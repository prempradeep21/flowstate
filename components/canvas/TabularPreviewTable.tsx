"use client";

export function TabularPreviewTable({
  rows,
  totalRows,
  totalCols,
  label,
  noDrag,
  compact = false,
}: {
  rows: string[][];
  totalRows: number;
  totalCols: number;
  label?: string;
  noDrag?: boolean;
  compact?: boolean;
}) {
  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (colCount === 0) {
    return (
      <div
        className={`flex h-full items-center justify-center px-3 text-center text-canvas-muted ${
          compact ? "text-[8px]" : "text-canvas-caption"
        }`}
      >
        Empty
      </div>
    );
  }

  const cellClass = compact
    ? "max-w-[48px] truncate px-0.5 py-0.5 text-[7px] leading-tight"
    : "max-w-[120px] truncate px-2 py-1.5 text-canvas-micro";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {label ? (
        <div
          className={`shrink-0 border-b border-canvas-border/50 bg-canvas-bg/80 px-2 py-1 text-canvas-muted ${
            compact ? "text-[7px]" : "text-canvas-micro"
          }`}
        >
          {label}
          {totalRows > rows.length || totalCols > colCount
            ? ` · ${Math.min(rows.length, totalRows)}×${colCount}`
            : null}
        </div>
      ) : null}
      <div
        className="min-h-0 flex-1 overflow-auto"
        {...(noDrag ? { "data-no-drag": true } : {})}
      >
        <table
          className={`w-full border-collapse text-left text-canvas-ink ${
            compact ? "text-[7px]" : "text-canvas-micro"
          }`}
        >
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  rowIndex === 0
                    ? "bg-canvas-bg/80 font-medium"
                    : "border-t border-canvas-border/40"
                }
              >
                {Array.from({ length: colCount }, (_, colIndex) => (
                  <td key={colIndex} className={`align-top ${cellClass}`}>
                    {row[colIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
