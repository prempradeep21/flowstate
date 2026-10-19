"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { QuestionAttachments } from "@/components/QuestionAttachments";
import { getQuestionAttachedImages } from "@/lib/questionAttachments";
import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQaMenu } from "@/components/CardQaMenu";
import { isConversationCard } from "@/lib/conversationCard";
import { ContributorAvatarStack } from "@/components/ContributorAvatarStack";
import { QaStatusBadge } from "@/components/QaStatusBadge";
import { QaQuestionSection } from "@/components/QaQuestionSection";
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
    // Retrying a conversation card would re-ask its heading as a question.
    // createFollowUp refuses it anyway; this keeps the intent at the call site.
    if (isConversationCard(card)) return;
    const attachedImages = card ? getQuestionAttachedImages(card) : [];
    createFollowUp(cardId, card.question, {
      pendingImages: attachedImages.length > 0 ? attachedImages : undefined,
      // See Card.tsx handleTryAgain: a handoff card needs its source to retry.
      customUiSource: card.customUiSource,
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

  // Chat reads like a transcript: the question is a right-aligned bubble, the
  // answer runs full-width beneath it with no card around it. Turn controls
  // sit beside the bubble and surface on hover so a long thread stays quiet.
  return (
    <article className="group/turn flex min-w-0 flex-col gap-4">
      <QaQuestionSection className="flex min-w-0 items-start justify-end gap-2">
        <div className="flex h-8 shrink-0 items-center gap-2">
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
          {/* z-10 lifts the open menu above the answer that follows; it stays
              shown while open even once the pointer leaves the turn. */}
          <div className="relative z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover/turn:opacity-100 has-[[aria-expanded=true]]:opacity-100">
            <CardQaMenu cardId={cardId} layout="embedded" />
          </div>
        </div>
        <div className="flex min-w-0 max-w-[85%] flex-col items-end gap-2">
          <QuestionAttachments card={card} />
          <p className="whitespace-pre-wrap break-words rounded-canvas bg-canvas-bg px-4 py-2.5 text-canvas-body leading-relaxed text-canvas-ink">
            {card.question}
          </p>
        </div>
      </QaQuestionSection>

      {showAnswer && (
        <div className="min-w-0">
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
    </article>
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
      className={
        className ??
        // Soft fade top and bottom so turns slip under the header and composer
        // instead of being cut at a hard edge.
        "flex-1 overflow-y-auto px-8 pb-10 pt-6 [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-24px),transparent)]"
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        {visibleChain.map((cardId) => (
          <QnaTurnBlock key={cardId} cardId={cardId} />
        ))}
      </div>
    </div>
  );
}
