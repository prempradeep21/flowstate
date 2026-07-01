import type { TableCell, TableColumn, TableRow } from "@/lib/artifactTypes";
import { normalizeTableCell } from "@/lib/tableCellContent";

export const TABLE_COLUMN_MAX_PERCENT = 35;
export const TABLE_NARROW_COLUMN_MIN_PERCENT = 8;
export const TABLE_NARROW_COLUMN_MAX_PERCENT = 14;
export const TABLE_COLUMN_MIN_RESIZE_PERCENT = 6;
/** Minimum pixel width per column for intrinsic size estimates. */
export const TABLE_COLUMN_MIN_PX = 96;
/** Approximate px per character for intrinsic width (body-sm). */
export const TABLE_COL_CHAR_PX = 7.5;
/** Horizontal cell padding for intrinsic width estimate. */
export const TABLE_COL_PAD_PX = 24;
/** Cap per-column character contribution before wrapping is preferred. */
export const TABLE_INTRINSIC_COL_CHAR_CAP = 48;
/** Estimated row body height (px) for intrinsic height. */
export const TABLE_ROW_HEIGHT_PX = 44;
/** Estimated header row height (px) for intrinsic height. */
export const TABLE_HEADER_HEIGHT_PX = 40;

const NARROW_KEY_PATTERN =
  /^(id|#|no|num|number|serial|index|idx|row|rank|sku|ref)$/i;
const NARROW_LABEL_PATTERN =
  /\b(id|#|no\.?|number|serial|index|idx)\b/i;

function cellDisplayLength(cell: string | TableCell | undefined): number {
  const { text, tags } = normalizeTableCell(cell);
  const tagMax = tags.reduce((max, t) => Math.max(max, t.label.length), 0);
  return Math.max(text.length, tagMax);
}

function isNarrowColumn(col: TableColumn, rows: TableRow[]): boolean {
  // Descriptive labels (Category, Previous Method, etc.) are never auto-narrowed.
  if (col.label.trim().length > 8) return false;

  if (NARROW_KEY_PATTERN.test(col.key) || NARROW_LABEL_PATTERN.test(col.label)) {
    return true;
  }

  const samples = rows
    .map((row) => normalizeTableCell(row[col.key]).text.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (samples.length === 0) return false;
  const avgLen =
    samples.reduce((sum, s) => sum + s.length, 0) / samples.length;
  const maxLen = Math.max(...samples.map((s) => s.length));
  return avgLen <= 6 && maxLen <= 8;
}

function columnIntrinsicWidthPx(col: TableColumn, rows: TableRow[]): number {
  let maxLen = col.label.length;
  for (const row of rows) {
    maxLen = Math.max(maxLen, cellDisplayLength(row[col.key]));
  }
  const effectiveLen = Math.min(maxLen, TABLE_INTRINSIC_COL_CHAR_CAP);
  return Math.max(
    TABLE_COLUMN_MIN_PX,
    effectiveLen * TABLE_COL_CHAR_PX + TABLE_COL_PAD_PX,
  );
}

export interface TableIntrinsicSize {
  widthPx: number;
  heightPx: number;
}

export function computeTableIntrinsicSize(
  columns: TableColumn[],
  rows: TableRow[],
): TableIntrinsicSize {
  if (columns.length === 0) {
    return { widthPx: TABLE_COLUMN_MIN_PX, heightPx: TABLE_HEADER_HEIGHT_PX };
  }

  const widthPx = columns.reduce(
    (sum, col) => sum + columnIntrinsicWidthPx(col, rows),
    0,
  );
  const heightPx =
    TABLE_HEADER_HEIGHT_PX + Math.max(rows.length, 1) * TABLE_ROW_HEIGHT_PX;

  return { widthPx, heightPx };
}

export interface TableColumnWidthPxResult {
  key: string;
  widthPx: number;
  wrap: boolean;
}

/** Pixel column widths for canvas tables (sum = intrinsic table width). */
export function computeTableColumnWidthsPx(
  columns: TableColumn[],
  rows: TableRow[],
): TableColumnWidthPxResult[] {
  const percentWidths = computeTableColumnWidths(columns, rows);
  const wrapByKey = new Map(percentWidths.map((w) => [w.key, w.wrap]));
  return columns.map((col) => ({
    key: col.key,
    widthPx: columnIntrinsicWidthPx(col, rows),
    wrap: wrapByKey.get(col.key) ?? false,
  }));
}

export function sumTableColumnWidthsPx(widths: number[]): number {
  return widths.reduce((sum, w) => sum + w, 0);
}

export interface TableColumnWidthResult {
  key: string;
  percent: number;
  wrap: boolean;
}

export function computeTableColumnWidths(
  columns: TableColumn[],
  rows: TableRow[],
): TableColumnWidthResult[] {
  if (columns.length === 0) return [];

  const meta = columns.map((col) => {
    let maxLen = col.label.length;
    for (const row of rows) {
      maxLen = Math.max(maxLen, cellDisplayLength(row[col.key]));
    }
    const narrow = isNarrowColumn(col, rows);
    const weight = Math.max(4, maxLen) * (narrow ? 0.35 : 1);
    const longContent = maxLen >= 48;
    return { key: col.key, weight, narrow, longContent };
  });

  const totalWeight = meta.reduce((sum, m) => sum + m.weight, 0) || 1;
  const percents = meta.map((m) => ({
    key: m.key,
    percent: (m.weight / totalWeight) * 100,
    narrow: m.narrow,
    wrap: m.longContent,
  }));

  for (let pass = 0; pass < 12; pass += 1) {
    let excess = 0;
    const receivers: { index: number; room: number }[] = [];

    for (let i = 0; i < percents.length; i += 1) {
      const entry = percents[i]!;
      const min = entry.narrow ? TABLE_NARROW_COLUMN_MIN_PERCENT : 0;
      const max = entry.narrow
        ? TABLE_NARROW_COLUMN_MAX_PERCENT
        : TABLE_COLUMN_MAX_PERCENT;

      if (entry.percent < min) {
        excess -= min - entry.percent;
        entry.percent = min;
      } else if (entry.percent > max) {
        excess += entry.percent - max;
        entry.percent = max;
        if (!entry.narrow) entry.wrap = true;
      }

      const room = max - entry.percent;
      if (room > 0.05) receivers.push({ index: i, room });
    }

    if (Math.abs(excess) < 0.05) break;
    const totalRoom = receivers.reduce((sum, r) => sum + r.room, 0);
    if (totalRoom < 0.05) break;

    for (const receiver of receivers) {
      const entry = percents[receiver.index]!;
      entry.percent += (receiver.room / totalRoom) * excess;
    }
  }

  const sum = percents.reduce((total, p) => total + p.percent, 0) || 1;
  for (const entry of percents) {
    entry.percent = (entry.percent / sum) * 100;
  }

  return percents.map(({ key, percent, wrap }) => ({
    key,
    percent: Math.round(percent * 10) / 10,
    wrap,
  }));
}
