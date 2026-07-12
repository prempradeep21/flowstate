"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useArtifactCanvasSizeReport } from "@/components/artifacts/ArtifactCanvasSizeReportContext";
import type { TableColumn, TableRow } from "@/lib/artifactTypes";
import { tableAccentStyles } from "@/lib/tableAccentColor";
import {
  computeTableColumnWidths,
  computeTableColumnWidthsPx,
  computeTableIntrinsicSize,
  sumTableColumnWidthsPx,
  TABLE_COLUMN_MIN_PX,
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
import { useCanvasStore } from "@/lib/store";

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
  minHeightPx,
  minWidthPx,
  compact = false,
  animate = true,
  canvasSurface = false,
}: {
  columns: TableColumn[];
  rows: TableRow[];
  accentSeed?: string;
  versionId?: string;
  maxHeightClassName?: string;
  /** Canvas fill: floor body height so auto-size does not collapse the node. */
  minHeightPx?: number;
  /** Canvas fill: floor body width so columns are not squeezed during measure. */
  minWidthPx?: number;
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
  // Viewport scale is read imperatively in the resize handler — a reactive
  // subscription re-rendered every table artifact on every zoom frame.
  const animatedVersionRef = useRef<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const userAdjustedRef = useRef(false);
  const lastSchemaRef = useRef("");
  const lastVersionRef = useRef<string | undefined>(undefined);
  const percentResizeRef = useRef<{
    pointerId: number;
    colIndex: number;
    startX: number;
    startLeft: number;
    startRight: number;
  } | null>(null);
  const pxResizeRef = useRef<{
    pointerId: number;
    colIndex: number;
    startX: number;
    startColWidth: number;
    startTableWidth: number;
  } | null>(null);
  const reportCanvasSize = useArtifactCanvasSizeReport();

  const columnSchemaKey = useMemo(
    () => columns.map((c) => `${c.key}:${c.label}`).join("|"),
    [columns],
  );

  const defaultColumnWidths = useMemo(
    () => computeTableColumnWidths(columns, rows),
    [columns, rows],
  );

  const defaultColumnWidthsPx = useMemo(
    () => computeTableColumnWidthsPx(columns, rows),
    [columns, rows],
  );

  const intrinsicSize = useMemo(
    () => computeTableIntrinsicSize(columns, rows),
    [columns, rows],
  );

  const [columnPercents, setColumnPercents] = useState<number[]>([]);
  const [columnWidthsPx, setColumnWidthsPx] = useState<number[]>([]);

  const activeColumnWidthsPx = useMemo(
    () =>
      columnWidthsPx.length > 0
        ? columnWidthsPx
        : defaultColumnWidthsPx.map((c) => c.widthPx),
    [columnWidthsPx, defaultColumnWidthsPx],
  );

  const tableWidthPx = useMemo(
    () => sumTableColumnWidthsPx(activeColumnWidthsPx),
    [activeColumnWidthsPx],
  );

  useEffect(() => {
    const schemaChanged = lastSchemaRef.current !== columnSchemaKey;
    const versionChanged = lastVersionRef.current !== versionId;
    if (schemaChanged || versionChanged) {
      lastSchemaRef.current = columnSchemaKey;
      lastVersionRef.current = versionId;
      userAdjustedRef.current = false;
      setColumnPercents(defaultColumnWidths.map((c) => c.percent));
      setColumnWidthsPx(defaultColumnWidthsPx.map((c) => c.widthPx));
      return;
    }
    if (!userAdjustedRef.current) {
      setColumnPercents(defaultColumnWidths.map((c) => c.percent));
      setColumnWidthsPx(defaultColumnWidthsPx.map((c) => c.widthPx));
    }
  }, [columnSchemaKey, versionId, defaultColumnWidths, defaultColumnWidthsPx]);

  useEffect(() => {
    if (!canvasSurface || !reportCanvasSize) return;
    reportCanvasSize({
      w: tableWidthPx,
      h: intrinsicSize.heightPx,
    });
  }, [canvasSurface, reportCanvasSize, tableWidthPx, intrinsicSize.heightPx]);

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
          widthPx:
            activeColumnWidthsPx[index] ??
            defaultColumnWidthsPx[index]?.widthPx ??
            TABLE_COLUMN_MIN_PX,
          wrap: wrapDefaults.get(col.key) ?? false,
        },
      ]),
    );
  }, [
    columns,
    columnPercents,
    defaultColumnWidths,
    activeColumnWidthsPx,
    defaultColumnWidthsPx,
  ]);

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
      if (compact) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);

      if (canvasSurface) {
        pxResizeRef.current = {
          pointerId: e.pointerId,
          colIndex,
          startX: e.clientX,
          startColWidth: activeColumnWidthsPx[colIndex] ?? TABLE_COLUMN_MIN_PX,
          startTableWidth: tableWidthPx,
        };
        return;
      }

      if (colIndex >= columns.length - 1) return;
      const left = columnPercents[colIndex] ?? 0;
      const right = columnPercents[colIndex + 1] ?? 0;
      percentResizeRef.current = {
        pointerId: e.pointerId,
        colIndex,
        startX: e.clientX,
        startLeft: left,
        startRight: right,
      };
    },
    [
      activeColumnWidthsPx,
      canvasSurface,
      columnPercents,
      columns.length,
      compact,
      tableWidthPx,
    ],
  );

  const handleResizePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const pxRs = pxResizeRef.current;
      if (pxRs && pxRs.pointerId === e.pointerId && canvasSurface) {
        const vpScale = useCanvasStore.getState().viewport.scale;
        const scale = vpScale > 0 ? vpScale : 1;
        const deltaPx = (e.clientX - pxRs.startX) / scale;
        const newColWidth = Math.max(
          TABLE_COLUMN_MIN_PX,
          Math.round(pxRs.startColWidth + deltaPx),
        );
        const appliedDelta = newColWidth - pxRs.startColWidth;
        if (appliedDelta === 0) return;

        userAdjustedRef.current = true;
        setColumnWidthsPx((prev) => {
          const base =
            prev.length > 0
              ? prev
              : defaultColumnWidthsPx.map((c) => c.widthPx);
          const next = [...base];
          next[pxRs.colIndex] = newColWidth;
          return next;
        });

        if (reportCanvasSize) {
          reportCanvasSize({
            w: pxRs.startTableWidth + appliedDelta,
            h: intrinsicSize.heightPx,
          });
        }
        return;
      }

      const rs = percentResizeRef.current;
      if (!rs || rs.pointerId !== e.pointerId || !tableRef.current) return;
      const tableWidth = tableRef.current.offsetWidth;
      if (tableWidth <= 0) return;

      const deltaPercent = ((e.clientX - rs.startX) / tableWidth) * 100;
      const min = TABLE_COLUMN_MIN_RESIZE_PERCENT;
      const newLeft = rs.startLeft + deltaPercent;
      const newRight = rs.startRight - deltaPercent;
      if (newLeft < min || newRight < min) return;

      userAdjustedRef.current = true;
      setColumnPercents((prev) => {
        const next = [...prev];
        next[rs.colIndex] = Math.round(newLeft * 10) / 10;
        next[rs.colIndex + 1] = Math.round(newRight * 10) / 10;
        return next;
      });
    },
    [
      canvasSurface,
      defaultColumnWidthsPx,
      intrinsicSize.heightPx,
      reportCanvasSize,
    ],
  );

  const handleResizePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const pxRs = pxResizeRef.current;
      if (pxRs && pxRs.pointerId === e.pointerId) {
        pxResizeRef.current = null;
        try {
          (e.currentTarget as HTMLButtonElement).releasePointerCapture(
            e.pointerId,
          );
        } catch {
          // ignore
        }
        return;
      }

      const rs = percentResizeRef.current;
      if (!rs || rs.pointerId !== e.pointerId) return;
      percentResizeRef.current = null;
      try {
        (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [],
  );

  const resizable = !compact && columns.length > 0;
  const showResizeHandle = (colIndex: number) =>
    resizable &&
    (canvasSurface ? true : colIndex < columns.length - 1);

  // On canvas the table fills its (fixed, user-resizable) node and scrolls
  // internally on both axes — the node no longer auto-grows to the full table.
  // `data-canvas-scroll` tells the wheel gate to hand scrolling to the browser
  // (both axes) once the node is selected, instead of panning the canvas.
  const overflowClass = canvasSurface
    ? "overflow-auto w-full min-h-0 flex-1"
    : "overflow-y-auto overflow-x-hidden";

  const resolvedMinWidthPx = canvasSurface ? undefined : minWidthPx;
  const resolvedMinHeightPx = canvasSurface ? undefined : minHeightPx;

  return (
    <div
      {...(canvasSurface ? { "data-canvas-scroll": "" } : {})}
      className={`${overflowClass} ${surfaceBg} ${maxHeightClassName}`}
      style={{
        ...tableAccentStyles(accentSeed),
        ...(resolvedMinHeightPx != null
          ? { minHeight: resolvedMinHeightPx }
          : {}),
        ...(resolvedMinWidthPx != null ? { minWidth: resolvedMinWidthPx } : {}),
      }}
    >
      <table
        ref={tableRef}
        className={`table-fixed border-collapse text-left ${textSize} ${surfaceBg} ${
          canvasSurface ? "" : "w-full"
        }`}
        style={
          canvasSurface
            ? { width: tableWidthPx, minWidth: tableWidthPx }
            : undefined
        }
      >
        <colgroup>
          {columns.map((col, colIndex) => {
            const spec = widthByKey.get(col.key);
            return (
              <col
                key={`${col.key}-${colIndex}`}
                style={
                  canvasSurface
                    ? { width: `${spec?.widthPx ?? TABLE_COLUMN_MIN_PX}px` }
                    : {
                        width: `${
                          spec?.percent ??
                          columnPercents[colIndex] ??
                          100 / Math.max(columns.length, 1)
                        }%`,
                      }
                }
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
                {showResizeHandle(colIndex) ? (
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
                    className={`overflow-hidden align-top text-canvas-ink ${RICH_TEXT_CLASS} ${cellPad} ${
                      spec?.wrap ? "break-words whitespace-normal" : "break-words"
                    } ${shouldAnimate ? "table-cell-animate" : ""}`}
                    style={
                      shouldAnimate
                        ? { animationDelay: `${delayMs}ms` }
                        : undefined
                    }
                  >
                    <div className="flex min-w-0 w-full flex-col gap-1">
                      {text ? (
                        <span className={tags.length > 0 ? "block" : undefined}>
                          {text}
                        </span>
                      ) : null}
                      {tags.length > 0 ? (
                        <span
                          className={
                            tags.length > 1
                              ? "flex min-w-0 w-full flex-col items-start gap-1.5"
                              : "flex min-w-0 w-full flex-wrap items-start gap-1"
                          }
                        >
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
