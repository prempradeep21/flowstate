import {
  getArtifactBounds,
  getArtifactLayoutFloors,
  getArtifactMaxSize,
  getCardBounds,
} from "@/lib/canvasNodeBounds";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
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
 * heads the chapter (title + summary), its sub-branch cards sit in rows under
 * it, and the artifacts it produced fill a bento grid below those. Each
 * chapter becomes a BranchGroup, so the box around it is derived, not authored.
 *
 * Builders author CONTENT ONLY — every position here is computed from measured
 * node sizes (getCardBounds / getArtifactBounds), never from a per-transcript
 * magic offset.
 */

/** Gap between tiles inside a chapter, horizontally and vertically. */
export const TILE_GAP = 48;
/** Gap between the chapter's title card and the content beneath it. */
export const HEAD_GAP_Y = 64;
/** Gap between one chapter's box and the next. */
export const CHAPTER_GAP_X = 260;
/** Bento width — the full six-column grid. Only full-bleed tiles exceed it. */
export const CHAPTER_CONTENT_WIDTH = 520 * 3 + TILE_GAP * 2;

/*
 * The bento grid.
 *
 * Six columns across CHAPTER_CONTENT_WIDTH with one uniform TILE_GAP gutter, so
 * every tile edge lands on a shared lattice no matter its size. Column width is
 * exact: (1656 - 5*48) / 6 = 236.
 *
 * Span 1 (236) is below MIN_ARTIFACT_WIDTH, and spans 5 and 6 exceed
 * MAX_ARTIFACT_WIDTH, so the usable vocabulary is {2, 3, 4} = 520 / 804 / 1088 —
 * a third, a half, two thirds. Rows must sum to six columns, which admits
 * exactly the four splits in BAND_SPLITS. That closed vocabulary is what makes
 * the result read as designed rather than packed.
 */
export const BENTO_COLS = 6;
export const BENTO_COL_W =
  (CHAPTER_CONTENT_WIDTH - TILE_GAP * (BENTO_COLS - 1)) / BENTO_COLS;
/** Height of one short tile. A tall tile is two of these plus the gutter. */
export const BENTO_ROW_H = 240;
/** 240 + 48 + 240 — so one tall slot is exactly a stacked pair of short tiles. */
export const BENTO_BAND_H = BENTO_ROW_H * 2 + TILE_GAP;
/** The only legal column compositions of the six-column grid. */
export const BAND_SPLITS: readonly (readonly number[])[] = [
  [2, 2, 2],
  [3, 3],
  [4, 2],
  [2, 4],
];
/**
 * A tile may be squeezed to at most this fraction of its natural height. The
 * artifact stage is overflow-hidden rather than scrollable, so an undersized
 * node truncates its content — this bound is correctness, not taste.
 */
export const BENTO_SQUEEZE_FLOOR = 0.9;
/** Cost of repeating the previous band's split — the "don't degrade into a table" term. */
const BAND_REPEAT_PENALTY = 0.35;
/** Cost of giving a tile a band to itself. A last resort, never a failure. */
const ORPHAN_BAND_PENALTY = 3;

export function bentoSpanWidth(cols: number): number {
  return cols * BENTO_COL_W + (cols - 1) * TILE_GAP;
}

export interface BentoTile {
  id: string;
  /** The size the kind wants — what it renders at with no layout pressure. */
  natural: { w: number; h: number };
  /** Smallest box that shows its content without clipping. */
  floor: { w: number; h: number };
  /** Largest box it may be stretched to. */
  max: { w: number; h: number };
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

/** Smallest legal span that clears a tile's width floor, or null if none does. */
function minSpanFor(tile: BentoTile): number | null {
  for (const cols of [2, 3, 4]) {
    if (bentoSpanWidth(cols) >= tile.floor.w) return cols;
  }
  return null;
}

/** A tile too wide for even a four-column slot takes a band of its own. */
function isFullBleed(tile: BentoTile): boolean {
  return minSpanFor(tile) === null;
}

/** Lattice height for a band of `rows` short rows: 240, 528, 816, 1104 ... */
export function bentoBandHeight(rows: number): number {
  return rows * BENTO_ROW_H + (rows - 1) * TILE_GAP;
}

/**
 * Height for a tile that gets a band to itself: the smallest lattice height that
 * shows it whole. A solo tile is already a compromise, so it is never squeezed —
 * only the last resort of exceeding the kind's own maximum is clamped away.
 */
function soloHeight(tile: BentoTile): number {
  const needed = Math.max(tile.floor.h, tile.natural.h);
  for (let rows = 1; rows <= 8; rows++) {
    const h = bentoBandHeight(rows);
    if (h >= needed) return Math.min(h, Math.max(tile.max.h, needed));
  }
  return Math.min(bentoBandHeight(8), Math.max(tile.max.h, needed));
}

/** Can this tile live in a 240px row without clipping or over-squeezing? */
function isShortCapable(tile: BentoTile): boolean {
  return (
    tile.floor.h <= BENTO_ROW_H &&
    tile.natural.h * BENTO_SQUEEZE_FLOOR <= BENTO_ROW_H
  );
}

/**
 * What placing `tile` at this size costs. Infinity means it would clip or
 * exceed the kind's own maximum, so the packer must not choose it at all.
 *
 * Squeezing height is weighted far above stretching because stretching leaves
 * air inside a card while squeezing cuts content off.
 */
function tileCost(tile: BentoTile, w: number, h: number): number {
  if (w < tile.floor.w || h < tile.floor.h) return Infinity;
  if (w > tile.max.w || h > tile.max.h) return Infinity;
  if (h < tile.natural.h * BENTO_SQUEEZE_FLOOR) return Infinity;
  const squeezeH = Math.max(0, (tile.natural.h - h) / tile.natural.h);
  const stretchH = Math.max(0, (h - tile.natural.h) / tile.natural.h);
  const stretchW = Math.max(0, (w - tile.natural.w) / tile.natural.w);
  return 4 * squeezeH + stretchH + 0.6 * stretchW;
}

interface BandPlan {
  /** Index into BAND_SPLITS, or -1 for a full-bleed or orphan band. */
  splitIndex: number;
  height: number;
  consumed: number;
  cost: number;
  place: (originY: number) => PackedTile[];
}

/** Every band that could start at `start`, given the tiles that follow it. */
function candidateBands(tiles: BentoTile[], start: number): BandPlan[] {
  const out: BandPlan[] = [];
  const head = tiles[start]!;

  if (isFullBleed(head)) {
    const w = Math.max(head.natural.w, head.floor.w);
    const h = soloHeight(head);
    out.push({
      splitIndex: -1,
      height: h,
      consumed: 1,
      cost: Number.isFinite(tileCost(head, w, h)) ? tileCost(head, w, h) : 0,
      place: (originY) => [{ id: head.id, x: 0, y: originY, w, h }],
    });
    return out;
  }

  for (let splitIndex = 0; splitIndex < BAND_SPLITS.length; splitIndex++) {
    const split = BAND_SPLITS[splitIndex]!;
    const slots = split.length;

    // Short band: one short tile per slot, the whole band only 240 tall.
    if (start + slots <= tiles.length) {
      let cost = 0;
      let ok = true;
      for (let k = 0; k < slots; k++) {
        const tile = tiles[start + k]!;
        if (isFullBleed(tile) || !isShortCapable(tile)) {
          ok = false;
          break;
        }
        cost += tileCost(tile, bentoSpanWidth(split[k]!), BENTO_ROW_H);
      }
      if (ok && cost < Infinity) {
        out.push({
          splitIndex,
          height: BENTO_ROW_H,
          consumed: slots,
          cost,
          place: (originY) => {
            const placed: PackedTile[] = [];
            let x = 0;
            for (let k = 0; k < slots; k++) {
              const w = bentoSpanWidth(split[k]!);
              placed.push({
                id: tiles[start + k]!.id,
                x,
                y: originY,
                w,
                h: BENTO_ROW_H,
              });
              x += w + TILE_GAP;
            }
            return placed;
          },
        });
      }
    }

    // Tall band: each slot is either one full-height tile or a stacked pair.
    for (let mask = 0; mask < 1 << slots; mask++) {
      let cursor = start;
      let cost = 0;
      let ok = true;
      const assignment: { tiles: BentoTile[]; cols: number }[] = [];
      for (let k = 0; k < slots && ok; k++) {
        const cols = split[k]!;
        const w = bentoSpanWidth(cols);
        const stacked = (mask >> k) & 1;
        if (stacked) {
          const a = tiles[cursor];
          const b = tiles[cursor + 1];
          if (!a || !b || !isShortCapable(a) || !isShortCapable(b)) {
            ok = false;
            break;
          }
          if (isFullBleed(a) || isFullBleed(b)) {
            ok = false;
            break;
          }
          cost += tileCost(a, w, BENTO_ROW_H) + tileCost(b, w, BENTO_ROW_H);
          assignment.push({ tiles: [a, b], cols });
          cursor += 2;
        } else {
          const a = tiles[cursor];
          if (!a || isFullBleed(a)) {
            ok = false;
            break;
          }
          cost += tileCost(a, w, BENTO_BAND_H);
          assignment.push({ tiles: [a], cols });
          cursor += 1;
        }
      }
      if (!ok || !Number.isFinite(cost)) continue;
      const consumed = cursor - start;
      out.push({
        splitIndex,
        height: BENTO_BAND_H,
        consumed,
        cost,
        place: (originY) => {
          const placed: PackedTile[] = [];
          let x = 0;
          for (const slot of assignment) {
            const w = bentoSpanWidth(slot.cols);
            if (slot.tiles.length === 2) {
              placed.push({ id: slot.tiles[0]!.id, x, y: originY, w, h: BENTO_ROW_H });
              placed.push({
                id: slot.tiles[1]!.id,
                x,
                y: originY + BENTO_ROW_H + TILE_GAP,
                w,
                h: BENTO_ROW_H,
              });
            } else {
              placed.push({
                id: slot.tiles[0]!.id,
                x,
                y: originY,
                w,
                h: BENTO_BAND_H,
              });
            }
            x += w + TILE_GAP;
          }
          return placed;
        },
      });
    }
  }

  // A band holding this tile alone, always legal, so the search cannot fail and
  // no artifact can ever be left unplaced at the origin.
  const cols = minSpanFor(head)!;
  const w = bentoSpanWidth(cols);
  const h = isShortCapable(head) ? BENTO_ROW_H : soloHeight(head);
  const orphanCost = tileCost(head, w, h);
  out.push({
    splitIndex: -1,
    height: h,
    consumed: 1,
    cost: (Number.isFinite(orphanCost) ? orphanCost : 0) + ORPHAN_BAND_PENALTY,
    place: (originY) => [{ id: head.id, x: 0, y: originY, w, h }],
  });
  return out;
}

/**
 * Lay tiles into bands, in order, choosing the cheapest legal program.
 *
 * The search is a small dynamic program over (tile index, previous split), which
 * is what lets the repeat penalty see the band before it. With at most a handful
 * of artifacts per chapter and four splits, the whole space is a few hundred
 * states — exhaustive, deterministic, and identical on every run.
 *
 * Full-bleed tiles are hoisted to the front. One sitting mid-sequence would cut
 * the chapter into two independently-tileable halves and strand the remainder in
 * orphan bands; a timeline summarises its whole chapter, so leading with it
 * reads as intentional. It is the one documented departure from transcript order.
 */
export function packBentoGrid(input: BentoTile[]): PackedBento {
  if (input.length === 0) return { placed: [], width: 0, height: 0 };

  const tiles = [
    ...input.filter((t) => isFullBleed(t)),
    ...input.filter((t) => !isFullBleed(t)),
  ];

  const SPLIT_STATES = BAND_SPLITS.length + 1; // +1 for "no previous band"
  const best: (number | null)[][] = tiles.map(() =>
    new Array<number | null>(SPLIT_STATES).fill(null),
  );
  const choice: (BandPlan | null)[][] = tiles.map(() =>
    new Array<BandPlan | null>(SPLIT_STATES).fill(null),
  );

  const solve = (i: number, prev: number): number => {
    if (i >= tiles.length) return 0;
    const cached = best[i]![prev];
    if (cached !== null) return cached;
    best[i]![prev] = Infinity; // guard; bands always consume >= 1 so no cycles
    let bestCost = Infinity;
    let bestPlan: BandPlan | null = null;
    for (const band of candidateBands(tiles, i)) {
      const penalty =
        band.splitIndex >= 0 && band.splitIndex === prev - 1
          ? BAND_REPEAT_PENALTY
          : 0;
      const nextPrev = band.splitIndex >= 0 ? band.splitIndex + 1 : 0;
      const total =
        band.cost + penalty + solve(i + band.consumed, nextPrev);
      if (total < bestCost) {
        bestCost = total;
        bestPlan = band;
      }
    }
    best[i]![prev] = bestCost;
    choice[i]![prev] = bestPlan;
    return bestCost;
  };

  solve(0, 0);

  const placed: PackedTile[] = [];
  let y = 0;
  let width = 0;
  let i = 0;
  let prev = 0;
  while (i < tiles.length) {
    const band = choice[i]![prev];
    if (!band) break; // unreachable: an orphan band always exists
    for (const tile of band.place(y)) {
      placed.push(tile);
      width = Math.max(width, tile.x + tile.w);
    }
    y += band.height + TILE_GAP;
    i += band.consumed;
    prev = band.splitIndex >= 0 ? band.splitIndex + 1 : 0;
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
export const CHAPTER_ACCENTS = [
  "#D2537E",
  "#2F9E68",
  "#B5820B",
  "#8B4FD1",
  "#2A8FBD",
  "#D06A2C",
  "#5B62D6",
] as const;

export function chapterAccent(index: number): string {
  return CHAPTER_ACCENTS[index % CHAPTER_ACCENTS.length]!;
}

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

/** Build the layout description of one artifact node: natural size, floor, max. */
function bentoTileFor(
  nodeId: string,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  sessionArtifacts: Record<string, SessionArtifact>,
): BentoTile {
  const node = canvasArtifactNodes[nodeId]!;
  const artifact = sessionArtifacts[node.artifactId];
  const payload = artifact?.versions.find(
    (v) => v.id === artifact.latestVersionId,
  )?.payload;
  const kind = artifact?.kind;
  const natural = getArtifactBounds(node, artifact);
  if (!kind) {
    return { id: nodeId, natural, floor: natural, max: natural };
  }
  return {
    id: nodeId,
    natural,
    floor: getArtifactLayoutFloors(kind, payload),
    max: getArtifactMaxSize(kind),
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
      const { w, h } = getArtifactBounds(node, sessionArtifacts[node.artifactId]);
      node.position = { x: originX, y: mastheadY };
      mastheadY += h + TILE_GAP;
      mastheadRight = Math.max(mastheadRight, originX + w);
    }
    chapterX = mastheadRight + CHAPTER_GAP_X;
  }

  mainCardIds.forEach((mainId, index) => {
    const head = cards[mainId];
    if (!head) return;
    const headSize = getCardBounds(head);
    head.position = { x: chapterX, y: originY };

    // Sub-branch cards: one row per thread, so the right/left connectors
    // between consecutive cards in a thread always land side by side.
    const subRows: string[][] = [];
    const rowOfThread = new Map<string, string[]>();
    for (const id of subCardIds[index]!) {
      const threadId = cards[id]?.threadId ?? "";
      let row = rowOfThread.get(threadId);
      if (!row) {
        row = [];
        rowOfThread.set(threadId, row);
        subRows.push(row);
      }
      row.push(id);
    }

    let contentWidth = CHAPTER_CONTENT_WIDTH;
    for (const row of subRows) {
      const rowW =
        row.reduce((sum, id) => sum + getCardBounds(cards[id]!).w, 0) +
        TILE_GAP * Math.max(0, row.length - 1);
      contentWidth = Math.max(contentWidth, rowW);
    }

    // The box is derived from where members actually land, so the advance has
    // to track the same extent — otherwise a thin chapter leaves a wide gap.
    let chapterRight = chapterX + headSize.w;

    let y = originY + headSize.h + HEAD_GAP_Y;
    for (const row of subRows) {
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

    const tiles: BentoTile[] = gridIds.map((nodeId) =>
      bentoTileFor(nodeId, canvasArtifactNodes, sessionArtifacts),
    );
    const bento = packBentoGrid(tiles);
    for (const tile of bento.placed) {
      const node = canvasArtifactNodes[tile.id]!;
      node.position = { x: chapterX + tile.x, y: y + tile.y };
      node.size = { w: tile.w, h: tile.h };
      // Without this the runtime auto-measure floors every node at its kind
      // default and quietly undoes any cell narrower or shorter than that.
      node.layoutSetSize = true;
      chapterRight = Math.max(chapterRight, chapterX + tile.x + tile.w);
    }

    let contentBottom = y + bento.height;
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
      accentColour: chapterAccent(index),
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
): Connection[] {
  const out: Connection[] = [];
  for (const connection of connections) {
    const fromChapter = chapterIndexOfCard.get(connection.from);
    const toChapter = chapterIndexOfCard.get(connection.to);
    const fromIsMain = mainCardIds.has(connection.from);

    // Head-to-head links land here too: consecutive heads are always in
    // different chapters, so this drops the inter-chapter spine.
    if (fromChapter !== toChapter) continue;
    if (fromIsMain) {
      out.push({ ...connection, fromSide: "bottom", toSide: "top" });
      continue;
    }
    // Sub cards share a row only when they share a thread; otherwise the
    // target sits in a row further down.
    const sameRow =
      cards[connection.from]?.threadId === cards[connection.to]?.threadId;
    out.push(
      sameRow
        ? { ...connection, fromSide: "right", toSide: "left" }
        : { ...connection, fromSide: "bottom", toSide: "top" },
    );
  }
  return out;
}
