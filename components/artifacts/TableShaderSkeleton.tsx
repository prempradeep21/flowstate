"use client";

import { ARTIFACT_CANVAS_SURFACE_FILL } from "@/lib/artifactCanvasChrome";
import { tableAccentStyles } from "@/lib/tableAccentColor";

export function TableShaderSkeleton({
  accentSeed,
  columnCount = 5,
  rowCount = 7,
  compact = false,
  maxHeightClassName = "max-h-[420px]",
  minHeightPx,
  minWidthPx,
  canvasSurface = false,
}: {
  accentSeed: string;
  columnCount?: number;
  rowCount?: number;
  compact?: boolean;
  maxHeightClassName?: string;
  minHeightPx?: number;
  minWidthPx?: number;
  canvasSurface?: boolean;
}) {
  const surfaceBg = canvasSurface
    ? ARTIFACT_CANVAS_SURFACE_FILL
    : "bg-canvas-card";
  const cols = Math.max(3, Math.min(columnCount || 5, 8));
  const rows = Math.max(4, Math.min(rowCount, 10));
  const headPad = compact ? "px-2 py-1.5" : "px-3 py-2";
  const cellPad = compact ? "px-2 py-2" : "px-3 py-2.5";
  const barH = compact ? "h-2.5" : "h-3";

  return (
    <div
      className={`overflow-hidden ${surfaceBg} ${maxHeightClassName}`}
      style={{
        ...tableAccentStyles(accentSeed),
        ...(minHeightPx != null ? { minHeight: minHeightPx } : {}),
        ...(minWidthPx != null ? { minWidth: minWidthPx } : {}),
      }}
      aria-hidden
    >
      <table className={`w-full table-fixed border-collapse ${surfaceBg}`}>
        <thead>
          <tr
            className="border-b"
            style={{ borderColor: "var(--table-accent-border)" }}
          >
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className={headPad}>
                <div
                  className={`table-shimmer-bar ${barH} w-3/5 max-w-[72px] rounded`}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr
              key={ri}
              className="border-b border-canvas-border/40 last:border-0"
            >
              {Array.from({ length: cols }).map((_, ci) => (
                <td key={ci} className={cellPad}>
                  <div
                    className={`table-shimmer-bar ${barH} rounded`}
                    style={{
                      width: `${45 + ((ri + ci) % 4) * 12}%`,
                      animationDelay: `${(ri * cols + ci) * 60}ms`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
