"use client";

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

export function WebsiteArtifactContent({
  payload,
  fill = false,
  sidebar = false,
}: {
  payload: Extract<ArtifactPayload, { type: "website" }>;
  fill?: boolean;
  sidebar?: boolean;
}) {
  const { url, title, faviconUrl } = payload.data;
  const pending = isWebsiteTitlePending(payload);

  if (sidebar) {
    return (
      <div className="flex h-full min-h-[80px] flex-col justify-center gap-1.5 px-3 py-2">
        <div className="flex items-center gap-2">
          {faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconUrl}
              alt=""
              className="h-4 w-4 shrink-0 rounded-sm object-contain"
            />
          ) : (
            <ArtifactTypeIcon kind="website" className="h-4 w-4 shrink-0 text-canvas-muted" />
          )}
          <span
            className={`min-w-0 truncate text-canvas-caption font-medium ${
              pending ? "text-canvas-muted" : "text-canvas-ink"
            }`}
          >
            {title}
          </span>
        </div>
        <span className="truncate text-canvas-micro text-canvas-muted">
          {displayHost(url)}
        </span>
      </div>
    );
  }

  const card = (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        {faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconUrl}
            alt=""
            className="mt-0.5 h-10 w-10 shrink-0 rounded-canvas object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-canvas bg-canvas-bg text-canvas-muted">
            <ArtifactTypeIcon kind="website" className="h-5 w-5" />
          </div>
        )}
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
        <div className="flex h-full items-center justify-center">{card}</div>
      </ArtifactContentStage>
    );
  }

  return card;
}
