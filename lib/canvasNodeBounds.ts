import type { SessionArtifact } from "@/lib/sessionArtifacts";
import {
  DEFAULT_CANVAS_TUNING,
  resolveTuning,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";

export const CARD_WIDTH = 420;
export const CANVAS_ARTIFACT_WIDTH = 520;
export const CANVAS_TABLE_ARTIFACT_WIDTH = 680;
/** Composer-only empty cards are much shorter than answered cards. */
export const EMPTY_CARD_HEIGHT = 88;
export const FALLBACK_CARD_HEIGHT = 240;
export const DEFAULT_ARTIFACT_HEIGHT = 280;
export const TABLE_ARTIFACT_HEIGHT = 480;

const DEFAULT_TUNING = resolveTuning(DEFAULT_CANVAS_TUNING);

/** Minimal card fields used for layout bounds (avoids importing the store). */
export interface CardBoundsInput {
  size?: { w: number; h: number };
  status?: string;
}

/** Minimal artifact node fields for bounds (avoids importing the store). */
export interface ArtifactBoundsNode {
  size?: { w: number; h: number };
}

export function getCardWidth(tuning: ResolvedCanvasTuning = DEFAULT_TUNING): number {
  return tuning.cardWidth;
}

export function getEmptyCardHeight(
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): number {
  return tuning.emptyCardHeight;
}

export function getCardBounds(
  card: CardBoundsInput,
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { w: number; h: number } {
  const w = card.size?.w ?? tuning.cardWidth;
  if (card.size?.h != null) {
    return { w, h: card.size.h };
  }
  if (card.status === "empty") {
    return { w, h: tuning.emptyCardHeight };
  }
  return { w, h: tuning.fallbackCardHeight };
}

export function getArtifactBounds(
  node: ArtifactBoundsNode,
  artifact?: SessionArtifact | null,
): { w: number; h: number } {
  const isTable = artifact?.kind === "table";
  const defaultW = isTable ? CANVAS_TABLE_ARTIFACT_WIDTH : CANVAS_ARTIFACT_WIDTH;
  const defaultH = isTable ? TABLE_ARTIFACT_HEIGHT : DEFAULT_ARTIFACT_HEIGHT;
  return {
    w: node.size?.w ?? defaultW,
    h: node.size?.h ?? defaultH,
  };
}

export function emptyCardSize(
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { w: number; h: number } {
  return { w: tuning.cardWidth, h: tuning.emptyCardHeight };
}
