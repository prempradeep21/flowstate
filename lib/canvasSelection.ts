import { getFamilyRootThreadId } from "@/lib/chatThreads";
import { cardIntersectsWorldRect } from "@/lib/groupBounds";
import type { ChatThreadState } from "@/lib/chatThreads";

export interface WorldRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Thread family roots for every card whose bounds intersect the world rect. */
export function collectFamiliesInWorldRect(
  state: ChatThreadState,
  worldRect: WorldRect,
): string[] {
  const roots = new Set<string>();
  for (const id of state.cardOrder) {
    const card = state.cards[id];
    if (!card) continue;
    if (!cardIntersectsWorldRect(card, worldRect)) continue;
    roots.add(getFamilyRootThreadId(state, card.threadId));
  }
  return [...roots];
}
