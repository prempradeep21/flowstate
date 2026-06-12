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
import {
  AUDIO_ARTIFACT_BODY_MIN_HEIGHT,
  AUDIO_ARTIFACT_HEIGHT,
  audioArtifactContentFloors,
  getDefaultAudioArtifactSize,
  MAX_AUDIO_ARTIFACT_WIDTH,
} from "@/lib/audioArtifact";
import { streetViewArtifactHeightForWidth, STREET_VIEW_NODE_CHROME_PX } from "@/lib/streetViewArtifact";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import { ARTIFACT_CANVAS_CHROME_HEIGHT_PX } from "@/lib/artifactCanvasChrome";
import { ARTIFACT_CONTROLS_BAR_HEIGHT_PX } from "@/lib/artifactFontScale";
import {
  DEFAULT_CANVAS_TUNING,
  resolveTuning,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";

export const CARD_WIDTH = 420;
export const CANVAS_ARTIFACT_WIDTH = 520;
export const CANVAS_TABLE_ARTIFACT_WIDTH = 680;
/** Horizontal padding on canvas artifact casing (16px × 2). */
export const CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX = 32;
export { REPO_ARTIFACT_HEIGHT, REPO_ARTIFACT_WIDTH };
export { TIMELINE_ARTIFACT_HEIGHT, TIMELINE_ARTIFACT_WIDTH, MAX_TIMELINE_ARTIFACT_WIDTH };
export {
  AUDIO_ARTIFACT_BODY_MIN_HEIGHT,
  AUDIO_ARTIFACT_HEIGHT,
  MAX_AUDIO_ARTIFACT_WIDTH,
};

export interface ArtifactContentFloors {
  minWidth: number;
  minHeight: number;
}

/**
 * Minimum content width/height for canvas fill-mode artifacts.
 * Apply inline on the artifact body so flex `min-h-0` stages do not collapse.
 * New fill-mode artifact kinds should register floors here (see table/timeline/audio).
 */
export function getArtifactContentFloors(
  kind: ArtifactKind,
  payload?: ArtifactPayload,
): ArtifactContentFloors | null {
  switch (kind) {
    case "table":
      return {
        minWidth: TABLE_ARTIFACT_STAGE_WIDTH,
        minHeight: TABLE_ARTIFACT_BODY_MIN_HEIGHT,
      };
    case "timeline":
      return {
        minWidth: TIMELINE_ARTIFACT_STAGE_WIDTH,
        minHeight: TIMELINE_ARTIFACT_BODY_MIN_HEIGHT,
      };
    case "audio":
      if (payload?.type === "audio") {
        return audioArtifactContentFloors(payload.data.durationMs);
      }
      return audioArtifactContentFloors(0);
    default:
      return null;
  }
}
/** Composer-only empty cards are much shorter than answered cards. */
export const EMPTY_CARD_HEIGHT = 88;
export const FALLBACK_CARD_HEIGHT = 240;
export const DEFAULT_ARTIFACT_HEIGHT = 280;
export const TABLE_ARTIFACT_HEIGHT = 512;
/** Content stage height (control strip + table body) inside a default table node. */
export const TABLE_ARTIFACT_STAGE_HEIGHT =
  TABLE_ARTIFACT_HEIGHT - ARTIFACT_CANVAS_CHROME_HEIGHT_PX;
/** Minimum table body height within the content stage (excludes the 48px control strip). */
export const TABLE_ARTIFACT_BODY_MIN_HEIGHT =
  TABLE_ARTIFACT_STAGE_HEIGHT - ARTIFACT_CONTROLS_BAR_HEIGHT_PX;
/** Content stage width inside a default table canvas node. */
export const TABLE_ARTIFACT_STAGE_WIDTH =
  CANVAS_TABLE_ARTIFACT_WIDTH - CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX;
/** Content stage width inside a default timeline canvas node. */
export const TIMELINE_ARTIFACT_STAGE_WIDTH =
  TIMELINE_ARTIFACT_WIDTH - CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX;
/** Content stage height (control strip + timeline body) inside a default timeline node. */
export const TIMELINE_ARTIFACT_STAGE_HEIGHT =
  TIMELINE_ARTIFACT_HEIGHT - ARTIFACT_CANVAS_CHROME_HEIGHT_PX;
/** Minimum timeline body height within the content stage (excludes the 48px control strip). */
export const TIMELINE_ARTIFACT_BODY_MIN_HEIGHT =
  TIMELINE_ARTIFACT_STAGE_HEIGHT - ARTIFACT_CONTROLS_BAR_HEIGHT_PX;
/* Per-kind intended heights — sized so default nodes reveal the full content
   without cropping. Canvas chrome overhead is ~110px (16px padding ×2,
   56px header band, 22px header gap); content components budget the rest,
   including the 48px artifact control strip. */
/** Chart toolbar + canvas chart height + stage padding (control strip is 48px). */
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
/** Default street-view height for a {@link CANVAS_ARTIFACT_WIDTH} node (square circle body). */
export const STREET_VIEW_ARTIFACT_HEIGHT =
  streetViewArtifactHeightForWidth(CANVAS_ARTIFACT_WIDTH);
export const MIN_ARTIFACT_WIDTH = 280;
export const MAX_ARTIFACT_WIDTH = 1200;
export const MIN_ARTIFACT_HEIGHT = 160;
export const MAX_ARTIFACT_HEIGHT = 1170;

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

/** Street View nodes keep a square content area so the circle fills the frame. */
export function clampStreetViewArtifactSize(w: number): { w: number; h: number } {
  const maxW = Math.min(
    MAX_ARTIFACT_WIDTH,
    MAX_ARTIFACT_HEIGHT - STREET_VIEW_NODE_CHROME_PX,
  );
  const clampedW = Math.min(maxW, Math.max(MIN_ARTIFACT_WIDTH, w));
  const h = Math.min(
    MAX_ARTIFACT_HEIGHT,
    streetViewArtifactHeightForWidth(clampedW),
  );
  return { w: clampedW, h };
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
      return {
        w: CANVAS_ARTIFACT_WIDTH,
        h: STREET_VIEW_ARTIFACT_HEIGHT,
      };
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
    case "audio":
      if (payload?.type === "audio") {
        return getDefaultAudioArtifactSize(payload);
      }
      return { w: MIN_ARTIFACT_WIDTH, h: AUDIO_ARTIFACT_HEIGHT };
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
