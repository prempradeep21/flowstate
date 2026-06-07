import type { CardStatus } from "@/lib/store";

export function isCardPending(
  status: CardStatus | undefined,
): boolean {
  return status === "thinking" || status === "streaming";
}

/** Minimum layout height while a response is in flight. */
export function pendingLayoutMinHeight(
  storedH: number | undefined,
  fallbackCardHeight: number,
): number {
  return Math.max(storedH ?? 0, fallbackCardHeight);
}
