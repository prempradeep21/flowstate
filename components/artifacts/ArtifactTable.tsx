"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { TableColumn, TableRow } from "@/lib/artifactTypes";
import { tableAccentStyles } from "@/lib/tableAccentColor";
import {
  computeTableColumnWidths,
  TABLE_COLUMN_MIN_RESIZE_PERCENT,
} from "@/lib/tableColumnWidths";
import {
  normalizeTableCell,
  tableTagClassName,
} from "@/lib/tableCellContent";
import {
  formatRichTextForDisplay,
  RICH_TEXT_CLASS,
} from "@/lib/richTextDisplay";
import { ARTIFACT_CANVAS_SURFACE_FILL } from "@/lib/artifactCanvasChrome";

const MAX_ENTRANCE_MS = 3000;

function computeAnimationDelays(
  colCount: number,
  rowCount: number,
): { columnStagger: number; rowStagger: number } {
  if (colCount <= 0 || rowCount <= 0) {
    return { columnStagger: 0, rowStagger: 0 };
  }
  const columnStagger = Math.min(
    500,
    MAX_ENTRANCE_MS / Math.max(colCount, 1),
  );
  const remaining = Math.max(0, MAX_ENTRANCE_MS - columnStagger * colCount);
  const rowStagger =
    rowCount > 1 ? remaining / (colCount * (rowCount - 1)) : 0;
  return { columnStagger, rowStagger };
}

export function ArtifactTable({
  columns,
  rows,
  accentSeed = "table",
  versionId,
  maxHeightClassName = "max-h-[420px]",
  compact = false,
  animate = true,
  canvasSurface = false,
}: {
  columns: TableColumn[];
  rows: TableRow[];
  accentSeed?: string;
  versionId?: string;
  maxHeightClassName?: string;
  compact?: boolean;
  animate?: boolean;
  /** Canvas: defer opaque surface until artifact chrome hover. */
  canvasSurface?: boolean;
}) {
  const surfaceBg = canvasSurface
    ? ARTIFACT_CANVAS_SURFACE_FILL
    : "bg-canvas-card";
  const textSize = compact ? "text-canvas-caption" : "text-canvas-body-sm";
  const cellPad = compact ? "px-2 py-1.5" : "px-3 py-2.5";
  const headPad = compact ? "px-2 py-1.5" : "px-3 py-2";
  const animatedVersionRef = useRef<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const resizeRef = useRef<{
    pointerId: number;
    colIndex: number;
    startX: number;
    startLeft: number;
    startRight: number;
  } | null>(null);

  const defaultColumnWidths = useMemo(
    () => computeTableColumnWidths(columns, rows),
    [columns, rows],
  );

  const [columnPercents, setColumnPercents] = useState<number[]>([]);

  useEffect(() => {
    setColumnPercents(defaultColumnWidths.map((c) => c.percent));
  }, [defaultColumnWidths, versionId]);

  const widthByKey = useMemo(() => {
    const wrapDefaults = new Map(
      defaultColumnWidths.map((c) => [c.key, c.wrap]),
    );
    return new Map(
      columns.map((col, index) => [
        col.key,
        {
          percent:
            columnPercents[index] ??
            defaultColumnWidths[index]?.percent ??
            100 / Math.max(columns.length, 1),
          wrap: wrapDefaults.get(col.key) ?? false,
        },
      ]),
    );
  }, [columns, columnPercents, defaultColumnWidths]);

  const { columnStagger, rowStagger } = useMemo(
    () => computeAnimationDelays(columns.length, rows.length),
    [columns.length, rows.length],
  );

  const shouldAnimate =
    animate &&
    rows.length > 0 &&
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    animatedVersionRef.current !== (versionId ?? `rows-${rows.length}`);

  useEffect(() => {
    if (rows.length > 0) {
      animatedVersionRef.current = versionId ?? `rows-${rows.length}`;
    }
  }, [versionId, rows.length]);

  const handleResizePointerDown = useCallback(
    (colIndex: number, e: ReactPointerEvent<HTMLButtonElement>) => {
      if (compact || colIndex >= columns.length - 1) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      const left = columnPercents[colIndex] ?? 0;
      const right = columnPercents[colIndex + 1] ?? 0;
      resizeRef.current = {
        pointerId: e.pointerId,
        colIndex,
        startX: e.clientX,
        startLeft: left,
        startRight: right,
      };
    },
    [columnPercents, columns.length, compact],
  );

  const handleResizePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const rs = resizeRef.current;
      if (!rs || rs.pointerId !== e.pointerId || !tableRef.current) return;
      const tableWidth = tableRef.current.offsetWidth;
      if (tableWidth <= 0) return;

      const deltaPercent = ((e.clientX - rs.startX) / tableWidth) * 100;
      const min = TABLE_COLUMN_MIN_RESIZE_PERCENT;
      const newLeft = rs.startLeft + deltaPercent;
      const newRight = rs.startRight - deltaPercent;
      if (newLeft < min || newRight < min) return;

      setColumnPercents((prev) => {
        const next = [...prev];
        next[rs.colIndex] = Math.round(newLeft * 10) / 10;
        next[rs.colIndex + 1] = Math.round(newRight * 10) / 10;
        return next;
      });
    },
    [],
  );

  const handleResizePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const rs = resizeRef.current;
      if (!rs || rs.pointerId !== e.pointerId) return;
      resizeRef.current = null;
      try {
        (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [],
  );

  const resizable = !compact && columns.length > 1;

  return (
    <div
      data-canvas-scroll
      className={`overflow-y-auto overflow-x-hidden ${surfaceBg} ${maxHeightClassName}`}
      style={tableAccentStyles(accentSeed)}
    >
      <table
        ref={tableRef}
        className={`w-full table-fixed border-collapse text-left ${textSize} ${surfaceBg}`}
      >
        <colgroup>
          {columns.map((col, colIndex) => {
            const spec = widthByKey.get(col.key);
            return (
              <col
                key={`${col.key}-${colIndex}`}
                style={{
                  width: `${
                    spec?.percent ??
                    columnPercents[colIndex] ??
                    100 / Math.max(columns.length, 1)
                  }%`,
                }}
              />
            );
          })}
        </colgroup>
        <thead>
          <tr
            className={`sticky top-0 z-10 border-b backdrop-blur-sm ${surfaceBg}`}
            style={{ borderColor: "var(--table-accent-border)" }}
          >
            {columns.map((col, colIndex) => (
              <th
                key={`${col.key}-${colIndex}`}
                className={`relative ${headPad} font-bold`}
                style={{ color: "var(--table-accent)" }}
              >
                <span className={`block truncate pr-1 ${RICH_TEXT_CLASS}`}>
                  {formatRichTextForDisplay(col.label)}
                </span>
                {resizable && colIndex < columns.length - 1 ? (
                  <button
                    type="button"
                    data-table-col-resize
                    data-no-drag
                    aria-label={`Resize ${col.label} column`}
                    className="table-col-resize-handle absolute -right-1 top-0 z-20 h-full w-2 cursor-col-resize touch-none border-0 bg-transparent p-0"
                    onPointerDown={(e) => handleResizePointerDown(colIndex, e)}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    onPointerCancel={handleResizePointerUp}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: TableRow, ri) => (
            <tr
              key={ri}
              className={`table-artifact-row border-b border-canvas-border/60 transition-colors duration-150 last:border-0 ${surfaceBg}`}
            >
              {columns.map((col, ci) => {
                const spec = widthByKey.get(col.key);
                const { text, tags } = normalizeTableCell(row[col.key]);
                const delayMs = ci * columnStagger + ri * rowStagger;
                return (
                  <td
                    key={`${col.key}-${ci}`}
                    className={`align-top text-canvas-ink ${RICH_TEXT_CLASS} ${cellPad} ${
                      spec?.wrap ? "break-words whitespace-normal" : "break-words"
                    } ${shouldAnimate ? "table-cell-animate" : ""}`}
                    style={
                      shouldAnimate
                        ? { animationDelay: `${delayMs}ms` }
                        : undefined
                    }
                  >
                    <div className="flex flex-col gap-1">
                      {text ? (
                        <span className={tags.length > 0 ? "block" : undefined}>
                          {text}
                        </span>
                      ) : null}
                      {tags.length > 0 ? (
                        <span className="inline-flex flex-wrap items-center gap-1">
                          {tags.map((tag, ti) => (
                            <span
                              key={`${tag.label}-${ti}`}
                              className={tableTagClassName(tag.tone, compact)}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
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
