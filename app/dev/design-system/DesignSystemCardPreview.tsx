"use client";

import { ArtifactPreviewPill } from "@/components/artifacts/ArtifactPreviewPill";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { CodeCardBody } from "@/components/cards/CodeCardBody";
import { PendingAnswerPlaceholder } from "@/components/cards/PendingAnswerPlaceholder";
import { QaRetryPlaceholder } from "@/components/cards/QaRetryPlaceholder";
import { TableCardBody } from "@/components/cards/TableCardBody";
import { TextCardBody } from "@/components/cards/TextCardBody";
import {
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import { DesignSystemCardStoreSeed } from "@/app/dev/design-system/DesignSystemCardStoreSeed";
import {
  DESIGN_SYSTEM_CARD_WIDTH,
  type DesignSystemCardSample,
} from "@/lib/designSystemCardSamples";
import { qaInsetStyle } from "@/lib/design/canvasInsets";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";

function CardChrome({
  sample,
  children,
}: {
  sample: DesignSystemCardSample;
  children: React.ReactNode;
}) {
  const accent = THREAD_ACCENT_PALETTE[0]!;

  return (
    <div
      className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
      style={{ width: DESIGN_SYSTEM_CARD_WIDTH, maxWidth: "100%" }}
    >
      <CanvasSharpContent worldWidth={DESIGN_SYSTEM_CARD_WIDTH}>
        <QaTranslucentSurface>
          <QaQuestionSection accentColour={accent}>
            <div
              className="w-full min-w-0 break-words text-canvas-heading font-semibold leading-snug text-canvas-ink"
              style={qaInsetStyle("question")}
            >
              {sample.card.question}
            </div>
          </QaQuestionSection>
          <div className="mx-5 shrink-0 h-px bg-canvas-border" />
          <div className="min-w-0" style={qaInsetStyle("answer")}>
            {children}
          </div>
        </QaTranslucentSurface>
      </CanvasSharpContent>
    </div>
  );
}

function CardBody({ sample }: { sample: DesignSystemCardSample }) {
  switch (sample.kind) {
    case "text":
      return <TextCardBody card={sample.card} />;
    case "streaming":
      return <TextCardBody card={sample.card} isStreaming />;
    case "code":
      return <CodeCardBody card={sample.card} />;
    case "table":
      return <TableCardBody card={sample.card} />;
    case "pending":
      return (
        <DesignSystemCardStoreSeed sample={sample}>
          <PendingAnswerPlaceholder
            cardId={sample.card.id}
            thinkingLabel={sample.card.thinkingLabel}
            className="py-8"
          />
        </DesignSystemCardStoreSeed>
      );
    case "retry":
      return (
        <QaRetryPlaceholder
          message="Something went wrong while generating the answer."
          onTryAgain={() => undefined}
        />
      );
    case "artifact-preview":
      return (
        <ArtifactPreviewPill
          kind={sample.previewKind ?? "table"}
          title={sample.card.artifactPayload?.title ?? sample.card.question}
          versionNumber={1}
          artifactId={
            sample.previewStatus === "ready" ? "ds-preview-artifact" : ""
          }
          status={sample.previewStatus ?? "ready"}
        />
      );
    default:
      return null;
  }
}

export function DesignSystemCardPreview({ sample }: { sample: DesignSystemCardSample }) {
  return (
    <CardChrome sample={sample}>
      <CardBody sample={sample} />
    </CardChrome>
  );
}
