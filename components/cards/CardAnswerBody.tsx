"use client";

import { CardArtifactPreview } from "@/components/artifacts/CardArtifactPreview";
import { TextCardBody } from "@/components/cards/TextCardBody";
import {
  shouldShowQaAnswerText,
  shouldShowQaArtifactPreview,
} from "@/lib/qaStreamDisplay";
import type { AnswerExplain, Card } from "@/lib/store";

interface CardAnswerBodyProps {
  card: Card;
  isStreaming?: boolean;
  clampStyle?: React.CSSProperties;
  plainClamp?: boolean;
  hideImages?: boolean;
  answerExplains?: AnswerExplain[];
  textRootRef?: React.RefObject<HTMLDivElement | null>;
  onExplainClick?: (explainId: string) => void;
}

export function CardAnswerBody({
  card,
  isStreaming,
  clampStyle,
  plainClamp,
  answerExplains,
  textRootRef,
  onExplainClick,
}: CardAnswerBodyProps) {
  const showPreview = shouldShowQaArtifactPreview(card);
  const showText = shouldShowQaAnswerText(card);

  if (!showPreview && !showText) return null;

  return (
    <div className="flex flex-col gap-3">
      {showPreview && <CardArtifactPreview card={card} />}
      {showText && (
        <TextCardBody
          card={card}
          isStreaming={isStreaming}
          clampStyle={clampStyle}
          plainClamp={plainClamp}
          answerExplains={answerExplains}
          textRootRef={textRootRef}
          onExplainClick={onExplainClick}
        />
      )}
    </div>
  );
}
