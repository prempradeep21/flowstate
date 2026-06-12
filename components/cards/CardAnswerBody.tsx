"use client";

import { CardArtifactPreview } from "@/components/artifacts/CardArtifactPreview";
import { AnswerTextScrollRegion } from "@/components/cards/AnswerTextScrollRegion";
import { PendingAnswerPlaceholder } from "@/components/cards/PendingAnswerPlaceholder";
import { QaRetryPlaceholder } from "@/components/cards/QaRetryPlaceholder";
import { TextCardBody } from "@/components/cards/TextCardBody";
import {
  formatQaResponseErrorMessage,
  formatQaResponseMissingMessage,
  isQaResponseFinalMissing,
  isQaResponsePending,
  shouldShowQaAnswerError,
  shouldShowQaAnswerText,
  shouldShowQaArtifactPreview,
} from "@/lib/qaStreamDisplay";
import type { AnswerExplain, Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

interface CardAnswerBodyProps {
  card: Card;
  isStreaming?: boolean;
  clampStyle?: React.CSSProperties;
  plainClamp?: boolean;
  hideImages?: boolean;
  answerExplains?: AnswerExplain[];
  textRootRef?: React.RefObject<HTMLDivElement | null>;
  onExplainClick?: (explainId: string) => void;
  showPendingPlaceholder?: boolean;
  pendingLabel?: string;
  onTryAgain?: () => void;
}

export function CardAnswerBody({
  card,
  isStreaming,
  clampStyle,
  plainClamp,
  answerExplains,
  textRootRef,
  onExplainClick,
  showPendingPlaceholder = false,
  pendingLabel,
  onTryAgain,
}: CardAnswerBodyProps) {
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const showPreview = shouldShowQaArtifactPreview(card);
  const showText = shouldShowQaAnswerText(card);
  const showError = shouldShowQaAnswerError(card, canvasArtifactNodes);
  const showMissing = isQaResponseFinalMissing(card, canvasArtifactNodes);
  const showActiveTurn =
    showPendingPlaceholder || isQaResponsePending(card.status);
  const scrollKey = `${card.id}:${card.question}`;
  const answerContent = showText ? (
    <TextCardBody
      card={card}
      isStreaming={isStreaming}
      clampStyle={clampStyle}
      plainClamp={plainClamp}
      answerExplains={answerExplains}
      textRootRef={textRootRef}
      onExplainClick={onExplainClick}
    />
  ) : showActiveTurn ? (
    <PendingAnswerPlaceholder thinkingLabel={pendingLabel} />
  ) : showError ? (
    <QaRetryPlaceholder
      message={formatQaResponseErrorMessage(card.answer)}
      onTryAgain={onTryAgain}
    />
  ) : showMissing ? (
    <QaRetryPlaceholder
      message={formatQaResponseMissingMessage(card)}
      onTryAgain={onTryAgain}
    />
  ) : null;

  if (!showPreview && !answerContent) return null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {showPreview && <CardArtifactPreview card={card} />}
      {answerContent ? (
        showActiveTurn && !showText ? (
          <div className="flex w-full items-center justify-center py-10">
            {answerContent}
          </div>
        ) : (
          <AnswerTextScrollRegion contentKey={scrollKey}>
            {answerContent}
          </AnswerTextScrollRegion>
        )
      ) : null}
    </div>
  );
}
