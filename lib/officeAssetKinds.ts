import type { CanvasAssetKind } from "@/lib/store";

export const SPREADSHEET_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

export const SPREADSHEET_EXTENSIONS = new Set(["xls", "xlsx", "xlsm", "ods"]);

export const WORD_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
]);

export const WORD_EXTENSIONS = new Set(["doc", "docx", "odt", "rtf"]);

export const PRESENTATION_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.presentation",
]);

export const PRESENTATION_EXTENSIONS = new Set(["ppt", "pptx", "odp"]);

export function officeKindForExtension(ext: string): CanvasAssetKind | null {
  if (SPREADSHEET_EXTENSIONS.has(ext)) return "spreadsheet";
  if (WORD_EXTENSIONS.has(ext)) return "word";
  if (PRESENTATION_EXTENSIONS.has(ext)) return "presentation";
  return null;
}

export function officeKindForMime(mime: string): CanvasAssetKind | null {
  if (SPREADSHEET_TYPES.has(mime)) return "spreadsheet";
  if (WORD_TYPES.has(mime)) return "word";
  if (PRESENTATION_TYPES.has(mime)) return "presentation";
  return null;
}

export function isPreviewableOfficeKind(kind: CanvasAssetKind): boolean {
  return kind === "spreadsheet" || kind === "word" || kind === "presentation";
}

export function officeOnlineEmbedUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

export const OFFICE_FILE_ACCEPT =
  ".xls,.xlsx,.xlsm,.ods,.doc,.docx,.odt,.rtf,.ppt,.pptx,.odp," +
  "application/vnd.ms-excel," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.ms-excel.sheet.macroEnabled.12," +
  "application/vnd.oasis.opendocument.spreadsheet," +
  "application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.oasis.opendocument.text," +
  "application/rtf," +
  "application/vnd.ms-powerpoint," +
  "application/vnd.openxmlformats-officedocument.presentationml.presentation," +
  "application/vnd.oasis.opendocument.presentation";
