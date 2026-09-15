import { downloadBlob } from "@/lib/artifactExport/download";
import { refreshAssetSignedUrl } from "@/lib/refreshAssetUrl";
import type { CanvasAsset } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

export interface AssetDownloadResult {
  ok: boolean;
  error?: string;
}

/** Keep the original file name; strip path separators a name should never carry. */
function safeAssetFileName(asset: CanvasAsset): string {
  const base = asset.name.split(/[\\/]/).pop()?.trim();
  return base && base !== "." && base !== ".." ? base : "download";
}

/**
 * Download an asset's original file.
 *
 * Assets live behind cross-origin signed storage URLs, so `<a download>` would
 * navigate instead of saving. Fetching the bytes and saving a blob keeps the
 * real file name; an expired signature is re-signed once and retried.
 */
export async function downloadCanvasAsset(
  asset: CanvasAsset,
): Promise<AssetDownloadResult> {
  const attempt = async (url: string): Promise<Response> => fetch(url);

  let response: Response;
  try {
    response = await attempt(asset.publicUrl);
  } catch {
    return openAssetInNewTab(asset);
  }

  if (!response.ok && asset.storagePath) {
    const freshUrl = await refreshAssetSignedUrl(asset.storagePath);
    if (freshUrl) {
      useCanvasStore.getState().patchCanvasAssetPublicUrl(asset.id, freshUrl);
      try {
        response = await attempt(freshUrl);
      } catch {
        return openAssetInNewTab(asset);
      }
    }
  }

  if (!response.ok) {
    return { ok: false, error: `Could not download file (${response.status})` };
  }

  try {
    downloadBlob(safeAssetFileName(asset), await response.blob());
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save file." };
  }
}

/** Last resort when the blob fetch is blocked (CORS): let the browser handle the URL. */
function openAssetInNewTab(asset: CanvasAsset): AssetDownloadResult {
  const opened = window.open(asset.publicUrl, "_blank", "noopener,noreferrer");
  return opened
    ? { ok: true }
    : { ok: false, error: "Could not download file." };
}
