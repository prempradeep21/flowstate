export const ARTIFACT_FONT_SCALE_MIN = 0.75;
export const ARTIFACT_FONT_SCALE_MAX = 1.5;
export const ARTIFACT_FONT_SCALE_STEP = 0.1;
export const ARTIFACT_FONT_SCALE_DEFAULT = 1;

/** Top control strip height (font scale + kind controls) — tripled from 16px. */
export const ARTIFACT_CONTROLS_BAR_HEIGHT_PX = 48;

/** CSS transition for artifact container size changes (subtle settle bounce). */
export const ARTIFACT_SIZE_TRANSITION_CSS =
  "width var(--motion-duration-standard) var(--motion-ease-settle), height var(--motion-duration-standard) var(--motion-ease-settle), min-height var(--motion-duration-standard) var(--motion-ease-settle), min-width var(--motion-duration-standard) var(--motion-ease-settle)";

export function clampArtifactFontScale(scale: number): number {
  return Math.min(
    ARTIFACT_FONT_SCALE_MAX,
    Math.max(ARTIFACT_FONT_SCALE_MIN, scale),
  );
}

export function stepArtifactFontScale(
  current: number,
  direction: 1 | -1,
): number {
  const next =
    Math.round((current + direction * ARTIFACT_FONT_SCALE_STEP) * 10) / 10;
  return clampArtifactFontScale(next);
}

function storageKey(artifactId: string): string {
  return `artifact-font-scale:${artifactId}`;
}

export function loadArtifactFontScale(artifactId?: string): number {
  if (!artifactId || typeof sessionStorage === "undefined") {
    return ARTIFACT_FONT_SCALE_DEFAULT;
  }
  try {
    const raw = sessionStorage.getItem(storageKey(artifactId));
    if (!raw) return ARTIFACT_FONT_SCALE_DEFAULT;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed)
      ? clampArtifactFontScale(parsed)
      : ARTIFACT_FONT_SCALE_DEFAULT;
  } catch {
    return ARTIFACT_FONT_SCALE_DEFAULT;
  }
}

export function saveArtifactFontScale(
  artifactId: string | undefined,
  scale: number,
): void {
  if (!artifactId || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(artifactId), String(scale));
  } catch {
    /* ignore quota / private mode */
  }
}
