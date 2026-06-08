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
}: {
  payload: Extract<ArtifactPayload, { type: "website" }>;
  fill?: boolean;
  sidebar?: boolean;
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
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-no-drag
        className="inline-flex w-fit items-center gap-2 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-caption font-medium text-canvas-ink transition-colors hover:border-canvas-accent/40 hover:bg-canvas-bg"
      >
        Open in new tab
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M6 3h7v7M13 3L6 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );

  if (fill) {
    return (
      <ArtifactContentStage fill className="h-full">
        <div className="flex h-full min-h-0 flex-col overflow-auto">{card}</div>
      </ArtifactContentStage>
    );
  }

  return card;
}
