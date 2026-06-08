"use client";

import type { AnswerExplain } from "@/lib/store";

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className ?? "h-4 w-4 shrink-0"}
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

function LoadingSpinner() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 animate-spin text-canvas-question"
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
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

export function QuickExplainPopup({
  explain,
  anchorY,
  onClose,
}: {
  explain: AnswerExplain;
  /** Y offset from card top — aligned to selected text */
  anchorY: number;
  onClose: () => void;
}) {
  const isLoading = explain.status === "loading";
  const isError = explain.status === "error";

  return (
    <div
      data-quick-explain-popup
      role="dialog"
      aria-label={`Quick explain: ${explain.selectedText}`}
      aria-busy={isLoading}
      className="motion-fade-in absolute z-40 w-[280px] overflow-hidden rounded-2xl border border-canvas-border/50 bg-white/30 shadow-card backdrop-blur-md"
      style={{
        left: "calc(100% + 12px)",
        top: anchorY,
        transform: "translateY(-50%)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 border-b border-canvas-border/40 px-3 py-2.5">
        <span className="mt-0.5 text-canvas-question">
          {isLoading ? <LoadingSpinner /> : <HelpCircleIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-canvas-question">
            {explain.selectedText}
          </p>
          {isLoading && (
            <p className="mt-0.5 text-[11px] font-medium text-canvas-muted">
              Explaining…
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-0.5 text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
          aria-label="Close"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
          >
            <path
              d="M4.5 4.5l7 7M11.5 4.5l-7 7"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="min-h-[72px] px-3 py-2.5" aria-live="polite">
        {isLoading && !explain.explanation && (
          <div className="space-y-2.5">
            <p className="text-[12px] text-canvas-muted">
              Fetching a quick explanation…
            </p>
            <div className="space-y-2">
              <div className="h-2.5 w-full animate-pulse rounded bg-canvas-accent/15" />
              <div className="h-2.5 w-[85%] animate-pulse rounded bg-canvas-accent/15" />
              <div className="h-2.5 w-[65%] animate-pulse rounded bg-canvas-accent/15" />
            </div>
          </div>
        )}
        {isError && (
          <p className="text-[13px] leading-relaxed text-red-600">
            {explain.explanation || "Could not load explanation."}
          </p>
        )}
        {explain.explanation && (
          <p className="text-[13px] leading-relaxed text-canvas-ink">
            {explain.explanation}
            {isLoading && (
              <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-canvas-ink/70 align-middle" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}
