"use client";

import { useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { ArtifactPayload } from "@/lib/artifactTypes";
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
      <ArtifactTypeIcon kind="website" className="h-1/2 w-1/2" />
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

export function WebsiteArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "website" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { url, title, faviconUrl, previewImageUrl } = payload.data;
  const pending = isWebsiteTitlePending(payload);

  if (sidebar) {
    return (
      <div className="flex h-full min-h-[80px] items-center gap-2 px-3 py-2">
        {previewImageUrl ? (
          <div className="h-10 w-16 shrink-0 overflow-hidden rounded-canvas bg-canvas-bg">
            <PreviewThumbnail
              previewImageUrl={previewImageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <WebsiteFavicon faviconUrl={faviconUrl} className="h-10 w-10 shrink-0 rounded-canvas" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {previewImageUrl && (
              <WebsiteFavicon
                faviconUrl={faviconUrl}
                className="h-4 w-4 shrink-0 rounded-sm"
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

  const card = (
    <div className="flex flex-col gap-4 p-4">
      {pending && !previewImageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-canvas bg-canvas-bg">
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-canvas-border border-t-canvas-accent" />
            <span className="text-canvas-micro text-canvas-muted">Loading preview…</span>
          </div>
        </div>
      ) : previewImageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-canvas bg-canvas-bg">
          <PreviewThumbnail
            previewImageUrl={previewImageUrl}
            alt={title}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-canvas bg-canvas-bg">
          <div className="flex h-full flex-col items-center justify-center gap-1 text-canvas-muted">
            <ArtifactTypeIcon kind="website" className="h-8 w-8 opacity-40" />
            <span className="text-canvas-micro">No preview image</span>
          </div>
        </div>
      )}
      <div className="flex items-start gap-3">
        <WebsiteFavicon
          faviconUrl={faviconUrl}
          className="mt-0.5 h-10 w-10 shrink-0 rounded-canvas"
        />
        <div className="min-w-0 flex-1">
          <h3
            className={`text-canvas-body font-semibold leading-snug ${
              pending ? "text-canvas-muted" : "text-canvas-ink"
            }`}
          >
            {title}
          </h3>
          <p className="mt-1 break-all text-canvas-caption text-canvas-muted">
            {displayHost(url)}
          </p>
        </div>
      </div>
    </div>
  );

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        className="h-full !bg-transparent"
      >
        <div className="flex h-full min-h-0 flex-col overflow-auto">{card}</div>
      </ArtifactContentStage>
    );
  }

  return card;
}
