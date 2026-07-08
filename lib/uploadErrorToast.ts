import type { AssetUploadError } from "@/lib/attachments";
import { showAppErrorToast } from "@/lib/appToastStore";

export function showUploadErrorsToast(errors: AssetUploadError[]): void {
  if (errors.length === 0) return;
  const primary = errors[0]!.message;
  const message =
    errors.length > 1 ? `${primary} (+${errors.length - 1} more)` : primary;
  showAppErrorToast(message);
}
