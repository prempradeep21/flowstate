import { isQaTurnInProgress } from "@/lib/qaStreamDisplay";
import type { CanvasArtifactNode, Card, CardStatus } from "@/lib/store";

export function isCardPending(
  status: CardStatus | undefined,
): boolean {
  return status === "thinking" || status === "streaming";
}

/** Layout lock while a Q&A turn is still generating or materializing. */
export function isCardLayoutPending(
  card: Pick<
    Card,
    | "id"
    | "status"
    | "artifactPayload"
    | "outputArtifactId"
    | "pendingEmittedArtifacts"
    | "images"
    | "responseType"
  >,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  return isQaTurnInProgress(card, canvasArtifactNodes);
}

/** Minimum layout height while a response is in flight. */
export function pendingLayoutMinHeight(
  storedH: number | undefined,
  fallbackCardHeight: number,
): number {
  return Math.max(storedH ?? 0, fallbackCardHeight);
}
