import { GOOGLE_EXTRACT_MAX_CHARS } from "@/lib/google/constants";
import {
  defaultTitleForFileKind,
  type GoogleDriveFileKind,
  parseGoogleDriveUrl,
} from "@/lib/google/parseDriveUrl";

export class GoogleDriveApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "GoogleDriveApiError";
    this.status = status;
    this.code = code;
  }
}

export interface GoogleDriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

export interface GoogleFileExtractResult {
  fileId: string;
  fileKind: GoogleDriveFileKind;
  title: string;
  mimeType: string;
  url: string;
  extractedText: string;
  truncated: boolean;
}

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const GOOGLE_SLIDES_MIME = "application/vnd.google-apps.presentation";

function mimeToFileKind(mimeType: string): GoogleDriveFileKind {
  if (mimeType === GOOGLE_DOC_MIME) return "document";
  if (mimeType === GOOGLE_SHEET_MIME) return "spreadsheet";
  if (mimeType === GOOGLE_SLIDES_MIME) return "presentation";
  return "file";
}

function exportMimeForGoogleType(mimeType: string): string | null {
  if (mimeType === GOOGLE_DOC_MIME) return "text/plain";
  if (mimeType === GOOGLE_SHEET_MIME) return "text/csv";
  if (mimeType === GOOGLE_SLIDES_MIME) return "text/plain";
  if (mimeType === "application/pdf") return null;
  if (mimeType.startsWith("text/")) return null;
  return "text/plain";
}

async function googleFetch(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchGoogleDriveFileMeta(
  accessToken: string,
  fileId: string,
): Promise<GoogleDriveFileMeta> {
  const params = new URLSearchParams({
    fields: "id,name,mimeType,webViewLink",
  });
  const res = await googleFetch(
    accessToken,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params}`,
  );

  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: { code?: number; message?: string } };
      code = body.error?.message;
    } catch {
      /* ignore */
    }
    throw new GoogleDriveApiError(
      code ?? `Drive metadata failed (${res.status})`,
      res.status,
    );
  }

  const data = (await res.json()) as GoogleDriveFileMeta;
  return data;
}

async function downloadFileMedia(
  accessToken: string,
  fileId: string,
): Promise<string> {
  const res = await googleFetch(
    accessToken,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
  );
  if (!res.ok) {
    throw new GoogleDriveApiError(
      `Drive download failed (${res.status})`,
      res.status,
    );
  }
  return res.text();
}

async function exportGoogleFile(
  accessToken: string,
  fileId: string,
  exportMime: string,
): Promise<string> {
  const res = await googleFetch(
    accessToken,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(exportMime)}`,
  );
  if (!res.ok) {
    throw new GoogleDriveApiError(
      `Drive export failed (${res.status})`,
      res.status,
    );
  }
  return res.text();
}

function truncateExtract(text: string): { text: string; truncated: boolean } {
  if (text.length <= GOOGLE_EXTRACT_MAX_CHARS) {
    return { text, truncated: false };
  }
  return {
    text: text.slice(0, GOOGLE_EXTRACT_MAX_CHARS),
    truncated: true,
  };
}

export async function extractGoogleDriveFile(
  accessToken: string,
  input: { fileId: string; url?: string },
): Promise<GoogleFileExtractResult> {
  const parsed = input.url ? parseGoogleDriveUrl(input.url) : null;
  const meta = await fetchGoogleDriveFileMeta(accessToken, input.fileId);
  const fileKind = parsed?.fileKind ?? mimeToFileKind(meta.mimeType);
  const url =
    parsed?.url ??
    input.url ??
    meta.webViewLink ??
    `https://drive.google.com/file/d/${meta.id}/view`;

  const exportMime = exportMimeForGoogleType(meta.mimeType);
  let rawText: string;
  if (exportMime) {
    rawText = await exportGoogleFile(accessToken, meta.id, exportMime);
  } else if (
    meta.mimeType.startsWith("text/") ||
    meta.mimeType === "application/json" ||
    meta.mimeType === "application/pdf"
  ) {
    rawText = await downloadFileMedia(accessToken, meta.id);
  } else {
    rawText = await exportGoogleFile(accessToken, meta.id, "text/plain");
  }

  const { text, truncated } = truncateExtract(rawText.trim());

  return {
    fileId: meta.id,
    fileKind,
    title: meta.name?.trim() || defaultTitleForFileKind(fileKind),
    mimeType: meta.mimeType,
    url,
    extractedText: text,
    truncated,
  };
}
