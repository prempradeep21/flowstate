import { CARD_WIDTH, FALLBACK_CARD_HEIGHT } from "@/lib/canvasNodeBounds";
import type { BranchGroup, Card } from "@/lib/store";
import { getFamilyCardIds } from "@/lib/chatThreads";
import type { ChatThreadState } from "@/lib/chatThreads";

export const GROUP_BOUNDS_PADDING = 24;
export const ARTIFACT_GAP = 24;
export const SUMMARY_ICON_GAP = 8;

export interface GroupBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

function cardAabb(card: Card): { x: number; y: number; w: number; h: number } {
  const w = card.size?.w ?? CARD_WIDTH;
  const h = card.size?.h ?? FALLBACK_CARD_HEIGHT;
  return { x: card.position.x, y: card.position.y, w, h };
}

export function getGroupCardIds(
  state: ChatThreadState,
  group: BranchGroup,
): string[] {
  const ids = new Set<string>();
  for (const rootId of group.familyRootThreadIds) {
    for (const id of getFamilyCardIds(state, rootId)) {
      ids.add(id);
    }
  }
  return state.cardOrder.filter((id) => ids.has(id));
}

export function computeGroupBounds(
  state: ChatThreadState,
  group: BranchGroup,
  padding: number = GROUP_BOUNDS_PADDING,
): GroupBounds | null {
  const cardIds = getGroupCardIds(state, group);
  if (cardIds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const id of cardIds) {
    const card = state.cards[id];
    if (!card) continue;
    const { x, y, w, h } = cardAabb(card);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  if (!Number.isFinite(minX)) return null;

  const pad = padding;
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
}

export function cardIntersectsWorldRect(
  card: Card,
  rect: { x1: number; y1: number; x2: number; y2: number },
): boolean {
  const { x, y, w, h } = cardAabb(card);
  const rx1 = Math.min(rect.x1, rect.x2);
  const ry1 = Math.min(rect.y1, rect.y2);
  const rx2 = Math.max(rect.x1, rect.x2);
  const ry2 = Math.max(rect.y1, rect.y2);
  return x < rx2 && x + w > rx1 && y < ry2 && y + h > ry1;
}
