import {
  boundsOfRects,
  columnPositions,
  rowPositions,
  viewportForBounds,
  type Position,
  type Rect,
  type Size,
} from "@/lib/sampleCanvases/layout";

/**
 * Layout for the Guinness campaign canvas — an **agency project** canvas, not a
 * research canvas. It deliberately shares none of the research geometry (no
 * OVERVIEW band, no giant era year, no zigzag clusters); only the pure geometry
 * maths above is shared.
 *
 * The shape is an **hourglass**, because that is the shape of advertising: you
 * gather a hundred references and several territories, it narrows to one film,
 * and that one film explodes back out into dozens of cutdowns. Time runs along
 * the x-axis. Every zone is vertically centred on `y = 0`, so zoomed out the
 * silhouette itself carries the argument — wide, pinched, wide.
 *
 *   THE INPUT          TERRITORIES   THE IDEA    THE MAKING      THE OUTPUT
 *   ████ brief ███                                               ████████
 *   ████ market ██        ▓ A ▓                    ▒ script ▒    ████████
 *   ████ audience         ▓ B ▓        ★ line ★    ▒ recce  ▒    ████████
 *   ████ reference        ▓ C ▓                    ▒ sched  ▒    ████████
 */

export { boundsOfRects, columnPositions, rowPositions, viewportForBounds };
export type { Position, Rect, Size };

/** Zone heading — "THE INPUT", "THE MAKING". */
export const ZONE_TITLE_FONT_SIZE = 96;
/** Line under a zone heading — "Everything we looked at". */
export const ZONE_SUBTITLE_FONT_SIZE = 28;
/** Category band label inside zone 0 — "BRIEF", "MARKET". */
export const BAND_LABEL_FONT_SIZE = 44;
/** A territory's endline, set large above its column. */
export const TERRITORY_LINE_FONT_SIZE = 72;
/** The chosen endline at the waist of the hourglass — the hero moment. */
export const HERO_LINE_FONT_SIZE = 200;

export const NODE_GAP_X = 80;
export const NODE_GAP_Y = 80;
/** Sticky notes sit closer together than artifacts. */
export const STICKY_GAP_Y = 40;
/** Between category bands in zone 0 — wider than NODE_GAP_Y so bands read apart. */
export const BAND_GAP_Y = 220;
/** One artifact column: default artifact width (520) + NODE_GAP_X. */
export const COLUMN_STRIDE_X = 600;

/**
 * Zone origins (world x). Explicit rather than derived, so the hourglass
 * silhouette is stable: wide (input) → narrow (idea) → wide again. Each zone
 * clears the next by ~680px; less than that and neighbours read as one zone.
 *
 * These are checked, not guessed — `buildGuinnessCampaignCanvas.test.ts` asserts
 * every zone clears the next and that no two nodes overlap. If you add content
 * to a zone, run that test: it will tell you when a zone has outgrown its slot.
 *
 * Note `idea` reserves unusually wide space for its size: the endline is set at
 * 200px over a 1600px wrap width, so the zone is far wider than its one column.
 */
export const ZONE_X = {
  input: 0,
  territories: 4800,
  idea: 7200,
  making: 9480,
  cut: 12040,
  output: 13600,
} as const;

export type ZoneKey = keyof typeof ZONE_X;

/**
 * Y of a zone's heading — one consistent header line across every zone, so the
 * eye can track right along the top. Must clear the tallest zone: the input
 * zone's six bands run to roughly ±1970 (the client-brief PDF previews at 3:4,
 * i.e. 480×640, which alone sets the BRIEF band height).
 */
export const ZONE_TITLE_Y = -2240;
export const ZONE_SUBTITLE_Y = ZONE_TITLE_Y + 116;
/** A band's label sits just above its row of artifacts. */
export const BAND_LABEL_OFFSET_Y = -64;

/** The seed Q&A card — far left, before the input zone. "Start here." */
export const SEED_CARD_POSITION = { x: -1500, y: -260 };

/**
 * Start-Y for each item in a stack of the given heights, so the whole stack is
 * centred on the y=0 axis. This is what produces the hourglass silhouette.
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
