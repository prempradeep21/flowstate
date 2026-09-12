import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { getDefaultArtifactSize } from "@/lib/canvasNodeBounds";
import {
  CLUSTER_GAP_X,
  NODE_GAP_X,
  NODE_GAP_Y,
  type Size,
} from "@/lib/sampleCanvases/layout";
import type {
  SampleArtifactSpec,
  SampleCluster,
} from "@/lib/sampleCanvases/specTypes";
import { STICKY_NOTE_ARTIFACT_WIDTH } from "@/lib/stickyNoteArtifact";

/**
 * Company-canvas conventions — the geometry for a subject read through lenses
 * rather than lived through eras. See
 * .claude/skills/company-canvas/references/layout-conventions.md.
 *
 * The canvas is three tiers stacked top to bottom:
 *
 *   THE SCOREBOARD   one band of authored metrics — what the company is today
 *   districts        stacked bands, each answering one question (THE MONEY,
 *                    THE PHILOSOPHY, …), each holding 1–3 clusters
 *   chapters         a chronological row of defining moments, zigzagged, each
 *                    under a giant year — the research era geometry, reused
 *
 * **The rule that drives this file: measure, never assume.** A chart is 520
 * wide, a table is 680, a timeline is 1920. The research builders hardcode
 * `520 + NODE_GAP_X` as a column stride, and their tables consequently overlap
 * the sticky column by 80px on the live canvas. Every x-origin here is walked
 * from real `getDefaultArtifactSize` output, so that mistake is unrepresentable
 * rather than merely warned about.
 *
 * Importing layout.ts's research constants is expected: a company canvas is
 * `kind: "research"` and its chapters legitimately use the same type scale.
 * The tier-2 bar in layout.ts applies to `kind: "project"` canvases only.
 */

/** A chapter is an era by another name — a defining moment under a giant year. */
export interface SampleChapter extends SampleCluster {
  year: string;
}

/**
 * A horizontal band answering one question about the company.
 *
 * `lens` is declared, not inferred. A private company ships no `public`
 * districts (it has no filings to read) and a long-public one ships few
 * `private` ones; `shared` districts work either way. Declaring it lets the
 * test assert the branch the skill promises actually got built.
 */
export interface SampleDistrict {
  key: string;
  /** "THE MONEY" — the primary wayfinding layer at 0.2 zoom. */
  label: string;
  /** "What the filings actually say" — one line under the label. */
  subtitle: string;
  lens: "shared" | "public" | "private";
  /** 1–3. More and the band stops reading as one idea. */
  clusters: SampleCluster[];
}

/* --- Typography ------------------------------------------------------- */

/** District band label ("THE MONEY") — outranks everything but a chapter year. */
export const DISTRICT_LABEL_FONT_SIZE = 140;
/** One-line district subtitle. */
export const DISTRICT_SUBTITLE_FONT_SIZE = 36;

/* --- Widths (imported, never magic) ----------------------------------- */

export const STICKY_COLUMN_W = STICKY_NOTE_ARTIFACT_WIDTH;
/** Stickies stack tighter than media — they are annotations, not content. */
export const STICKY_GAP_Y = 40;

/* --- Scoreboard band -------------------------------------------------- */

export const SCOREBOARD_LABEL_POS = { x: 0, y: -40 };
export const SCOREBOARD_SUBTITLE_POS = { x: 0, y: 52 };
export const SCOREBOARD_ROWS_START_Y = 140;
export const SCOREBOARD_SUBTITLE_WIDTH = 980;

/* --- Districts -------------------------------------------------------- */

/** Clears the 140px label. */
export const DISTRICT_SUBTITLE_OFFSET_Y = 170;
/** Where a district's clusters start, relative to the band top. */
export const DISTRICT_CONTENT_OFFSET_Y = 260;
/** Vertical gap between district bands. */
export const DISTRICT_GAP_Y = 400;
/** Horizontal gap between clusters inside one band. */
export const DISTRICT_CLUSTER_GAP_X = 320;
/** Gap between the scoreboard band and the first district. */
export const DISTRICTS_START_GAP_Y = 400;
export const DISTRICT_SUBTITLE_WIDTH = 1400;

/** Column sub-label, relative to a district cluster's content top. */
export const CLUSTER_COLUMN_LABEL_OFFSET_Y = 120;
/** Column items, relative to a district cluster's content top. */
export const CLUSTER_ITEMS_OFFSET_Y = 180;

/* --- Chapters (the research zigzag, reused) --------------------------- */

/** Gap between the last district and the chapter row. */
export const CHAPTERS_GAP_Y = 700;
/** Chapter title, under the 200px year. */
export const CHAPTER_TITLE_OFFSET_Y = 240;
export const CHAPTER_COLUMN_LABEL_OFFSET_Y = 400;
export const CHAPTER_ITEMS_OFFSET_Y = 460;
/** Alternate chapters drop by this much — a zigzag that reads as a timeline. */
export const CHAPTER_STAGGER_Y = 450;
export const CHAPTER_GAP_X = CLUSTER_GAP_X;

/* --- Measurement ------------------------------------------------------ */

export const specSize = (spec: SampleArtifactSpec): Size =>
  getDefaultArtifactSize(payloadToArtifactKind(spec.payload), spec.payload);

/**
 * Width of a column = its widest item.
 *
 * NEVER a constant. A chart is CANVAS_ARTIFACT_WIDTH (520) but a table is
 * CANVAS_TABLE_ARTIFACT_WIDTH (680); assuming 520 is exactly the bug that
 * overlaps the research canvases' tables with their sticky columns.
 */
export const columnWidth = (items: SampleArtifactSpec[]): number =>
  items.length ? Math.max(...items.map((item) => specSize(item).w)) : 0;

/** Total height of a stack of sizes separated by `gap`. */
export const stackHeight = (sizes: Size[], gap: number): number =>
  sizes.length
    ? sizes.reduce((sum, size) => sum + size.h, 0) + gap * (sizes.length - 1)
    : 0;

export interface ClusterColumnLayout {
  /** x-origin of each media column, in order. */
  columnOrigins: number[];
  /** x-origin of the annotation column — the last column's real right edge + gap. */
  stickyX: number;
  /** Full cluster width, so the next cluster's origin is derived, not assumed. */
  width: number;
}

/**
 * Walk a cluster's columns left to right, measuring each from its real items.
 *
 * The annotation column lands after the last media column's *actual* right
 * edge, so a 680-wide table pushes the stickies right instead of sliding under
 * them. Cluster width falls out of the same walk — which is why this family has
 * no `CLUSTER_STRIDE_X` constant at all.
 */
export function clusterColumnOrigins(
  cluster: SampleCluster,
  startX: number,
): ClusterColumnLayout {
  const columnOrigins: number[] = [];
  let x = startX;
  for (const column of cluster.columns) {
    columnOrigins.push(x);
    x += columnWidth(column.items) + NODE_GAP_X;
  }
  const stickyX = x;
  // With no stickies the trailing NODE_GAP_X is not real width; take it back.
  const right = cluster.stickies.length ? stickyX + STICKY_COLUMN_W : x - NODE_GAP_X;
  return { columnOrigins, stickyX, width: Math.max(0, right - startX) };
}

/**
 * Height of a cluster measured from its tallest column *or* its sticky stack —
 * a cluster whose annotations outrun its media would otherwise be clipped by
 * whatever is placed below it.
 */
export function clusterHeight(
  cluster: SampleCluster,
  itemsOffsetY: number,
): number {
  const columnHeights = cluster.columns.map((column) =>
    stackHeight(column.items.map(specSize), NODE_GAP_Y),
  );
  const stickyHeight = stackHeight(cluster.stickies.map(specSize), STICKY_GAP_Y);
  return itemsOffsetY + Math.max(0, ...columnHeights, stickyHeight);
}

export function districtHeight(district: SampleDistrict): number {
  return (
    DISTRICT_CONTENT_OFFSET_Y +
    Math.max(
      0,
      ...district.clusters.map((cluster) =>
        clusterHeight(cluster, CLUSTER_ITEMS_OFFSET_Y),
      ),
    )
  );
}

export interface DistrictBand {
  key: string;
  top: number;
  height: number;
}

/**
 * The y-band each district occupies. Shared by the builder and its test: every
 * district starts at x=0 and owns a disjoint `[top, top + height)`, so
 * cross-district collisions are impossible by construction — the test asserts
 * the property this function guarantees.
 */
export function districtBands(
  districts: SampleDistrict[],
  startY: number,
): DistrictBand[] {
  const bands: DistrictBand[] = [];
  let top = startY;
  for (const district of districts) {
    const height = districtHeight(district);
    bands.push({ key: district.key, top, height });
    top += height + DISTRICT_GAP_Y;
  }
  return bands;
}
