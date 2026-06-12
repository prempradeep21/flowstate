"use client";

import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
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
import type { Card } from "@/lib/store";

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
      className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
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

  return (
    <div className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <div
        className="relative overflow-auto bg-canvas-artifactStage"
        style={{ height: previewHeight }}
      >
        <ArtifactContent
          payload={entry.payload}
          layout="panel"
          catalogPreview
          canvasContentInteractive
        />
      </div>
    </div>
  );
}
