import { useCanvasStore, type CardSize } from "@/lib/store";

/**
 * Card height measurements, landed as one store write per burst.
 *
 * Every card measures itself on mount and on resize. Written one by one, a
 * canvas of N cards makes N store writes in a row, and each write runs every
 * subscriber's selector (~0.8ms per write at 234 cards, measured on
 * /dev/perf). Loading a board, a font swap or a culling remount hits all
 * cards at once, so that adds up to a long frame.
 *
 * - Mount: sizes queue and flush in a microtask, after the commit's effects.
 * - Resize: measures run together in one shared animation frame, then flush.
 */

const pendingSizes = new Map<string, CardSize>();
const measures = new Set<() => void>();
let rafId = 0;
let inMeasureFrame = false;
let flushQueued = false;

export function queueCardSize(id: string, size: CardSize): void {
  pendingSizes.set(id, size);
  if (inMeasureFrame || flushQueued) return;
  flushQueued = true;
  queueMicrotask(flushCardSizes);
}

export function flushCardSizes(): void {
  flushQueued = false;
  if (pendingSizes.size === 0) return;
  const entries = [...pendingSizes];
  pendingSizes.clear();
  useCanvasStore.getState().setCardSizes(entries);
}

/** Run `measure` in the next shared frame (deduped per function). */
export function scheduleCardMeasure(measure: () => void): void {
  measures.add(measure);
  if (!rafId) rafId = requestAnimationFrame(runMeasures);
}

export function cancelCardMeasure(measure: () => void): void {
  measures.delete(measure);
}

function runMeasures(): void {
  rafId = 0;
  const batch = [...measures];
  measures.clear();
  inMeasureFrame = true;
  try {
    for (const measure of batch) measure();
  } finally {
    inMeasureFrame = false;
  }
  flushCardSizes();
}
