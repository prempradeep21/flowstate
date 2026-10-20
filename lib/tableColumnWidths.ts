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
  return normalizeTableCell(cell).text.length;
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

/* Rendered metrics of a canvas table (text-canvas-body-sm, px-3 py-2.5 cells). */
const TABLE_LINE_HEIGHT_PX = 19.5;
/**
 * Average rendered glyph width at 13px. Column widths budget a generous 7.5px a
 * character so text rarely wraps; counting wrapped lines at that rate would
 * predict wraps that never happen and leave a blank band under the last row.
 */
const TABLE_WRAP_CHAR_PX = 6.6;
const TABLE_CELL_PAD_Y_PX = 20;
const TABLE_ROW_BORDER_PX = 1;
const TABLE_HEAD_HEIGHT_PX = 37;

/**
 * Height a canvas table renders at, wrapping each cell at its column's width.
 *
 * {@link computeTableIntrinsicSize} assumes one line per row, which is right for
 * the auto-measure floor it feeds but undersizes any table with wrapped cells.
 * A node sized to content needs the real figure: text wraps at the column
 * width (minus padding).
 */
export function estimateTableHeightPx(
  columns: TableColumn[],
  rows: TableRow[],
): number {
  const widths = columns.map((col) => columnIntrinsicWidthPx(col, rows));
  let total = TABLE_HEAD_HEIGHT_PX;
  for (const row of rows) {
    let rowH = TABLE_LINE_HEIGHT_PX;
    columns.forEach((col, index) => {
      const { text } = normalizeTableCell(row[col.key]);
      const usable = Math.max(1, widths[index]! - TABLE_COL_PAD_PX);
      const lines = text
        ? Math.max(1, Math.ceil((text.length * TABLE_WRAP_CHAR_PX) / usable))
        : 0;
      rowH = Math.max(rowH, lines * TABLE_LINE_HEIGHT_PX);
    });
    total += rowH + TABLE_CELL_PAD_Y_PX + TABLE_ROW_BORDER_PX;
  }
  return Math.ceil(total);
}

/*
 * Responsive column fitting for canvas tables.
 *
 * Each column has two widths: its IDEAL (every cell on one line, capped like
 * the intrinsic estimate) and its MIN (its longest unbreakable word —
 * narrower than that and words split mid-letter). Fitting a node width:
 *
 *  - wider than every ideal: the spare goes to the text columns in proportion
 *    to their ideal, so a wide node reads as a balanced table, not one huge
 *    last column. Narrow columns (ids, ranks) stay at their ideal.
 *  - between the mins and the ideals: each column gives up width in proportion
 *    to its slack (ideal − min), the CSS auto-table rule — long prose columns
 *    wrap first, short columns stay on one line.
 *  - narrower than every min: columns hold their mins and the table scrolls
 *    sideways inside the node (rows that wrap taller scroll vertically).
 *
 * A column the user dragged is pinned at that width; the rest fit around it.
 */

/** No column is squeezed below this, however short its content. */
export const TABLE_COLUMN_FLOOR_PX = 64;
/** A single very long word (a URL) breaks rather than forcing a huge min. */
export const TABLE_COLUMN_MIN_CAP_PX = 200;
/**
 * Cells this short ("Dec – Mar", "$1.2M", "High") read as one unit, so they
 * never wrap — only longer prose is allowed to break between words.
 */
const TABLE_UNBREAKABLE_CELL_CHARS = 14;
/** Bold header glyphs run wider than body text. */
const TABLE_HEADER_CHAR_PX = 8.2;

function longestWordLength(text: string): number {
  let max = 0;
  for (const word of text.split(/\s+/)) max = Math.max(max, word.length);
  return max;
}

/** Characters that must sit on one line: a short cell whole, else its longest word. */
function unbreakableLength(text: string): number {
  const trimmed = text.trim();
  return trimmed.length <= TABLE_UNBREAKABLE_CELL_CHARS
    ? trimmed.length
    : longestWordLength(trimmed);
}

function columnMinWidthPx(col: TableColumn, rows: TableRow[]): number {
  // Headers truncate rather than wrap; their longest word keeps them legible.
  let minPx =
    longestWordLength(col.label) * TABLE_HEADER_CHAR_PX + TABLE_COL_PAD_PX;
  for (const row of rows) {
    const { text } = normalizeTableCell(row[col.key]);
    minPx = Math.max(
      minPx,
      unbreakableLength(text) * TABLE_COL_CHAR_PX + TABLE_COL_PAD_PX,
    );
  }
  return Math.min(TABLE_COLUMN_MIN_CAP_PX, Math.max(TABLE_COLUMN_FLOOR_PX, minPx));
}

export interface TableColumnFitSpec {
  key: string;
  minPx: number;
  idealPx: number;
  /** Short id/rank-style column: never stretched past its ideal. */
  narrow: boolean;
}

export function computeTableColumnFitSpecs(
  columns: TableColumn[],
  rows: TableRow[],
): TableColumnFitSpec[] {
  return columns.map((col) => {
    const narrow = isNarrowColumn(col, rows);
    const idealPx = columnIntrinsicWidthPx(col, rows);
    // A narrow column's content is short enough that wrapping it only hurts.
    const minPx = narrow ? idealPx : Math.min(idealPx, columnMinWidthPx(col, rows));
    return { key: col.key, minPx, idealPx, narrow };
  });
}

/**
 * Pixel widths for every column at `availablePx` of table width. The result
 * sums to exactly `availablePx` unless the mins don't fit, in which case it
 * sums to more and the caller's container scrolls. `pinnedPx[i]`, when set,
 * fixes column i at that width.
 */
export function fitTableColumnWidthsPx(
  specs: TableColumnFitSpec[],
  availablePx: number,
  pinnedPx: ReadonlyArray<number | undefined> = [],
): number[] {
  if (specs.length === 0) return [];
  const widths = specs.map((s, i) => pinnedPx[i] ?? s.idealPx);
  const free = specs
    .map((_, i) => i)
    .filter((i) => pinnedPx[i] == null);
  const pinnedTotal = specs.reduce(
    (sum, _, i) => sum + (pinnedPx[i] ?? 0),
    0,
  );
  const room = availablePx - pinnedTotal;
  const idealTotal = free.reduce((sum, i) => sum + specs[i]!.idealPx, 0);
  const minTotal = free.reduce((sum, i) => sum + specs[i]!.minPx, 0);

  if (free.length === 0 || !Number.isFinite(availablePx)) {
    return widths.map(Math.round);
  }

  if (room >= idealTotal) {
    const growers = free.filter((i) => !specs[i]!.narrow);
    const takers = growers.length > 0 ? growers : free;
    const weight = takers.reduce((sum, i) => sum + specs[i]!.idealPx, 0) || 1;
    const spare = room - idealTotal;
    for (const i of takers) {
      widths[i] = specs[i]!.idealPx + (spare * specs[i]!.idealPx) / weight;
    }
  } else if (room > minTotal) {
    const t = (room - minTotal) / (idealTotal - minTotal || 1);
    for (const i of free) {
      const s = specs[i]!;
      widths[i] = s.minPx + (s.idealPx - s.minPx) * t;
    }
  } else {
    for (const i of free) widths[i] = specs[i]!.minPx;
    return widths.map(Math.round);
  }

  // Whole pixels that still sum to the room exactly — a stray fractional
  // pixel would show a one-pixel horizontal scrollbar.
  const rounded = widths.map(Math.floor);
  const target = Math.round(availablePx);
  let leftover = target - rounded.reduce((sum, w) => sum + w, 0);
  // Flooring loses under 1px per column, so one pass covers it.
  for (let k = free.length - 1; leftover > 0 && k >= 0; k -= 1) {
    rounded[free[k]!]! += 1;
    leftover -= 1;
  }
  return rounded;
}
