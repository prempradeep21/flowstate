import { CARD_WIDTH, getCardBounds, type CardBoundsInput } from "@/lib/canvasNodeBounds";

/** Live DOM height for a canvas card, when mounted. */
export function readCardDomSize(
  cardId: string,
): { w: number; h: number } | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(
    `[data-canvas-card="${cardId}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const h = el.offsetHeight;
  const w = el.offsetWidth;
  if (h <= 0 || w <= 0) return null;
  return { w, h };
}

/** Prefer measured DOM size so layout/connectors match what is on screen. */
export function getLayoutCardBounds(
  card: CardBoundsInput & { id?: string },
): { w: number; h: number } {
  if (card.id) {
    const dom = readCardDomSize(card.id);
    if (dom) return dom;
  }
  const bounds = getCardBounds(card);
  return { w: bounds.w, h: bounds.h };
}
