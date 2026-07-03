"use client";

import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { CodeCardBody } from "@/components/cards/CodeCardBody";
import { TableCardBody } from "@/components/cards/TableCardBody";
import { TextCardBody } from "@/components/cards/TextCardBody";
import { ArtifactPreviewPill } from "@/components/artifacts/ArtifactPreviewPill";
import {
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import {
  DESIGN_SYSTEM_CARD_SAMPLES,
  DESIGN_SYSTEM_CARD_WIDTH,
  type DesignSystemCardSample,
} from "@/lib/designSystemCardSamples";
import { qaInsetStyle } from "@/lib/design/canvasInsets";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";

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
    case "artifact-preview":
      return (
        <ArtifactPreviewPill
          kind={sample.previewKind ?? "table"}
          title={sample.card.artifactPayload?.title ?? sample.card.question}
          versionNumber={1}
          artifactId={
            sample.previewStatus === "ready" ? "l2-preview-artifact" : ""
          }
          status={sample.previewStatus ?? "ready"}
        />
      );
    default:
      return <TextCardBody card={sample.card} />;
  }
}

export function Landing2CardPreview({
  sample,
  accentColour,
}: {
  sample: DesignSystemCardSample;
  accentColour?: string;
}) {
  const accent = accentColour ?? THREAD_ACCENT_PALETTE[0]!;

  return (
    <div
      className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-artifact"
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
            <CardBody sample={sample} />
          </div>
        </QaTranslucentSurface>
      </CanvasSharpContent>
    </div>
  );
}

export function landing2ChatSample(id: string) {
  const sample = DESIGN_SYSTEM_CARD_SAMPLES.find((s) => s.id === id);
  if (!sample) throw new Error(`Missing card sample: ${id}`);
  return sample;
}
