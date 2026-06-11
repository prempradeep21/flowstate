import { normalizeHttpUrl } from "@/lib/urlDetection";

export type GoogleDriveFileKind =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "file";

export interface ParsedGoogleDriveUrl {
  fileId: string;
  fileKind: GoogleDriveFileKind;
  url: string;
}

const DOC_RE =
  /\/document\/d\/([a-zA-Z0-9_-]+)/;
const SHEET_RE =
  /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const SLIDES_RE =
  /\/presentation\/d\/([a-zA-Z0-9_-]+)/;
const DRIVE_FILE_RE =
  /\/file\/d\/([a-zA-Z0-9_-]+)/;
const DRIVE_OPEN_RE = /[?&]id=([a-zA-Z0-9_-]+)/;

export function defaultTitleForFileKind(kind: GoogleDriveFileKind): string {
  switch (kind) {
    case "document":
      return "Google Doc";
    case "spreadsheet":
      return "Google Sheet";
    case "presentation":
      return "Google Slides";
    default:
      return "Google Drive file";
  }
}

/** Parse a Google Docs, Sheets, Slides, or Drive file URL. */
export function parseGoogleDriveUrl(input: string): ParsedGoogleDriveUrl | null {
  const normalized = normalizeHttpUrl(input);
  if (!normalized) return null;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  if (host === "docs.google.com") {
    const docMatch = path.match(DOC_RE);
    if (docMatch?.[1]) {
      return {
        fileId: docMatch[1],
        fileKind: "document",
        url: normalized,
      };
    }
    const sheetMatch = path.match(SHEET_RE);
    if (sheetMatch?.[1]) {
      return {
        fileId: sheetMatch[1],
        fileKind: "spreadsheet",
        url: normalized,
      };
    }
    const slidesMatch = path.match(SLIDES_RE);
    if (slidesMatch?.[1]) {
      return {
        fileId: slidesMatch[1],
        fileKind: "presentation",
        url: normalized,
      };
    }
    return null;
  }

  if (host === "drive.google.com") {
    const fileMatch = path.match(DRIVE_FILE_RE);
    if (fileMatch?.[1]) {
      return {
        fileId: fileMatch[1],
        fileKind: "file",
        url: normalized,
      };
    }
    const openMatch = parsed.search.match(DRIVE_OPEN_RE);
    if (openMatch?.[1]) {
      return {
        fileId: openMatch[1],
        fileKind: "file",
        url: normalized,
      };
    }
  }

  return null;
}

export function isGoogleDriveUrl(input: string): boolean {
  return parseGoogleDriveUrl(input) !== null;
}
