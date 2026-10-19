import { describe, expect, it } from "vitest";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { computeGroupBounds } from "@/lib/groupBounds";
import type { CanvasNodesState } from "@/lib/canvasSelection";
import { buildDesignToolsCanvasSection } from "@/lib/transcriptImport/buildDesignToolsCanvasSection";
import { buildHubermanCanvasSection } from "@/lib/transcriptImport/buildHubermanCanvasSection";
import { buildJagadambaCanvasSection } from "@/lib/transcriptImport/buildJagadambaCanvasSection";
import { buildKunalShahHiringCanvasSection } from "@/lib/transcriptImport/buildKunalShahHiringCanvasSection";
import { buildLightconeEmergentCanvasSection } from "@/lib/transcriptImport/buildLightconeEmergentCanvasSection";
import { buildNithinKamathRiskCanvasSection } from "@/lib/transcriptImport/buildNithinKamathRiskCanvasSection";
import { buildAllariNareshCanvasSection } from "@/lib/transcriptImport/buildAllariNareshCanvasSection";
import { buildRanaDaggubatiCanvasSection } from "@/lib/transcriptImport/buildRanaDaggubatiCanvasSection";
import { buildYcInterviewCanvasSection } from "@/lib/transcriptImport/buildYcInterviewCanvasSection";
import {
  CHAPTER_CONTENT_WIDTH,
  TILE_GAP,
  packJustifiedRows,
  tileZoomRange,
  type PackedRows,
  type RowTile,
} from "@/lib/transcriptImport/chapterLayout";
import type { TranscriptImportCanvasSection } from "@/lib/transcriptImport/playgroundLayout";

interface Rect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function nodeRects(section: TranscriptImportCanvasSection): Rect[] {
  const rects: Rect[] = [];
  for (const id of section.cardOrder) {
    const card = section.cards[id]!;
    const { w, h } = getCardBounds(card);
    rects.push({ id, x: card.position.x, y: card.position.y, w, h });
  }
  for (const id of section.canvasArtifactOrder) {
    const node = section.canvasArtifactNodes[id]!;
    const { w, h } = getArtifactBounds(
      node,
      section.sessionArtifacts[node.artifactId],
    );
    rects.push({ id, x: node.position.x, y: node.position.y, w, h });
  }
  return rects;
}

/** The slice of store state computeGroupBounds reads. */
function nodesState(
  section: TranscriptImportCanvasSection,
): CanvasNodesState {
  return {
    cards: section.cards,
    cardOrder: section.cardOrder,
    connections: section.connections,
    threads: section.threads,
    threadOrder: section.threadOrder,
    canvasArtifactNodes: section.canvasArtifactNodes,
    canvasArtifactOrder: section.canvasArtifactOrder,
    sessionArtifacts: section.sessionArtifacts,
    canvasAssets: {},
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasSkills: {},
    canvasSkillNodes: {},
    canvasSkillOrder: [],
    canvasGifNodes: {},
    canvasGifOrder: [],
    canvas3DNodes: {},
    canvas3DOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
  } as unknown as CanvasNodesState;
}

const SECTIONS: [string, () => TranscriptImportCanvasSection][] = [
  ["design tools", buildDesignToolsCanvasSection],
  ["yc interview", buildYcInterviewCanvasSection],
  ["huberman", buildHubermanCanvasSection],
  ["rana daggubati", buildRanaDaggubatiCanvasSection],
  ["jagadamba", buildJagadambaCanvasSection],
  ["lightcone emergent", buildLightconeEmergentCanvasSection],
  ["kunal shah", buildKunalShahHiringCanvasSection],
  ["nithin kamath", buildNithinKamathRiskCanvasSection],
  ["allari naresh", buildAllariNareshCanvasSection],
];

function tile(id: string, kind: string, natural: { w: number; h: number }): RowTile {
  return { id, kind, natural };
}

/**
 * The only artifacts allowed to sit outside every chapter — the masthead. A
 * chart is allowed there for the episode-level measured series (airtime per
 * chapter, theme counts per chapter), which belong to no single chapter.
 */
const MASTHEAD_KINDS = new Set(["episode", "linkgroup", "chart"]);

describe("packJustifiedRows", () => {
  const quote = (id: string) => tile(id, "quote", { w: 520, h: 240 });
  const stat = (id: string) => tile(id, "stat", { w: 380, h: 260 });
  const claim = (id: string) => tile(id, "claim", { w: 680, h: 420 });
  const table = (id: string, w = 584) => tile(id, "table", { w, h: 423 });
  const favicon = (id: string) => tile(id, "website", { w: 280, h: 280 });
  const poster = (id: string) => tile(id, "website", { w: 448, h: 648 });
  const sticky = (id: string) => tile(id, "stickynote", { w: 240, h: 248 });
  const timeline = (id: string) => tile(id, "timeline", { w: 1920, h: 480 });

  const byId = (packed: PackedRows, id: string) =>
    packed.placed.find((t) => t.id === id)!;

  /** Tiles grouped into rows by their shared top edge. */
  const rowsOf = (packed: PackedRows) => {
    const rows = new Map<number, PackedRows["placed"]>();
    for (const t of packed.placed) rows.set(t.y, [...(rows.get(t.y) ?? []), t]);
    return [...rows.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, tiles]) => tiles.sort((a, b) => a.x - b.x));
  };

  const mixed = () => [
    quote("q1"),
    poster("p1"),
    stat("s1"),
    table("t1"),
    sticky("n1"),
    quote("q2"),
    claim("c1"),
    favicon("f1"),
    poster("p2"),
    stat("s2"),
  ];

  it("is empty for no tiles", () => {
    expect(packJustifiedRows([])).toEqual({ placed: [], width: 0, height: 0 });
  });

  it("keeps every tile at its own aspect ratio, scaled within its range", () => {
    const tiles = mixed();
    const packed = packJustifiedRows(tiles, { minWidth: 1356 });
    for (const t of tiles) {
      const p = byId(packed, t.id);
      const [min, max] = tileZoomRange(t);
      expect(p.zoom).toBeGreaterThanOrEqual(min - 0.01);
      expect(p.zoom).toBeLessThanOrEqual(max + 0.01);
      // Rounded to whole pixels, so allow a pixel either way.
      expect(Math.abs(p.w - t.natural.w * p.zoom)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.h - t.natural.h * p.zoom)).toBeLessThanOrEqual(1);
    }
  });

  it("gives every tile in a row one height, with exact gutters across and down", () => {
    const packed = packJustifiedRows(mixed(), { minWidth: 1356 });
    const rows = rowsOf(packed);
    for (const row of rows) {
      for (const t of row) expect(t.h).toBe(row[0]!.h);
      for (let i = 1; i < row.length; i++) {
        expect(row[i]!.x).toBe(row[i - 1]!.x + row[i - 1]!.w + TILE_GAP);
      }
    }
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]![0]!.y).toBe(rows[i - 1]![0]!.y + rows[i - 1]![0]!.h + TILE_GAP);
    }
  });

  it("runs rows flush to the card block when the tiles can fill it", () => {
    const tiles = Array.from({ length: 6 }, (_, i) => quote(`q${i}`));
    const packed = packJustifiedRows(tiles, { minWidth: 1356 });
    const rows = rowsOf(packed);
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
      const last = row[row.length - 1]!;
      expect(Math.abs(last.x + last.w - 1356)).toBeLessThanOrEqual(row.length);
    }
  });

  it("heads the block with a full-width strip", () => {
    const packed = packJustifiedRows([quote("a"), timeline("tl"), quote("b")], {
      minWidth: CHAPTER_CONTENT_WIDTH,
    });
    expect(byId(packed, "tl")).toMatchObject({ x: 0, y: 0 });
    for (const other of packed.placed.filter((t) => t.id !== "tl")) {
      expect(other.y).toBeGreaterThan(0);
    }
  });

  it("starts with the text cards, and only pulls pictures forward to share a row", () => {
    const packed = packJustifiedRows(
      [sticky("n"), poster("p"), quote("q"), stat("s")],
      { minWidth: 900 },
    );
    const first = [...packed.placed].sort((a, b) => a.y - b.y || a.x - b.x)[0]!;
    expect(first.id).toBe("q");
    // A picture or sticky never opens a row while text is still unplaced.
    const rows = rowsOf(packed);
    const textRows = rows.filter((row) => row.some((t) => t.id === "q" || t.id === "s"));
    expect(rows.indexOf(textRows[textRows.length - 1]!)).toBeLessThanOrEqual(textRows.length - 1);
  });

  it("pairs height-compatible tiles rather than leaving each on its own row", () => {
    // In shape order the to-do sits between quotes it can't share a height
    // with; the poster further down can.
    const todo = tile("todo", "todo", { w: 520, h: 440 });
    const packed = packJustifiedRows(
      [quote("q1"), quote("q2"), todo, quote("q3"), poster("p")],
      { minWidth: 1104 },
    );
    const rows = rowsOf(packed);
    const todoRow = rows.find((row) => row.some((t) => t.id === "todo"))!;
    expect(todoRow.map((t) => t.id)).toContain("p");
  });

  it("never runs wider than the block it chose", () => {
    const packed = packJustifiedRows(mixed(), { minWidth: 1356 });
    for (const t of packed.placed) expect(t.x + t.w).toBeLessThanOrEqual(packed.width);
  });

  it("is deterministic", () => {
    expect(packJustifiedRows(mixed(), { minWidth: 1356 })).toEqual(
      packJustifiedRows(mixed(), { minWidth: 1356 }),
    );
  });

  it("never overlaps", () => {
    const tiles = Array.from({ length: 13 }, (_, i) =>
      [quote, claim, table, favicon, poster, stat, sticky][i % 7]!(`n${i}`),
    );
    const packed = packJustifiedRows(tiles, { minWidth: 1824 });
    expect(packed.placed).toHaveLength(13);
    for (let i = 0; i < packed.placed.length; i++) {
      for (let j = i + 1; j < packed.placed.length; j++) {
        expect(overlaps(packed.placed[i]!, packed.placed[j]!)).toBe(false);
      }
    }
  });
});

describe.each(SECTIONS)("%s chapter layout", (_name, build) => {
  const section = build();

  it("places every node without overlap", () => {
    const rects = nodeRects(section);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]!;
        const b = rects[j]!;
        expect(
          overlaps(a, b),
          `${a.id} overlaps ${b.id}`,
        ).toBe(false);
      }
    }
  });

  it("draws every chapter artifact whole: box = natural size × its zoom", () => {
    for (const group of Object.values(section.groups)) {
      for (const item of group.items ?? []) {
        const node = section.canvasArtifactNodes[item.id]!;
        const art = section.sessionArtifacts[node.artifactId];
        const natural = getArtifactBounds({ size: undefined }, art);
        const zoom = node.contentZoom ?? 1;
        const drawn = getArtifactBounds(node, art);
        expect(Math.abs(drawn.w - natural.w * zoom), item.id).toBeLessThanOrEqual(1);
        expect(Math.abs(drawn.h - natural.h * zoom), item.id).toBeLessThanOrEqual(1);
      }
    }
  });

  it("names every card and artifact in exactly one chapter, masthead aside", () => {
    const groups = Object.values(section.groups);
    expect(groups.length).toBeGreaterThan(0);

    const cardIds = groups.flatMap((g) => g.cardIds ?? []);
    const artifactIds = groups.flatMap((g) =>
      (g.items ?? []).map((item) => item.id),
    );
    expect(new Set(cardIds).size).toBe(cardIds.length);
    expect(new Set(artifactIds).size).toBe(artifactIds.length);
    expect([...cardIds].sort()).toEqual([...section.cardOrder].sort());

    // The masthead describes the source rather than any beat inside it, so it
    // belongs to no chapter. That exemption is deliberately narrow: the only
    // artifacts allowed outside a group are the two masthead kinds.
    const grouped = new Set(artifactIds);
    const ungrouped = section.canvasArtifactOrder.filter((id) => !grouped.has(id));
    for (const id of ungrouped) {
      const node = section.canvasArtifactNodes[id]!;
      const kind = section.sessionArtifacts[node.artifactId]!.kind;
      expect(MASTHEAD_KINDS.has(kind), `${id} (${kind}) is outside every chapter`).toBe(true);
    }
    expect([...artifactIds, ...ungrouped].sort()).toEqual(
      [...section.canvasArtifactOrder].sort(),
    );
  });

  it("puts the masthead left of every chapter, and indexes real groups", () => {
    const state = nodesState(section);
    const grouped = new Set(
      Object.values(section.groups).flatMap((g) =>
        (g.items ?? []).map((item) => item.id),
      ),
    );
    const masthead = section.canvasArtifactOrder.filter((id) => !grouped.has(id));
    expect(masthead.length).toBeGreaterThan(0);

    const mastheadRight = Math.max(
      ...masthead.map((id) => {
        const node = section.canvasArtifactNodes[id]!;
        const { w } = getArtifactBounds(
          node,
          section.sessionArtifacts[node.artifactId],
        );
        return node.position.x + w;
      }),
    );
    for (const group of Object.values(section.groups)) {
      const bounds = computeGroupBounds(state, group)!;
      expect(bounds.x, `${group.label} starts left of the masthead`).toBeGreaterThan(
        mastheadRight,
      );
    }

    // Every row of the chapter index has to name a group that exists, or the
    // click is a no-op the reader cannot distinguish from a broken control.
    for (const id of masthead) {
      const node = section.canvasArtifactNodes[id]!;
      const payload = section.sessionArtifacts[node.artifactId]!.versions[0]!.payload;
      if (payload.type !== "episode") continue;
      expect(payload.data.chapters.length).toBeGreaterThan(0);
      for (const chapter of payload.data.chapters) {
        expect(
          Object.keys(section.groups),
          `chapter "${chapter.label}" points at ${chapter.groupId}`,
        ).toContain(chapter.groupId);
      }
    }
  });

  it("keeps chapter boxes disjoint and members inside their own box", () => {
    const state = nodesState(section);
    const boxes: Rect[] = [];
    for (const group of Object.values(section.groups)) {
      const bounds = computeGroupBounds(state, group);
      expect(bounds, `${group.label} has no bounds`).not.toBeNull();
      boxes.push({ id: group.label, ...bounds! });

      for (const cardId of group.cardIds ?? []) {
        const card = section.cards[cardId]!;
        const { w, h } = getCardBounds(card);
        expect(card.position.x).toBeGreaterThanOrEqual(bounds!.x);
        expect(card.position.y).toBeGreaterThanOrEqual(bounds!.y);
        expect(card.position.x + w).toBeLessThanOrEqual(bounds!.x + bounds!.w);
        expect(card.position.y + h).toBeLessThanOrEqual(bounds!.y + bounds!.h);
      }
    }

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(
          overlaps(boxes[i]!, boxes[j]!),
          `${boxes[i]!.id} overlaps ${boxes[j]!.id}`,
        ).toBe(false);
      }
    }
  });
});
