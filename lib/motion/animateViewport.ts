import { useCanvasStore } from "@/lib/store";
import { durations } from "./tokens";

type ViewportState = { x: number; y: number; scale: number };

let focusTimer: ReturnType<typeof setTimeout> | null = null;

export function cancelViewportTween(): void {
  if (focusTimer) {
    clearTimeout(focusTimer);
    focusTimer = null;
  }
  const el = document.querySelector<HTMLDivElement>("[data-canvas-viewport]");
  el?.classList.remove("viewport-focusing");
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
  useCanvasStore.getState().setViewport(target);

  focusTimer = setTimeout(() => {
    el.classList.remove("viewport-focusing");
    focusTimer = null;
  }, durations.slow);
}
