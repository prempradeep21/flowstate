import type {
  ArtifactPayload,
  StickyNoteArtifactData,
  StickyNoteColorId,
} from "@/lib/artifactTypes";

/** Source card id for user-initiated sticky note drops (no chat turn). */
export const MANUAL_STICKY_NOTE_SOURCE_CARD_ID = "__manual_stickynote__";

export const STICKY_NOTE_COLOR_IDS: StickyNoteColorId[] = [
  "yellow",
  "pink",
  "blue",
  "green",
  "orange",
];

/** Pantone-inspired flat fills — separate light/dark pairs for theme contrast. */
export const STICKY_NOTE_PALETTE: Record<
  StickyNoteColorId,
  {
    pantone: string;
    light: { bg: string; ink: string };
    dark: { bg: string; ink: string };
  }
> = {
  yellow: {
    pantone: "108 C",
    light: { bg: "#FEDD00", ink: "#2C2A26" },
    dark: { bg: "#6B6028", ink: "#FFF8DC" },
  },
  pink: {
    pantone: "176 C",
    light: { bg: "#FFAABB", ink: "#2C2A26" },
    dark: { bg: "#6B3D4A", ink: "#FFE4EA" },
  },
  blue: {
    pantone: "290 C",
    light: { bg: "#89CFF0", ink: "#1E3A5F" },
    dark: { bg: "#2E4A66", ink: "#D6EBFF" },
  },
  green: {
    pantone: "375 C",
    light: { bg: "#C5E86C", ink: "#2C3A1E" },
    dark: { bg: "#3D5228", ink: "#E8F5C8" },
  },
  orange: {
    pantone: "137 C",
    light: { bg: "#FFA300", ink: "#3A2800" },
    dark: { bg: "#6B4A1E", ink: "#FFE8C8" },
  },
};

export const STICKY_NOTE_ARTIFACT_WIDTH = 240;
export const STICKY_NOTE_ARTIFACT_HEIGHT = 280;

export function defaultStickyNoteColorId(): StickyNoteColorId {
  return "yellow";
}

export function stickyNoteThemeColors(
  colorId: StickyNoteColorId,
  isDark: boolean,
): { bg: string; ink: string } {
  const entry = STICKY_NOTE_PALETTE[colorId] ?? STICKY_NOTE_PALETTE.yellow;
  return isDark ? entry.dark : entry.light;
}

function normalizeColorId(value: unknown): StickyNoteColorId {
  if (
    typeof value === "string" &&
    STICKY_NOTE_COLOR_IDS.includes(value as StickyNoteColorId)
  ) {
    return value as StickyNoteColorId;
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
  return STICKY_NOTE_COLOR_IDS[next] ?? "yellow";
}
