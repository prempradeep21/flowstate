"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload, ImagesMediaItem } from "@/lib/artifactTypes";

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function MediaCell({ item }: { item: ImagesMediaItem }) {
  if (item.kind === "youtube") {
    const embed = youtubeEmbedUrl(item.url);
    if (!embed) {
      return (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full items-center justify-center bg-canvas-bg text-canvas-micro text-canvas-muted"
        >
          {item.title ?? "Video"}
        </a>
      );
    }
    return (
      <iframe
        src={embed}
        title={item.title ?? "Video"}
        className="pointer-events-none h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.thumb || item.url}
      alt={item.alt ?? ""}
      className="h-full w-full object-cover"
    />
  );
}

export function ImagesArtifactContent({
  payload,
  fill = false,
  sidebar = false,
}: {
  payload: Extract<ArtifactPayload, { type: "images" }>;
  fill?: boolean;
  sidebar?: boolean;
}) {
  const items = payload.data.items;

  if (sidebar) {
    return (
      <div className="grid h-full min-h-0 w-full grid-cols-3 grid-rows-2 gap-1 p-1.5">
        {items.slice(0, 6).map((item, i) => (
          <div key={i} className="relative min-h-0 overflow-hidden rounded-canvas bg-canvas-bg">
            <div className="absolute inset-0">
              <MediaCell item={item} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (fill) {
    return (
      <ArtifactContentStage fill className="h-full">
        <div className="h-full overflow-auto p-3">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="aspect-[4/3] overflow-hidden rounded-canvas bg-canvas-bg"
              >
                <MediaCell item={item} />
              </div>
            ))}
          </div>
        </div>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage>
      <div className="grid grid-cols-3 gap-2 p-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="aspect-[4/3] overflow-hidden rounded-canvas bg-canvas-bg"
          >
            <MediaCell item={item} />
          </div>
        ))}
      </div>
    </ArtifactContentStage>
  );
}
