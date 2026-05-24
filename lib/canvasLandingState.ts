import type { Card } from "@/lib/store";

/** Empty home card to attach the landing composer (first empty root, else first empty). */
export function getLandingCardId(
  cards: Record<string, Card>,
  cardOrder: string[],
): string | null {
  const emptyIds = cardOrder.filter((id) => cards[id]?.status === "empty");
  if (emptyIds.length === 0) return null;

  const emptyRoot = emptyIds.find((id) => cards[id]?.parentCardId === null);
  if (emptyRoot) return emptyRoot;

  if (emptyIds.length === 1) return emptyIds[0] ?? null;

  return null;
}

/** True when the canvas is still at the pre-conversation home state. */
export function shouldShowCanvasLanding(
  cards: Record<string, Card>,
  cardOrder: string[],
): boolean {
  if (cardOrder.length === 0) return true;
  return cardOrder.every((id) => cards[id]?.status === "empty");
}
