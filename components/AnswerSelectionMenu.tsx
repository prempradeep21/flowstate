"use client";

import { createPortal } from "react-dom";

function HelpCircleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
    >
      <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M6.2 6.1a1.8 1.8 0 0 1 3.1 1.2c0 1.2-1.55 1.45-1.55 2.55"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
    >
      <path
        d="M4 4h8M8 4v8M6 12h4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
    >
      <path
        d="M4 3.5v9M4 8h5.5a2.5 2.5 0 0 0 0-5H4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 5.5l1.5 1.5L11 8.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 animate-spin"
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.35"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AnswerSelectionMenu({
  rect,
  onQuickExplain,
  onAskQuestion,
  onAddToCanvas,
  askDisabled,
  addToCanvasDisabled,
  quickExplainLoading,
}: {
  rect: DOMRect;
  onQuickExplain: () => void;
  onAskQuestion: () => void;
  onAddToCanvas: () => void;
  askDisabled?: boolean;
  addToCanvasDisabled?: boolean;
  quickExplainLoading?: boolean;
}) {
  const left = rect.left + rect.width / 2;
  const top = rect.top - 8;

  return createPortal(
    <div
      data-answer-selection-menu
      className="motion-fade-in pointer-events-auto fixed z-[50000] flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-xl bg-canvas-ink px-1 py-1 shadow-card"
      style={{ left, top }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={quickExplainLoading}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onQuickExplain();
        }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-90"
      >
        {quickExplainLoading ? <LoadingSpinner /> : <HelpCircleIcon />}
        {quickExplainLoading ? "Explaining…" : "Quick explain"}
      </button>
      <div className="mx-0.5 h-4 w-px bg-white/20" aria-hidden />
      <button
        type="button"
        disabled={askDisabled || quickExplainLoading}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onAskQuestion();
        }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <BranchIcon />
        Ask a question
      </button>
      <div className="mx-0.5 h-4 w-px bg-white/20" aria-hidden />
      <button
        type="button"
        disabled={addToCanvasDisabled || quickExplainLoading}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onAddToCanvas();
        }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <TypeIcon />
        Add to Canvas
      </button>
    </div>,
    document.body,
  );
}
