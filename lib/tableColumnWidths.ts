import type { TableCell, TableColumn, TableRow } from "@/lib/artifactTypes";
import { normalizeTableCell } from "@/lib/tableCellContent";

export const TABLE_COLUMN_MAX_PERCENT = 35;
export const TABLE_NARROW_COLUMN_MIN_PERCENT = 8;
export const TABLE_NARROW_COLUMN_MAX_PERCENT = 14;
export const TABLE_COLUMN_MIN_RESIZE_PERCENT = 6;

const NARROW_KEY_PATTERN =
  /^(id|#|no|num|number|serial|index|idx|row|rank|sku|ref)$/i;
const NARROW_LABEL_PATTERN =
  /\b(id|#|no\.?|number|serial|index|idx)\b/i;

function cellDisplayLength(cell: string | TableCell | undefined): number {
  const { text, tags } = normalizeTableCell(cell);
  const tagLen = tags.reduce((sum, t) => sum + t.label.length + 2, 0);
  return Math.max(text.length, tagLen);
}

function isNarrowColumn(col: TableColumn, rows: TableRow[]): boolean {
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
  return avgLen <= 12 && maxLen <= 16;
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
