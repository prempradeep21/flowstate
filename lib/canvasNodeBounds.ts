import type { SessionArtifact } from "@/lib/sessionArtifacts";
import {
  CANVAS_ARTIFACT_WIDTH,
  CANVAS_TABLE_ARTIFACT_WIDTH,
  type CanvasArtifactNode,
  type Card,
} from "@/lib/store";

export const CARD_WIDTH = 420;
/** Composer-only empty cards are much shorter than answered cards. */
export const EMPTY_CARD_HEIGHT = 88;
export const FALLBACK_CARD_HEIGHT = 240;
export const DEFAULT_ARTIFACT_HEIGHT = 280;
export const TABLE_ARTIFACT_HEIGHT = 480;

export function getCardBounds(card: Card): { w: number; h: number } {
  const w = card.size?.w ?? CARD_WIDTH;
  if (card.size?.h != null) {
    return { w, h: card.size.h };
  }
  if (card.status === "empty") {
    return { w, h: EMPTY_CARD_HEIGHT };
  }
  return { w, h: FALLBACK_CARD_HEIGHT };
}

export function getArtifactBounds(
  node: CanvasArtifactNode,
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

export function emptyCardSize(): { w: number; h: number } {
  return { w: CARD_WIDTH, h: EMPTY_CARD_HEIGHT };
}
