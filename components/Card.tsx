"use client";

import {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { askClaude } from "@/lib/claudeClient";
import { Card as CardType, useCanvasStore } from "@/lib/store";

interface CardProps {
  card: CardType;
}

const CARD_WIDTH = 420;

export function Card({ card }: CardProps) {
  const updateCard = useCanvasStore((s) => s.updateCard);
  const setCardSize = useCanvasStore((s) => s.setCardSize);
  const createFollowUp = useCanvasStore((s) => s.createFollowUp);
  const createBranch = useCanvasStore((s) => s.createBranch);
  const moveSubtree = useCanvasStore((s) => s.moveSubtree);
  const openArtifact = useCanvasStore((s) => s.openArtifact);
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  // Only vertical follow-ups (same-thread children) suppress the follow-up
  // input. Side branches spawn new threads and shouldn't strip this card of
  // its own ability to continue inquiring further down its thread.
  const hasChildren = useCanvasStore((s) =>
    s.connections.some(
      (c) => c.from === card.id && c.fromSide === "bottom",
    ),
  );
  const accent = useCanvasStore(
    (s) => s.threads[card.threadId]?.accentColour,
  );
  // A "branch root" is a root card (parentCardId === null) that has an
  // incoming connection from somewhere — i.e. it was pulled as a new thread
  // off another card. Used to customise its empty-state placeholder.
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

  // Tracks which question we've already dispatched an ask for, keyed by ref so
  // it survives React 18 strict-mode double-invoke without double-starting the
  // dummy stream. We deliberately don't cancel on unmount — askDummy callbacks
  // update Zustand state, which safely no-ops if the card has been removed.
  const startedFor = useRef<string | null>(null);

  const questionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const followUpTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Initial focus on the question textarea when the card is brand-new.
  useEffect(() => {
    if (card.status === "empty") {
      questionTextareaRef.current?.focus();
    }
  }, [card.status]);

  // Measure card size for connection routing.
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

  // Kick off the dummy LLM whenever a card enters `thinking` for a question we
  // haven't asked yet. Handles both the initial-card submit and follow-up children
  // that mount already in `thinking`. No cleanup: cancelling here would kill the
  // ask during React 18 strict-mode's mount-cleanup-mount cycle.
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
      onImages: (images) =>
        updateCard(card.id, { images }),
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
    // Skip when the pointer is on an interactive descendant — let textareas,
    // buttons, etc. handle their own clicks.
    const target = e.target as HTMLElement;
    if (
      target.closest(
        'textarea, button, input, select, [contenteditable="true"]',
      )
    ) {
      return;
    }
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
    const scale = useCanvasStore.getState().viewport.scale;
    moveSubtree(card.id, screenDx / scale, screenDy / scale);
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
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onPointerCancel={handleDragPointerUp}
      className={`group absolute rounded-2xl border border-canvas-border bg-canvas-card shadow-card transition-shadow hover:shadow-cardHover ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: CARD_WIDTH,
      }}
    >
      {accent && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ background: accent }}
        />
      )}
      {card.status === "done" && (
        <>
          <BranchHandle
            side="left"
            onClick={() => createBranch(card.id, "left")}
          />
          <BranchHandle
            side="right"
            onClick={() => createBranch(card.id, "right")}
          />
          {card.artifactId && (
            <ArtifactBadge onClick={() => openArtifact(card.id)} />
          )}
        </>
      )}
      <div className="px-5 pt-4 pb-3">
        {card.status === "empty" ? (
          <div className="flex items-end gap-2">
            <textarea
              ref={questionTextareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder={emptyPlaceholder}
              rows={1}
              className="block min-h-[26px] flex-1 resize-none border-0 bg-transparent p-0 text-[18px] font-bold leading-snug text-canvas-ink outline-none placeholder:font-normal placeholder:text-canvas-muted/70"
            />
            <button
              type="button"
              onClick={submitQuestion}
              className="shrink-0 rounded-md bg-canvas-ink px-3 py-1.5 text-[12px] font-medium text-canvas-card transition-opacity hover:opacity-90"
            >
              Send
            </button>
          </div>
        ) : (
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
            Question
          </div>
        )}
        {card.status !== "empty" && (
          <div className="whitespace-pre-wrap text-[18px] font-bold leading-snug text-canvas-ink">
            {card.question}
          </div>
        )}
      </div>

      {card.status !== "empty" && (
        <>
          <div className="mx-5 h-px bg-canvas-border" />
          <div className="px-5 py-4">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
              Answer
            </div>
            {card.images && card.images.length > 0 && (
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
            {card.answer && (
              <div className="text-[15px] leading-relaxed text-canvas-ink">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-2 mt-3 text-[17px] font-bold first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-1.5 mt-3 text-[15px] font-semibold first:mt-0">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-1 mt-2 text-[14px] font-semibold first:mt-0">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-0.5">{children}</li>
                    ),
                    hr: () => (
                      <hr className="my-3 border-t border-canvas-border" />
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-canvas-border/50 px-1 py-0.5 font-mono text-[13px]">{children}</code>
                    ),
                  }}
                >
                  {card.answer}
                </ReactMarkdown>
                {card.status === "streaming" && (
                  <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-canvas-ink/70 align-middle" />
                )}
              </div>
            )}
            {card.status === "thinking" && (
              <div className={card.answer ? "mt-2" : ""}>
                <LoadingLine label={card.thinkingLabel ?? "Thinking"} />
              </div>
            )}
          </div>
        </>
      )}

      {card.status === "done" && !hasChildren && (
        <div className="flex items-end gap-2 border-t border-canvas-border px-5 py-2.5">
          <textarea
            ref={followUpTextareaRef}
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={handleFollowUpKeyDown}
            placeholder="Ask a follow-up..."
            rows={1}
            className="block min-h-[22px] flex-1 resize-none border-0 bg-transparent p-0 text-[14px] leading-snug text-canvas-ink outline-none placeholder:text-canvas-muted/70"
          />
          <button
            type="button"
            onClick={submitFollowUp}
            className="shrink-0 rounded-md bg-canvas-ink px-3 py-1.5 text-[12px] font-medium text-canvas-card transition-opacity hover:opacity-90"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[14px] text-canvas-muted">
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-canvas-muted/60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-canvas-muted" />
      </span>
      <span className="animate-pulse">{label}...</span>
    </div>
  );
}

function BranchHandle({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const isLeft = side === "left";
  return (
    <button
      type="button"
      aria-label={`Pull a new thread to the ${side}`}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={`absolute top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-muted opacity-0 shadow-card transition-opacity duration-150 group-hover:opacity-100 hover:border-canvas-ink/40 hover:text-canvas-ink ${
        isLeft ? "-left-3" : "-right-3"
      }`}
    >
      <span className="text-[14px] leading-none">+</span>
    </button>
  );
}

// Floating document badge that sits 16px outside the card's right edge. Per
// the V1 spec it stays visible (not hover-revealed) because its purpose is
// to signal that this card has an attachment.
//
// The badge is the only piece of card UI that resists the canvas zoom: it's
// anchored at the card's top-right corner and counter-scaled by
// `1 / viewport.scale` so the icon (and the 16px gap to the card) stay the
// same on-screen size at every zoom level. Scale is subscribed to inside the
// badge itself so cards without an artifact don't pay the re-render cost.
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
