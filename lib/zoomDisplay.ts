/**
 * Zoom display helpers. Canvas content is NOT zoom-responsive — nodes,
 * borders, connectors and chrome are fixed world sizes and just scale with
 * the canvas. The one deliberate exception is god view: below
 * ZOOM_HIDE_CHROME, artifact / asset / skill / 3D nodes hide their side plugs
 * and resize handles.
 */

/** Below this settled scale, node interaction chrome (plugs, handles) hides. */
export const ZOOM_HIDE_CHROME = 0.52;

export function isGodViewMode(scale: number) {
  return scale < ZOOM_HIDE_CHROME;
}

/** Canvas viewport zoom as a whole-number percentage (e.g. 100, 45). */
export function formatViewportZoomPercent(scale: number): number {
  return Math.round(Math.max(0, scale) * 100);
}

/**
 * Screen-constant stroke width in world px (px at scale ≥ 1, px/scale below).
 * Used only by the demo-video renderer; the live canvas draws fixed strokes.
 */
export function compensatedStrokeWidth(
  screenPx: number,
  scale: number,
  baseWhenZoomedIn = screenPx,
) {
  if (scale >= 1) return baseWhenZoomedIn;
  return screenPx / scale;
}

export function compactThinkingWord(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "Thinking";
  return trimmed.split(/\s+/)[0];
}
