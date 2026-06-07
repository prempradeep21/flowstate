import {
  getLandingCardId,
  shouldShowCanvasLanding,
} from "@/lib/canvasLandingState";
import type { ResolvedCanvasTuning } from "@/lib/canvasTuning";
import type { Card } from "@/lib/store";

export interface GlobalOrigin {
  cardId: string;
  x: number;
  y: number;
}

/** World-space anchor for the seed landing card (top-left). */
export const CANVAS_ORIGIN = { x: 0, y: 0 } as const;

/** Viewport focal point: center of the seed card at the global origin. */
export function seedCardViewportCenter(tuning: ResolvedCanvasTuning): {
  x: number;
  y: number;
} {
  return {
    x: CANVAS_ORIGIN.x + tuning.cardWidth / 2,
    y: CANVAS_ORIGIN.y + tuning.emptyCardHeight / 2,
  };
}

/** Approximate world focal point for centering the landing stack (matches product UI). */
export function landingStackViewportCenter(
  _tuning: ResolvedCanvasTuning,
): { x: number; y: number } {
  return { x: 0, y: 0 };
}

export function isOriginCardPinned(
  cards: Record<string, Card>,
  cardOrder: string[],
  cardId: string,
  globalOrigin: GlobalOrigin | null,
): boolean {
  if (!globalOrigin || globalOrigin.cardId !== cardId) return false;
  return shouldShowCanvasLanding(cards, cardOrder);
}

export function getOriginCoords(
  globalOrigin: GlobalOrigin | null,
): { x: number; y: number } {
  if (globalOrigin) {
    return { x: globalOrigin.x, y: globalOrigin.y };
  }
  return { ...CANVAS_ORIGIN };
}

export function landingCardIdOrNull(
  cards: Record<string, Card>,
  cardOrder: string[],
): string | null {
  return getLandingCardId(cards, cardOrder);
}
