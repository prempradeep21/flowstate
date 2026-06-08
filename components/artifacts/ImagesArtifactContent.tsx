"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import {
  isVideoArtifactPayload,
  type ArtifactPayload,
  type ImagesMediaItem,
} from "@/lib/artifactTypes";
import { youtubeEmbedUrl } from "@/lib/youtube";

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
  const isVideo = isVideoArtifactPayload(payload);
  // Videos stay 16:9; image thumbnails use a 4:3 frame.
  const aspectClass = isVideo ? "aspect-video" : "aspect-[4/3]";
  // auto-fit (not auto-fill) collapses empty tracks so a single item grows to
  // fill the available width and scales with the resizable artifact node.
  const minColWidth = isVideo ? 220 : 140;

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

  const grid = (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`,
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={`${aspectClass} overflow-hidden rounded-canvas bg-canvas-bg`}
        >
          <MediaCell item={item} />
        </div>
      ))}
    </div>
  );

  if (fill) {
    return (
      <ArtifactContentStage fill className="h-full">
        <div className="h-full overflow-auto p-3">{grid}</div>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage>
      <div className="p-3">{grid}</div>
    </ArtifactContentStage>
  );
}
