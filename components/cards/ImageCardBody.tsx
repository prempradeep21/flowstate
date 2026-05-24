"use client";

import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";

interface ImageCardBodyProps {
  card: Card;
  isStreaming?: boolean;
  hideImages?: boolean;
}

export function ImageCardBody({
  card,
  isStreaming,
  hideImages,
}: ImageCardBodyProps) {
  const images = card.images ?? [];
  const title = card.images?.[0]?.alt?.trim() || card.question || "Images";

  if (card.responseType === "image" && !hideImages && images.length > 0) {
    return (
      <ArtifactCardChrome
        type="image"
        title={title}
        description={card.answer.trim() || undefined}
      >
        <div
          className={`grid gap-2 ${
            images.length === 1
              ? "grid-cols-1"
              : images.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {images.slice(0, 6).map((img, i) => (
            <a
              key={i}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-canvas-border/60 bg-black/[0.03]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <img
                src={img.thumb}
                alt={img.alt}
                className={
                  images.length === 1
                    ? "max-h-80 w-full object-contain p-1"
                    : "aspect-[4/3] w-full object-cover"
                }
              />
            </a>
          ))}
        </div>
        {isStreaming && (
          <p className="text-[13px] text-canvas-muted animate-pulse">Loading…</p>
        )}
      </ArtifactCardChrome>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!hideImages && images.length > 0 && (
        <div
          className={`mb-3 grid gap-2 ${
            images.length === 1
              ? "grid-cols-1"
              : images.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {images.slice(0, 6).map((img, i) => (
            <a
              key={i}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-canvas-border/60 bg-black/[0.03]"
            >
              <img
                src={img.thumb}
                alt={img.alt}
                className={
                  images.length === 1
                    ? "max-h-80 w-full object-contain p-1"
                    : "aspect-[4/3] w-full object-cover"
                }
              />
            </a>
          ))}
        </div>
      )}
      <TextCardBody card={card} isStreaming={isStreaming} />
    </div>
  );
}
