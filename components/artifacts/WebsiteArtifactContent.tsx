"use client";

import { useEffect, useRef, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { InteractiveWebFrame } from "@/components/artifacts/InteractiveWebFrame";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { refreshAssetSignedUrl } from "@/lib/refreshAssetUrl";
import { useCanvasStore } from "@/lib/store";
import { isWebsiteTitlePending } from "@/lib/websiteArtifact";

function displayHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host + u.pathname + u.search;
  } catch {
    return url;
  }
}

function WebsiteFavicon({
  faviconUrl,
  className,
  bare = false,
}: {
  faviconUrl?: string;
  className: string;
  /** Drop the gray plate and let the glyph fill the box — for the hero icon. */
  bare?: boolean;
}) {
  // A favicon commonly 403s on hotlink-protected origins. Without a fallback
  // that left a blank square, so failure falls through to the type icon.
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [faviconUrl]);

  if (faviconUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={faviconUrl}
        alt=""
        className={`${className} object-contain`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center ${
        bare ? "text-canvas-ink/70" : "bg-canvas-bg text-canvas-muted"
      }`}
    >
      <ArtifactTypeIcon kind="website" className={bare ? "h-full w-full" : "h-1/2 w-1/2"} />
    </div>
  );
}

/**
 * Reports failure upward rather than rendering nothing. Returning null used to
 * leave the sized container behind as a blank slab — the caller needs to know so
 * it can show the real empty state instead.
 */
function PreviewThumbnail({
  previewImageUrl,
  alt,
  className,
  onFailed,
}: {
  previewImageUrl: string;
  alt: string;
  className: string;
  onFailed: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={previewImageUrl}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={onFailed}
    />
  );
}

export function WebsiteArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  layout = "panel",
  forceInteractive = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "website" }>;
  fill?: boolean;
  sidebar?: boolean;
  layout?: "canvas" | "panel" | "sidebar";
  forceInteractive?: boolean;
  artifactId?: string;
}) {
  const { url, title, faviconUrl, previewImageUrl, previewAssetId, embeddable } =
    payload.data;
  const pending = isWebsiteTitlePending(payload);

  // The live frame is preferred when the site allows embedding; the watchdog
  // inside InteractiveWebFrame can flip us back to the static card if it never
  // renders. Reset the fallback whenever the target URL changes.
  const [frameFailed, setFrameFailed] = useState(false);
  useEffect(() => {
    setFrameFailed(false);
  }, [url]);
  const showLiveFrame = embeddable === true && !frameFailed && !sidebar;

  // A preview that 404s, 403s or rate-limits must fall through to the empty
  // state below, not leave an empty box the size of the whole card.
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(previewImageUrl);
  const resignedRef = useRef(false);
  useEffect(() => {
    setPreviewFailed(false);
    setPreviewSrc(previewImageUrl);
    resignedRef.current = false;
  }, [previewImageUrl]);

  // When the image is a canvas asset, its signed URL expires after a week. One
  // re-sign from the stored path is the difference between a card that keeps
  // working and one that quietly empties out.
  const handlePreviewError = () => {
    const asset = previewAssetId
      ? useCanvasStore.getState().canvasAssets[previewAssetId]
      : undefined;
    if (!resignedRef.current && asset?.storagePath) {
      resignedRef.current = true;
      void refreshAssetSignedUrl(asset.storagePath).then((nextUrl) => {
        if (!nextUrl) {
          setPreviewFailed(true);
          return;
        }
        setPreviewSrc(nextUrl);
        useCanvasStore.getState().patchCanvasAssetPublicUrl(asset.id, nextUrl);
      });
      return;
    }
    setPreviewFailed(true);
  };

  const showPreview = Boolean(previewSrc) && !previewFailed;

  if (showLiveFrame) {
    const frame = (
      <InteractiveWebFrame
        src={url}
        title={title}
        layout={layout}
        forceInteractive={forceInteractive}
        onFailed={() => setFrameFailed(true)}
      />
    );
    if (fill) {
      return (
        <ArtifactContentStage
          fill
          artifactId={artifactId}
          className="h-full min-h-0 !bg-transparent"
        >
          {frame}
        </ArtifactContentStage>
      );
    }
    return frame;
  }

  if (sidebar) {
    return (
      <div className="flex h-full min-h-[80px] items-center gap-2 px-3 py-2">
        {showPreview ? (
          <div className="h-10 w-16 shrink-0 overflow-hidden rounded-canvas bg-canvas-bg">
            <PreviewThumbnail
              previewImageUrl={previewSrc!}
              alt={title}
              className="h-full w-full object-cover"
              onFailed={handlePreviewError}
            />
          </div>
        ) : (
          <WebsiteFavicon faviconUrl={faviconUrl} className="h-10 w-10 shrink-0 rounded-canvas" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {showPreview && (
              <WebsiteFavicon
                faviconUrl={faviconUrl}
                className="h-4 w-4 shrink-0 rounded-canvas-xs"
              />
            )}
            <span
              className={`min-w-0 truncate text-canvas-caption font-medium ${
                pending ? "text-canvas-muted" : "text-canvas-ink"
              }`}
            >
              {title}
            </span>
          </div>
          <span className="mt-0.5 block truncate text-canvas-micro text-canvas-muted">
            {displayHost(url)}
          </span>
        </div>
      </div>
    );
  }

  // Two shapes, picked by state. With a preview there is a media block plus a
  // chin; without one — still fetching, or none exists — a gray slab with a
  // spinner in it was just a hole in the card, so the chin's own contents
  // become the card instead: hero icon, title and link centered on the
  // artifact's own colour, no plate behind them.
  const linkRow = (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      title={url}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className="break-all text-canvas-caption text-canvas-ink/70 underline decoration-canvas-ink/30 underline-offset-2 transition-colors hover:text-canvas-ink hover:decoration-canvas-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/50"
    >
      {displayHost(url)}
    </a>
  );

  const identity = (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-6 text-center ${
        fill ? "h-full min-h-0" : "min-h-[240px]"
      }`}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <WebsiteFavicon
          bare
          faviconUrl={faviconUrl}
          className="aspect-square h-40 max-h-full w-auto shrink-0"
        />
      </div>
      <div className="flex w-full shrink-0 flex-col items-center gap-1">
        <h3
          className={`max-w-full truncate text-canvas-body font-semibold leading-snug ${
            pending ? "text-canvas-ink/60" : "text-canvas-ink"
          }`}
        >
          {title}
        </h3>
        {linkRow}
      </div>
    </div>
  );

  // The chin must stay visible at every node height, so the media block flexes
  // into whatever space is left instead of claiming a fixed 4:3 slab that
  // pushes it out of view on short cards. Only the unsized (panel) case keeps
  // the aspect ratio.
  const card = showPreview ? (
    <div className={`flex flex-col gap-4 p-4 ${fill ? "h-full min-h-0" : ""}`}>
      <div
        className={
          fill
            ? "relative min-h-0 w-full flex-1 overflow-hidden rounded-canvas bg-canvas-bg"
            : "relative aspect-[4/3] w-full overflow-hidden rounded-canvas bg-canvas-bg"
        }
      >
        <PreviewThumbnail
          previewImageUrl={previewSrc!}
          alt={title}
          className="h-full w-full object-contain"
          onFailed={handlePreviewError}
        />
      </div>
      <div className="flex shrink-0 items-start gap-3">
        <WebsiteFavicon
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
        </div>
      </div>
    </div>
  ) : (
    identity
  );

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        className="h-full !bg-transparent"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">{card}</div>
      </ArtifactContentStage>
    );
  }

  return card;
}
