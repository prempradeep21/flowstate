"use client";

import {
  CSSProperties,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQaMenu } from "@/components/CardQaMenu";
import { applyEmittedArtifact, askClaude } from "@/lib/claudeClient";
import { isCardInSelectedFamilies } from "@/lib/chatThreads";
import { Card as CardType, useCanvasStore } from "@/lib/store";
import { useAutoResizeTextarea } from "@/lib/useAutoResizeTextarea";
import {
  CARD_QA_MAX_HEIGHT,
  compactThinkingWord,
  compensatedStrokeWidth,
  counterScaleFactor,
  isExpandedCardContent,
  isGodViewMode,
  lineClampStyle,
  shouldHideDivider,
  shouldHideFollowUp,
  shouldHideImages,
  shouldHideLabels,
  zoomLineClamp,
  zoomSectionInsets,
} from "@/lib/zoomDisplay";

interface CardProps {
  card: CardType;
}

const CARD_WIDTH = 420;

function handleAnswerWheel(e: WheelEvent) {
  e.stopPropagation();
  if (e.deltaX !== 0) e.preventDefault();
}

export function Card({ card }: CardProps) {
  const updateCard = useCanvasStore((s) => s.updateCard);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const setCardSize = useCanvasStore((s) => s.setCardSize);
  const createFollowUp = useCanvasStore((s) => s.createFollowUp);
  const createBranch = useCanvasStore((s) => s.createBranch);
  const moveSubtree = useCanvasStore((s) => s.moveSubtree);
  const openArtifact = useCanvasStore((s) => s.openArtifact);
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const isSelected = useCanvasStore((s) =>
    isCardInSelectedFamilies(s, card.id, s.selectedFamilyRootIds),
  );
  const hasChildren = useCanvasStore((s) =>
    s.connections.some(
      (c) => c.from === card.id && c.fromSide === "bottom",
    ),
  );
  const scale = useCanvasStore((s) => s.viewport.scale);
  const godView = isGodViewMode(scale);
  const lineClamp = zoomLineClamp(scale);
  const expandedContent = isExpandedCardContent(scale);
  const insets = zoomSectionInsets(scale);
  const hideLabels = shouldHideLabels(scale);
  const hideDivider = shouldHideDivider(scale);
  const hideFollowUp = shouldHideFollowUp(scale);
  const hideImages = shouldHideImages(scale);
  const cardBorderWidth = compensatedStrokeWidth(1, scale, 1);
  const clampStyle = lineClampStyle(lineClamp);

  const accent = useCanvasStore(
    (s) => s.threads[card.threadId]?.accentColour,
  );
  const isBranchRoot = useCanvasStore(
    (s) =>
      card.parentCardId === null &&
      s.connections.some((c) => c.to === card.id),
  );
  const emptyPlaceholder = isBranchRoot ? "Pull a new thread" : "ask anything";

  const isDraggable = card.parentCardId === null;

  const [draft, setDraft] = useState(card.question);
  const [followUp, setFollowUp] = useState("");
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    didMove: boolean;
  } | null>(null);
  const DRAG_THRESHOLD_PX = 5;

  const startedFor = useRef<string | null>(null);

  const questionTextarea = useAutoResizeTextarea(draft);
  const followUpTextarea = useAutoResizeTextarea(followUp);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const TEXT_SELECTABLE =
    'textarea, button, input, select, [contenteditable="true"], [data-selectable-text]';

  useEffect(() => {
    if (card.status === "empty") {
      questionTextarea.ref.current?.focus();
    }
  }, [card.status, questionTextarea.ref]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => {
      setCardSize(card.id, { w: el.offsetWidth, h: el.offsetHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [card.id, setCardSize, scale]);

  useEffect(() => {
    if (card.status !== "thinking") return;
    if (startedFor.current === card.question) return;
    startedFor.current = card.question;
    askClaude(card.id, card.parentConversationId ?? null, card.question, selectedModel, {
      onThinking: (label) =>
        updateCard(card.id, {
          status: "thinking",
          thinkingLabel: label,
        }),
      onToken: (next) =>
        updateCard(card.id, {
          status: "streaming",
          answer: next,
          thinkingLabel: undefined,
        }),
      onImages: (images) =>
        updateCard(card.id, {
          images,
          responseType: "image",
        }),
      onResponseType: (responseType) =>
        updateCard(card.id, { responseType }),
      onArtifact: (artifact) => {
        const applied = applyEmittedArtifact(artifact);
        updateCard(card.id, {
          responseType: applied.responseType,
          artifactPayload: applied.artifactPayload,
        });
      },
      onDone: ({ artifactId, responseType }) =>
        updateCard(card.id, {
          status: "done",
          thinkingLabel: undefined,
          artifactId: artifactId ?? undefined,
          responseType: responseType ?? "text",
        }),
    });
  }, [card.status, card.question, card.id, updateCard, selectedModel]);

  const isPending =
    card.status === "thinking" || card.status === "streaming";

  const submitQuestion = () => {
    const q = draft.trim();
    if (!q || isPending) return;
    recordUndo();
    updateCard(card.id, {
      question: q,
      answer: "",
      status: "thinking",
      responseType: "text",
      artifactPayload: undefined,
      images: undefined,
    });
  };

  const submitFollowUp = () => {
    const q = followUp.trim();
    if (!q) return;
    createFollowUp(card.id, q);
    setFollowUp("");
  };

  const handleQuestionKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const handleFollowUpKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitFollowUp();
    }
  };

  const handleCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest(TEXT_SELECTABLE)) return;

    e.stopPropagation();
    if (!isDraggable) return;

    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      didMove: false,
    };
  };

  const handleDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;

    const screenDx = e.clientX - ds.lastX;
    const screenDy = e.clientY - ds.lastY;
    const dist = Math.hypot(screenDx, screenDy);
    if (!ds.didMove && dist < DRAG_THRESHOLD_PX) return;

    ds.didMove = true;
    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    const vpScale = useCanvasStore.getState().viewport.scale;
    moveSubtree(card.id, screenDx / vpScale, screenDy / vpScale);
  };

  const handleDragPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragStateRef.current = null;
  };

  return (
    <div
      ref={cardRef}
      data-canvas-card
      onPointerDown={handleCardPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onPointerCancel={handleDragPointerUp}
      className={`group absolute overflow-visible select-text ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: CARD_WIDTH,
      }}
    >
      {card.status === "done" && (
        <>
          <BranchHandle
            side="left"
            alwaysVisible={godView}
            onClick={() => createBranch(card.id, "left")}
          />
          <BranchHandle
            side="right"
            alwaysVisible={godView}
            onClick={() => createBranch(card.id, "right")}
          />
        </>
      )}
      <div
        className={`relative flex flex-col overflow-hidden rounded-2xl border bg-canvas-card shadow-card transition-shadow hover:shadow-cardHover ${
          isSelected
            ? "border-canvas-ink ring-2 ring-canvas-ink/25"
            : "border-canvas-border"
        }`}
        style={{
          borderWidth: cardBorderWidth,
          ...(isSelected && accent
            ? { boxShadow: `0 0 0 2px ${accent}40` }
            : {}),
        }}
      >
        {accent && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 rounded-l-2xl"
            style={{
              background: accent,
              width: compensatedStrokeWidth(3, scale, 3),
            }}
          />
        )}
        {card.status !== "empty" && (
          <CardQaMenu cardId={card.id} viewportScale={scale} />
        )}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
            expandedContent ? "max-h-[var(--card-qa-max-height)]" : ""
          }`}
          style={
            expandedContent
              ? ({
                  "--card-qa-max-height": `${CARD_QA_MAX_HEIGHT}px`,
                } as CSSProperties)
              : undefined
          }
        >
        <div
          className="min-w-0 shrink-0"
          style={{
            paddingTop: insets.question.paddingTop,
            paddingBottom: insets.question.paddingBottom,
            paddingLeft: insets.question.paddingLeft,
            paddingRight: insets.question.paddingRight,
          }}
        >
          {card.status === "empty" ? (
            <div className="flex min-w-0 items-end gap-2">
                <textarea
                  ref={questionTextarea.ref}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    questionTextarea.resize();
                  }}
                  onKeyDown={handleQuestionKeyDown}
                  placeholder={emptyPlaceholder}
                  rows={1}
                  className="block min-h-[40px] min-w-0 flex-1 resize-none overflow-hidden break-words border-0 bg-transparent px-0 py-2 text-[15px] font-semibold leading-normal text-canvas-ink outline-none placeholder:font-normal placeholder:text-canvas-muted/70"
                />
                <button
                  type="button"
                  onClick={submitQuestion}
                  className="mb-0.5 shrink-0 rounded-md bg-canvas-ink px-3 py-1.5 text-[12px] font-medium text-canvas-card transition-opacity hover:opacity-90"
                >
                  Send
                </button>
              </div>
          ) : (
            <>
              {!hideLabels && (
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
                  Question
                </div>
              )}
              <div
                data-selectable-text
                className="w-full min-w-0 cursor-text break-words whitespace-pre-wrap text-[18px] font-bold leading-snug text-canvas-ink"
                style={clampStyle}
              >
                {card.question}
              </div>
            </>
          )}
        </div>

        {card.status !== "empty" && (
          <>
            {!hideDivider && <div className="mx-5 shrink-0 h-px bg-canvas-border" />}
            <div
              data-card-answer
              onWheel={handleAnswerWheel}
              className={`min-h-0 min-w-0 ${
                expandedContent
                  ? "flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
                  : "overflow-hidden"
              }`}
              style={{
                paddingTop: insets.answer.paddingTop,
                paddingBottom: insets.answer.paddingBottom,
                paddingLeft: insets.answer.paddingLeft,
                paddingRight: insets.answer.paddingRight,
              }}
            >
              {!hideLabels && (
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
                  Answer
                </div>
              )}
              {card.status === "thinking" ? (
                <SummaryLoading label={card.thinkingLabel ?? "Thinking"} />
              ) : (
                <>
                  {(card.answer ||
                    card.images?.length ||
                    card.artifactPayload ||
                    card.responseType !== "text") && (
                    lineClamp !== null ? (
                      <ClampedAnswer
                        card={card}
                        clampStyle={clampStyle}
                        isStreaming={card.status === "streaming"}
                        hideImages={hideImages}
                      />
                    ) : (
                      <CardAnswerBody
                        card={card}
                        isStreaming={card.status === "streaming"}
                        hideImages={hideImages}
                      />
                    )
                  )}
                </>
              )}
            </div>
          </>
        )}

        </div>

        {card.status === "done" && !hasChildren && !hideFollowUp && (
          <div className="relative z-20 shrink-0 rounded-b-2xl border-t border-canvas-border bg-canvas-card px-4 py-2.5">
            <div className="flex min-w-0 items-end gap-2">
              <textarea
                ref={followUpTextarea.ref}
                value={followUp}
                onChange={(e) => {
                  setFollowUp(e.target.value);
                  followUpTextarea.resize();
                }}
                onKeyDown={handleFollowUpKeyDown}
                placeholder="Ask a follow-up..."
                rows={1}
                className="block min-h-[36px] min-w-0 flex-1 resize-none overflow-hidden break-words border-0 bg-transparent px-0 py-1.5 text-[14px] leading-normal text-canvas-ink outline-none placeholder:text-canvas-muted/70"
              />
              <button
                type="button"
                onClick={submitFollowUp}
                className="mb-0.5 shrink-0 rounded-md bg-canvas-ink px-3 py-1.5 text-[12px] font-medium text-canvas-card transition-opacity hover:opacity-90"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
      {card.status === "done" && card.artifactId && (
        <ArtifactBadge onClick={() => openArtifact(card.id)} />
      )}
    </div>
  );
}

function SummaryLoading({ label }: { label: string }) {
  const word = compactThinkingWord(label);
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-canvas-border bg-canvas-bg/80 px-3 py-2.5"
      style={{ animation: "summary-pulse-stroke 2s ease-in-out infinite" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          style={{ animation: "summary-shimmer 1.8s ease-in-out infinite" }}
        />
      </div>
      <span className="relative text-sm font-medium capitalize text-canvas-muted">
        {word}
      </span>
    </div>
  );
}

function ClampedAnswer({
  card,
  clampStyle,
  isStreaming,
  hideImages,
}: {
  card: CardType;
  clampStyle?: ReturnType<typeof lineClampStyle>;
  isStreaming: boolean;
  hideImages?: boolean;
}) {
  if (
    (card.responseType ?? "text") === "text" &&
    !card.artifactPayload
  ) {
    return (
      <CardAnswerBody
        card={card}
        isStreaming={isStreaming}
        clampStyle={clampStyle}
        plainClamp
        hideImages={hideImages}
      />
    );
  }

  return (
    <div
      data-selectable-text
      className="min-w-0 cursor-text select-text"
      style={clampStyle}
    >
      <CardAnswerBody
        card={card}
        isStreaming={isStreaming}
        hideImages={hideImages}
      />
    </div>
  );
}

function BranchHandle({
  side,
  alwaysVisible,
  onClick,
}: {
  side: "left" | "right";
  alwaysVisible: boolean;
  onClick: () => void;
}) {
  const scale = useCanvasStore((s) => s.viewport.scale);
  const isLeft = side === "left";
  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-20 ${isLeft ? "left-0" : "right-0"}`}
      style={{
        transform: `translate(${isLeft ? "-50%" : "50%"}, -50%) scale(${counterScaleFactor(scale)})`,
        transformOrigin: "center",
      }}
    >
      <button
        type="button"
        aria-label={`Pull a new thread to the ${side}`}
        onClick={onClick}
        onPointerDown={(e) => e.stopPropagation()}
        className={`pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-canvas-border bg-canvas-card text-canvas-ink shadow-card transition-opacity hover:border-canvas-ink/50 ${
          alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <span className="text-[15px] font-medium leading-none">+</span>
      </button>
    </div>
  );
}

function ArtifactBadge({ onClick }: { onClick: () => void }) {
  const scale = useCanvasStore((s) => s.viewport.scale);
  return (
    <div
      className="pointer-events-none absolute top-0 left-full z-10"
      style={{
        transform: `scale(${1 / scale})`,
        transformOrigin: "top left",
      }}
    >
      <button
        type="button"
        aria-label="Open attached document"
        onClick={onClick}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ marginLeft: 16 }}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-muted shadow-card transition-colors hover:border-canvas-ink/40 hover:text-canvas-ink"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 1.75h6L13 5.25v8.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V2.25a.5.5 0 0 1 .5-.5Z" />
          <path d="M9.25 1.75v3.5H13" />
          <path d="M5.5 8.25h5" />
          <path d="M5.5 10.75h5" />
        </svg>
      </button>
    </div>
  );
}
