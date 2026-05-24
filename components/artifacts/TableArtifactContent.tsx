"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { TableCell, TableRow } from "@/lib/artifactTypes";
import type { ArtifactPayload } from "@/lib/artifactTypes";

function cellValue(cell: string | TableCell | undefined): string {
  if (cell == null) return "";
  if (typeof cell === "string") return cell;
  return cell.value;
}

function cellBadge(cell: string | TableCell | undefined): string | undefined {
  if (cell == null || typeof cell === "string") return undefined;
  return cell.badge;
}

export function TableArtifactContent({
  payload,
}: {
  payload: Extract<ArtifactPayload, { type: "table" }>;
}) {
  const { columns, rows } = payload.data;

  return (
    <ArtifactContentStage minHeight="200px" className="min-h-[200px] p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-canvas-border bg-canvas-bg/60">
              {columns.map((col) => (
                <th
                  key={col.key}
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
                    <td key={col.key} className="px-3 py-2.5 text-canvas-ink">
                      <span className="inline-flex items-center gap-2">
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
    </ArtifactContentStage>
  );
}
