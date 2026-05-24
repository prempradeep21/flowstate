"use client";

import type { TableCell, TableColumn, TableRow } from "@/lib/artifactTypes";

function cellValue(cell: string | TableCell | undefined): string {
  if (cell == null) return "";
  if (typeof cell === "string") return cell;
  return cell.value;
}

function cellBadge(cell: string | TableCell | undefined): string | undefined {
  if (cell == null || typeof cell === "string") return undefined;
  return cell.badge;
}

export function ArtifactTable({
  columns,
  rows,
  maxHeightClassName = "max-h-[420px]",
}: {
  columns: TableColumn[];
  rows: TableRow[];
  maxHeightClassName?: string;
}) {
  const colWidth = `${100 / Math.max(columns.length, 1)}%`;

  return (
    <div className={`overflow-y-auto overflow-x-hidden ${maxHeightClassName}`}>
      <table className="w-full table-fixed border-collapse text-left text-[13px]">
        <thead>
          <tr className="sticky top-0 z-10 border-b border-canvas-border bg-canvas-bg/95 backdrop-blur-sm">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: colWidth }}
                className="px-3 py-2 font-medium text-canvas-muted"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: TableRow, ri) => (
            <tr
              key={ri}
              className="border-b border-canvas-border/60 last:border-0"
            >
              {columns.map((col) => {
                const cell = row[col.key];
                const badge = cellBadge(cell);
                return (
                  <td
                    key={col.key}
                    className="break-words px-3 py-2.5 align-top text-canvas-ink"
                  >
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {cellValue(cell)}
                      {badge && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                          {badge}
                        </span>
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
