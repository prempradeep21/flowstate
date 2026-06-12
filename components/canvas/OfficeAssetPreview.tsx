"use client";

import { useEffect, useState } from "react";
import type { CanvasAsset } from "@/lib/store";
import { officeOnlineEmbedUrl } from "@/lib/officeAssetKinds";
import {
  loadSpreadsheetPreview,
  type SpreadsheetPreviewData,
} from "@/lib/spreadsheetPreview";

function SpreadsheetPreviewTable({
  data,
  noDrag,
}: {
  data: SpreadsheetPreviewData;
  noDrag?: boolean;
}) {
  const colCount = data.rows.reduce(
    (max, row) => Math.max(max, row.length),
    0,
  );
  if (colCount === 0) {
    return (
      <div className="flex h-full items-center justify-center px-3 text-center text-canvas-caption text-canvas-muted">
        Empty sheet
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-canvas-border/50 bg-canvas-bg/80 px-2 py-1 text-canvas-micro text-canvas-muted">
        {data.sheetName}
        {data.totalRows > data.rows.length || data.totalCols > colCount
          ? ` · showing ${Math.min(data.rows.length, data.totalRows)}×${colCount} of ${data.totalRows}×${data.totalCols}`
          : null}
      </div>
      <div
        className="min-h-0 flex-1 overflow-auto"
        {...(noDrag ? { "data-no-drag": true } : {})}
      >
        <table className="w-full border-collapse text-left text-canvas-micro text-canvas-ink">
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  rowIndex === 0
                    ? "bg-canvas-bg/80 font-medium"
                    : "border-t border-canvas-border/40"
                }
              >
                {Array.from({ length: colCount }, (_, colIndex) => (
                  <td
                    key={colIndex}
                    className="max-w-[120px] truncate px-2 py-1.5 align-top"
                  >
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

function OfficeEmbedPreview({
  url,
  title,
  interactive,
  onActivate,
  noDrag,
}: {
  url: string;
  title: string;
  interactive: boolean;
  onActivate?: () => void;
  noDrag?: boolean;
}) {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white"
      {...(noDrag ? { "data-no-drag": true } : {})}
    >
      <iframe
        src={officeOnlineEmbedUrl(url)}
        title={title}
        className={`h-full w-full flex-1 border-0 bg-white ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
        allow="fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {!interactive && onActivate ? (
        <button
          type="button"
          aria-label="Click to interact with document"
          onClick={onActivate}
          className="absolute inset-0 z-10 flex cursor-pointer items-end justify-center bg-transparent pb-3 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <span className="rounded-full border border-canvas-border/60 bg-canvas-card/95 px-2.5 py-1 text-canvas-micro text-canvas-muted shadow-sm">
            Click to interact
          </span>
        </button>
      ) : null}
    </div>
  );
}

function PreviewFallback({
  asset,
  message,
}: {
  asset: CanvasAsset;
  message?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      <span className="text-canvas-body font-medium text-canvas-ink">
        {asset.name}
      </span>
      <span className="text-canvas-caption uppercase tracking-wide text-canvas-muted">
        {asset.kind}
      </span>
      {message ? (
        <span className="text-canvas-caption text-canvas-muted">{message}</span>
      ) : null}
    </div>
  );
}

export function OfficeAssetPreview({
  asset,
  interactive = false,
  onActivate,
  noDrag = false,
}: {
  asset: CanvasAsset;
  interactive?: boolean;
  onActivate?: () => void;
  noDrag?: boolean;
}) {
  const [sheetData, setSheetData] = useState<SpreadsheetPreviewData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(asset.kind === "spreadsheet");

  useEffect(() => {
    if (asset.kind !== "spreadsheet") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadSpreadsheetPreview(asset.publicUrl)
      .then((data) => {
        if (!cancelled) {
          setSheetData(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not preview spreadsheet",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [asset.kind, asset.publicUrl]);

  if (asset.kind === "spreadsheet") {
    if (loading) {
      return (
        <PreviewFallback asset={asset} message="Loading spreadsheet preview…" />
      );
    }
    if (error || !sheetData) {
      return (
        <PreviewFallback
          asset={asset}
          message={error ?? "Preview unavailable"}
        />
      );
    }
    return <SpreadsheetPreviewTable data={sheetData} noDrag={noDrag} />;
  }

  if (asset.kind === "word" || asset.kind === "presentation") {
    return (
      <OfficeEmbedPreview
        url={asset.publicUrl}
        title={asset.name}
        interactive={interactive}
        onActivate={onActivate}
        noDrag={noDrag || interactive}
      />
    );
  }

  return <PreviewFallback asset={asset} />;
}
