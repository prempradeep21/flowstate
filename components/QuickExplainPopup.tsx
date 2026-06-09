"use client";

import { m } from "framer-motion";
import { createPortal } from "react-dom";
import type { AnswerExplain } from "@/lib/store";
import { framerTransition } from "@/lib/motion/transitions";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

const quickExplainTransition = framerTransition("fast", "easeLight");

const quickExplainVariants = {
  initial: { opacity: 0, scale: 0.96, x: -6 },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: quickExplainTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    x: -6,
    transition: quickExplainTransition,
  },
  reduced: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0 },
  },
  reducedExit: {
    opacity: 0,
    transition: { duration: 0 },
  },
};

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
      className="h-4 w-4 shrink-0 animate-spin text-canvas-accent"
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
  anchorRect,
  onClose,
}: {
  explain: AnswerExplain;
  /** Y offset from card top — aligned to selected text */
  anchorY?: number;
  /** Viewport rect — portals beside selection (artifacts, panel) */
  anchorRect?: DOMRect;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const isLoading = explain.status === "loading";
  const isError = explain.status === "error";

  const popup = (
    <m.div
      data-quick-explain-popup
      role="dialog"
      aria-label={`Quick explain: ${explain.selectedText}`}
      aria-busy={isLoading}
      initial={reducedMotion ? "reduced" : "initial"}
      animate={reducedMotion ? "reduced" : "animate"}
      exit={reducedMotion ? "reducedExit" : "exit"}
      variants={quickExplainVariants}
      className={`${
        anchorRect ? "fixed" : "absolute"
      } z-[50001] w-[280px] origin-left overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card/95 shadow-card backdrop-blur-sm`}
      style={
        anchorRect
          ? {
              left: anchorRect.right + 12,
              top: anchorRect.top + anchorRect.height / 2,
              transform: "translateY(-50%)",
            }
          : {
              left: "calc(100% + 12px)",
              top: anchorY,
              y: "-50%",
            }
      }
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 border-b border-canvas-border px-3 py-2.5">
        <span className="mt-0.5 text-canvas-accent">
          {isLoading ? <LoadingSpinner /> : <HelpCircleIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-canvas-body-sm font-semibold leading-snug text-canvas-accent">
            {explain.selectedText}
          </p>
          {isLoading && (
            <p className="mt-0.5 text-canvas-caption font-medium text-canvas-muted">
              Explaining…
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-canvas p-0.5 text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
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
            <p className="text-canvas-compact text-canvas-muted">
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
          <p className="text-canvas-body-sm leading-relaxed text-canvas-danger">
            {explain.explanation || "Could not load explanation."}
          </p>
        )}
        {explain.explanation && (
          <p className="text-canvas-body-sm leading-relaxed text-canvas-ink">
            {explain.explanation}
            {isLoading && (
              <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-canvas-ink/70 align-middle" />
            )}
          </p>
        )}
      </div>
    </m.div>
  );

  if (anchorRect) {
    return createPortal(popup, document.body);
  }

  return popup;
}
