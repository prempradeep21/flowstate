import {
  CODE_ASSET_MAX_BYTES,
  DOCUMENT_ASSET_MAX_BYTES,
  maxBytesForAssetKind,
} from "@/lib/attachments";
import { isPreviewableOfficeKind } from "@/lib/officeAssetKinds";
import type { CanvasAsset, CanvasAssetKind } from "@/lib/store";

export type AssetPreviewRenderer =
  | "image"
  | "pdf"
  | "code"
  | "markdown"
  | "json"
  | "csv"
  | "html"
  | "plain-text"
  | "office";

export const MAX_PREVIEW_ROWS = 24;
export const MAX_PREVIEW_COLS = 10;

export interface CsvPreviewData {
  rows: string[][];
  totalRows: number;
  totalCols: number;
}

export interface JsonPreviewData {
  pretty: string;
  valid: true;
}

export interface JsonPreviewError {
  message: string;
  raw: string;
  valid: false;
}

export type JsonPreviewResult = JsonPreviewData | JsonPreviewError;

function extensionForName(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function isPreviewableAssetKind(kind: CanvasAssetKind): boolean {
  return (
    kind === "image" ||
    kind === "document" ||
    kind === "code" ||
    isPreviewableOfficeKind(kind)
  );
}

export function resolvePreviewKind(asset: CanvasAsset): AssetPreviewRenderer {
  const ext = extensionForName(asset.name);
  const mime = asset.mimeType || "";

  if (asset.kind === "image") return "image";
  if (
    asset.kind === "spreadsheet" ||
    asset.kind === "word" ||
    asset.kind === "presentation"
  ) {
    return "office";
  }

  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (ext === "html" || ext === "htm" || mime === "text/html") return "html";
  if (ext === "md" || mime === "text/markdown") return "markdown";
  if (ext === "json" || mime === "application/json") return "json";
  if (ext === "csv" || mime === "text/csv") return "csv";
  if (asset.kind === "code") return "code";
  if (ext === "txt" || mime === "text/plain") return "plain-text";
  if (asset.kind === "document") return "plain-text";
  return "plain-text";
}

export function maxBytesForAssetPreview(asset: CanvasAsset): number {
  return maxBytesForAssetKind(asset.kind);
}

export async function fetchAssetText(
  url: string,
  maxBytes: number = DOCUMENT_ASSET_MAX_BYTES,
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load file (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new Error(
      `File is too large to preview (${Math.round(buffer.byteLength / 1024)} KB; limit ${Math.round(maxBytes / 1024)} KB)`,
    );
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

/** Lightweight RFC 4180-style CSV parser for preview grids. */
function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

export function parseCsvPreview(text: string): CsvPreviewData {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line, index, all) => line.length > 0 || index < all.length - 1);

  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const grid = nonEmptyLines.map(parseCsvRow);
  const totalRows = grid.length;
  const totalCols = grid.reduce((max, row) => Math.max(max, row.length), 0);
  const rows = grid.slice(0, MAX_PREVIEW_ROWS).map((row) =>
    Array.from({ length: Math.min(totalCols, MAX_PREVIEW_COLS) }, (_, index) =>
      row[index] ?? "",
    ),
  );

  return { rows, totalRows, totalCols };
}

export function parseJsonPreview(text: string): JsonPreviewResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, message: "Empty file", raw: "" };
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return { valid: true, pretty: JSON.stringify(parsed, null, 2) };
  } catch (err) {
    return {
      valid: false,
      message: err instanceof Error ? err.message : "Invalid JSON",
      raw: text.slice(0, 4000),
    };
  }
}

export function pdfEmbedUrl(fileUrl: string): string {
  const base = fileUrl.includes("#") ? fileUrl.split("#")[0]! : fileUrl;
  return `${base}#toolbar=0&navpanes=0`;
}

export function previewRequiresClickToInteract(
  renderer: AssetPreviewRenderer,
): boolean {
  return renderer === "pdf" || renderer === "html" || renderer === "office";
}

export { CODE_ASSET_MAX_BYTES, DOCUMENT_ASSET_MAX_BYTES };
