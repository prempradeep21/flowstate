import {
  getCardBounds,
  type CardBoundsInput,
} from "@/lib/canvasNodeBounds";
import {
  DEFAULT_CANVAS_TUNING,
  resolveTuning,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";
import { isCardPending, pendingLayoutMinHeight } from "@/lib/cardLayoutPolicy";

const DEFAULT_TUNING = resolveTuning(DEFAULT_CANVAS_TUNING);

/** Live DOM height for a canvas card, when mounted. */
export function readCardDomHeight(cardId: string): number | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(
    `[data-canvas-card="${cardId}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const h = el.offsetHeight;
  return h > 0 ? h : null;
}

/** Measure from ResizeObserver — width is always the tuned CSS width, not offsetWidth. */
export function measureCardSize(
  el: HTMLElement,
  cardWidth: number,
): { w: number; h: number } {
  return { w: cardWidth, h: el.offsetHeight };
}

/**
 * Single source of truth for card bounds (layout + connectors).
 * Prefers live DOM when mounted so positions and lines stay aligned.
 */
export function getCanvasCardBounds(
  card: CardBoundsInput & { id?: string; status?: string },
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { w: number; h: number } {
  const w = tuning.cardWidth;
  const storedH = card.size?.h;
  const domH = card.id ? readCardDomHeight(card.id) : null;

  if (isCardPending(card.status as import("@/lib/store").CardStatus)) {
    const minH = pendingLayoutMinHeight(storedH, tuning.fallbackCardHeight);
    const h = Math.max(minH, domH ?? 0);
    return { w, h };
  }

  if (card.id) {
    if (domH != null) return { w, h: domH };
  }
  if (card.size?.h != null && card.size.h > 0) {
    return { w, h: card.size.h };
  }
  const bounds = getCardBounds(card, tuning);
  return { w, h: bounds.h };
}

/** @deprecated Alias — use getCanvasCardBounds */
export function getLayoutCardBounds(
  card: CardBoundsInput & { id?: string },
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { w: number; h: number } {
  return getCanvasCardBounds(card, tuning);
}

/** @deprecated Alias — use getCanvasCardBounds */
export function getConnectionCardBounds(
  card: CardBoundsInput & { id?: string; status?: string },
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { w: number; h: number } {
  return getCanvasCardBounds(card, tuning);
}

/** World Y of the vertical center of the question block, or null if not mounted. */
export function readCardQuestionCenterY(
  cardId: string,
  cardTopY: number,
): number | null {
  if (typeof document === "undefined") return null;
  const card = document.querySelector(
    `[data-canvas-card="${CSS.escape(cardId)}"]`,
  );
  if (!card) return null;
  const question = card.querySelector("[data-card-question]");
  if (!(question instanceof HTMLElement)) return null;
  return cardTopY + question.offsetTop + question.offsetHeight / 2;
}

/** Fallback when question DOM is unavailable (SSR / tests). */
export function estimateCardQuestionCenterY(
  cardTopY: number,
  cardH: number,
): number {
  const bandH = Math.min(cardH, 120);
  return cardTopY + bandH / 2;
}

/** Branch child receive plug Y — question block center. */
export function branchTargetAnchorY(
  cardId: string,
  cardTopY: number,
  cardH: number,
): number {
  return (
    readCardQuestionCenterY(cardId, cardTopY) ??
    estimateCardQuestionCenterY(cardTopY, cardH)
  );
}

/** Dev diagnostic: cards whose stored height diverges from live DOM. */
export function findCardSizeMismatches<
  T extends CardBoundsInput & { id: string; size?: { w: number; h: number } },
>(
  cards: Record<string, T>,
  tolerancePx = 2,
): { id: string; stored: number; dom: number }[] {
  if (typeof document === "undefined") return [];
  const out: { id: string; stored: number; dom: number }[] = [];
  for (const id of Object.keys(cards)) {
    const card = cards[id];
    if (!card?.size?.h) continue;
    const domH = readCardDomHeight(id);
    if (domH == null) continue;
    if (Math.abs(card.size.h - domH) > tolerancePx) {
      out.push({ id, stored: card.size.h, dom: domH });
    }
  }
  return out;
}

/** Height for layout — excludes the entire follow-up footer (wrapper + composer). */
export function readCardLayoutHeight(cardId: string): number | null {
  const domH = readCardDomHeight(cardId);
  if (domH == null || typeof document === "undefined") return domH;
  const card = document.querySelector(
    `[data-canvas-card="${CSS.escape(cardId)}"]`,
  );
  if (!card) return domH;
  const footer = card.querySelector("[data-follow-up-footer]");
  if (footer instanceof HTMLElement) {
    return Math.max(0, domH - footer.offsetHeight);
  }
  return domH;
}

export function syncAllCardDomSizes<
  T extends CardBoundsInput & { id: string; size?: { w: number; h: number } },
>(
  cards: Record<string, T>,
  cardWidth: number,
): Record<string, T> {
  if (typeof document === "undefined") return cards;
  let changed = false;
  const next = { ...cards };
  for (const id of Object.keys(next)) {
    const card = next[id];
    if (!card) continue;
    const domH = readCardDomHeight(id);
    if (domH == null) continue;
    const dom = { w: cardWidth, h: domH };
    const prev = card.size;
    if (prev && prev.w === dom.w && prev.h === dom.h) continue;
    changed = true;
    next[id] = { ...card, size: dom };
  }
  return changed ? next : cards;
}
