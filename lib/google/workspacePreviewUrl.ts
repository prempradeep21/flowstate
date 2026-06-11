import type { GoogleDriveFileKind } from "@/lib/google/parseDriveUrl";

/** Google Workspace iframe preview URL for a Drive file id. */
export function googleWorkspacePreviewUrl(
  fileId: string,
  fileKind: GoogleDriveFileKind,
): string {
  switch (fileKind) {
    case "spreadsheet":
      return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(fileId)}/preview`;
    case "presentation":
      return `https://docs.google.com/presentation/d/${encodeURIComponent(fileId)}/embed?start=false&loop=false&delayms=3000`;
    case "document":
      return `https://docs.google.com/document/d/${encodeURIComponent(fileId)}/preview`;
    default:
      return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
  }
}
