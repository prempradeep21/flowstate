"use client";

import { CardArtifactPreview } from "@/components/artifacts/CardArtifactPreview";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";

interface CardAnswerBodyProps {
  card: Card;
  isStreaming?: boolean;
  clampStyle?: React.CSSProperties;
  plainClamp?: boolean;
  hideImages?: boolean;
}

const STRUCTURED_TYPES = new Set([
  "table",
  "code",
  "video",
  "custom",
  "3d",
  "images",
  "image",
]);

export function CardAnswerBody({
  card,
  isStreaming,
  clampStyle,
  plainClamp,
}: CardAnswerBodyProps) {
  const type = card.responseType ?? "text";
  const hasStructured =
    card.artifactPayload ||
    card.outputArtifactId ||
    (type !== "text" && STRUCTURED_TYPES.has(type));

  const showPreview =
    hasStructured ||
    (card.images && card.images.length > 0 && type === "image");

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody
          card={card}
          isStreaming={isStreaming}
          clampStyle={clampStyle}
          plainClamp={plainClamp}
        />
      )}
      {showPreview && <CardArtifactPreview card={card} />}
    </div>
  );
}
