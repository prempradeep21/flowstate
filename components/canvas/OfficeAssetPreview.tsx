"use client";

import { useEffect, useRef, useState } from "react";
import { TabularPreviewTable } from "@/components/canvas/TabularPreviewTable";
import type { CanvasAsset } from "@/lib/store";
import { officeOnlineEmbedUrl } from "@/lib/officeAssetKinds";
import {
  loadPresentationOutline,
  loadWordDocumentHtml,
} from "@/lib/officeDocumentFallback";
import {
  loadSpreadsheetPreview,
  type SpreadsheetPreviewData,
} from "@/lib/spreadsheetPreview";

const OFFICE_EMBED_TIMEOUT_MS = 8000;

function SpreadsheetPreviewTable({
  data,
  noDrag,
  compact,
}: {
  data: SpreadsheetPreviewData;
  noDrag?: boolean;
  compact?: boolean;
}) {
  return (
    <TabularPreviewTable
      rows={data.rows}
      totalRows={data.totalRows}
      totalCols={data.totalCols}
      label={data.sheetName}
      noDrag={noDrag}
      compact={compact}
    />
  );
}

function HtmlFallbackPreview({
  html,
  title,
  interactive,
  onActivate,
  noDrag,
  compact,
}: {
  html: string;
  title: string;
  interactive: boolean;
  onActivate?: () => void;
  noDrag?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white"
      {...(noDrag ? { "data-no-drag": true } : {})}
    >
      <iframe
        srcDoc={html}
        title={title}
        sandbox=""
        className={`h-full w-full flex-1 border-0 bg-white ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
      />
      {!interactive && onActivate ? (
        <button
          type="button"
          aria-label="Click to interact with document"
          onClick={onActivate}
          className={`absolute inset-0 z-10 flex cursor-pointer items-end justify-center bg-transparent opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 ${
            compact ? "pb-0.5" : "pb-3"
          }`}
        >
          <span
            className={`rounded-full border border-canvas-border/60 bg-canvas-card/95 text-canvas-muted shadow-sm ${
              compact
                ? "px-1 py-0 text-[7px]"
                : "px-2.5 py-1 text-canvas-micro"
            }`}
          >
            Click to interact
          </span>
        </button>
      ) : null}
    </div>
  );
}

function OfficeEmbedPreview({
  url,
  title,
  interactive,
  onActivate,
  noDrag,
  compact,
  onEmbedFailed,
}: {
  url: string;
  title: string;
  interactive: boolean;
  onActivate?: () => void;
  noDrag?: boolean;
  compact?: boolean;
  onEmbedFailed: () => void;
}) {
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    const timer = window.setTimeout(() => {
      if (!loadedRef.current) onEmbedFailed();
    }, OFFICE_EMBED_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [url, onEmbedFailed]);

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
        onLoad={() => {
          loadedRef.current = true;
        }}
        onError={onEmbedFailed}
      />
      {!interactive && onActivate ? (
        <button
          type="button"
          aria-label="Click to interact with document"
          onClick={onActivate}
          className={`absolute inset-0 z-10 flex cursor-pointer items-end justify-center bg-transparent opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 ${
            compact ? "pb-0.5" : "pb-3"
          }`}
        >
          <span
            className={`rounded-full border border-canvas-border/60 bg-canvas-card/95 text-canvas-muted shadow-sm ${
              compact
                ? "px-1 py-0 text-[7px]"
                : "px-2.5 py-1 text-canvas-micro"
            }`}
          >
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
  compact,
}: {
  asset: CanvasAsset;
  message?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-2 px-4 text-center ${
        compact ? "gap-1 px-1" : ""
      }`}
    >
      <span
        className={`font-medium text-canvas-ink ${
          compact ? "line-clamp-2 text-[8px]" : "text-canvas-body"
        }`}
      >
        {asset.name}
      </span>
      <span
        className={`uppercase tracking-wide text-canvas-muted ${
          compact ? "text-[7px]" : "text-canvas-caption"
        }`}
      >
        {asset.kind}
      </span>
      {message ? (
        <span
          className={`text-canvas-muted ${
            compact ? "text-[7px]" : "text-canvas-caption"
          }`}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}

export function OfficeAssetPreview({
  asset,
  interactive = false,
  onActivate,
  noDrag = false,
  compact = false,
}: {
  asset: CanvasAsset;
  interactive?: boolean;
  onActivate?: () => void;
  noDrag?: boolean;
  compact?: boolean;
}) {
  const [sheetData, setSheetData] = useState<SpreadsheetPreviewData | null>(
    null,
  );
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(
    asset.kind === "spreadsheet" ||
      asset.kind === "word" ||
      asset.kind === "presentation",
  );
  const [embedFailed, setEmbedFailed] = useState(false);

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

  useEffect(() => {
    if (asset.kind !== "word" && asset.kind !== "presentation") return;
    if (!embedFailed) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const loader =
      asset.kind === "word"
        ? loadWordDocumentHtml(asset.publicUrl, asset.name)
        : loadPresentationOutline(asset.publicUrl, asset.name);
    loader
      .then((html) => {
        if (!cancelled) {
          setFallbackHtml(html);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not preview document",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [asset.kind, asset.name, asset.publicUrl, embedFailed]);

  if (asset.kind === "spreadsheet") {
    if (loading) {
      return (
        <PreviewFallback
          asset={asset}
          message="Loading spreadsheet preview…"
          compact={compact}
        />
      );
    }
    if (error || !sheetData) {
      return (
        <PreviewFallback
          asset={asset}
          message={error ?? "Preview unavailable"}
          compact={compact}
        />
      );
    }
    return (
      <SpreadsheetPreviewTable
        data={sheetData}
        noDrag={noDrag}
        compact={compact}
      />
    );
  }

  if (asset.kind === "word" || asset.kind === "presentation") {
    if (embedFailed) {
      if (loading) {
        return (
          <PreviewFallback
            asset={asset}
            message="Loading local preview…"
            compact={compact}
          />
        );
      }
      if (error || !fallbackHtml) {
        return (
          <PreviewFallback
            asset={asset}
            message={error ?? "Preview unavailable"}
            compact={compact}
          />
        );
      }
      return (
        <HtmlFallbackPreview
          html={fallbackHtml}
          title={asset.name}
          interactive={interactive}
          onActivate={onActivate}
          noDrag={noDrag || interactive}
          compact={compact}
        />
      );
    }

    return (
      <OfficeEmbedPreview
        url={asset.publicUrl}
        title={asset.name}
        interactive={interactive}
        onActivate={onActivate}
        noDrag={noDrag || interactive}
        compact={compact}
        onEmbedFailed={() => setEmbedFailed(true)}
      />
    );
  }

  return <PreviewFallback asset={asset} compact={compact} />;
}
