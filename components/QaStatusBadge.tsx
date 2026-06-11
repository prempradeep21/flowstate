"use client";

import type { CanvasArtifactNode, Card } from "@/lib/store";
import {
  isQaResponseFinalError,
  resolveQaStatusBadgeLabel,
} from "@/lib/qaStreamDisplay";
import { compactThinkingWord } from "@/lib/zoomDisplay";

export function QaStatusBadge({
  card,
  canvasArtifactNodes,
}: {
  card: Card;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
}) {
  const isError = isQaResponseFinalError(card, canvasArtifactNodes);
  const label = compactThinkingWord(
    resolveQaStatusBadgeLabel(card, canvasArtifactNodes),
  );
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-full border border-canvas-border/80 bg-canvas-card/95 px-2.5 py-1 shadow-sm backdrop-blur-sm"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {!isError && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-canvas-success/70 opacity-70" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            isError ? "bg-canvas-danger" : "bg-canvas-success"
          }`}
        />
      </span>
      <span
        className={`max-w-[140px] truncate text-canvas-caption font-medium capitalize ${
          isError ? "text-canvas-danger" : "text-canvas-muted"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
