"use client";

import { useState } from "react";
import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";

interface VideoCardBodyProps {
  card: Card;
  isStreaming?: boolean;
}

export function VideoCardBody({ card, isStreaming }: VideoCardBodyProps) {
  const payload =
    card.artifactPayload?.type === "video" ? card.artifactPayload : null;
  const [widescreen, setWidescreen] = useState(
    payload?.data.widescreen ?? false,
  );

  if (!payload) {
    return <TextCardBody card={card} isStreaming={isStreaming} />;
  }

  const items = payload.data.items ?? [];

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody card={card} isStreaming={isStreaming} />
      )}
      <ArtifactCardChrome
        type="video"
        title={payload.title}
        description={payload.description}
        action={
          <button
            type="button"
            onClick={() => setWidescreen((w) => !w)}
            className="shrink-0 rounded-md border border-canvas-border px-2 py-1 text-[11px] font-medium text-canvas-muted hover:border-canvas-ink/30"
          >
            {widescreen ? "Grid" : "Widescreen"}
          </button>
        }
      >
        <div
          className={`grid gap-2 ${
            widescreen
              ? "grid-cols-1"
              : items.length <= 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {items.slice(0, 6).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-lg border border-canvas-border/60 bg-black/[0.03]"
            >
              <div
                className={
                  widescreen ? "aspect-video w-full" : "aspect-[4/3] w-full"
                }
              >
                <img
                  src={item.thumb}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate px-2 py-1.5 text-[12px] text-canvas-muted group-hover:text-canvas-ink">
                {item.title}
              </p>
            </a>
          ))}
        </div>
      </ArtifactCardChrome>
    </div>
  );
}
