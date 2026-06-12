import type { TableArtifactData, TableColumn, TableRow } from "@/lib/artifactTypes";
import { normalizeTableCell } from "@/lib/tableCellContent";
import * as XLSX from "xlsx";

export function tableCellExportText(
  cell: string | import("@/lib/artifactTypes").TableCell | undefined,
): string {
  const { text, tags } = normalizeTableCell(cell);
  const tagLabels = tags.map((t) => t.label).filter(Boolean);
  if (tagLabels.length === 0) return text;
  if (!text) return tagLabels.join(", ");
  return `${text} (${tagLabels.join(", ")})`;
}

export function tableToGrid(
  columns: TableColumn[],
  rows: TableRow[],
): string[][] {
  const header = columns.map((col) => col.label);
  const body = rows.map((row) =>
    columns.map((col) => tableCellExportText(row[col.key])),
  );
  return [header, ...body];
}

export function tableToCsv(data: TableArtifactData): string {
  const grid = tableToGrid(data.columns, data.rows);
  const sheet = XLSX.utils.aoa_to_sheet(grid);
  return XLSX.utils.sheet_to_csv(sheet);
}

export function tableToMarkdown(data: TableArtifactData): string {
  const { columns, rows } = data;
  if (columns.length === 0) return "";
  const header = `| ${columns.map((c) => c.label).join(" | ")} |`;
  const sep = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows
    .map(
      (row) =>
        `| ${columns.map((col) => tableCellExportText(row[col.key]).replace(/\|/g, "\\|")).join(" | ")} |`,
    )
    .join("\n");
  return [header, sep, body].filter(Boolean).join("\n");
}

export function tableWorkbookBlob(
  data: TableArtifactData,
  bookType: "xlsx" | "xls" | "csv",
): Blob {
  const grid = tableToGrid(data.columns, data.rows);
  const sheet = XLSX.utils.aoa_to_sheet(grid);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  const arrayBuffer = XLSX.write(workbook, { bookType, type: "array" });
  const mime =
    bookType === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : bookType === "xls"
        ? "application/vnd.ms-excel"
        : "text/csv";
  return new Blob([arrayBuffer], { type: mime });
}

export function tableToHtml(data: TableArtifactData): string {
  const { columns, rows } = data;
  const head = columns
    .map((col) => `<th>${escapeHtml(col.label)}</th>`)
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((col) => `<td>${escapeHtml(tableCellExportText(row[col.key]))}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Table</title>
<style>
  table { border-collapse: collapse; width: 100%; font-family: system-ui, sans-serif; font-size: 14px; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  tr:nth-child(even) { background: #fafafa; }
</style>
</head>
<body>
<table>
<thead><tr>${head}</tr></thead>
<tbody>${body}</tbody>
</table>
</body>
</html>`;
}

export function tableToReact(data: TableArtifactData): string {
  const { columns, rows } = data;
  const cols = columns
    .map((col) => `    { key: ${JSON.stringify(col.key)}, label: ${JSON.stringify(col.label)} },`)
    .join("\n");
  const rowData = rows.map((row) => {
    const entries = columns.map(
      (col) => `      ${JSON.stringify(col.key)}: ${JSON.stringify(tableCellExportText(row[col.key]))},`,
    );
    return `    {\n${entries.join("\n")}\n    }`;
  });
  return `import React from "react";

const columns = [
${cols}
];

const rows = [
${rowData.join(",\n")}
];

export default function DataTable() {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ border: "1px solid #ddd", padding: "8px 12px" }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key} style={{ border: "1px solid #ddd", padding: "8px 12px" }}>
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
