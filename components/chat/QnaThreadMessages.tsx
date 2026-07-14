"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { QuestionAttachments } from "@/components/QuestionAttachments";
import { getQuestionAttachedImages } from "@/lib/questionAttachments";
import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQaMenu } from "@/components/CardQaMenu";
import { ContributorAvatarStack } from "@/components/ContributorAvatarStack";
import { QaStatusBadge } from "@/components/QaStatusBadge";
import {
  QaQuestionHeaderRow,
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import { qaInsetStyle } from "@/lib/design/canvasInsets";
import { useAuth } from "@/components/AuthProvider";
import { useContributorProfiles } from "@/lib/contributorProfiles";
import {
  isQaResponseFinalError,
  isQaTurnInProgress,
  resolveQaStatusLabel,
  shouldShowQaAnswerText,
} from "@/lib/qaStreamDisplay";
import { getThreadCardChain } from "@/lib/chatThreads";
import { useCanvasStore } from "@/lib/store";

export function QnaTurnBlock({ cardId }: { cardId: string }) {
  const card = useCanvasStore((s) => s.cards[cardId]);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const createFollowUp = useCanvasStore((s) => s.createFollowUp);
  const collaborationHasEdits = useCanvasStore((s) => s.collaborationHasEdits);
  const accent = useCanvasStore(
    (s) => s.threads[card?.threadId ?? ""]?.accentColour,
  );
  const { members, accessInfo, onlineUserIds } = useAuth();
  const contributorProfiles = useContributorProfiles(
    card?.contributorIds,
    members,
    accessInfo?.ownerId,
  );
  const showContributors =
    members.length > 1 &&
    collaborationHasEdits &&
    contributorProfiles.length > 0;

  const handleTryAgain = useCallback(() => {
    if (!card?.question.trim()) return;
    const attachedImages = card ? getQuestionAttachedImages(card) : [];
    createFollowUp(cardId, card.question, {
      pendingImages: attachedImages.length > 0 ? attachedImages : undefined,
    });
  }, [card, cardId, createFollowUp]);

  if (!card || card.status === "empty") return null;

  const turnInProgress = isQaTurnInProgress(card, canvasArtifactNodes);
  const showFinalError = isQaResponseFinalError(card, canvasArtifactNodes);
  const showStatusBadge = turnInProgress || showFinalError;
  const qaStatusLabel = resolveQaStatusLabel(card, canvasArtifactNodes);
  const showAnswer =
    turnInProgress ||
    shouldShowQaAnswerText(card) ||
    showFinalError ||
    card.artifactPayload != null ||
    card.outputArtifactId != null;

  return (
    <div className="relative border-t border-canvas-border/80 first:border-t-0">
      <QaTranslucentSurface>
        <QaQuestionSection accentColour={accent} style={qaInsetStyle("chatPanel")}>
          <QaQuestionHeaderRow
            collaborators={
              showContributors || showStatusBadge ? (
                <div className="flex min-w-0 items-center gap-2">
                  {showContributors && (
                    <ContributorAvatarStack
                      profiles={contributorProfiles}
                      onlineUserIds={onlineUserIds}
                    />
                  )}
                  {showStatusBadge && (
                    <QaStatusBadge
                      card={card}
                      canvasArtifactNodes={canvasArtifactNodes}
                    />
                  )}
                </div>
              ) : null
            }
            controls={<CardQaMenu cardId={cardId} layout="embedded" />}
          />
          <QuestionAttachments card={card} />

          <p className="text-canvas-body-lg font-medium leading-snug text-canvas-ink">
            {card.question}
          </p>
        </QaQuestionSection>

        {showAnswer && (
          <div style={qaInsetStyle("answer")}>
            <CardAnswerBody
              card={card}
              isStreaming={card.status === "streaming"}
              showPendingPlaceholder={
                turnInProgress && !shouldShowQaAnswerText(card)
              }
              pendingLabel={qaStatusLabel}
              onTryAgain={handleTryAgain}
            />
          </div>
        )}
      </QaTranslucentSurface>
    </div>
  );
}

export function ChatThreadMessages({
  threadId,
  className,
}: {
  threadId: string;
  className?: string;
}) {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const chain = useMemo(
    () =>
      getThreadCardChain(
        { cards, connections, cardOrder, threads: {}, threadOrder: [] },
        threadId,
      ),
    [cards, connections, cardOrder, threadId],
  );

  const visibleChain = chain.filter(
    (id) => cards[id] && cards[id].status !== "empty",
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleChain, cards]);

  if (visibleChain.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-canvas-body text-canvas-muted">
        No messages in this chat yet.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={className ?? "flex-1 overflow-y-auto px-4 py-6 md:px-8"}
    >
      <div className="relative mx-auto max-w-3xl">
        <div className="chat-casing overflow-hidden rounded-canvas border border-canvas-border bg-transparent shadow-card">
          {visibleChain.map((cardId) => (
            <QnaTurnBlock key={cardId} cardId={cardId} />
          ))}
        </div>
      </div>
    </div>
  );
}
