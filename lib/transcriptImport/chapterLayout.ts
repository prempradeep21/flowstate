import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import {
  MASTHEAD_ARTIFACT_KINDS,
  MASTHEAD_ARTIFACT_SCALE,
} from "@/lib/transcriptArtifacts";
import type {
  BranchGroup,
  CanvasArtifactNode,
  Card,
  Connection,
} from "@/lib/store";

/*
 * Chapter layout — the shared geometry engine for every transcript import.
 *
 * A chapter is one node on the transcript's main spine. Its conversation card
 * heads the chapter (title + summary) and opens a LEFT-TO-RIGHT main line: the
 * chapter's first sub-branch continues along that same row, so the beat reads
 * as one sentence running rightwards rather than a column of stacked rows.
 * Every further branch hangs BELOW that line, each on its own row and itself
 * running left to right. Under the conversation block sits a hairline divider,
 * and under that the artifacts the chapter produced, in justified rows. Each
 * chapter becomes a BranchGroup, so the box around it is derived, not authored.
 *
 * Builders author CONTENT ONLY — every position here is computed from measured
 * node sizes (getCardBounds / getArtifactBounds), never from a per-transcript
 * magic offset.
 */

/** Gap between tiles inside a chapter, horizontally and vertically. */
export const TILE_GAP = 48;
/** Gap above and below the rule that separates conversation from artifacts. */
export const DIVIDER_GAP_Y = 36;
/** Gap between one chapter's box and the next. */
export const CHAPTER_GAP_X = 260;
/** Widest a chapter's artifact block runs, unless its card row is wider still. */
export const CHAPTER_CONTENT_WIDTH = 520 * 3 + TILE_GAP * 2;

/*
 * Justified rows — the artifact block under a chapter's conversation.
 *
 * Every row is ONE height and runs the block's full width, with exactly
 * TILE_GAP between tiles and between rows. Tiles never change shape to get
 * there: each one is scaled WHOLE — node box and content together, by CSS
 * zoom (`CanvasArtifactNode.contentZoom`) — so a poster stays a poster, a
 * table keeps its columns, and a quote card keeps its proportions. The only
 * freedom is how big each tile is drawn, and that is bounded per kind
 * (`tileZoomRange`) so type stays legible and no single tile shouts.
 *
 * The packer:
 * 1. Shape order. A strip wider than most of the block (a timeline) heads it;
 *    then text and data cards, then pictures, then stickies — each group in
 *    the order the conversation produced it. Like shapes landing next to each
 *    other is most of what makes a row read as arranged.
 * 2. Row heights. Tiles sharing a row share a height h, so the row's width is
 *    linear in h: Σ(aspect)·h + gaps. The justified height fills the block
 *    exactly; each tile's zoom range bounds h, and when the bounds don't reach
 *    (three short cards can't fill 1600px) the row runs short and is charged
 *    for it.
 * 3. Breaks. A dynamic programme over where rows break picks the cheapest
 *    set: zoom far from 1 costs (pictures more than text), short rows cost
 *    (a short last row much less), and so does each extra row.
 * 4. Block width. Tried across a range; the artifacts should end where the
 *    cards above them end, so drifting either way costs — running short of
 *    the cards most.
 */

export interface RowTile {
  id: string;
  /** Artifact kind — decides the zoom range and the shape-order group. */
  kind: string;
  /** The size its content wants at zoom 1. */
  natural: { w: number; h: number };
}

export interface PackedTile {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The tile's scale — its box is natural × zoom, content drawn at this zoom. */
  zoom: number;
}

export interface PackedRows {
  placed: PackedTile[];
  width: number;
  height: number;
}

const PICTURE_KINDS: ReadonlySet<string> = new Set(["website", "images", "map"]);

/**
 * How far a tile may be scaled. Pictures can grow and shrink furthest; text
 * stays near its designed size; a timeline only shrinks (it is already a
 * full-width strip).
 */
export function tileZoomRange(tile: RowTile): [number, number] {
  switch (tile.kind) {
    case "table":
      return [0.8, 1.2];
    case "website":
      // A favicon-only site is a fixed square; a hero follows its image.
      return tile.natural.w === tile.natural.h ? [0.8, 1.3] : [0.6, 1.3];
    case "images":
    case "map":
      return [0.6, 1.3];
    case "timeline":
      return [0.6, 1.1];
    case "stickynote":
      return [0.9, 1.3];
    case "chart":
      return [0.75, 1.3];
    default:
      return [0.8, 1.3];
  }
}

/** A tile wider than this share of the block heads it in a row of its own. */
const FULL_ROW_SHARE = 0.72;
/** Most tiles one row may hold. */
const MAX_ROW_TILES = 5;
/** Rows shorter than this read as a strip of thumbnails. */
const MIN_ROW_H = 160;
/** Narrowest block tried when the cards above are narrow or few. */
const MIN_BLOCK_W = 520 * 2 + TILE_GAP + 16;
/** Block widths are tried at this step. */
const BLOCK_W_STEP = 90;

function shapeRank(tile: RowTile, blockW: number): number {
  if (tile.natural.w > blockW * FULL_ROW_SHARE) return 0;
  if (tile.kind === "stickynote") return 3;
  return PICTURE_KINDS.has(tile.kind) ? 2 : 1;
}

/** Stable sort into strip / text / pictures / stickies. */
function shapeOrder(tiles: RowTile[], blockW: number): RowTile[] {
  return tiles
    .map((tile, index) => ({ tile, index, rank: shapeRank(tile, blockW) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ tile }) => tile);
}

/** Cost of drawing a tile at `zoom`: quadratic in log-zoom, by its size, pictures weighted up. */
function zoomCost(tile: RowTile, zoom: number): number {
  const size = Math.sqrt(tile.natural.w * tile.natural.h) / 400;
  const weight = PICTURE_KINDS.has(tile.kind) ? 2.5 : 1;
  const log = Math.log(zoom);
  return log * log * size * weight;
}

interface Row {
  tiles: RowTile[];
  h: number;
  cost: number;
}

/** Fit one row to `blockW`: the justified height, clamped into every tile's range. */
function fitRow(tiles: RowTile[], blockW: number, isLast: boolean): Row {
  const gaps = TILE_GAP * (tiles.length - 1);
  const aspect = tiles.reduce((sum, t) => sum + t.natural.w / t.natural.h, 0);
  let lo = 0;
  let hi = Infinity;
  for (const t of tiles) {
    const [min, max] = tileZoomRange(t);
    lo = Math.max(lo, t.natural.h * min);
    hi = Math.min(hi, t.natural.h * max);
  }
  // Ranges that don't overlap (a short card beside a tall poster) can't share a row.
  if (lo > hi + 0.5) return { tiles, h: 0, cost: Infinity };
  const h = Math.min(hi, Math.max(lo, (blockW - gaps) / aspect));
  const width = aspect * h + gaps;
  if (width > blockW + 1) return { tiles, h, cost: Infinity };

  let cost = 0;
  for (const t of tiles) cost += zoomCost(t, h / t.natural.h);
  const short = Math.max(0, blockW - width) / blockW;
  cost += (isLast ? 30 : 120) * short * short;
  if (short > 0.01) cost += isLast ? 0.5 : 1.5;
  if (h < MIN_ROW_H) cost += ((MIN_ROW_H - h) / 60) ** 2 * 3;
  return { tiles, h, cost };
}

/**
 * How far ahead of the next tile a row may reach for companions. Tiles that
 * sit next to each other in the order often can't share a height (a to-do
 * list beside a one-line quote), so a row may pull a better-matched tile
 * forward — but only from close by, so the block still reads roughly in
 * order.
 */
const ROW_LOOKAHEAD = 5;

/**
 * Cheapest set of rows for tiles in this order at this block width. Each row
 * starts at the first tile not yet placed and takes up to MAX_ROW_TILES - 1
 * companions from the next ROW_LOOKAHEAD, keeping their relative order. The
 * search is memoised on which tiles are placed.
 */
function breakRows(tiles: RowTile[], blockW: number): { cost: number; rows: Row[] } {
  const n = tiles.length;
  // The placed-set is a 31-bit mask; a chapter that big is packed in halves.
  if (n > 30) {
    const head = breakRows(tiles.slice(0, 30), blockW);
    const tail = breakRows(tiles.slice(30), blockW);
    return { cost: head.cost + tail.cost, rows: [...head.rows, ...tail.rows] };
  }
  const full = (1 << n) - 1;
  const memo = new Map<number, { cost: number; rows: Row[] }>();

  const solve = (placed: number): { cost: number; rows: Row[] } => {
    if (placed === full) return { cost: 0, rows: [] };
    const hit = memo.get(placed);
    if (hit) return hit;

    const open: number[] = [];
    for (let i = 0; i < n && open.length <= ROW_LOOKAHEAD; i++) {
      if (!(placed & (1 << i))) open.push(i);
    }
    const [head, ...ahead] = open as [number, ...number[]];
    let best: { cost: number; rows: Row[] } = { cost: Infinity, rows: [] };
    // Every subset of the lookahead, up to a full row, in order.
    for (let pick = 0; pick < 1 << ahead.length; pick++) {
      const members = [head];
      for (let k = 0; k < ahead.length; k++) {
        if (pick & (1 << k)) members.push(ahead[k]!);
      }
      if (members.length > MAX_ROW_TILES) continue;
      let next = placed;
      for (const m of members) next |= 1 << m;
      const row = fitRow(
        members.map((m) => tiles[m]!),
        blockW,
        next === full,
      );
      if (row.cost === Infinity) continue;
      const rest = solve(next);
      // A small charge per row keeps the block from shattering into strips.
      const cost = row.cost + 0.8 + rest.cost;
      if (cost < best.cost) best = { cost, rows: [row, ...rest.rows] };
    }
    memo.set(placed, best);
    return best;
  };

  return solve(0);
}

/**
 * Artifacts should end where the cards end. Either way off reads as
 * misaligned; running short of the cards reads worse than running past them.
 */
function blockWidthCost(blockW: number, cardsW: number): number {
  const drift = (blockW - cardsW) / Math.max(cardsW, 1);
  // A flat charge for missing the card edge at all, so a block that CAN end
  // exactly where the cards do always prefers to.
  const missed = Math.abs(blockW - cardsW) > 4 ? 0.3 : 0;
  return (drift < 0 ? 60 : 30) * drift * drift + missed;
}

function blockWidths(tiles: RowTile[], cardsW: number, maxWidth: number): number[] {
  // No block narrower than its widest tile can be drawn.
  const widest = Math.max(
    ...tiles.map((t) => t.natural.w * tileZoomRange(t)[0]),
  );
  const floor = Math.ceil(Math.max(Math.min(cardsW, MIN_BLOCK_W), widest));
  const top = Math.max(floor, maxWidth, cardsW);
  const widths = new Set<number>([floor, Math.round(top)]);
  for (let w = floor; w < top; w += BLOCK_W_STEP) widths.add(w);
  // The card row's own width, exactly — so a block that can fill it lines up.
  if (cardsW >= floor) widths.add(Math.round(cardsW));
  return [...widths].sort((a, b) => a - b);
}

/**
 * Lay tiles into justified rows. `minWidth` is the chapter's card block: the
 * width the artifacts aim to end at.
 */
export function packJustifiedRows(
  input: RowTile[],
  opts: { maxWidth?: number; minWidth?: number } = {},
): PackedRows {
  if (input.length === 0) return { placed: [], width: 0, height: 0 };
  const maxWidth = opts.maxWidth ?? CHAPTER_CONTENT_WIDTH;
  const cardsW = opts.minWidth ?? 0;

  let best: { cost: number; rows: Row[] } | null = null;
  for (const blockW of blockWidths(input, cardsW, maxWidth)) {
    const res = breakRows(shapeOrder(input, blockW), blockW);
    const cost = res.cost + blockWidthCost(blockW, cardsW);
    if (!best || cost < best.cost) best = { cost, rows: res.rows };
  }

  const placed: PackedTile[] = [];
  let y = 0;
  let width = 0;
  for (const row of best!.rows) {
    // Round the shared height once so every tile in the row ends on one line,
    // then step x by whole widths so every gutter is exactly TILE_GAP.
    const h = Math.round(row.h);
    let x = 0;
    for (const t of row.tiles) {
      const zoom = h / t.natural.h;
      const w = Math.round(t.natural.w * zoom);
      placed.push({ id: t.id, x, y, w, h, zoom });
      x += w + TILE_GAP;
    }
    width = Math.max(width, x - TILE_GAP);
    y += h + TILE_GAP;
  }
  return { placed, width, height: Math.max(0, y - TILE_GAP) };
}

/**
 * Chapter hues. Deliberately not THREAD_ACCENT_PALETTE: that palette carries
 * the canvas accent (a group wearing it reads as selected) and a light yellow
 * that is unreadable as label text on the card surface. These are picked to
 * stay legible at caption size on a light canvas while tinting to nearly
 * nothing at 4.5% fill.
 */
/**
 * The label chip is the ordinal alone. A full chapter title inside a chip that
 * counter-scales with zoom was both unreadable when zoomed out and long enough
 * to run past its own group when zoomed in; the title now rides above the frame
 * in world space (see `chapterGroupHeading` and GroupBounds).
 *
 * No time range: it took the most prominent position while being the least
 * interesting part of the label. The range stays in the chapter data, where it
 * still places artifacts by timestamp and feeds the episode masthead.
 */
export function chapterGroupLabel(_head: Card, index: number): string {
  return `Chapter ${index + 1}`;
}

/**
 * The chapter's own title — for an imported video, the creator's chapter name
 * verbatim. convCard already puts the title in `question`.
 */
export function chapterGroupHeading(head: Card, index: number): string {
  return head.question?.trim() || `Chapter ${index + 1}`;
}

export interface ChapterLayoutInput {
  /** Ordered main-spine card ids — one chapter each. */
  mainCardIds: string[];
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
  /**
   * Artifact nodes stacked in a column to the LEFT of chapter 1 — the episode
   * masthead. They belong to the import rather than to any beat, so they are
   * excluded from every chapter group and never counted against a chapter's
   * artifact budget.
   */
  mastheadNodeIds?: string[];
  /** Prefix for generated group ids, e.g. "tip-yc". */
  idPrefix: string;
  origin?: { x: number; y: number };
}

export interface ChapterLayoutResult {
  groups: Record<string, BranchGroup>;
  connections: Connection[];
  contentCenter: { x: number; y: number };
}

/** The layout description of one artifact node: its kind and its content size at zoom 1. */
function rowTileFor(
  nodeId: string,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  sessionArtifacts: Record<string, SessionArtifact>,
): RowTile {
  const node = canvasArtifactNodes[nodeId]!;
  const artifact = sessionArtifacts[node.artifactId];
  return {
    id: nodeId,
    kind: artifact?.kind ?? "unknown",
    natural: getArtifactBounds(node, artifact),
  };
}

/**
 * Position every card and artifact into chapter columns, emit one group per
 * chapter, and re-point the connectors to match the new geometry.
 *
 * Cards and artifact nodes are mutated in place — builders hand over the
 * records they just created, so there is nothing else holding a reference.
 */
export function layoutChapters(
  input: ChapterLayoutInput,
): ChapterLayoutResult {
  const {
    mainCardIds,
    cards,
    cardOrder,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    idPrefix,
  } = input;
  const originX = input.origin?.x ?? 0;
  const originY = input.origin?.y ?? 0;

  const chapterIndexOfCard = new Map<string, number>();
  mainCardIds.forEach((id, index) => chapterIndexOfCard.set(id, index));

  /** A sub card belongs to the chapter its parentConversationId names. */
  const resolveChapter = (cardId: string): number => {
    const seen = new Set<string>();
    let current: string | null = cardId;
    while (current && !seen.has(current)) {
      const known = chapterIndexOfCard.get(current);
      if (known !== undefined) return known;
      seen.add(current);
      current = cards[current]?.parentConversationId ?? null;
    }
    return 0;
  };

  const subCardIds: string[][] = mainCardIds.map(() => []);
  for (const id of cardOrder) {
    if (chapterIndexOfCard.has(id)) continue;
    const chapter = resolveChapter(id);
    subCardIds[chapter]!.push(id);
    chapterIndexOfCard.set(id, chapter);
  }

  const masthead = new Set(input.mastheadNodeIds ?? []);
  const artifactIds: string[][] = mainCardIds.map(() => []);
  for (const nodeId of canvasArtifactOrder) {
    const node = canvasArtifactNodes[nodeId];
    if (!node) continue;
    if (masthead.has(nodeId)) continue;
    const chapter = node.sourceCardId
      ? resolveChapter(node.sourceCardId)
      : 0;
    artifactIds[chapter]!.push(nodeId);
  }

  const groups: Record<string, BranchGroup> = {};
  const chapterCenters: { x: number; y: number }[] = [];
  /** Cards that end up in the same row as their parent, so the connector runs right→left. */
  const inlineWithParent = new Set<string>();
  let chapterX = originX;

  // The masthead column: stacked top-down at the origin, with the spine pushed
  // right to clear it. Measured like everything else, so a taller masthead
  // moves chapter 1 rather than overlapping it.
  if (masthead.size > 0) {
    let mastheadY = originY;
    let mastheadRight = originX;
    for (const nodeId of input.mastheadNodeIds ?? []) {
      const node = canvasArtifactNodes[nodeId];
      if (!node) continue;
      const artifact = sessionArtifacts[node.artifactId];
      // Episode and link group are drawn at masthead scale by kind; anything
      // else in the column (an episode-level chart) opts in here, so the
      // column reads as one size instead of a normal tile beside giant cards.
      if (artifact && !MASTHEAD_ARTIFACT_KINDS.has(artifact.kind)) {
        const base = getArtifactBounds(node, artifact);
        node.size = {
          w: base.w * MASTHEAD_ARTIFACT_SCALE,
          h: base.h * MASTHEAD_ARTIFACT_SCALE,
        };
        node.layoutSetSize = true;
        node.mastheadScale = true;
      }
      const { w, h } = getArtifactBounds(node, artifact);
      node.position = { x: originX, y: mastheadY };
      mastheadY += h + TILE_GAP;
      mastheadRight = Math.max(mastheadRight, originX + w);
    }
    chapterX = mastheadRight + CHAPTER_GAP_X;
  }

  mainCardIds.forEach((mainId, index) => {
    const head = cards[mainId];
    if (!head) return;
    // Sub-branch cards: one row per thread, so the right/left connectors
    // between consecutive cards in a thread always land side by side.
    const branches: string[][] = [];
    const rowOfThread = new Map<string, string[]>();
    for (const id of subCardIds[index]!) {
      const threadId = cards[id]?.threadId ?? "";
      let row = rowOfThread.get(threadId);
      if (!row) {
        row = [];
        rowOfThread.set(threadId, row);
        branches.push(row);
      }
      row.push(id);
    }

    // The main line: the head plus the chapter's first branch, side by side.
    // Every remaining branch drops below it, one row each. A branch's own cards
    // always run left to right, whichever row it lands in.
    const rows: string[][] = [[mainId, ...(branches[0] ?? [])], ...branches.slice(1)];
    for (const id of branches[0] ?? []) inlineWithParent.add(id);

    // The box is derived from where members actually land, so the advance has
    // to track the same extent — otherwise a thin chapter leaves a wide gap.
    let chapterRight = chapterX;

    let y = originY;
    let cardsBottom = originY;
    for (const row of rows) {
      let x = chapterX;
      let rowH = 0;
      for (const id of row) {
        const card = cards[id]!;
        const size = getCardBounds(card);
        card.position = { x, y };
        x += size.w + TILE_GAP;
        rowH = Math.max(rowH, size.h);
        chapterRight = Math.max(chapterRight, card.position.x + size.w);
      }
      cardsBottom = y + rowH;
      y += rowH + TILE_GAP;
    }

    // The divider rides in the middle of the band between the conversation
    // block and the artifacts — DIVIDER_GAP_Y of air on each side of it.
    // Sticky notes pack with everything else, at the end of the shape order:
    // an annotation sits in the rows beside the work it annotates.
    const gridIds = artifactIds[index]!;
    const hasArtifacts = gridIds.length > 0;
    const dividerY = hasArtifacts ? cardsBottom + DIVIDER_GAP_Y : null;
    if (dividerY !== null) y = dividerY + DIVIDER_GAP_Y;

    const tiles = gridIds.map((nodeId) =>
      rowTileFor(nodeId, canvasArtifactNodes, sessionArtifacts),
    );
    const block = packJustifiedRows(tiles, {
      minWidth: chapterRight - chapterX,
    });
    for (const tile of block.placed) {
      const node = canvasArtifactNodes[tile.id]!;
      node.position = { x: chapterX + tile.x, y: y + tile.y };
      node.size = { w: tile.w, h: tile.h };
      // The box is authored, and the content is drawn at the tile's zoom so
      // it fills that box at its own aspect ratio. layoutSetSize keeps the
      // runtime auto-measure from flooring the box at its kind default.
      node.layoutSetSize = true;
      if (Math.abs(tile.zoom - 1) > 0.001) node.contentZoom = tile.zoom;
      chapterRight = Math.max(chapterRight, chapterX + tile.x + tile.w);
    }

    const contentBottom = hasArtifacts ? y + block.height : cardsBottom;
    const chapterWidth = chapterRight - chapterX;
    const chapterHeight = contentBottom - originY;

    groups[`${idPrefix}-chapter-${index + 1}`] = {
      id: `${idPrefix}-chapter-${index + 1}`,
      label: chapterGroupLabel(head, index),
      headingText: chapterGroupHeading(head, index),
      familyRootThreadIds: [],
      cardIds: [mainId, ...subCardIds[index]!],
      items: artifactIds[index]!.map((id) => ({
        kind: "artifact" as const,
        id,
      })),
      ...(dividerY !== null ? { dividerY } : {}),
      summaryMarkdown: null,
    };

    chapterCenters.push({
      x: chapterX + chapterWidth / 2,
      y: originY + chapterHeight / 2,
    });
    chapterX += chapterWidth + CHAPTER_GAP_X;
  });

  return {
    groups,
    connections: normalizeChapterConnections(
      input.connections,
      cards,
      chapterIndexOfCard,
      new Set(mainCardIds),
      inlineWithParent,
    ),
    contentCenter: averagePoint(chapterCenters, { x: originX, y: originY }),
  };
}

function averagePoint(
  points: { x: number; y: number }[],
  fallback: { x: number; y: number },
): { x: number; y: number } {
  if (points.length === 0) return fallback;
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

/**
 * Re-point connectors for the chapter geometry: a chapter head drops into its
 * sub rows, and every link that leaves its chapter is dropped.
 *
 * That includes head-to-head links. Chapters are sequenced by their left-to-right
 * position, not by a drawn line: a connector spanning the gutter enters and exits
 * the heading cards in a single colour that matches no group accent, and at canvas
 * zoom it reads as one stray rule across the whole board. Dropping it here rather
 * than in each builder makes "no spine" a property of the layout engine, so a new
 * import cannot reintroduce one by chaining its heads.
 */
export function normalizeChapterConnections(
  connections: Connection[],
  cards: Record<string, Card>,
  chapterIndexOfCard: Map<string, number>,
  mainCardIds: Set<string>,
  inlineWithParent: Set<string> = new Set(),
): Connection[] {
  const out: Connection[] = [];
  for (const connection of connections) {
    const fromChapter = chapterIndexOfCard.get(connection.from);
    const toChapter = chapterIndexOfCard.get(connection.to);

    // Head-to-head links land here too: consecutive heads are always in
    // different chapters, so this drops the inter-chapter spine.
    if (fromChapter !== toChapter) continue;

    // A card the layout put beside its parent — the first branch, continuing
    // the head's row — is linked across; anything below its parent is linked
    // down. Sub cards sharing a thread always share a row.
    const sameRow =
      inlineWithParent.has(connection.to) ||
      (!mainCardIds.has(connection.from) &&
        cards[connection.from]?.threadId === cards[connection.to]?.threadId);
    out.push(
      sameRow
        ? { ...connection, fromSide: "right", toSide: "left" }
        : { ...connection, fromSide: "bottom", toSide: "top" },
    );
  }
  return out;
}
