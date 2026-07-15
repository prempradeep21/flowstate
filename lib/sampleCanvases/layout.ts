import type { Viewport } from "@/lib/store";

/**
 * Layout conventions for research canvases (see
 * .claude/skills/research-canvas/references/layout-conventions.md).
 *
 * World-space geometry mirrors the Walt Disney reference canvas: a wide
 * OVERVIEW band of authored metrics up top, then era deep-dive clusters
 * left-to-right below it, each anchored by a big era title and a giant year.
 */

/** Top-left of the overview band. */
export const OVERVIEW_ORIGIN = { x: 0, y: 0 };
/** Band/section heading ("OVERVIEW"). */
export const SECTION_LABEL_FONT_SIZE = 64;
/** Era cluster title ("Model T"). */
export const CLUSTER_TITLE_FONT_SIZE = 96;
/** Giant era year ("1908"). */
export const CLUSTER_YEAR_FONT_SIZE = 200;
/** Small annotation labels ("In the making"). */
export const SUB_LABEL_FONT_SIZE = 28;

/** Horizontal gap between nodes placed in a row. */
export const NODE_GAP_X = 80;
/** Vertical gap between stacked nodes. */
export const NODE_GAP_Y = 80;
/** Vertical space reserved for a cluster's title + year labels. */
export const CLUSTER_HEADER_HEIGHT = 360;
/** Horizontal gap between adjacent era clusters. */
export const CLUSTER_GAP_X = 480;

export interface Size {
  w: number;
  h: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Rect extends Position, Size {}

/** Lay out sizes left-to-right from `origin`, returning each item's position. */
export function rowPositions(
  sizes: Size[],
  origin: Position,
  gapX: number = NODE_GAP_X,
): Position[] {
  const positions: Position[] = [];
  let x = origin.x;
  for (const size of sizes) {
    positions.push({ x, y: origin.y });
    x += size.w + gapX;
  }
  return positions;
}

/** Stack sizes top-to-bottom from `origin`, returning each item's position. */
export function columnPositions(
  sizes: Size[],
  origin: Position,
  gapY: number = NODE_GAP_Y,
): Position[] {
  const positions: Position[] = [];
  let y = origin.y;
  for (const size of sizes) {
    positions.push({ x: origin.x, y });
    y += size.h + gapY;
  }
  return positions;
}

export function boundsOfRects(rects: Rect[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  if (rects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Viewport that frames the given world bounds. The canvas maps world → screen
 * as `screen = world * scale + viewport.{x,y}`, so the translate is the
 * negated scaled origin plus a margin.
 */
export function viewportForBounds(
  bounds: { minX: number; minY: number },
  scale = 0.5,
  margin = 80,
): Viewport {
  return {
    x: -(bounds.minX * scale) + margin,
    y: -(bounds.minY * scale) + margin,
    scale,
  };
}
