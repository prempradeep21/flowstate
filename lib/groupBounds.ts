import { CARD_WIDTH, FALLBACK_CARD_HEIGHT } from "@/lib/canvasNodeBounds";
import {
  getSelectionBounds,
  type CanvasNodesState,
} from "@/lib/canvasSelection";
import type { BranchGroup, Card } from "@/lib/store";
import { getFamilyCardIds } from "@/lib/chatThreads";
import type { ChatThreadState } from "@/lib/chatThreads";

/**
 * Inner padding of a group frame. Held equal to the transcript bento's
 * TILE_GAP so the air inside the frame reads as the same gutter that runs
 * between the artifacts it contains.
 */
export const GROUP_BOUNDS_PADDING = 48;

/**
 * Chapter heading type size, in WORLD px. Lives here rather than in the
 * renderer because the band below is derived from it — the frame has to
 * reserve the space before anything is placed inside it.
 */
export const GROUP_HEADING_FONT_SIZE = 84;
export const GROUP_HEADING_LINE_HEIGHT = 1.15;
/**
 * Extra top band a group grows by when it carries a heading: one line of
 * heading plus a gap, so the title gets its own air and the first row of
 * cards starts below it instead of on top of it. The frame's own padding
 * still sits above the heading.
 */
export const GROUP_HEADING_BAND =
  Math.round(GROUP_HEADING_FONT_SIZE * GROUP_HEADING_LINE_HEIGHT) + 32;

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
  for (const id of group.cardIds ?? []) {
    ids.add(id);
  }
  return state.cardOrder.filter((id) => ids.has(id));
}

/**
 * Padded AABB around every member — thread families, individually named
 * cards, AND non-card nodes.
 */
export function computeGroupBounds(
  state: CanvasNodesState,
  group: BranchGroup,
  padding: number = GROUP_BOUNDS_PADDING,
): GroupBounds | null {
  const bounds = getSelectionBounds(state, {
    familyRootIds: group.familyRootThreadIds,
    items: group.items ?? [],
  });

  let minX = bounds ? bounds.x : Infinity;
  let minY = bounds ? bounds.y : Infinity;
  let maxX = bounds ? bounds.x + bounds.w : -Infinity;
  let maxY = bounds ? bounds.y + bounds.h : -Infinity;

  for (const id of group.cardIds ?? []) {
    const card = state.cards[id];
    if (!card) continue;
    const { x, y, w, h } = cardAabb(card);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  // A heading is laid out first: the frame grows upward to hold it, so the
  // members keep their positions and never land under the title.
  const headingBand = group.headingText ? GROUP_HEADING_BAND : 0;
  return {
    x: minX - padding,
    y: minY - padding - headingBand,
    w: maxX - minX + padding * 2,
    h: maxY - minY + padding * 2 + headingBand,
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
