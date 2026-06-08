import type {
  ArtifactPayload,
  TableArtifactData,
  TableColumn,
  TableRow,
} from "@/lib/artifactTypes";

function normalizeColumn(raw: unknown): TableColumn | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const key = typeof obj.key === "string" ? obj.key.trim() : "";
  if (!key) return null;
  const label =
    typeof obj.label === "string" && obj.label.trim()
      ? obj.label.trim()
      : key;
  return { key, label };
}

function normalizeRow(raw: unknown): TableRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as TableRow;
}

function nextUniqueColumnKey(base: string, used: Set<string>): string {
  let key = base;
  let suffix = 2;
  while (used.has(key)) {
    key = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(key);
  return key;
}

/**
 * Ensures column keys are unique within a single table so React list keys and
 * row field lookups stay stable when models emit duplicate slugs.
 */
export function ensureUniqueTableColumns(
  columns: TableColumn[],
  rows: TableRow[],
): { columns: TableColumn[]; rows: TableRow[] } {
  if (columns.length === 0) return { columns, rows };

  const used = new Set<string>();
  const remappedColumns: TableColumn[] = [];

  for (const col of columns) {
    const key = nextUniqueColumnKey(col.key, used);
    remappedColumns.push(key === col.key ? col : { ...col, key });
  }

  const needsRowRemap = remappedColumns.some(
    (col, index) => col.key !== columns[index]?.key,
  );
  if (!needsRowRemap) {
    return { columns: remappedColumns, rows };
  }

  const remappedRows = rows.map((row) => {
    const next: TableRow = { ...row };
    remappedColumns.forEach((col, index) => {
      const sourceKey = columns[index]?.key;
      if (!sourceKey || col.key === sourceKey) return;
      if (sourceKey in row) {
        next[col.key] = row[sourceKey];
      }
    });
    return next;
  });

  return { columns: remappedColumns, rows: remappedRows };
}

/** Coerce partial or legacy table payloads into a safe shape. */
export function normalizeTableArtifactData(data: unknown): TableArtifactData {
  const obj =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const columns = Array.isArray(obj.columns)
    ? obj.columns
        .map(normalizeColumn)
        .filter((col): col is TableColumn => col !== null)
    : [];

  const rows = Array.isArray(obj.rows)
    ? obj.rows
        .map(normalizeRow)
        .filter((row): row is TableRow => row !== null)
    : [];

  return ensureUniqueTableColumns(columns, rows);
}

export function normalizeTablePayload(
  payload: Extract<ArtifactPayload, { type: "table" }>,
): Extract<ArtifactPayload, { type: "table" }> {
  return {
    ...payload,
    data: normalizeTableArtifactData(payload.data),
  };
}
