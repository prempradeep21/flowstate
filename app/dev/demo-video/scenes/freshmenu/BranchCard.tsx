"use client";

import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQuestionText } from "@/components/cards/CardQuestionText";
import { ChatComposer } from "@/components/ChatComposer";
import { CardQaMenu } from "@/components/CardQaMenu";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { QuestionAttachments } from "@/components/QuestionAttachments";
import {
  QaQuestionHeaderRow,
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import { qaInsetStyle } from "@/lib/design/canvasInsets";
import {
  isCardLayoutPending,
  pendingLayoutMinHeight,
} from "@/lib/cardLayoutPolicy";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import type { Card as CardType } from "@/lib/store";
import type { FmBranchScene } from "./timeline";

/**
 * The card a dropped artifact plug creates — same DOM and atoms as
 * components/Card.tsx (empty composer → asked → answered), with the product's
 * pointer/store interactions replaced by scripted scene state. Deltas:
 *  - drop-in (dropVariants) computed from the timeline, not MotionCanvasNode
 *  - composer draft comes from the scene (typed as a function of t)
 *  - the answer's one-shot fade (.answer-reveal-in) is driven from t
 */
export function BranchCard({
  scene,
  card,
  accent,
}: {
  scene: FmBranchScene;
  /** Store-shaped card (also written to zustand for the plug connection). */
  card: CardType;
  accent: string;
}) {
  const tuning = RESOLVED_CANVAS_TUNING;
  const cardWidth = tuning.cardWidth;
  const isEmptyComposer = card.status === "empty";
  const pendingMinHeight = isCardLayoutPending(card)
    ? pendingLayoutMinHeight(card.size?.h, tuning.fallbackCardHeight)
    : null;
  const settling =
    scene.opacity < 1 || scene.liftY !== 0 || scene.scale !== 1;

  return (
    <div
      data-canvas-card={card.id}
      data-artifact-category="discourse"
      className={`group/card absolute overflow-visible select-text ${
        isEmptyComposer
          ? "overflow-hidden rounded-canvas border border-canvas-border bg-transparent shadow-artifact"
          : ""
      }`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: cardWidth,
        ...(isEmptyComposer
          ? { borderWidth: "calc(1px / min(var(--vp-scale, 1), 1))" }
          : {}),
        ...(pendingMinHeight != null ? { minHeight: pendingMinHeight } : {}),
        ...(settling
          ? {
              opacity: scene.opacity,
              transform: `translateY(${scene.liftY}px) scale(${scene.scale})`,
            }
          : {}),
      }}
    >
      {isEmptyComposer ? (
        <div
          className="relative min-w-0 overflow-hidden"
          style={qaInsetStyle("emptyComposer")}
        >
          <CanvasSharpContent className="w-full min-w-0">
            <ChatComposer
              variant="canvas"
              cardId={card.id}
              accentColour={accent}
              placeholder="Ask anything"
              autoFocus={false}
              draftValue={scene.draft}
              onDraftChange={() => {}}
              onSubmit={() => {}}
              trailingControls={
                <CardQaMenu cardId={card.id} canvas layout="embedded" />
              }
            />
          </CanvasSharpContent>
        </div>
      ) : (
        <div
          className="chat-casing group/inner relative flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-transparent shadow-artifact"
          style={{ borderWidth: "calc(1px / min(var(--vp-scale, 1), 1))" }}
        >
          {card.status === "thinking" && (
            <div
              className="thinking-accent-bar pointer-events-none absolute inset-x-0 top-0 z-40 h-px bg-canvas-accent"
              aria-hidden
            />
          )}
          <CanvasSharpContent
            worldWidth={cardWidth}
            className="flex min-w-0 flex-col"
          >
            <QaTranslucentSurface className="group/body flex min-w-0 flex-col">
              <QaQuestionSection style={qaInsetStyle("question")}>
                <QaQuestionHeaderRow
                  controls={
                    <CardQaMenu cardId={card.id} canvas layout="embedded" />
                  }
                />
                <QuestionAttachments card={card} />
                <CardQuestionText question={card.question} collapsed={false} />
              </QaQuestionSection>

              <div className="mx-5 shrink-0 h-px bg-canvas-border" />

              <div
                data-card-answer
                className="min-w-0"
                style={{
                  ...qaInsetStyle("answer"),
                  ...(card.status === "done" && scene.reveal < 1
                    ? { opacity: scene.reveal }
                    : {}),
                }}
              >
                <CardAnswerBody
                  card={card}
                  isStreaming={false}
                  showPendingPlaceholder={card.status === "thinking"}
                  pendingLabel="Thinking"
                />
              </div>
            </QaTranslucentSurface>

            {card.status === "done" && (
              <div
                data-follow-up-footer
                className="relative z-20 shrink-0 border-t border-canvas-border bg-canvas-card px-3 py-2.5"
                style={scene.reveal < 1 ? { opacity: scene.reveal } : undefined}
              >
                <ChatComposer
                  variant="canvas"
                  cardId={card.id}
                  accentColour={accent}
                  placeholder="Follow up"
                  draftValue=""
                  onDraftChange={() => {}}
                  onSubmit={() => {}}
                />
              </div>
            )}
          </CanvasSharpContent>
        </div>
      )}
    </div>
  );
}
