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
import { streetViewArtifactHeightForWidth } from "@/lib/streetViewArtifact";
import {
  CLAIM_ARTIFACT_HEIGHT,
  CLAIM_ARTIFACT_WIDTH,
  DEFINITION_ARTIFACT_HEIGHT,
  DEFINITION_ARTIFACT_WIDTH,
  EPISODE_ARTIFACT_HEIGHT,
  EPISODE_ARTIFACT_WIDTH,
  LINK_GROUP_ARTIFACT_HEIGHT,
  LINK_GROUP_ARTIFACT_WIDTH,
  MECHANISM_ARTIFACT_HEIGHT,
  MECHANISM_ARTIFACT_WIDTH,
  QUOTE_ARTIFACT_HEIGHT,
  QUOTE_ARTIFACT_WIDTH,
  STAT_ARTIFACT_HEIGHT,
  STAT_ARTIFACT_WIDTH,
} from "@/lib/transcriptArtifacts";
import {
  STICKY_NOTE_ARTIFACT_HEIGHT,
  STICKY_NOTE_ARTIFACT_WIDTH,
  STICKY_NOTE_MAX_HEIGHT,
  STICKY_NOTE_MAX_WIDTH,
  clampStickyNoteArtifactSize,
  stickyNoteContentFloors,
} from "@/lib/stickyNoteArtifact";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import { ARTIFACT_CANVAS_CHROME_HEIGHT_PX, artifactKindUsesCanvasPaddingChrome } from "@/lib/artifactCanvasChrome";
import {
  DEFAULT_CANVAS_TUNING,
  resolveTuning,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";

export const CARD_WIDTH = 420;
export const CANVAS_ARTIFACT_WIDTH = 520;
export const CANVAS_TABLE_ARTIFACT_WIDTH = 680;
/** Horizontal padding on canvas artifact casing — content is edge-flush (0). */
export const CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX = 0;
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
    case "stickynote":
      return stickyNoteContentFloors();
    default:
      return null;
  }
}

/**
 * Pixel size for sidebar preview content — matches the artifact body on canvas
 * (stage width/height inside chrome and controls), not the clipped tile frame.
 */
export function getSidebarPreviewContentSize(
  kind: ArtifactKind,
  payload?: ArtifactPayload,
): { w: number; h: number } {
  const floors = getArtifactContentFloors(kind, payload);
  if (floors) {
    return { w: floors.minWidth, h: floors.minHeight };
  }

  const node = getDefaultArtifactSize(kind, payload);
  const horizontalPad = artifactKindUsesCanvasPaddingChrome(kind)
    ? CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX
    : 0;

  return {
    w: node.w - horizontalPad,
    h: node.h - ARTIFACT_CANVAS_CHROME_HEIGHT_PX,
  };
}

/** Composer-only empty cards are much shorter than answered cards. */
export const EMPTY_CARD_HEIGHT = 88;
export const FALLBACK_CARD_HEIGHT = 240;
export const DEFAULT_ARTIFACT_HEIGHT = 280;
export const TABLE_ARTIFACT_HEIGHT = 512;
/** Content stage height (control strip + table body) inside a default table node. */
export const TABLE_ARTIFACT_STAGE_HEIGHT =
  TABLE_ARTIFACT_HEIGHT - ARTIFACT_CANVAS_CHROME_HEIGHT_PX;
/** Minimum table body height within the content stage. */
export const TABLE_ARTIFACT_BODY_MIN_HEIGHT = TABLE_ARTIFACT_STAGE_HEIGHT;
/** Content stage width inside a default table canvas node. */
export const TABLE_ARTIFACT_STAGE_WIDTH =
  CANVAS_TABLE_ARTIFACT_WIDTH - CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX;
/** Content stage width inside a default timeline canvas node. */
export const TIMELINE_ARTIFACT_STAGE_WIDTH =
  TIMELINE_ARTIFACT_WIDTH - CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX;
/** Content stage height (control strip + timeline body) inside a default timeline node. */
export const TIMELINE_ARTIFACT_STAGE_HEIGHT =
  TIMELINE_ARTIFACT_HEIGHT - ARTIFACT_CANVAS_CHROME_HEIGHT_PX;
/** Minimum timeline body height within the content stage. */
export const TIMELINE_ARTIFACT_BODY_MIN_HEIGHT = TIMELINE_ARTIFACT_STAGE_HEIGHT;
/* Per-kind intended heights — sized so default nodes reveal the full content
   without cropping. Canvas chrome overhead is 72px (header row + 14px vertical padding). */
/** Canvas chart height + stage padding. */
export const CHART_ARTIFACT_HEIGHT = 392;
/** Progress header plus ~6 task rows before the list scrolls. */
export const TODO_ARTIFACT_HEIGHT = 440;
/** File tabs plus ~12 code lines before the pane scrolls. */
export const CODE_ARTIFACT_HEIGHT = 420;
/** Author-defined widgets get a taller stage than the generic default. */
export const CUSTOM_ARTIFACT_HEIGHT = 380;
/** Image / video grids, website previews, and 3D model viewers. */
export const MEDIA_ARTIFACT_HEIGHT = 400;
export const THREE_D_ARTIFACT_HEIGHT = 400;
export const MAP_ARTIFACT_HEIGHT = 380;
/** Default street-view height for a {@link CANVAS_ARTIFACT_WIDTH} node (wide rectangle body). */
export const STREET_VIEW_ARTIFACT_HEIGHT =
  streetViewArtifactHeightForWidth(CANVAS_ARTIFACT_WIDTH);
export const MIN_ARTIFACT_WIDTH = 280;
export const MAX_ARTIFACT_WIDTH = 1200;
export const MIN_ARTIFACT_HEIGHT = 160;
export const MAX_ARTIFACT_HEIGHT = 1170;
/**
 * The episode/link masthead pair spawns larger than the generic ceiling, so it
 * gets its own — otherwise the auto-measure and corner-resize clamps would drag
 * it back down to 1200×1170 the moment it rendered.
 */
export const MAX_MASTHEAD_ARTIFACT_WIDTH = EPISODE_ARTIFACT_WIDTH;
export const MAX_MASTHEAD_ARTIFACT_HEIGHT = EPISODE_ARTIFACT_HEIGHT;

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

/** Table artifacts have no maximum width/height — users widen freely on canvas. */
export function clampTableArtifactSize(
  w: number,
  h: number,
): { w: number; h: number } {
  // Bounded like every other artifact so corner-resize can't produce an
  // unusable node; content that exceeds the node scrolls inside it.
  return {
    w: Math.min(MAX_ARTIFACT_WIDTH, Math.max(MIN_ARTIFACT_WIDTH, w)),
    h: Math.min(MAX_ARTIFACT_HEIGHT, Math.max(MIN_ARTIFACT_HEIGHT, h)),
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
      // A wide rectangle by default; users then resize freely like any artifact.
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
    case "3d":
      return { w: CANVAS_ARTIFACT_WIDTH, h: THREE_D_ARTIFACT_HEIGHT };
    case "map":
      return { w: CANVAS_ARTIFACT_WIDTH, h: MAP_ARTIFACT_HEIGHT };
    case "audio":
      if (payload?.type === "audio") {
        return getDefaultAudioArtifactSize(payload);
      }
      return { w: MIN_ARTIFACT_WIDTH, h: AUDIO_ARTIFACT_HEIGHT };
    case "episode":
      return { w: EPISODE_ARTIFACT_WIDTH, h: EPISODE_ARTIFACT_HEIGHT };
    case "linkgroup":
      return { w: LINK_GROUP_ARTIFACT_WIDTH, h: LINK_GROUP_ARTIFACT_HEIGHT };
    case "quote":
      return { w: QUOTE_ARTIFACT_WIDTH, h: QUOTE_ARTIFACT_HEIGHT };
    case "stat":
      return { w: STAT_ARTIFACT_WIDTH, h: STAT_ARTIFACT_HEIGHT };
    case "definition":
      return { w: DEFINITION_ARTIFACT_WIDTH, h: DEFINITION_ARTIFACT_HEIGHT };
    case "claim":
      return { w: CLAIM_ARTIFACT_WIDTH, h: CLAIM_ARTIFACT_HEIGHT };
    case "mechanism": {
      // One row of steps: width grows with the step count (each step needs
      // ~170px to hold a label without shredding it), clamped to the canvas
      // maximum; the row itself is short.
      const steps =
        payload?.type === "mechanism" ? payload.data.steps.length : 0;
      const rowWidth = steps > 0 ? steps * 170 + (steps - 1) * 36 + 48 : 0;
      return {
        w: Math.min(MAX_ARTIFACT_WIDTH, Math.max(MECHANISM_ARTIFACT_WIDTH, rowWidth)),
        h: MECHANISM_ARTIFACT_HEIGHT,
      };
    }
    case "stickynote":
      return clampStickyNoteArtifactSize(
        STICKY_NOTE_ARTIFACT_WIDTH,
        STICKY_NOTE_ARTIFACT_HEIGHT,
      );
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

/*
 * Layout-space sizing helpers.
 *
 * getArtifactContentFloors above returns STAGE-space minimums (the drawable area
 * inside the chrome). A layout engine places NODES, so it needs those floors
 * converted to node space, and it needs to know how far a kind may be stretched.
 * Kept here beside the other bounds helpers so there is one source of truth for
 * what a given artifact kind can survive being resized to.
 */

/**
 * Smallest node box that shows a kind's content without clipping. The artifact
 * stage is `overflow-hidden`, not scrollable, so undersizing truncates content
 * rather than making it reachable — these are correctness floors, not taste.
 *
 * Never returns less than the kind's default size on width: a narrower node
 * re-wraps text unpredictably at canvas zoom.
 */
export function getArtifactLayoutFloors(
  kind: ArtifactKind,
  payload?: ArtifactPayload,
): { w: number; h: number } {
  const natural = getDefaultArtifactSize(kind, payload);
  const floors = getArtifactContentFloors(kind, payload);
  if (!floors) {
    return { w: natural.w, h: MIN_ARTIFACT_HEIGHT };
  }
  // ARTIFACT_CANVAS_CHROME_HEIGHT_PX is already the whole vertical overhead
  // (44px header + 14px padding twice) — the same conversion the per-kind stage
  // heights use, e.g. TABLE_ARTIFACT_STAGE_HEIGHT.
  return {
    w: Math.max(floors.minWidth + CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX, natural.w),
    h: floors.minHeight + ARTIFACT_CANVAS_CHROME_HEIGHT_PX,
  };
}

/**
 * Per-kind overrides for {@link clampArtifactSize} — the one place the free
 * resize path and the auto-measure path read their ceilings from, so the two
 * cannot drift apart.
 */
export function getArtifactClampOpts(
  kind: ArtifactKind | undefined,
): { maxW?: number; maxH?: number } | undefined {
  switch (kind) {
    case "timeline":
      return { maxW: MAX_TIMELINE_ARTIFACT_WIDTH };
    case "audio":
      return { maxW: MAX_AUDIO_ARTIFACT_WIDTH };
    case "episode":
    case "linkgroup":
      return {
        maxW: MAX_MASTHEAD_ARTIFACT_WIDTH,
        maxH: MAX_MASTHEAD_ARTIFACT_HEIGHT,
      };
    default:
      return undefined;
  }
}

/** Largest node box a kind may be stretched to, mirroring the runtime clamps. */
export function getArtifactMaxSize(kind: ArtifactKind): { w: number; h: number } {
  if (kind === "stickynote") {
    return { w: STICKY_NOTE_MAX_WIDTH, h: STICKY_NOTE_MAX_HEIGHT };
  }
  const opts = getArtifactClampOpts(kind);
  return {
    w: opts?.maxW ?? MAX_ARTIFACT_WIDTH,
    h: opts?.maxH ?? MAX_ARTIFACT_HEIGHT,
  };
}
