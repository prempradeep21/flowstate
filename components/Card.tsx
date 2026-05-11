"use client";

import {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { askDummy } from "@/lib/dummyLLM";
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
  const hasChildren = useCanvasStore((s) =>
    s.connections.some((c) => c.from === card.id),
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
    askDummy(card.question, {
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
      onDone: () =>
        updateCard(card.id, {
          status: "done",
          thinkingLabel: undefined,
        }),
    });
  }, [card.status, card.question, card.id, updateCard]);

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
      <BranchHandle
        side="left"
        onClick={() => createBranch(card.id, "left")}
      />
      <BranchHandle
        side="right"
        onClick={() => createBranch(card.id, "right")}
      />
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
              className="block min-h-[22px] flex-1 resize-none border-0 bg-transparent p-0 text-[15px] leading-snug text-canvas-ink outline-none placeholder:text-canvas-muted/70"
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
          <div className="whitespace-pre-wrap text-[15px] leading-snug text-canvas-ink">
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
            {card.answer && (
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-canvas-ink">
                {card.answer}
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
