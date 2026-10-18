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
 * and under that the artifacts the chapter produced, in a bento grid. Each
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
/** Widest a chapter's artifact block may run before a tile wraps to a new row. */
export const CHAPTER_CONTENT_WIDTH = 520 * 3 + TILE_GAP * 2;

/*
 * The bento — content first, grid second.
 *
 * The first version of this packer forced every tile onto a six-column lattice
 * of fixed spans (520 / 804 / 1088) and fixed row heights (240 / 528). That
 * read as designed, but it sized tiles to slots rather than to what they hold:
 * a two-column table sat in an 1088-wide slot with half the card empty, and a
 * site with nothing but a favicon got a 520×528 hero slab.
 *
 * Now each tile arrives at its CONTENT size — a table as wide as its columns
 * and as tall as its wrapped rows, a website at its hero image's aspect or a
 * fixed favicon square — and the bento is composed around those sizes:
 *
 * 1. Rows, in reading order. Tiles join the current row while they fit within
 *    CHAPTER_CONTENT_WIDTH (text tiles may give up to a fifth of their width to
 *    make room). A tile wider than most of the block takes a row of its own,
 *    hoisted to the top — a timeline summarises its whole chapter.
 * 2. Stacks. In a row that holds something tall, two consecutive short tiles
 *    fuse into one column, one above the other, so the column matches the tall
 *    tile instead of leaving a hole under a lone quote. Stacking frees width,
 *    so the row then tries to take the next tile too.
 * 3. Justify. Every row is stretched toward the block's widest row, but only
 *    through tiles whose content reflows (quote, stat, chart …). Content-sized
 *    tiles — tables, websites — never change size, so a row of them stays
 *    ragged rather than padding air into a card or cropping a poster. That is
 *    the rule the grid breaks.
 * 4. Heights. Reflowing tiles grow to their row's height (within 1.5× of
 *    their own); content-sized tiles keep theirs and top-align.
 */

/** A tile at most this tall may stack with a neighbour inside a taller row. */
export const BENTO_SHORT_H = 300;
/** Text tiles may narrow to this share of their natural width to fit a row. */
export const BENTO_SHRINK_FLOOR = 0.8;
/** …and widen to this multiple of it when a row is justified. */
export const BENTO_STRETCH_CEIL = 1.6;
/** Reflowing tiles grow to their row's height by at most this multiple. */
export const BENTO_HEIGHT_STRETCH_CEIL = 1.5;
/**
 * A stack may run this much taller than the row's tallest tile. Two quotes
 * (528) beside a claim (420) is still a better row than a lone quote with a
 * 180px hole under it; past this the stack, not the tall tile, sets the row.
 */
const STACK_OVERSHOOT = 1.3;
/** A tile wider than this share of the block takes a row of its own. */
const FULL_ROW_SHARE = 0.72;

export interface BentoTile {
  id: string;
  /** The size its content wants — what it renders at with no layout pressure. */
  natural: { w: number; h: number };
  /**
   * Whether the tile's content reflows when its box changes (text, charts).
   * A content-sized tile (table, website) is placed at exactly its natural size.
   */
  flexible: boolean;
}

export interface PackedTile {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PackedBento {
  placed: PackedTile[];
  width: number;
  height: number;
}

interface Column {
  tiles: BentoTile[];
}

function isFullRow(tile: BentoTile, maxWidth: number): boolean {
  return tile.natural.w > maxWidth * FULL_ROW_SHARE;
}

function minW(tile: BentoTile): number {
  return tile.flexible ? tile.natural.w * BENTO_SHRINK_FLOOR : tile.natural.w;
}

function maxW(tile: BentoTile): number {
  return tile.flexible ? tile.natural.w * BENTO_STRETCH_CEIL : tile.natural.w;
}

function columnNaturalW(col: Column): number {
  return Math.max(...col.tiles.map((t) => t.natural.w));
}

function columnMinW(col: Column): number {
  return Math.max(...col.tiles.map(minW));
}

function columnMaxW(col: Column): number {
  return Math.min(...col.tiles.map(maxW));
}

/** The height a row settles at: its tallest column. */
function rowAnchorH(cols: Column[]): number {
  return Math.max(...cols.map(columnNaturalH));
}

function columnNaturalH(col: Column): number {
  return (
    col.tiles.reduce((sum, t) => sum + t.natural.h, 0) +
    (col.tiles.length - 1) * TILE_GAP
  );
}

function rowWidth(cols: Column[], width: (col: Column) => number): number {
  return (
    cols.reduce((sum, col) => sum + width(col), 0) +
    Math.max(0, cols.length - 1) * TILE_GAP
  );
}

/** Two tiles may share a column when both are short and both reflow — or are the same fixed width. */
function canStack(a: BentoTile, b: BentoTile): boolean {
  if (a.natural.h > BENTO_SHORT_H || b.natural.h > BENTO_SHORT_H) return false;
  if (a.flexible && b.flexible) return true;
  return !a.flexible && !b.flexible && a.natural.w === b.natural.w;
}

/**
 * Fuse consecutive stackable singles into two-high columns, but only where the
 * row has something tall enough to make a lone short tile look stranded.
 */
function fuseStacks(cols: Column[]): Column[] {
  const tallest = rowAnchorH(cols);
  const out: Column[] = [];
  for (const col of cols) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.tiles.length === 1 &&
      col.tiles.length === 1 &&
      canStack(prev.tiles[0]!, col.tiles[0]!) &&
      prev.tiles[0]!.natural.h + col.tiles[0]!.natural.h + TILE_GAP <=
        tallest * STACK_OVERSHOOT
    ) {
      out[out.length - 1] = { tiles: [prev.tiles[0]!, col.tiles[0]!] };
    } else {
      out.push(col);
    }
  }
  return out;
}

/** Greedy rows in reading order, each re-fused and refilled after stacking frees width. */
function buildRows(tiles: BentoTile[], maxWidth: number): Column[][] {
  const rows: Column[][] = [];
  let i = 0;
  while (i < tiles.length) {
    const head = tiles[i]!;
    if (isFullRow(head, maxWidth)) {
      rows.push([{ tiles: [head] }]);
      i += 1;
      continue;
    }
    let cols: Column[] = [];
    for (;;) {
      const next = tiles[i];
      if (!next || isFullRow(next, maxWidth)) break;
      const trial = fuseStacks([...cols, { tiles: [next] }]);
      if (cols.length > 0 && rowWidth(trial, columnMinW) > maxWidth) break;
      cols = trial;
      i += 1;
    }
    rows.push(cols);
  }
  return rows;
}

/** Spread `target` across columns: start natural, then shrink or grow flexible ones. */
function columnWidths(cols: Column[], target: number): number[] {
  const widths = cols.map(columnNaturalW);
  const gaps = Math.max(0, cols.length - 1) * TILE_GAP;
  for (let pass = 0; pass < 4; pass++) {
    const delta = target - gaps - widths.reduce((a, b) => a + b, 0);
    if (Math.abs(delta) < 0.5) break;
    const movable = cols
      .map((col, index) => ({ col, index }))
      .filter(({ col, index }) =>
        delta > 0
          ? widths[index]! < columnMaxW(col) - 0.5
          : widths[index]! > columnMinW(col) + 0.5,
      );
    if (movable.length === 0) break;
    const weight = movable.reduce((sum, { col }) => sum + columnNaturalW(col), 0);
    for (const { col, index } of movable) {
      const share = (delta * columnNaturalW(col)) / weight;
      widths[index] = Math.min(
        columnMaxW(col),
        Math.max(columnMinW(col), widths[index]! + share),
      );
    }
  }
  return widths.map((w) => Math.round(w));
}

/** Height a tile takes in a row of height `rowH`. */
function fitHeight(tile: BentoTile, rowH: number): number {
  if (!tile.flexible) return tile.natural.h;
  return Math.round(
    Math.max(tile.natural.h, Math.min(rowH, tile.natural.h * BENTO_HEIGHT_STRETCH_CEIL)),
  );
}

/**
 * Lay tiles into content-sized rows. `minWidth` lets the caller ask rows to
 * justify toward a width it already has (the chapter's conversation block), so
 * the artifacts end where the cards above them do when the tiles can reflow.
 */
export function packBentoGrid(
  input: BentoTile[],
  opts: { maxWidth?: number; minWidth?: number } = {},
): PackedBento {
  if (input.length === 0) return { placed: [], width: 0, height: 0 };
  const maxWidth = opts.maxWidth ?? CHAPTER_CONTENT_WIDTH;

  const tiles = [
    ...input.filter((t) => isFullRow(t, maxWidth)),
    ...input.filter((t) => !isFullRow(t, maxWidth)),
  ];
  const rows = buildRows(tiles, maxWidth);

  // Every row justifies toward the widest thing in the block — a timeline
  // included — so the right edges line up as far as reflowing tiles allow.
  const target = Math.min(
    maxWidth,
    Math.max(opts.minWidth ?? 0, ...rows.map((cols) => rowWidth(cols, columnNaturalW))),
  );

  const placed: PackedTile[] = [];
  let y = 0;
  let width = 0;
  for (const cols of rows) {
    const widths = columnWidths(cols, target);
    const rowH = rowAnchorH(cols);
    let x = 0;
    let bottom = 0;
    cols.forEach((col, index) => {
      const w = widths[index]!;
      if (col.tiles.length === 1) {
        const tile = col.tiles[0]!;
        const h = fitHeight(tile, rowH);
        placed.push({ id: tile.id, x, y, w: tile.flexible ? w : tile.natural.w, h });
        bottom = Math.max(bottom, h);
      } else {
        // A stack shares the row's height between its pair in proportion to
        // what each wants, so neither is squeezed below its natural height.
        const [a, b] = col.tiles as [BentoTile, BentoTile];
        const spare = Math.max(0, rowH - columnNaturalH(col));
        const flexA = a.flexible ? a.natural.h : 0;
        const flexB = b.flexible ? b.natural.h : 0;
        const total = flexA + flexB || 1;
        const hA = Math.round(a.natural.h + (spare * flexA) / total);
        const hB = Math.round(b.natural.h + (spare * flexB) / total);
        placed.push({ id: a.id, x, y, w: a.flexible ? w : a.natural.w, h: hA });
        placed.push({
          id: b.id,
          x,
          y: y + hA + TILE_GAP,
          w: b.flexible ? w : b.natural.w,
          h: hB,
        });
        bottom = Math.max(bottom, hA + TILE_GAP + hB);
      }
      width = Math.max(width, x + w);
      x += w + TILE_GAP;
    });
    y += bottom + TILE_GAP;
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

/**
 * Kinds whose node is sized to what they hold, so the packer never resizes
 * them: a table is as wide as its columns, a website is exactly its hero
 * image's aspect ratio or a favicon square, a timeline spans its own dates.
 * Stretching any of these pads empty space into the card; cropping a hero
 * would throw away the shape of the thing it shows.
 */
const CONTENT_SIZED_KINDS: ReadonlySet<string> = new Set([
  "table",
  "website",
  "timeline",
]);

/** Build the layout description of one artifact node: its content size, and whether it reflows. */
function bentoTileFor(
  nodeId: string,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  sessionArtifacts: Record<string, SessionArtifact>,
): BentoTile {
  const node = canvasArtifactNodes[nodeId]!;
  const artifact = sessionArtifacts[node.artifactId];
  const kind = artifact?.kind;
  return {
    id: nodeId,
    natural: getArtifactBounds(node, artifact),
    flexible: Boolean(kind) && !CONTENT_SIZED_KINDS.has(kind!),
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

    // Sticky notes sit outside the grid. STICKY_NOTE_MAX_WIDTH (400) is below
    // even the narrowest slot, so one can never fill a cell; and the skill calls
    // it the annotation layer rather than a chapter artifact. It is pinned in a
    // row under the bento instead.
    const gridIds: string[] = [];
    const stickyIds: string[] = [];
    for (const nodeId of artifactIds[index]!) {
      const node = canvasArtifactNodes[nodeId]!;
      const kind = sessionArtifacts[node.artifactId]?.kind;
      (kind === "stickynote" ? stickyIds : gridIds).push(nodeId);
    }

    // The divider rides in the middle of the band between the conversation
    // block and the artifacts — DIVIDER_GAP_Y of air on each side of it.
    const hasArtifacts = gridIds.length > 0 || stickyIds.length > 0;
    const dividerY = hasArtifacts ? cardsBottom + DIVIDER_GAP_Y : null;
    if (dividerY !== null) y = dividerY + DIVIDER_GAP_Y;

    const tiles: BentoTile[] = gridIds.map((nodeId) =>
      bentoTileFor(nodeId, canvasArtifactNodes, sessionArtifacts),
    );
    const bento = packBentoGrid(tiles, { minWidth: chapterRight - chapterX });
    for (const tile of bento.placed) {
      const node = canvasArtifactNodes[tile.id]!;
      node.position = { x: chapterX + tile.x, y: y + tile.y };
      node.size = { w: tile.w, h: tile.h };
      // Without this the runtime auto-measure floors every node at its kind
      // default and quietly undoes any cell narrower or shorter than that.
      node.layoutSetSize = true;
      chapterRight = Math.max(chapterRight, chapterX + tile.x + tile.w);
    }

    let contentBottom = hasArtifacts ? y + bento.height : cardsBottom;
    if (stickyIds.length > 0) {
      let stickyX = chapterX;
      const stickyY = bento.placed.length > 0 ? contentBottom + TILE_GAP : y;
      let stickyRowH = 0;
      for (const nodeId of stickyIds) {
        const node = canvasArtifactNodes[nodeId]!;
        const { w, h } = getArtifactBounds(
          node,
          sessionArtifacts[node.artifactId],
        );
        node.position = { x: stickyX, y: stickyY };
        stickyX += w + TILE_GAP;
        stickyRowH = Math.max(stickyRowH, h);
        chapterRight = Math.max(chapterRight, node.position.x + w);
      }
      contentBottom = stickyY + stickyRowH;
    }

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
