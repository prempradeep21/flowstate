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
          className="flex h-full items-center justify-center bg-canvas-bg text-[12px] text-canvas-muted"
        >
          {item.title ?? "Video"}
        </a>
      );
    }
    return (
      <iframe
        src={embed}
        title={item.title ?? "Video"}
        className="h-full w-full border-0"
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
}: {
  payload: Extract<ArtifactPayload, { type: "images" }>;
}) {
  const items = payload.data.items;

  return (
    <ArtifactContentStage>
      <div className="grid grid-cols-3 gap-2 p-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="aspect-[4/3] overflow-hidden rounded-lg bg-canvas-bg"
          >
            <MediaCell item={item} />
          </div>
        ))}
      </div>
    </ArtifactContentStage>
  );
}
