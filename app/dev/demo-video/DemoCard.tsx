"use client";

import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQuestionText } from "@/components/cards/CardQuestionText";
import { ChatComposer } from "@/components/ChatComposer";
import { CardQaMenu } from "@/components/CardQaMenu";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { Plug } from "@/components/plugs/Plug";
import { QuickExplainPopup } from "@/components/QuickExplainPopup";
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
import type { AnswerExplain, Card as CardType } from "@/lib/store";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";
import type { DemoCardScene, WorldRect } from "./timeline";

/**
 * Demo twin of components/Card.tsx — identical DOM structure and classes,
 * composed from the same atoms, but driven by scripted scene state instead
 * of pointer/store interactions. Deltas vs Card.tsx:
 *  - spawn transition computed from timeline (not MotionCanvasNode)
 *  - plug visibility/hint driven by props (not CSS hover)
 *  - selection highlight overlays + QuickExplainPopup mounted from scene
 */

// Copies of Card.tsx's private hint/toggle (Card.tsx:1083-1140).
const BRANCH_PLUG_SIZE_PX = 10;
const BRANCH_PLUG_HINT_GAP_PX = 8;
const BRANCH_PLUG_HINT_OFFSET_PX =
  BRANCH_PLUG_SIZE_PX / 2 + BRANCH_PLUG_HINT_GAP_PX;

function BranchPlugHint({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <span
      className={`pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 whitespace-nowrap text-canvas-body-sm text-canvas-muted ${
        isLeft ? "right-full text-right" : "left-full text-left"
      }`}
      style={
        isLeft
          ? { marginRight: BRANCH_PLUG_HINT_OFFSET_PX }
          : { marginLeft: BRANCH_PLUG_HINT_OFFSET_PX }
      }
    >
      Pull a branch
    </span>
  );
}

function BranchCollapseToggle({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <button
      type="button"
      aria-label="Collapse branch"
      className={`pointer-events-auto absolute top-1/2 z-40 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-body-sm font-medium text-canvas-muted shadow-sm transition-colors ${
        isLeft ? "right-full" : "left-full"
      }`}
      style={
        isLeft
          ? { marginRight: BRANCH_PLUG_HINT_OFFSET_PX }
          : { marginLeft: BRANCH_PLUG_HINT_OFFSET_PX }
      }
    >
      −
    </button>
  );
}

export function DemoCard({
  scene,
  card,
  accent,
  viewportScale,
  selectionRects,
  selectionProgress,
  explain,
  explainAnchorY,
}: {
  scene: DemoCardScene;
  /** Store-shaped card object (also written to zustand for DOM measurement). */
  card: CardType;
  accent: string;
  viewportScale: number;
  /** Card-local rects of the selected phrase (only on the selection card). */
  selectionRects?: WorldRect[];
  selectionProgress?: number;
  explain?: AnswerExplain | null;
  explainAnchorY?: number;
}) {
  const tuning = RESOLVED_CANVAS_TUNING;
  const cardWidth = tuning.cardWidth;
  const cardBorderWidth = compensatedStrokeWidth(1, viewportScale, 1);
  const isEmptyComposer = card.status === "empty";
  const pendingMinHeight = isCardLayoutPending(card)
    ? pendingLayoutMinHeight(card.size?.h, tuning.fallbackCardHeight)
    : null;
  const spawnStyle =
    scene.spawn < 1
      ? {
          opacity: scene.spawn,
          transform: `scale(${0.96 + 0.04 * scene.spawn})`,
          transformOrigin: "top center",
        }
      : undefined;
  const showPlugs = scene.plugsOpacity > 0 && card.status === "done";

  return (
    <div
      data-canvas-card={card.id}
      className={`group/card absolute overflow-visible select-text ${
        isEmptyComposer
          ? "overflow-hidden rounded-canvas border border-canvas-border bg-transparent shadow-artifact"
          : ""
      }`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: cardWidth,
        ...(isEmptyComposer ? { borderWidth: cardBorderWidth } : {}),
        ...(pendingMinHeight != null ? { minHeight: pendingMinHeight } : {}),
        ...spawnStyle,
      }}
    >
      {showPlugs && (
        <>
          {(["left", "right"] as const).map((side) => (
            <div
              key={side}
              className={`pointer-events-none absolute inset-y-0 z-30 ${
                side === "left" ? "left-0" : "right-0"
              }`}
              style={{ opacity: scene.plugsOpacity }}
            >
              <Plug
                side={side}
                accentColour={accent}
                visible
                ariaLabel={`Pull a new thread to the ${side}`}
                onPointerDown={() => {}}
              />
              {scene.branchSides.includes(side) && (
                <BranchCollapseToggle side={side} />
              )}
              {scene.hintSide === side && <BranchPlugHint side={side} />}
            </div>
          ))}
        </>
      )}
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
              placeholder={card.quotedSelection ? "Ask about this…" : "Ask anything"}
              lockedPrefix={card.quotedSelection}
              autoFocus={false}
              draftValue={scene.emptyDraft}
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
          className="group/inner relative flex flex-col overflow-hidden rounded-canvas border bg-transparent shadow-artifact transition-shadow border-canvas-border"
          style={{ borderWidth: cardBorderWidth }}
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
              <QaQuestionSection
                accentColour={accent}
                accentBandVariant="header"
                style={qaInsetStyle("question")}
              >
                <QaQuestionHeaderRow
                  controls={
                    <CardQaMenu cardId={card.id} canvas layout="embedded" />
                  }
                />
                <CardQuestionText question={card.question} collapsed={false} />
              </QaQuestionSection>

              <div className="mx-5 shrink-0 h-px bg-canvas-border" />

              <div
                data-card-answer
                className="min-w-0"
                style={qaInsetStyle("answer")}
              >
                <CardAnswerBody
                  card={card}
                  isStreaming={card.status === "streaming"}
                  showPendingPlaceholder={card.status === "thinking"}
                  pendingLabel="Thinking"
                />
              </div>
            </QaTranslucentSurface>

            {scene.showFollowUp && card.status === "done" && (
              <div
                data-follow-up-footer
                className="relative z-20 shrink-0 border-t border-canvas-border bg-canvas-card px-3 py-2.5"
              >
                <ChatComposer
                  variant="canvas"
                  cardId={card.id}
                  accentColour={accent}
                  placeholder="Follow up"
                  draftValue={scene.followUpDraft}
                  onDraftChange={() => {}}
                  onSubmit={() => {}}
                />
              </div>
            )}
          </CanvasSharpContent>
        </div>
      )}
      {/* Selection highlight — same rendering as TextCardBody's ExplainOverlays
          fallback boxes, revealed left-to-right by timeline progress. */}
      {selectionRects && selectionProgress != null && selectionProgress > 0 && (
        <div className="pointer-events-none absolute inset-0 z-30">
          {(() => {
            const total = selectionRects.reduce((s, r) => s + r.w, 0);
            let consumed = 0;
            return selectionRects.map((r, i) => {
              const before = consumed;
              consumed += r.w;
              const w = Math.max(
                0,
                Math.min(r.w, selectionProgress * total - before),
              );
              if (w <= 0) return null;
              return (
                <span
                  key={i}
                  className="absolute rounded-canvas-xs bg-canvas-accent/20"
                  style={{ left: r.x, top: r.y, width: w, height: r.h }}
                />
              );
            });
          })()}
        </div>
      )}
      {explain && explainAnchorY != null && (
        <QuickExplainPopup
          explain={explain}
          anchorY={explainAnchorY}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
