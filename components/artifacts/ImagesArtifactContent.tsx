"use client";

import { useEffect, useRef } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import {
  isVideoArtifactPayload,
  type ArtifactPayload,
  type ImagesMediaItem,
} from "@/lib/artifactTypes";
import { youtubeEmbedUrl } from "@/lib/youtube";

function MediaCell({
  item,
  allowInteraction = false,
  natural = false,
}: {
  item: ImagesMediaItem;
  allowInteraction?: boolean;
  /** Render the image at its intrinsic aspect ratio (no cropping). */
  natural?: boolean;
}) {
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
        className={`h-full w-full border-0 ${allowInteraction ? "pointer-events-auto" : "pointer-events-none"}`}
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
      className={natural ? "block h-auto w-full" : "h-full w-full object-cover"}
    />
  );
}

export function ImagesArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  allowMediaInteraction = false,
  onContentHeightChange,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "images" }>;
  fill?: boolean;
  sidebar?: boolean;
  allowMediaInteraction?: boolean;
  /** Reports the grid's natural height so the canvas node can wrap around it. */
  onContentHeightChange?: (heightPx: number) => void;
  artifactId?: string;
}) {
  const items = payload.data.items;
  const isVideo = isVideoArtifactPayload(payload);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!fill || !onContentHeightChange) return;
    const el = measureRef.current;
    if (!el) return;
    const report = () => onContentHeightChange(el.offsetHeight);
    const observer = new ResizeObserver(report);
    observer.observe(el);
    report();
    return () => observer.disconnect();
  }, [fill, onContentHeightChange]);

  if (sidebar) {
    return (
      <div className="grid h-full min-h-0 w-full grid-cols-3 grid-rows-2 gap-1 p-1.5">
        {items.slice(0, 6).map((item, i) => (
          <div key={i} className="relative min-h-0 overflow-hidden rounded-canvas-sm bg-canvas-bg">
            <div className="absolute inset-0">
              <MediaCell item={item} allowInteraction={allowMediaInteraction} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    const emptyBody = (
      <div className="flex min-h-[160px] items-center justify-center p-6 text-center text-canvas-body-sm text-canvas-muted">
        No images yet
      </div>
    );
    if (fill) {
      return (
        <ArtifactContentStage
          fill
          artifactId={artifactId}
          className="h-full !bg-transparent"
        >
          {emptyBody}
        </ArtifactContentStage>
      );
    }
    return (
      <ArtifactContentStage
        artifactId={artifactId}
        className="!bg-transparent"
      >
        {emptyBody}
      </ArtifactContentStage>
    );
  }

  // Videos keep fixed 16:9 frames (iframes have no intrinsic size); images
  // flow as borderless masonry columns at their original aspect ratios.
  const grid = isVideo ? (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      }}
    >
      {items.map((item, i) => (
        <div key={i} className="aspect-video overflow-hidden rounded-canvas-sm">
          <MediaCell item={item} allowInteraction={allowMediaInteraction} />
        </div>
      ))}
    </div>
  ) : (
    <div
      style={{
        columnCount: items.length <= 1 ? 1 : items.length <= 4 ? 2 : 3,
        columnGap: "8px",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="mb-2 break-inside-avoid overflow-hidden rounded-canvas-sm last:mb-0"
        >
          <MediaCell
            item={item}
            allowInteraction={allowMediaInteraction}
            natural
          />
        </div>
      ))}
    </div>
  );

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        className="h-full !bg-transparent"
      >
        <div className="h-full overflow-auto">
          <div ref={measureRef} className="p-3">
            {grid}
          </div>
        </div>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage
      artifactId={artifactId}
      className="!bg-transparent"
    >
      <div className="p-3">{grid}</div>
    </ArtifactContentStage>
  );
}
