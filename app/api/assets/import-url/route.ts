import { NextResponse } from "next/server";
import {
  ASSET_SIGNED_URL_TTL_SECONDS,
  ASSET_STORAGE_BUCKET,
  IMAGE_ASSET_MAX_BYTES,
  IMAGE_ASSET_MIME_TYPES,
  safeStorageName,
} from "@/lib/attachments";
import { readImageDimensions } from "@/lib/imageDimensions";
import { validateLinkPreviewUrl } from "@/lib/linkPreview";
import { createClient } from "@/lib/supabase/server";
import type { CanvasAsset } from "@/lib/store";

/*
 * Bring a remote image into the canvas as a durable asset.
 *
 * The browser cannot do this: fetchImageUrlAsFile is subject to CORS, and most
 * third-party images do not permit a cross-origin read — which is why the paste
 * path has to tell users to save the file and drag it in. Fetching server-side
 * sidesteps CORS entirely, so a preview image stops being a live hotlink to
 * someone else's origin and becomes bytes the canvas owns.
 *
 * This route fetches a caller-supplied URL from the server, so SSRF is the risk
 * that matters. It reuses validateLinkPreviewUrl's blocklist rather than growing
 * a second one, refuses redirects to blocked hosts, caps the response, and
 * writes only through the user's own session so bucket RLS still applies.
 */

const FETCH_TIMEOUT_MS = 8000;

const EXTENSION_FOR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Read a response body, aborting past the cap rather than buffering it all. */
async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }
  const record = (body ?? {}) as Record<string, unknown>;
  const rawUrl = typeof record.url === "string" ? record.url.trim() : "";
  const canvasId =
    typeof record.canvasId === "string" ? record.canvasId.trim() : "";
  if (!rawUrl || !canvasId) {
    return fail("Missing url or canvasId", 400);
  }

  const target = validateLinkPreviewUrl(rawUrl);
  if (!target) {
    return fail("Invalid or blocked URL", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return fail("Not signed in", 401);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Origins that vary on Accept or reject unknown agents otherwise serve
        // an HTML error page, which then fails the MIME check below.
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5",
        "User-Agent":
          "Mozilla/5.0 (compatible; FlowstateAssetImport/1.0; +https://flowstate.app)",
      },
    });
  } catch {
    return fail("Could not fetch image", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return fail(`Source responded ${response.status}`, 502);
  }
  // A redirect chain can land somewhere the original check never saw.
  if (response.url && !validateLinkPreviewUrl(response.url)) {
    return fail("Redirected to a blocked URL", 400);
  }

  const mimeType = (response.headers.get("content-type") ?? "")
    .split(";")[0]!
    .trim()
    .toLowerCase();
  if (!IMAGE_ASSET_MIME_TYPES.has(mimeType)) {
    return fail(`Unsupported image type: ${mimeType || "unknown"}`, 415);
  }

  const bytes = await readCapped(response, IMAGE_ASSET_MAX_BYTES);
  if (!bytes) {
    return fail("Image is too large", 413);
  }

  const dimensions = readImageDimensions(bytes, mimeType);

  const baseName =
    target.pathname.split("/").filter(Boolean).pop() ||
    target.hostname.replace(/\./g, "-");
  const extension = EXTENSION_FOR_MIME[mimeType]!;
  const fileName = baseName.match(/\.[a-z0-9]+$/i)
    ? baseName
    : `${baseName}.${extension}`;
  const storagePath = `${user.id}/${canvasId}/${safeStorageName(fileName)}`;

  const { error: uploadError } = await supabase.storage
    .from(ASSET_STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });
  if (uploadError) {
    return fail(uploadError.message, 500);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(ASSET_STORAGE_BUCKET)
    .createSignedUrl(storagePath, ASSET_SIGNED_URL_TTL_SECONDS);
  if (signError || !signed?.signedUrl) {
    return fail("Could not sign the stored image", 500);
  }

  const asset: CanvasAsset = {
    id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    canvasId,
    ownerId: user.id,
    name: fileName,
    mimeType,
    sizeBytes: bytes.byteLength,
    storagePath,
    publicUrl: signed.signedUrl,
    kind: "image",
    width: dimensions?.width,
    height: dimensions?.height,
    aspectRatio:
      dimensions && dimensions.height > 0
        ? dimensions.width / dimensions.height
        : undefined,
    createdAt: Date.now(),
  };

  return NextResponse.json({ asset });
}
