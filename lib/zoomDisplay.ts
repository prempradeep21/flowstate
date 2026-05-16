/** Below this scale, cards show only question + summary (no labels, follow-up). */
export const ZOOM_SUMMARY_ONLY = 0.52;

/** Below this scale, summaries clamp to two lines instead of four. */
export const ZOOM_TWO_LINE_SUMMARY = 0.72;

export function isSummaryOnlyMode(scale: number) {
  return scale < ZOOM_SUMMARY_ONLY;
}

export function isGodViewMode(scale: number) {
  return scale < ZOOM_SUMMARY_ONLY;
}

export function summaryLineClamp(scale: number): 2 | 4 {
  return scale < ZOOM_TWO_LINE_SUMMARY ? 2 : 4;
}

/** Counter-scale factor so on-screen size stays constant while zooming out. */
export function counterScaleFactor(scale: number) {
  return scale > 0 ? 1 / scale : 1;
}

/** World-space stroke/border px so lines stay visible on screen when scale < 1. */
export function compensatedStrokeWidth(
  screenPx: number,
  scale: number,
  baseWhenZoomedIn = screenPx,
) {
  if (scale >= 1) return baseWhenZoomedIn;
  return screenPx / scale;
}

/** First token of a thinking label for compact loading display. */
export function compactThinkingWord(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "Thinking";
  return trimmed.split(/\s+/)[0];
}
