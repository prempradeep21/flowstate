import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  defaultTitleForFileKind,
  parseGoogleDriveUrl,
  type GoogleDriveFileKind,
} from "@/lib/google/parseDriveUrl";

/** Source card id for user-initiated Google Workspace artifacts (no chat turn). */
export const MANUAL_GOOGLE_DOC_SOURCE_CARD_ID = "__manual_google__";

export type GoogleWorkspaceImportStatus =
  | "loading"
  | "ready"
  | "needs_connect"
  | "needs_access"
  | "failed";

export interface GoogleWorkspaceArtifactData {
  url: string;
  fileId: string;
  fileKind: GoogleDriveFileKind;
  title: string;
  mimeType?: string;
  status: GoogleWorkspaceImportStatus;
  extractedText?: string;
  extractedTextLength?: number;
  truncated?: boolean;
  errorMessage?: string;
}

export function normalizeGoogleWorkspaceArtifactData(
  data: unknown,
): GoogleWorkspaceArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const url = typeof obj.url === "string" ? obj.url.trim() : "";
  const fileId = typeof obj.fileId === "string" ? obj.fileId.trim() : "";
  const fileKindRaw = obj.fileKind;
  const fileKind: GoogleDriveFileKind =
    fileKindRaw === "spreadsheet" ||
    fileKindRaw === "presentation" ||
    fileKindRaw === "file"
      ? fileKindRaw
      : "document";
  const title =
    typeof obj.title === "string" && obj.title.trim()
      ? obj.title.trim()
      : defaultTitleForFileKind(fileKind);
  const statusRaw = obj.status;
  const status: GoogleWorkspaceImportStatus =
    statusRaw === "ready" ||
    statusRaw === "needs_connect" ||
    statusRaw === "needs_access" ||
    statusRaw === "failed"
      ? statusRaw
      : "loading";
  const mimeType =
    typeof obj.mimeType === "string" && obj.mimeType.trim()
      ? obj.mimeType.trim()
      : undefined;
  const extractedText =
    typeof obj.extractedText === "string" ? obj.extractedText : undefined;
  const extractedTextLength =
    typeof obj.extractedTextLength === "number"
      ? obj.extractedTextLength
      : extractedText?.length;
  const truncated = obj.truncated === true;
  const errorMessage =
    typeof obj.errorMessage === "string" ? obj.errorMessage : undefined;

  return {
    url,
    fileId,
    fileKind,
    title,
    mimeType,
    status,
    extractedText,
    extractedTextLength,
    truncated,
    errorMessage,
  };
}

export function normalizeGoogleWorkspacePayload(
  payload: Extract<ArtifactPayload, { type: "google-doc" }>,
): Extract<ArtifactPayload, { type: "google-doc" }> {
  const data = normalizeGoogleWorkspaceArtifactData(payload.data);
  return {
    ...payload,
    title: payload.title?.trim() || data.title,
    data,
  };
}

export function createGoogleWorkspacePayload(
  parsed: ReturnType<typeof parseGoogleDriveUrl>,
): Extract<ArtifactPayload, { type: "google-doc" }> | null {
  if (!parsed) return null;
  const title = defaultTitleForFileKind(parsed.fileKind);
  return {
    type: "google-doc",
    title,
    data: {
      url: parsed.url,
      fileId: parsed.fileId,
      fileKind: parsed.fileKind,
      title,
      status: "loading",
    },
  };
}

export function isGoogleWorkspaceTitlePending(
  payload: Extract<ArtifactPayload, { type: "google-doc" }>,
): boolean {
  return (
    payload.data.status === "loading" ||
    payload.data.title === defaultTitleForFileKind(payload.data.fileKind)
  );
}

export function googleWorkspaceFileKindLabel(
  kind: GoogleDriveFileKind,
): string {
  switch (kind) {
    case "document":
      return "Google Doc";
    case "spreadsheet":
      return "Google Sheet";
    case "presentation":
      return "Google Slides";
    default:
      return "Drive file";
  }
}
