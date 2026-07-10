import { useCanvasStore } from "@/lib/store";
import { durations } from "./tokens";

type ViewportState = { x: number; y: number; scale: number };

let focusTimer: ReturnType<typeof setTimeout> | null = null;
/**
 * Element the active tween added the class to — cached so cancel (which runs
 * on EVERY wheel/pinch input event) never does a per-event DOM query.
 */
let tweenEl: HTMLDivElement | null = null;

export function cancelViewportTween(): void {
  if (focusTimer) {
    clearTimeout(focusTimer);
    focusTimer = null;
  }
  if (!tweenEl) return; // no tween active — nothing to clean up
  tweenEl.classList.remove("viewport-focusing");
  tweenEl = null;
}

export function setViewportInstant(next: Partial<ViewportState>): void {
  cancelViewportTween();
  useCanvasStore.getState().setViewport(next);
}

export function animateViewportTo(
  target: { x: number; y: number },
  opts?: { reducedMotion?: boolean },
): void {
  const reduced = opts?.reducedMotion ?? false;
  const el = document.querySelector<HTMLDivElement>("[data-canvas-viewport]");

  cancelViewportTween();

  if (!el || reduced) {
    useCanvasStore.getState().setViewport(target);
    return;
  }

  el.classList.add("viewport-focusing");
  tweenEl = el;
  useCanvasStore.getState().setViewport(target);

  focusTimer = setTimeout(() => {
    el.classList.remove("viewport-focusing");
    tweenEl = null;
    focusTimer = null;
  }, durations.slow);
}
