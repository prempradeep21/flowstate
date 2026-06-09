"use client";

import { useMemo } from "react";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import type { ArtifactCatalogEntry } from "@/lib/artifactCatalogSamples";
import {
  CARD_WIDTH,
  FALLBACK_CARD_HEIGHT,
  getArtifactBounds,
} from "@/lib/canvasNodeBounds";
import { createSessionArtifactFromPayload } from "@/lib/sessionArtifacts";

/** Timeline keeps the original fit width; everything else scales up 60%. */
const TIMELINE_MAX_PREVIEW_WIDTH = 640;
const CATALOG_MAX_PREVIEW_WIDTH = 1024;
const CATALOG_SIZE_MULTIPLIER = 1.6;

function previewBounds(entry: ArtifactCatalogEntry): { w: number; h: number } {
  if (entry.previewKind === "text-card") {
    return {
      w: Math.round(CARD_WIDTH * CATALOG_SIZE_MULTIPLIER),
      h: Math.round(FALLBACK_CARD_HEIGHT * CATALOG_SIZE_MULTIPLIER),
    };
  }
  if (!entry.payload) return { w: CARD_WIDTH, h: FALLBACK_CARD_HEIGHT };
  const artifact = createSessionArtifactFromPayload(entry.payload, "__catalog__");
  return getArtifactBounds({}, artifact);
}

function previewScale(entry: ArtifactCatalogEntry, bounds: { w: number; h: number }): number {
  const isTimeline = entry.id === "timeline" || entry.payload?.type === "timeline";
  if (isTimeline) {
    return Math.min(1, TIMELINE_MAX_PREVIEW_WIDTH / bounds.w);
  }
  const fitScale = Math.min(1, CATALOG_MAX_PREVIEW_WIDTH / bounds.w);
  return fitScale * CATALOG_SIZE_MULTIPLIER;
}

function TextCardPreview({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const width = Math.round(CARD_WIDTH * CATALOG_SIZE_MULTIPLIER);
  const minHeight = Math.round(FALLBACK_CARD_HEIGHT * CATALOG_SIZE_MULTIPLIER);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-canvas border border-canvas-border/80 bg-canvas-card shadow-card"
      style={{ width, minHeight }}
    >
      <div className="border-b border-canvas-border/60 px-6 py-4">
        <p className="m-0 text-canvas-body font-medium text-canvas-ink">{question}</p>
      </div>
      <div className="flex-1 px-6 py-4">
        <p className="m-0 text-canvas-body leading-relaxed text-canvas-muted">{answer}</p>
      </div>
    </div>
  );
}

export function CatalogArtifactPreview({ entry }: { entry: ArtifactCatalogEntry }) {
  const bounds = previewBounds(entry);
  const scale = previewScale(entry, bounds);

  const sessionArtifact = useMemo(() => {
    if (!entry.payload) return null;
    return createSessionArtifactFromPayload(entry.payload, "__catalog__");
  }, [entry.id, entry.payload]);

  const versionId = sessionArtifact?.latestVersionId ?? "";

  return (
    <div
      className="pointer-events-auto shrink-0"
      style={{
        width: Math.round(bounds.w * scale),
        height: Math.round(bounds.h * scale),
      }}
    >
      <div
        className="origin-top-left"
        style={{
          width: bounds.w,
          height: bounds.h,
          transform: `scale(${scale})`,
        }}
      >
        {entry.previewKind === "text-card" && entry.textCard ? (
          <TextCardPreview
            question={entry.textCard.question}
            answer={entry.textCard.answer}
          />
        ) : sessionArtifact ? (
          <ArtifactShell
            sessionArtifact={sessionArtifact}
            versionId={versionId}
            onVersionChange={() => {}}
            menuVariant="canvas"
            layout="canvas"
            catalogPreview
          />
        ) : null}
      </div>
    </div>
  );
}
