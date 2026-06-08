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

  return { columns, rows };
}

export function normalizeTablePayload(
  payload: Extract<ArtifactPayload, { type: "table" }>,
): Extract<ArtifactPayload, { type: "table" }> {
  return {
    ...payload,
    data: normalizeTableArtifactData(payload.data),
  };
}
