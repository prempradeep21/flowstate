"use client";

import type { OnboardingTourStep } from "@/lib/onboardingTour";

const SPOTLIGHT_PAD = 8;
const POPOVER_MAX_WIDTH = 352; // 22rem
const POPOVER_MAX_HEIGHT = 220;
const VIEWPORT_MARGIN = 16;

export interface PopoverPlacementResult {
  top: number;
  left: number;
  placement: "above" | "below" | "center";
  translateX: string;
  translateY: string;
}

function popoverWidth(): number {
  if (typeof window === "undefined") return POPOVER_MAX_WIDTH;
  return Math.min(window.innerWidth - VIEWPORT_MARGIN * 2, POPOVER_MAX_WIDTH);
}

function clampHorizontal(
  rect: SpotlightRect,
  width: number,
): { left: number; translateX: string } {
  const margin = VIEWPORT_MARGIN;
  const maxLeft = window.innerWidth - margin;
  const minLeft = margin;

  const targetRight = rect.left + rect.width;
  const targetLeft = rect.left;
  const targetCenter = rect.left + rect.width / 2;

  // Right-edge targets: anchor popover's right edge to target's right edge.
  if (targetRight > window.innerWidth * 0.65) {
    let left = Math.min(targetRight, maxLeft);
    if (left - width < minLeft) {
      left = minLeft + width;
    }
    return { left, translateX: "-100%" };
  }

  // Left-edge targets: anchor popover's left edge to target's left edge.
  if (targetLeft < window.innerWidth * 0.35) {
    let left = Math.max(targetLeft, minLeft);
    if (left + width > maxLeft) {
      left = maxLeft - width;
    }
    return { left: Math.max(minLeft, left), translateX: "0" };
  }

  // Center on target, then clamp so the full box stays on screen.
  const half = width / 2;
  let left = targetCenter;
  left = Math.min(maxLeft - half, Math.max(minLeft + half, left));
  return { left, translateX: "-50%" };
}

function clampVertical(
  top: number,
  height: number,
  placement: "above" | "below",
): { top: number; translateY: string } {
  const margin = VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - margin;

  if (placement === "below") {
    if (top + height > maxTop) {
      return { top: maxTop - height, translateY: "0" };
    }
    return { top: Math.max(margin, top), translateY: "0" };
  }

  // above
  if (top - height < margin) {
    return { top: margin + height, translateY: "-100%" };
  }
  return { top: Math.min(maxTop, top), translateY: "-100%" };
}

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function measureCoachTarget(
  selector: string,
): SpotlightRect | null {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }
  const nodes = Array.from(document.querySelectorAll(selector));
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    const style = window.getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      continue;
    }
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    return {
      top: rect.top - SPOTLIGHT_PAD,
      left: rect.left - SPOTLIGHT_PAD,
      width: rect.width + SPOTLIGHT_PAD * 2,
      height: rect.height + SPOTLIGHT_PAD * 2,
    };
  }
  return null;
}

export function popoverPlacement(
  rect: SpotlightRect | null,
  centered: boolean,
): PopoverPlacementResult {
  if (typeof window === "undefined") {
    return {
      top: 0,
      left: 0,
      placement: "center",
      translateX: "-50%",
      translateY: "-50%",
    };
  }

  if (centered || !rect) {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      placement: "center",
      translateX: "-50%",
      translateY: "-50%",
    };
  }

  const width = popoverWidth();
  const gap = 12;
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const nearBottom = rect.top + rect.height > window.innerHeight * 0.55;
  const nearTop = rect.top < window.innerHeight * 0.2;

  if (spaceBelow < POPOVER_MAX_HEIGHT + gap && spaceAbove < POPOVER_MAX_HEIGHT + gap) {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      placement: "center",
      translateX: "-50%",
      translateY: "-50%",
    };
  }

  const { left, translateX } = clampHorizontal(rect, width);

  let placement: "above" | "below";
  let rawTop: number;

  if (nearTop && spaceBelow >= POPOVER_MAX_HEIGHT + gap) {
    placement = "below";
    rawTop = rect.top + rect.height + gap;
  } else if (nearBottom || spaceBelow < POPOVER_MAX_HEIGHT + gap) {
    placement = "above";
    rawTop = rect.top - gap;
  } else {
    placement = "below";
    rawTop = rect.top + rect.height + gap;
  }

  const { top, translateY } = clampVertical(rawTop, POPOVER_MAX_HEIGHT, placement);

  return { top, left, placement, translateX, translateY };
}

export interface CoachMarkPopoverProps {
  step: OnboardingTourStep;
  stepIndex: number;
  stepCount: number;
  placement: "above" | "below" | "center";
  style: { top: number; left: number };
  translateX: string;
  translateY: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export function CoachMarkPopover({
  step,
  stepIndex,
  stepCount,
  placement,
  style,
  translateX,
  translateY,
  onBack,
  onNext,
  onSkip,
  canGoBack,
  isLastStep,
}: CoachMarkPopoverProps) {
  const transform = `translate(${translateX}, ${translateY})`;

  return (
    <div
      className="pointer-events-auto fixed z-[72] w-[min(100vw-2rem,22rem)] rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card"
      style={{ top: style.top, left: style.left, transform }}
      role="dialog"
      aria-labelledby="coach-mark-title"
      aria-describedby="coach-mark-body"
    >
      <p
        id="coach-mark-title"
        className="text-canvas-body font-medium text-canvas-ink"
      >
        {step.title}
      </p>
      <div id="coach-mark-body" className="mt-2 space-y-1">
        {step.lines.map((line) => (
          <p key={line} className="text-canvas-caption leading-snug text-canvas-muted">
            {line}
          </p>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: stepCount }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === stepIndex ? "bg-canvas-accent" : "bg-canvas-border"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-canvas px-2 py-1 text-canvas-caption text-canvas-muted transition-colors hover:text-canvas-ink"
          >
            Skip tour
          </button>
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-caption font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="rounded-canvas bg-canvas-ink px-3 py-1.5 text-canvas-caption font-medium text-canvas-card transition-opacity hover:opacity-90"
          >
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CoachMarkSpotlight({ rect }: { rect: SpotlightRect }) {
  return (
    <>
      <div
        className="pointer-events-none fixed z-[71] rounded-canvas-md ring-2 ring-canvas-card ring-offset-2 ring-offset-transparent"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed z-[70] rounded-canvas-md shadow-[0_0_0_9999px_rgba(15,15,15,0.55)]"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
        aria-hidden
      />
    </>
  );
}

export function CoachMarkCenteredBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[70] bg-[rgba(15,15,15,0.55)]"
      aria-hidden
    />
  );
}
