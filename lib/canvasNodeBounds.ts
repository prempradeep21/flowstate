import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { CALENDAR_ARTIFACT_HEIGHT } from "@/lib/calendarArtifact";
import {
  REPO_ARTIFACT_HEIGHT,
  REPO_ARTIFACT_WIDTH,
} from "@/lib/repoArtifactLayout";
import {
  MAX_TIMELINE_ARTIFACT_WIDTH,
  TIMELINE_ARTIFACT_HEIGHT,
  TIMELINE_ARTIFACT_WIDTH,
} from "@/lib/timelineArtifact";
import { STREET_VIEW_ARTIFACT_HEIGHT } from "@/lib/streetViewArtifact";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import {
  DEFAULT_CANVAS_TUNING,
  resolveTuning,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";

export const CARD_WIDTH = 420;
export const CANVAS_ARTIFACT_WIDTH = 520;
export const CANVAS_TABLE_ARTIFACT_WIDTH = 680;
export { REPO_ARTIFACT_HEIGHT, REPO_ARTIFACT_WIDTH };
export { TIMELINE_ARTIFACT_HEIGHT, TIMELINE_ARTIFACT_WIDTH, MAX_TIMELINE_ARTIFACT_WIDTH };
/** Composer-only empty cards are much shorter than answered cards. */
export const EMPTY_CARD_HEIGHT = 88;
export const FALLBACK_CARD_HEIGHT = 240;
export const DEFAULT_ARTIFACT_HEIGHT = 280;
export const TABLE_ARTIFACT_HEIGHT = 480;
/* Per-kind intended heights — sized so default nodes reveal the full content
   without cropping. Canvas chrome overhead is ~110px (16px padding ×2,
   56px header band, 22px header gap); content components budget the rest. */
/** Chart toolbar (33) + canvas chart height (280) + stage padding (16). */
export const CHART_ARTIFACT_HEIGHT = 440;
/** Progress header plus ~6 task rows before the list scrolls. */
export const TODO_ARTIFACT_HEIGHT = 440;
/** File tabs plus ~12 code lines before the pane scrolls. */
export const CODE_ARTIFACT_HEIGHT = 420;
/** Author-defined widgets get a taller stage than the generic default. */
export const CUSTOM_ARTIFACT_HEIGHT = 380;
/** Image / video grids and website previews. */
export const MEDIA_ARTIFACT_HEIGHT = 400;
export const MAP_ARTIFACT_HEIGHT = 380;
export const MIN_ARTIFACT_WIDTH = 280;
export const MAX_ARTIFACT_WIDTH = 1200;
export const MIN_ARTIFACT_HEIGHT = 160;
export const MAX_ARTIFACT_HEIGHT = 900;

export function clampArtifactSize(
  w: number,
  h: number,
  opts?: { maxW?: number; maxH?: number },
): { w: number; h: number } {
  const maxW = opts?.maxW ?? MAX_ARTIFACT_WIDTH;
  const maxH = opts?.maxH ?? MAX_ARTIFACT_HEIGHT;
  return {
    w: Math.min(maxW, Math.max(MIN_ARTIFACT_WIDTH, w)),
    h: Math.min(maxH, Math.max(MIN_ARTIFACT_HEIGHT, h)),
  };
}

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

/**
 * Intended canvas dimensions per artifact kind — the single source of truth
 * for spawn sizes, bounds fallbacks, and catalog layout. Default containers
 * must reveal the artifact's full content at these sizes (no cropping).
 */
export function getDefaultArtifactSize(
  kind: ArtifactKind,
  payload?: ArtifactPayload,
): { w: number; h: number } {
  switch (kind) {
    case "table":
      return { w: CANVAS_TABLE_ARTIFACT_WIDTH, h: TABLE_ARTIFACT_HEIGHT };
    case "repo":
      return { w: REPO_ARTIFACT_WIDTH, h: REPO_ARTIFACT_HEIGHT };
    case "timeline":
      return { w: TIMELINE_ARTIFACT_WIDTH, h: TIMELINE_ARTIFACT_HEIGHT };
    case "streetview":
      return { w: CANVAS_ARTIFACT_WIDTH, h: STREET_VIEW_ARTIFACT_HEIGHT };
    case "calendar":
      return { w: CANVAS_ARTIFACT_WIDTH, h: CALENDAR_ARTIFACT_HEIGHT };
    case "embed":
      if (payload?.type === "embed") {
        return clampArtifactSize(
          payload.data.embedWidth,
          payload.data.embedHeight,
        );
      }
      return { w: CANVAS_ARTIFACT_WIDTH, h: DEFAULT_ARTIFACT_HEIGHT };
    case "chart":
      return { w: CANVAS_ARTIFACT_WIDTH, h: CHART_ARTIFACT_HEIGHT };
    case "todo":
      return { w: CANVAS_ARTIFACT_WIDTH, h: TODO_ARTIFACT_HEIGHT };
    case "code":
      return { w: CANVAS_ARTIFACT_WIDTH, h: CODE_ARTIFACT_HEIGHT };
    case "custom":
      return { w: CANVAS_ARTIFACT_WIDTH, h: CUSTOM_ARTIFACT_HEIGHT };
    case "images":
    case "website":
    case "google-doc":
      return { w: CANVAS_ARTIFACT_WIDTH, h: MEDIA_ARTIFACT_HEIGHT };
    case "map":
      return { w: CANVAS_ARTIFACT_WIDTH, h: MAP_ARTIFACT_HEIGHT };
    default:
      return { w: CANVAS_ARTIFACT_WIDTH, h: DEFAULT_ARTIFACT_HEIGHT };
  }
}

export function getArtifactBounds(
  node: ArtifactBoundsNode,
  artifact?: SessionArtifact | null,
): { w: number; h: number } {
  const latest = artifact?.versions.find(
    (v) => v.id === artifact.latestVersionId,
  );
  const fallback = artifact
    ? getDefaultArtifactSize(artifact.kind, latest?.payload)
    : { w: CANVAS_ARTIFACT_WIDTH, h: DEFAULT_ARTIFACT_HEIGHT };
  return {
    w: node.size?.w ?? fallback.w,
    h: node.size?.h ?? fallback.h,
  };
}

export function emptyCardSize(
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { w: number; h: number } {
  return { w: tuning.cardWidth, h: tuning.emptyCardHeight };
}
