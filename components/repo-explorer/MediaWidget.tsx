"use client";

import { useState } from "react";
import type { MediaData } from "@/lib/github/types";
import { WidgetCard } from "@/components/repo-explorer/WidgetCard";

function MediaThumb({ item }: { item: MediaData["items"][number] }) {
  const [failed, setFailed] = useState(false);

  if (item.kind === "youtube") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block aspect-video overflow-hidden rounded-canvas bg-canvas-artifactStage"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumb ?? ""}
          alt={item.title ?? "YouTube"}
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-canvas-micro font-medium text-white">
          YouTube
        </span>
      </a>
    );
  }

  if (failed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-canvas bg-canvas-artifactStage text-canvas-compact text-canvas-muted">
        Media
      </div>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block aspect-video overflow-hidden rounded-canvas bg-canvas-artifactStage"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={item.alt ?? "Screenshot"}
        className="h-full w-full object-cover object-top"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export function MediaGallery({ data }: { data?: MediaData }) {
  const gallery = data?.displayableItems ?? [];
  if (gallery.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {gallery.slice(0, 6).map((item) => (
        <MediaThumb key={item.url} item={item} />
      ))}
    </div>
  );
}

export function MediaWidget({ data }: { data?: MediaData }) {
  if (!data) return null;

  const gallery = data.displayableItems ?? [];
  if (gallery.length === 0) return null;

  return (
    <WidgetCard
      title="Media"
      subtitle={`${gallery.length} large screenshots from README`}
    >
      <MediaGallery data={data} />
    </WidgetCard>
  );
}
