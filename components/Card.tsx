"use client";

import {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { askClaude } from "@/lib/claudeClient";
import { Card as CardType, useCanvasStore } from "@/lib/store";
import { useAutoResizeTextarea } from "@/lib/useAutoResizeTextarea";
import { ZoomResistantChrome } from "@/components/ZoomResistantChrome";
import {
  compactThinkingWord,
  compensatedStrokeWidth,
  counterScaleFactor,
  isGodViewMode,
  isSummaryOnlyMode,
  summaryLineClamp,
} from "@/lib/zoomDisplay";

interface CardProps {
  card: CardType;
}

const CARD_WIDTH = 420;

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-[17px] font-bold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-3 text-[15px] font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2 text-[14px] font-semibold first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  hr: () => <hr className="my-3 border-t border-canvas-border" />,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-canvas-border/50 px-1 py-0.5 font-mono text-[13px]">
      {children}
    </code>
  ),
};

export function Card({ card }: CardProps) {
  const updateCard = useCanvasStore((s) => s.updateCard);
  const setCardSize = useCanvasStore((s) => s.setCardSize);
  const createFollowUp = useCanvasStore((s) => s.createFollowUp);
  const createBranch = useCanvasStore((s) => s.createBranch);
  const moveSubtree = useCanvasStore((s) => s.moveSubtree);
  const openArtifact = useCanvasStore((s) => s.openArtifact);
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const hasChildren = useCanvasStore((s) =>
    s.connections.some(
      (c) => c.from === card.id && c.fromSide === "bottom",
    ),
  );
  const scale = useCanvasStore((s) => s.viewport.scale);
  const summaryOnly = isSummaryOnlyMode(scale);
  const godView = isGodViewMode(scale);
  const lineClamp = summaryLineClamp(scale);
  const cardBorderWidth = compensatedStrokeWidth(1, scale, 1);

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
  } | null>(null);

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
  }, [card.id, setCardSize]);

  useEffect(() => {
    if (card.status !== "thinking") return;
    if (startedFor.current === card.question) return;
    startedFor.current = card.question;
    askClaude(card.id, card.question, selectedModel, {
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
      onImages: (images) => updateCard(card.id, { images }),
      onDone: ({ artifactId }) =>
        updateCard(card.id, {
          status: "done",
          thinkingLabel: undefined,
          artifactId: artifactId ?? undefined,
        }),
    });
  }, [card.status, card.question, card.id, updateCard, selectedModel]);

  const isPending =
    card.status === "thinking" || card.status === "streaming";

  const submitQuestion = () => {
    const q = draft.trim();
    if (!q || isPending) return;
    updateCard(card.id, {
      question: q,
      answer: "",
      status: "thinking",
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

  const handleDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest(TEXT_SELECTABLE)) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  const handleDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    const screenDx = e.clientX - ds.lastX;
    const screenDy = e.clientY - ds.lastY;
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
      onPointerDown={handleDragPointerDown}
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
        className="relative overflow-hidden rounded-2xl border border-canvas-border bg-canvas-card shadow-card transition-shadow hover:shadow-cardHover"
        style={{ borderWidth: cardBorderWidth }}
      >
        {accent && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-2 bottom-2 rounded-r-full"
            style={{
              background: accent,
              width: compensatedStrokeWidth(3, scale, 3),
            }}
          />
        )}
        <div className="min-w-0 px-5 pt-4 pb-3">
          {card.status === "empty" ? (
            <ZoomResistantChrome transformOrigin="top left">
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
                  className="block min-h-[26px] min-w-0 flex-1 resize-none overflow-hidden break-words border-0 bg-transparent p-0 text-[18px] font-bold leading-snug text-canvas-ink outline-none placeholder:font-normal placeholder:text-canvas-muted/70"
                />
                <button
                  type="button"
                  onClick={submitQuestion}
                  className="shrink-0 rounded-md bg-canvas-ink px-3 py-1.5 text-[12px] font-medium text-canvas-card transition-opacity hover:opacity-90"
                >
                  Send
                </button>
              </div>
            </ZoomResistantChrome>
          ) : (
            !summaryOnly && (
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
                Question
              </div>
            )
          )}
          {card.status !== "empty" && (
            <div
              data-selectable-text
              className="w-full min-w-0 cursor-text break-words whitespace-pre-wrap text-[18px] font-bold leading-snug text-canvas-ink"
            >
              {card.question}
            </div>
          )}
        </div>

        {card.status !== "empty" && (
          <>
            {!summaryOnly && <div className="mx-5 h-px bg-canvas-border" />}
            <div
              className={
                summaryOnly ? "min-w-0 px-4 pb-3 pt-1" : "min-w-0 px-5 py-4"
              }
            >
              {!summaryOnly && (
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
                  Answer
                </div>
              )}
              {card.status === "thinking" ? (
                <SummaryLoading label={card.thinkingLabel ?? "Thinking"} />
              ) : (
                <>
                  {!summaryOnly && card.images && card.images.length > 0 && (
                    <div
                      className={`mb-3 grid gap-1 overflow-hidden rounded-xl ${
                        card.images.length === 1
                          ? "grid-cols-1"
                          : card.images.length <= 4
                            ? "grid-cols-2"
                            : "grid-cols-3"
                      }`}
                    >
                      {card.images.slice(0, 6).map((img, i) => (
                        <a
                          key={i}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <img
                            src={img.thumb}
                            alt={img.alt}
                            className="h-32 w-full object-cover transition-transform duration-200 hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {card.answer ? (
                    summaryOnly ? (
                      <AnswerSummary
                        answer={card.answer}
                        lineClamp={lineClamp}
                        isStreaming={card.status === "streaming"}
                      />
                    ) : (
                      <div
                        data-selectable-text
                        className="min-w-0 cursor-text text-[15px] leading-relaxed text-canvas-ink"
                      >
                        <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                          {card.answer}
                        </ReactMarkdown>
                        {card.status === "streaming" && (
                          <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-canvas-ink/70 align-middle" />
                        )}
                      </div>
                    )
                  ) : null}
                </>
              )}
            </div>
          </>
        )}

        {card.status === "done" && !hasChildren && !summaryOnly && (
          <ZoomResistantChrome transformOrigin="bottom left">
            <div className="flex min-w-0 items-end gap-2 border-t border-canvas-border px-5 py-2.5">
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
                className="block min-h-[22px] min-w-0 flex-1 resize-none overflow-hidden break-words border-0 bg-transparent p-0 text-[14px] leading-snug text-canvas-ink outline-none placeholder:text-canvas-muted/70"
              />
              <button
                type="button"
                onClick={submitFollowUp}
                className="shrink-0 rounded-md bg-canvas-ink px-3 py-1.5 text-[12px] font-medium text-canvas-card transition-opacity hover:opacity-90"
              >
                Send
              </button>
            </div>
          </ZoomResistantChrome>
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

function AnswerSummary({
  answer,
  lineClamp,
  isStreaming,
}: {
  answer: string;
  lineClamp: 2 | 4;
  isStreaming: boolean;
}) {
  const clampClass = lineClamp === 2 ? "line-clamp-2" : "line-clamp-4";
  return (
    <div
      data-selectable-text
      className={`min-w-0 cursor-text select-text break-words whitespace-pre-wrap text-[15px] leading-relaxed text-canvas-ink ${clampClass}`}
    >
      {answer}
      {isStreaming && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-canvas-ink/70 align-middle" />
      )}
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
