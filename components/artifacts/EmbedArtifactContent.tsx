"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { retryEmbedArtifact } from "@/lib/createUrlArtifact";
import { isEmbedTitlePending } from "@/lib/embedArtifact";

function displayHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host + u.pathname + u.search;
  } catch {
    return url;
  }
}

function EmbedFavicon({
  faviconUrl,
  className,
}: {
  faviconUrl?: string;
  className: string;
}) {
  if (faviconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={faviconUrl}
        alt=""
        className={`${className} object-contain`}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-canvas-bg text-canvas-muted`}
    >
      <ArtifactTypeIcon kind="embed" className="h-1/2 w-1/2" />
    </div>
  );
}

function PreviewThumbnail({
  previewImageUrl,
  alt,
  className,
}: {
  previewImageUrl: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={previewImageUrl}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function EmbedHtmlFrame({ html }: { html: string }) {
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;overflow:hidden;}</style></head><body>${html}</body></html>`;
  return (
    <iframe
      srcDoc={srcDoc}
      title="Embed"
      className="h-full w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  );
}

function FallbackCard({
  payload,
  onRetry,
  retrying,
}: {
  payload: Extract<ArtifactPayload, { type: "embed" }>;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { url, title, fallback } = payload.data;
  const previewImageUrl = fallback?.previewImageUrl;
  const faviconUrl = fallback?.faviconUrl;

  return (
    <div className="flex flex-col gap-4 p-4">
      {previewImageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-canvas bg-canvas-bg">
          <PreviewThumbnail
            previewImageUrl={previewImageUrl}
            alt={title}
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}
      <div className="flex items-start gap-3">
        <EmbedFavicon
          faviconUrl={faviconUrl}
          className="mt-0.5 h-10 w-10 shrink-0 rounded-canvas"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-canvas-body font-semibold leading-snug text-canvas-ink">
            {title}
          </h3>
          <p className="mt-1 break-all text-canvas-caption text-canvas-muted">
            {displayHost(url)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-canvas border border-canvas-border px-2.5 py-1 text-canvas-caption text-canvas-ink transition-colors hover:bg-canvas-bg"
            >
              Open in browser
            </a>
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="rounded-canvas border border-canvas-border/60 px-2.5 py-1 text-canvas-caption text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink disabled:opacity-50"
            >
              {retrying ? "Retrying…" : "Retry embed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedFrame({
  payload,
  interactive,
  onActivate,
}: {
  payload: Extract<ArtifactPayload, { type: "embed" }>;
  interactive: boolean;
  onActivate?: () => void;
}) {
  const { iframeSrc, embedHtml, embedWidth, embedHeight, title, provider } =
    payload.data;

  /** On canvas, defer iframe network load until the user opts into interaction. */
  const loadFrame = Boolean(iframeSrc) && (interactive || !onActivate);

  const frame = loadFrame && iframeSrc ? (
    <iframe
      src={iframeSrc}
      title={title}
      width={embedWidth}
      height={embedHeight}
      loading="lazy"
      className={`max-h-full max-w-full border-0 bg-white ${
        interactive ? "pointer-events-auto" : "pointer-events-none"
      }`}
      allow="autoplay; encrypted-media; fullscreen; clipboard-write"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  ) : iframeSrc && onActivate ? (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-canvas-bg px-4 text-center"
      style={{ width: embedWidth, height: embedHeight, maxWidth: "100%", maxHeight: "100%" }}
    >
      <ArtifactTypeIcon kind="embed" className="h-8 w-8 text-canvas-muted" />
      <p className="m-0 text-canvas-caption font-medium text-canvas-ink">{title}</p>
      <p className="m-0 text-canvas-micro text-canvas-muted">
        Click to load live preview
      </p>
    </div>
  ) : embedHtml && provider !== "twitter" ? (
    <div
      className={`h-full w-full ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{ width: embedWidth, height: embedHeight, maxWidth: "100%", maxHeight: "100%" }}
    >
      <EmbedHtmlFrame html={embedHtml} />
    </div>
  ) : null;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-canvas-bg">
      {frame}
      {!interactive && onActivate ? (
        <button
          type="button"
          aria-label="Click to interact with embed"
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

export function EmbedArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  layout = "panel",
  artifactId,
  versionId,
  forceInteractive = false,
}: {
  payload: Extract<ArtifactPayload, { type: "embed" }>;
  fill?: boolean;
  sidebar?: boolean;
  layout?: "canvas" | "panel" | "sidebar";
  artifactId?: string;
  versionId?: string;
  forceInteractive?: boolean;
}) {
  const [active, setActive] = useState(forceInteractive);

  useEffect(() => {
    setActive(forceInteractive);
  }, [forceInteractive]);
  const [retrying, setRetrying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { status, url } = payload.data;
  const pending = isEmbedTitlePending(payload);
  const isCanvas = layout === "canvas";
  const interactive = isCanvas && active;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [active]);

  const handleRetry = useCallback(() => {
    if (!artifactId || !versionId) return;
    setRetrying(true);
    retryEmbedArtifact(artifactId, versionId, url);
    window.setTimeout(() => setRetrying(false), 1200);
  }, [artifactId, url, versionId]);

  if (sidebar) {
    const previewImageUrl = payload.data.fallback?.previewImageUrl;
    return (
      <div className="flex h-full min-h-[80px] items-center gap-2 px-3 py-2">
        {previewImageUrl ? (
          <div className="h-10 w-16 shrink-0 overflow-hidden rounded-canvas bg-canvas-bg">
            <PreviewThumbnail
              previewImageUrl={previewImageUrl}
              alt={payload.data.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <EmbedFavicon
            faviconUrl={payload.data.fallback?.faviconUrl}
            className="h-10 w-10 shrink-0 rounded-canvas"
          />
        )}
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-canvas-caption font-medium ${
              pending ? "text-canvas-muted" : "text-canvas-ink"
            }`}
          >
            {payload.data.title}
          </span>
          <span className="mt-0.5 block truncate text-canvas-micro text-canvas-muted">
            {displayHost(url)}
          </span>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    const loading = (
      <div className="flex h-full min-h-[160px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 text-canvas-caption text-canvas-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-canvas-border border-t-canvas-accent" />
          <span>Loading embed…</span>
        </div>
      </div>
    );
    if (fill) {
      return (
        <ArtifactContentStage
          fill
          artifactId={artifactId}
          showControls={!sidebar}
          className="h-full !bg-transparent"
        >
          {loading}
        </ArtifactContentStage>
      );
    }
    return loading;
  }

  if (status === "failed") {
    const failed = (
      <FallbackCard payload={payload} onRetry={handleRetry} retrying={retrying} />
    );
    if (fill) {
      return (
        <ArtifactContentStage
          fill
          artifactId={artifactId}
          showControls={!sidebar}
          className="h-full !bg-transparent"
        >
          <div className="flex h-full min-h-0 flex-col overflow-auto">{failed}</div>
        </ArtifactContentStage>
      );
    }
    return failed;
  }

  const ready = (
    <div ref={rootRef} className="h-full w-full">
      <EmbedFrame
        payload={payload}
        interactive={interactive}
        onActivate={isCanvas ? () => setActive(true) : undefined}
      />
    </div>
  );

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        showControls={!sidebar}
        className="h-full min-h-0 !bg-transparent"
      >
        {ready}
      </ArtifactContentStage>
    );
  }

  return ready;
}
