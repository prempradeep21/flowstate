"use client";

import { useCanvasStore } from "@/lib/store";

/**
 * Above every node's resting class z (cards: auto, nodes: z-20, selected
 * artifacts/labels: z-30), so a raised node always wins over an unraised one.
 */
const RAISED_Z_BASE = 31;

/**
 * Inline z-index for a card or canvas node the user last clicked/selected, or
 * undefined to keep its default stacking. The most recently raised is on top.
 */
export function useRaisedZIndex(id: string): number | undefined {
  return useCanvasStore((s) => {
    const index = s.raisedNodeIds.indexOf(id);
    return index === -1 ? undefined : RAISED_Z_BASE + index;
  });
}
