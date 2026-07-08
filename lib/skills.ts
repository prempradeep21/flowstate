import type { CanvasSkill } from "@/lib/store";
import {
  ASSET_SIGNED_URL_TTL_SECONDS,
  ASSET_STORAGE_BUCKET,
  DOCUMENT_ASSET_MAX_BYTES,
  MAX_ASSET_BATCH_FILES,
  type AssetUploadContext,
  type AssetUploadError,
} from "@/lib/attachments";
import { deriveSkillCardData } from "@/lib/skillMetadata";
import { createClient } from "@/lib/supabase/client";
import { isLocalReadOnlyClient } from "@/lib/supabase/localReadOnly";

export type SkillUploadBatchResult = {
  skills: CanvasSkill[];
  errors: AssetUploadError[];
};

function extensionForName(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function isSkillFile(file: File): boolean {
  const ext = extensionForName(file.name);
  const type = file.type || "";
  return ext === "md" || type === "text/markdown";
}

export function defaultSkillTitle(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "").trim();
  return stem || "Untitled Skill";
}

function safeStorageName(name: string): string {
  const ext = extensionForName(name);
  const stem = name
    .replace(/\.[^.]+$/, "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${stem || "skill"}-${suffix}${ext ? `.${ext}` : ".md"}`;
}

function validateSkillFile(file: File): AssetUploadError | null {
  if (!isSkillFile(file)) {
    return {
      fileName: file.name,
      code: "unsupported-type",
      message: `${file.name} is not a markdown skill file (.md).`,
    };
  }
  if (file.size > DOCUMENT_ASSET_MAX_BYTES) {
    return {
      fileName: file.name,
      code: "file-too-large",
      message: `${file.name} exceeds the ${Math.round(DOCUMENT_ASSET_MAX_BYTES / (1024 * 1024))} MB limit.`,
    };
  }
  return null;
}

export async function uploadSkillFiles(
  files: FileList | File[],
  context: AssetUploadContext | null,
  titles: Record<string, string>,
): Promise<SkillUploadBatchResult> {
  const input = Array.from(files);
  const result: SkillUploadBatchResult = { skills: [], errors: [] };

  if (!context?.canvasId || !context.userId) {
    return {
      skills: [],
      errors: [
        {
          code: "missing-context",
          message: "Sign in and open a canvas before uploading skills.",
        },
      ],
    };
  }

  if (isLocalReadOnlyClient()) {
    return {
      skills: [],
      errors: [
        {
          code: "read-only-local",
          message:
            "Skill uploads are disabled in local session mode. Changes reset on reload.",
        },
      ],
    };
  }

  if (input.length > MAX_ASSET_BATCH_FILES) {
    result.errors.push({
      code: "too-many-files",
      message: `Drop ${MAX_ASSET_BATCH_FILES} files or fewer at a time.`,
    });
    return result;
  }

  const supabase = createClient();

  for (const file of input) {
    const validationError = validateSkillFile(file);
    if (validationError) {
      result.errors.push(validationError);
      continue;
    }

    const title =
      titles[file.name]?.trim() || defaultSkillTitle(file.name);
    const storagePath = `${context.userId}/${context.canvasId}/skills/${safeStorageName(file.name)}`;
    const contentType = file.type || "text/markdown";

    const { error } = await supabase.storage
      .from(ASSET_STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });

    if (error) {
      result.errors.push({
        fileName: file.name,
        code: "upload-failed",
        message: `Could not upload ${file.name}: ${error.message}`,
      });
      continue;
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(ASSET_STORAGE_BUCKET)
      .createSignedUrl(storagePath, ASSET_SIGNED_URL_TTL_SECONDS);

    if (signedError || !signed?.signedUrl) {
      result.errors.push({
        fileName: file.name,
        code: "upload-failed",
        message: `Uploaded ${file.name}, but could not create a preview URL.`,
      });
      continue;
    }

    let metadata: CanvasSkill["metadata"];
    try {
      metadata = deriveSkillCardData(await file.text());
    } catch {
      // Malformed/unreadable content — fall back to the plain icon+title look.
      metadata = undefined;
    }

    result.skills.push({
      id: `skill_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      canvasId: context.canvasId,
      ownerId: context.userId,
      title,
      fileName: file.name,
      mimeType: contentType,
      sizeBytes: file.size,
      storagePath,
      publicUrl: signed.signedUrl,
      createdAt: Date.now(),
      metadata,
      metadataStatus: "pending",
    });
  }

  return result;
}
