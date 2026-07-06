import {
  ASSET_SIGNED_URL_TTL_SECONDS,
  ASSET_STORAGE_BUCKET,
} from "@/lib/attachments";
import { createClient } from "@/lib/supabase/client";
import { isLocalReadOnlyClient } from "@/lib/supabase/localReadOnly";

/** Re-sign a stored asset file URL when the cached signed URL has expired. */
export async function refreshAssetSignedUrl(
  storagePath: string,
): Promise<string | null> {
  if (!storagePath.trim() || isLocalReadOnlyClient()) return null;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(ASSET_STORAGE_BUCKET)
    .createSignedUrl(storagePath, ASSET_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
