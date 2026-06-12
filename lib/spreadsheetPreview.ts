import * as XLSX from "xlsx";

export interface SpreadsheetPreviewData {
  sheetName: string;
  rows: string[][];
  totalRows: number;
  totalCols: number;
}

const MAX_PREVIEW_ROWS = 24;
const MAX_PREVIEW_COLS = 10;

function cellToDisplay(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
}

export async function loadSpreadsheetPreview(
  url: string,
): Promise<SpreadsheetPreviewData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load spreadsheet (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Spreadsheet has no sheets");
  }
  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(
    sheet,
    { header: 1, defval: "" },
  );
  const totalRows = grid.length;
  const totalCols = grid.reduce((max, row) => Math.max(max, row.length), 0);
  const rows = grid
    .slice(0, MAX_PREVIEW_ROWS)
    .map((row) =>
      Array.from({ length: Math.min(totalCols, MAX_PREVIEW_COLS) }, (_, index) =>
        cellToDisplay(row[index]),
      ),
    );
  return {
    sheetName,
    rows,
    totalRows,
    totalCols,
  };
}
