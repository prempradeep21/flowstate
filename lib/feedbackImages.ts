import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export const FEEDBACK_IMAGES_BUCKET = "feedback-images";
export const MAX_FEEDBACK_IMAGES = 3;
export const MAX_FEEDBACK_IMAGE_BYTES = 5 * 1024 * 1024;
export const FEEDBACK_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const ANON_FOLDER_KEY = "flowstate:feedback-anon-folder";

function safeStorageName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return base || "image";
}

function feedbackFolder(userId: string | null): string {
  if (userId) return userId;
  if (typeof window === "undefined") return "anonymous/unknown";
  let folder = sessionStorage.getItem(ANON_FOLDER_KEY);
  if (!folder) {
    folder = `anonymous/${crypto.randomUUID()}`;
    sessionStorage.setItem(ANON_FOLDER_KEY, folder);
  }
  return folder;
}

export function validateFeedbackImage(file: File): string | null {
  const type = file.type || "";
  if (!IMAGE_TYPES.has(type) && !type.startsWith("image/")) {
    return `${file.name || "File"} is not a supported image.`;
  }
  if (file.size > MAX_FEEDBACK_IMAGE_BYTES) {
    return `${file.name || "Image"} is too large (max 5 MB).`;
  }
  return null;
}

export async function uploadFeedbackImages(
  files: File[],
  userId: string | null,
): Promise<{ urls: string[]; error?: string }> {
  if (files.length === 0) return { urls: [] };
  if (!isSupabaseConfigured()) {
    return { urls: [], error: "Image upload is not available right now." };
  }

  const supabase = createClient();
  const folder = feedbackFolder(userId);
  const urls: string[] = [];

  for (const file of files) {
    const validationError = validateFeedbackImage(file);
    if (validationError) {
      return { urls: [], error: validationError };
    }

    const storagePath = `${folder}/${Date.now().toString(36)}-${safeStorageName(file.name || "image.png")}`;
    const { error: uploadError } = await supabase.storage
      .from(FEEDBACK_IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || "image/png",
        upsert: false,
      });

    if (uploadError) {
      return {
        urls: [],
        error: `Could not upload ${file.name || "image"}: ${uploadError.message}`,
      };
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(FEEDBACK_IMAGES_BUCKET)
      .createSignedUrl(storagePath, FEEDBACK_IMAGE_SIGNED_URL_TTL_SECONDS);

    if (signedError || !signed?.signedUrl) {
      return {
        urls: [],
        error: `Uploaded ${file.name || "image"}, but could not create a preview URL.`,
      };
    }

    urls.push(signed.signedUrl);
  }

  return { urls };
}
