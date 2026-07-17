import {
  boundsOfRects,
  rowPositions,
  viewportForBounds,
  type Position,
  type Rect,
  type Size,
} from "@/lib/sampleCanvases/layout";

/**
 * Shared geometry for **filmmaker pipeline** canvases (produced by the
 * `filmmaker-canvas` skill). A film canvas is a `kind:"project"` canvas laid out
 * as a left-to-right production pipeline — time on the x-axis, every zone
 * vertically centred on `y = 0` — so zooming out reads as "development → release":
 *
 *   THE PITCH  THE STORY  WORLD & RESEARCH  PRE-PRO  PRODUCTION  POST  DISTRIBUTION
 *
 * Only the pure geometry maths from `../layout` is shared with other canvases;
 * this deliberately imports none of the research `SECTION_*` / `CLUSTER_*`
 * conventions. Both `viennaExchange` and `theLongNoon` build on this module — see
 * `.claude/skills/filmmaker-canvas/references/layout-conventions.md`.
 */

export { boundsOfRects, rowPositions, viewportForBounds };
export type { Position, Rect, Size };

/** Zone heading — "THE STORY", "PRE-PRODUCTION". */
export const ZONE_TITLE_FONT_SIZE = 96;
/** Line under a zone heading. */
export const ZONE_SUBTITLE_FONT_SIZE = 28;
/** Small label above a column of nodes. */
export const COLUMN_LABEL_FONT_SIZE = 28;

export const NODE_GAP_X = 80;
export const NODE_GAP_Y = 80;

/**
 * Y of the zone header line — one consistent line across every zone. Sits above
 * the tallest centred column (columns stay under ~3000px tall, i.e. half-height
 * ~1500). Text labels do not participate in the overlap test, so this only needs
 * to read cleanly, not clear artifacts.
 */
export const ZONE_TITLE_Y = -1900;
export const ZONE_SUBTITLE_Y = ZONE_TITLE_Y + 116;
/** A column's label sits just above its topmost node. */
export const COLUMN_LABEL_OFFSET_Y = -56;

/**
 * Start-Y for each item in a stack of the given heights so the whole stack is
 * centred on the y=0 axis — this is what makes every zone read off the one line.
 */
export function stackCentredOnAxis(heights: number[], gap: number): number[] {
  if (heights.length === 0) return [];
  const total =
    heights.reduce((sum, h) => sum + h, 0) + gap * (heights.length - 1);
  const out: number[] = [];
  let y = -total / 2;
  for (const h of heights) {
    out.push(y);
    y += h + gap;
  }
  return out;
}

/** Stack sizes into a column at `x`, vertically centred on the y=0 axis. */
export function centredColumn(
  sizes: Size[],
  x: number,
  gap: number = NODE_GAP_Y,
): Position[] {
  return stackCentredOnAxis(
    sizes.map((s) => s.h),
    gap,
  ).map((y) => ({ x, y }));
}
