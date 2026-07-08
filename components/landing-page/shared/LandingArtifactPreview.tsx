"use client";

import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import type { ArtifactLayout } from "@/components/artifacts/ArtifactContent";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { TextCardBody } from "@/components/cards/TextCardBody";
import {
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import type { ArtifactCatalogEntry } from "@/lib/artifactCatalogSamples";
import { CARD_WIDTH } from "@/lib/canvasNodeBounds";
import { qaInsetStyle } from "@/lib/design/canvasInsets";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import type { ArtifactKind } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import type { Card } from "@/lib/store";

const CANVAS_LAYOUT_KINDS = new Set<ArtifactKind>([
  "map",
  "streetview",
  "3d",
  "embed",
  "audio",
]);

function catalogLayoutForEntry(entry: ArtifactCatalogEntry): ArtifactLayout {
  if (!entry.payload) return "panel";
  const kind = payloadToArtifactKind(entry.payload);
  return CANVAS_LAYOUT_KINDS.has(kind) ? "canvas" : "panel";
}

export function previewHeightForEntry(id: string): number {
  if (id.startsWith("chart")) return 360;
  if (id === "map" || id === "streetview" || id === "3d") return 340;
  if (id === "audio" || id === "embed" || id === "video") return 320;
  if (id === "custom" || id.startsWith("timezone") || id === "currency") return 280;
  return 300;
}

function catalogTextCard(entry: ArtifactCatalogEntry): Card {
  return {
    id: `landing-card-${entry.id}`,
    threadId: "landing-preview",
    question: entry.textCard?.question ?? entry.title,
    answer: entry.textCard?.answer ?? entry.description,
    status: "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
    responseType: "text",
  };
}

export function LandingProductCard({
  entry,
}: {
  entry: ArtifactCatalogEntry;
}) {
  const card = catalogTextCard(entry);
  const accent = THREAD_ACCENT_PALETTE[0]!;

  return (
    <div
      className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-artifact"
      style={{ width: CARD_WIDTH, maxWidth: "100%" }}
    >
      <CanvasSharpContent worldWidth={CARD_WIDTH}>
        <QaTranslucentSurface>
          <QaQuestionSection accentColour={accent}>
            <div
              className="w-full min-w-0 break-words text-canvas-heading font-semibold leading-snug text-canvas-ink"
              style={qaInsetStyle("question")}
            >
              {card.question}
            </div>
          </QaQuestionSection>
          <div className="mx-5 shrink-0 h-px bg-canvas-border" />
          <div className="min-w-0" style={qaInsetStyle("answer")}>
            <TextCardBody card={card} />
          </div>
        </QaTranslucentSurface>
      </CanvasSharpContent>
    </div>
  );
}

export function LandingArtifactPreview({
  entry,
  previewHeight = 320,
}: {
  entry: ArtifactCatalogEntry;
  previewHeight?: number;
}) {
  if (entry.previewKind === "text-card") {
    return <LandingProductCard entry={entry} />;
  }

  if (!entry.payload) return null;

  const layout = catalogLayoutForEntry(entry);

  return (
    <div className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-artifact">
      <div
        className="relative flex min-h-0 flex-col overflow-hidden bg-canvas-artifactStage"
        style={{ height: previewHeight }}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col [&_.artifact-content-stage]:min-h-0 [&_.artifact-content-stage]:flex-1">
          <ArtifactContent
            payload={entry.payload}
            layout={layout}
            catalogPreview
            canvasContentInteractive
          />
        </div>
      </div>
    </div>
  );
}
