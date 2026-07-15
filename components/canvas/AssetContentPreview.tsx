"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OfficeAssetPreview } from "@/components/canvas/OfficeAssetPreview";
import { TabularPreviewTable } from "@/components/canvas/TabularPreviewTable";
import { highlightCode, languageFromPath } from "@/lib/codeHighlight";
import {
  fetchAssetText,
  maxBytesForAssetPreview,
  parseCsvPreview,
  parseJsonPreview,
  pdfEmbedUrl,
  resolvePreviewKind,
  type AssetPreviewRenderer,
} from "@/lib/documentPreview";
import { refreshAssetSignedUrl } from "@/lib/refreshAssetUrl";
import type { CanvasAsset } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

function PreviewFallback({
  asset,
  message,
  compact = false,
}: {
  asset: CanvasAsset;
  message?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-1 px-2 text-center ${
        compact ? "text-[8px]" : ""
      }`}
    >
      <span
        className={`font-medium text-canvas-ink ${
          compact ? "line-clamp-2 text-[8px]" : "text-canvas-body"
        }`}
      >
        {asset.name}
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

function InteractOverlay({
  onActivate,
  compact,
}: {
  onActivate?: () => void;
  compact?: boolean;
}) {
  if (!onActivate) return null;
  return (
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
  );
}

function PdfAssetPreview({
  asset,
  interactive,
  onActivate,
  noDrag,
  compact,
}: {
  asset: CanvasAsset;
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
        src={pdfEmbedUrl(asset.publicUrl)}
        title={asset.name}
        className={`w-full flex-1 border-0 bg-white ${
          compact ? "min-h-[36px]" : "min-h-[360px]"
        } ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
        allow="fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {!interactive ? (
        <InteractOverlay onActivate={onActivate} compact={compact} />
      ) : null}
    </div>
  );
}

function HtmlAssetPreview({
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
  const srcDoc = useMemo(() => html, [html]);

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white"
      {...(noDrag ? { "data-no-drag": true } : {})}
    >
      <iframe
        srcDoc={srcDoc}
        title={title}
        sandbox=""
        className={`h-full w-full flex-1 border-0 bg-white ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
      />
      {!interactive ? (
        <InteractOverlay onActivate={onActivate} compact={compact} />
      ) : null}
    </div>
  );
}

function TextAssetPreview({
  content,
  language,
  fileName,
  interactive,
  noDrag,
  compact,
  error,
}: {
  content: string | null;
  language: string;
  fileName: string;
  interactive: boolean;
  noDrag?: boolean;
  compact?: boolean;
  error?: string | null;
}) {
  const html = useMemo(() => {
    if (!content) return "";
    return highlightCode(content, language);
  }, [content, language]);

  if (error) {
    return (
      <PreviewFallback
        asset={{ name: fileName } as CanvasAsset}
        message={error}
        compact={compact}
      />
    );
  }

  if (!content) {
    return (
      <PreviewFallback
        asset={{ name: fileName } as CanvasAsset}
        message="Loading…"
        compact={compact}
      />
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-canvas-card ${
        compact ? "p-0.5" : ""
      }`}
    >
      <pre
        data-canvas-scroll
        className={`min-h-0 flex-1 overflow-auto font-mono leading-[1.45] text-canvas-ink ${
          compact
            ? "p-0.5 text-[6px] leading-[1.3]"
            : "p-3 text-canvas-body-sm"
        }`}
        {...(noDrag && interactive ? { "data-no-drag": true } : {})}
      >
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

function JsonAssetPreview({
  content,
  fileName,
  interactive,
  noDrag,
  compact,
  error,
}: {
  content: string | null;
  fileName: string;
  interactive: boolean;
  noDrag?: boolean;
  compact?: boolean;
  error?: string | null;
}) {
  const parsed = useMemo(() => {
    if (!content) return null;
    return parseJsonPreview(content);
  }, [content]);

  if (error) {
    return (
      <PreviewFallback
        asset={{ name: fileName } as CanvasAsset}
        message={error}
        compact={compact}
      />
    );
  }

  if (!content || !parsed) {
    return (
      <PreviewFallback
        asset={{ name: fileName } as CanvasAsset}
        message="Loading…"
        compact={compact}
      />
    );
  }

  if (!parsed.valid) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div
          className={`shrink-0 px-2 py-1 text-canvas-danger ${
            compact ? "text-[7px]" : "text-canvas-caption"
          }`}
        >
          Invalid JSON: {parsed.message}
        </div>
        <TextAssetPreview
          content={parsed.raw}
          language="json"
          fileName={fileName}
          interactive={interactive}
          noDrag={noDrag}
          compact={compact}
        />
      </div>
    );
  }

  return (
    <TextAssetPreview
      content={parsed.pretty}
      language="json"
      fileName={fileName}
      interactive={interactive}
      noDrag={noDrag}
      compact={compact}
    />
  );
}

function CsvAssetPreview({
  content,
  fileName,
  interactive,
  noDrag,
  compact,
  error,
}: {
  content: string | null;
  fileName: string;
  interactive: boolean;
  noDrag?: boolean;
  compact?: boolean;
  error?: string | null;
}) {
  const data = useMemo(() => {
    if (!content) return null;
    return parseCsvPreview(content);
  }, [content]);

  if (error) {
    return (
      <PreviewFallback
        asset={{ name: fileName } as CanvasAsset}
        message={error}
        compact={compact}
      />
    );
  }

  if (!content || !data) {
    return (
      <PreviewFallback
        asset={{ name: fileName } as CanvasAsset}
        message="Loading…"
        compact={compact}
      />
    );
  }

  return (
    <TabularPreviewTable
      rows={data.rows}
      totalRows={data.totalRows}
      totalCols={data.totalCols}
      noDrag={noDrag && interactive}
      compact={compact}
    />
  );
}

function useAssetTextContent(asset: CanvasAsset, enabled: boolean) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setContent(null);
    setError(null);
    fetchAssetText(asset.publicUrl, maxBytesForAssetPreview(asset))
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load preview",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [asset.publicUrl, asset.kind, asset.name, enabled]);

  return { content, error };
}

function TextBasedPreview({
  asset,
  renderer,
  interactive,
  onActivate,
  noDrag,
  compact,
}: {
  asset: CanvasAsset;
  renderer: AssetPreviewRenderer;
  interactive: boolean;
  onActivate?: () => void;
  noDrag?: boolean;
  compact?: boolean;
}) {
  const { content, error } = useAssetTextContent(asset, true);
  const language =
    renderer === "markdown"
      ? "markdown"
      : languageFromPath(asset.name);

  if (renderer === "html" && content) {
    return (
      <HtmlAssetPreview
        html={content}
        title={asset.name}
        interactive={interactive}
        onActivate={onActivate}
        noDrag={noDrag}
        compact={compact}
      />
    );
  }

  if (renderer === "json") {
    return (
      <JsonAssetPreview
        content={content}
        fileName={asset.name}
        interactive={interactive}
        noDrag={noDrag}
        compact={compact}
        error={error}
      />
    );
  }

  if (renderer === "csv") {
    return (
      <CsvAssetPreview
        content={content}
        fileName={asset.name}
        interactive={interactive}
        noDrag={noDrag}
        compact={compact}
        error={error}
      />
    );
  }

  return (
    <TextAssetPreview
      content={content}
      language={language}
      fileName={asset.name}
      interactive={interactive}
      noDrag={noDrag}
      compact={compact}
      error={error}
    />
  );
}

function ImageAssetPreview({
  asset,
  compact,
}: {
  asset: CanvasAsset;
  compact: boolean;
}) {
  const [src, setSrc] = useState(asset.publicUrl);
  const [failed, setFailed] = useState(false);
  const refreshedRef = useRef(false);

  useEffect(() => {
    setSrc(asset.publicUrl);
    setFailed(false);
    refreshedRef.current = false;
  }, [asset.id, asset.publicUrl]);

  const handleError = () => {
    if (!refreshedRef.current && asset.storagePath) {
      refreshedRef.current = true;
      void refreshAssetSignedUrl(asset.storagePath).then((nextUrl) => {
        if (nextUrl) {
          setSrc(nextUrl);
          useCanvasStore.getState().patchCanvasAssetPublicUrl(asset.id, nextUrl);
          return;
        }
        setFailed(true);
      });
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <PreviewFallback
        asset={asset}
        message="Preview unavailable"
        compact={compact}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={asset.name}
      draggable={false}
      className={`h-full w-full ${compact ? "object-cover" : "object-contain"}`}
      onError={handleError}
    />
  );
}

export function AssetContentPreview({
  asset,
  layout = "canvas",
  interactive = false,
  onActivate,
  noDrag = false,
}: {
  asset: CanvasAsset;
  layout?: "canvas" | "sidebar";
  interactive?: boolean;
  onActivate?: () => void;
  noDrag?: boolean;
}) {
  const compact = layout === "sidebar";
  const previewKind = resolvePreviewKind(asset);

  if (previewKind === "image") {
    return <ImageAssetPreview asset={asset} compact={compact} />;
  }

  if (previewKind === "office") {
    return (
      <OfficeAssetPreview
        asset={asset}
        interactive={interactive}
        onActivate={onActivate}
        noDrag={noDrag || interactive}
        compact={compact}
      />
    );
  }

  if (previewKind === "pdf") {
    return (
      <PdfAssetPreview
        asset={asset}
        interactive={interactive}
        onActivate={onActivate}
        noDrag={noDrag || interactive}
        compact={compact}
      />
    );
  }

  if (
    previewKind === "code" ||
    previewKind === "markdown" ||
    previewKind === "plain-text" ||
    previewKind === "json" ||
    previewKind === "csv" ||
    previewKind === "html"
  ) {
    return (
      <TextBasedPreview
        asset={asset}
        renderer={previewKind}
        interactive={interactive}
        onActivate={onActivate}
        noDrag={noDrag || interactive}
        compact={compact}
      />
    );
  }

  return <PreviewFallback asset={asset} compact={compact} />;
}
