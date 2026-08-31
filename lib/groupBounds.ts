import { CARD_WIDTH, FALLBACK_CARD_HEIGHT } from "@/lib/canvasNodeBounds";
import {
  getSelectionBounds,
  type CanvasNodesState,
} from "@/lib/canvasSelection";
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

/** Padded AABB around every member — thread families AND non-card nodes. */
export function computeGroupBounds(
  state: CanvasNodesState,
  group: BranchGroup,
  padding: number = GROUP_BOUNDS_PADDING,
): GroupBounds | null {
  const bounds = getSelectionBounds(state, {
    familyRootIds: group.familyRootThreadIds,
    items: group.items ?? [],
  });
  if (!bounds) return null;
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    w: bounds.w + padding * 2,
    h: bounds.h + padding * 2,
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
