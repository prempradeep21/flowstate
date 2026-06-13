import type {
  ArtifactPayload,
  StickyNoteArtifactData,
  StickyNoteColorId,
} from "@/lib/artifactTypes";

/** Source card id for user-initiated sticky note drops (no chat turn). */
export const MANUAL_STICKY_NOTE_SOURCE_CARD_ID = "__manual_stickynote__";

export const STICKY_NOTE_COLOR_IDS: StickyNoteColorId[] = [
  "turbo",
  "violet",
  "haiti",
  "chalk",
];

/** Quantus Palette 2025 — theme-agnostic sticky note fills. */
export const STICKY_NOTE_PALETTE: Record<
  StickyNoteColorId,
  { label: string; bg: string; ink: string }
> = {
  turbo: { label: "Turbo", bg: "#F0E100", ink: "#18102B" },
  violet: { label: "Electric Violet", bg: "#834DFB", ink: "#F5F3FF" },
  haiti: { label: "Haiti", bg: "#18102B", ink: "#F5F3FF" },
  chalk: { label: "Blue Chalk", bg: "#F5F3FF", ink: "#18102B" },
};

/** Maps pre-Quantus color ids to the current palette. */
const LEGACY_STICKY_NOTE_COLOR_IDS: Record<string, StickyNoteColorId> = {
  yellow: "turbo",
  pink: "violet",
  blue: "haiti",
  green: "chalk",
  orange: "turbo",
};

export const STICKY_NOTE_ARTIFACT_WIDTH = 240;
export const STICKY_NOTE_ARTIFACT_HEIGHT = 248;

/** Sticky notes are compact — tighter bounds than generic artifacts. */
export const STICKY_NOTE_MIN_WIDTH = 200;
export const STICKY_NOTE_MAX_WIDTH = 400;
export const STICKY_NOTE_MIN_HEIGHT = 200;
export const STICKY_NOTE_MAX_HEIGHT = 480;

/** Vertical canvas padding (16px × 2) — stickies have no header band. */
export const STICKY_NOTE_CANVAS_PADDING_PX = 32;

/** Default note body height inside the content stage (excludes 48px control strip). */
export const STICKY_NOTE_BODY_MIN_HEIGHT = 120;
export const STICKY_NOTE_BODY_DEFAULT_HEIGHT = 168;

export function clampStickyNoteArtifactSize(
  w: number,
  h: number,
): { w: number; h: number } {
  return {
    w: Math.min(
      STICKY_NOTE_MAX_WIDTH,
      Math.max(STICKY_NOTE_MIN_WIDTH, Math.round(w)),
    ),
    h: Math.min(
      STICKY_NOTE_MAX_HEIGHT,
      Math.max(STICKY_NOTE_MIN_HEIGHT, Math.round(h)),
    ),
  };
}

/** Content-stage floors for canvas fill layout (control strip is 48px). */
export function stickyNoteContentFloors(): {
  minWidth: number;
  minHeight: number;
} {
  return {
    minWidth: STICKY_NOTE_ARTIFACT_WIDTH,
    minHeight: STICKY_NOTE_BODY_MIN_HEIGHT,
  };
}

export function defaultStickyNoteColorId(): StickyNoteColorId {
  return "turbo";
}

export function stickyNoteThemeColors(
  colorId: StickyNoteColorId,
): { bg: string; ink: string } {
  const entry = STICKY_NOTE_PALETTE[colorId] ?? STICKY_NOTE_PALETTE.turbo;
  return { bg: entry.bg, ink: entry.ink };
}

function normalizeColorId(value: unknown): StickyNoteColorId {
  if (typeof value === "string") {
    if (STICKY_NOTE_COLOR_IDS.includes(value as StickyNoteColorId)) {
      return value as StickyNoteColorId;
    }
    const legacy = LEGACY_STICKY_NOTE_COLOR_IDS[value];
    if (legacy) return legacy;
  }
  return defaultStickyNoteColorId();
}

export function normalizeStickyNoteArtifactData(
  data: unknown,
): StickyNoteArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return {
    text: typeof obj.text === "string" ? obj.text : "",
    colorId: normalizeColorId(obj.colorId),
  };
}

export function normalizeStickyNotePayload(
  payload: Extract<ArtifactPayload, { type: "stickynote" }>,
): Extract<ArtifactPayload, { type: "stickynote" }> {
  return {
    ...payload,
    title: payload.title?.trim() || "Sticky note",
    data: normalizeStickyNoteArtifactData(payload.data),
  };
}

export function nextStickyNoteColorId(
  current: StickyNoteColorId,
): StickyNoteColorId {
  const idx = STICKY_NOTE_COLOR_IDS.indexOf(current);
  const next = idx < 0 ? 0 : (idx + 1) % STICKY_NOTE_COLOR_IDS.length;
  return STICKY_NOTE_COLOR_IDS[next] ?? "turbo";
}
