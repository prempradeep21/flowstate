import { describe, expect, it } from "vitest";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { computeGroupBounds } from "@/lib/groupBounds";
import type { CanvasNodesState } from "@/lib/canvasSelection";
import { buildDesignToolsCanvasSection } from "@/lib/transcriptImport/buildDesignToolsCanvasSection";
import { buildHubermanCanvasSection } from "@/lib/transcriptImport/buildHubermanCanvasSection";
import { buildJagadambaCanvasSection } from "@/lib/transcriptImport/buildJagadambaCanvasSection";
import { buildLightconeEmergentCanvasSection } from "@/lib/transcriptImport/buildLightconeEmergentCanvasSection";
import { buildRanaDaggubatiCanvasSection } from "@/lib/transcriptImport/buildRanaDaggubatiCanvasSection";
import { buildYcInterviewCanvasSection } from "@/lib/transcriptImport/buildYcInterviewCanvasSection";
import {
  BAND_SPLITS,
  BENTO_BAND_H,
  BENTO_COL_W,
  BENTO_ROW_H,
  BENTO_SQUEEZE_FLOOR,
  CHAPTER_CONTENT_WIDTH,
  TILE_GAP,
  bentoSpanWidth,
  packBentoGrid,
  type BentoTile,
} from "@/lib/transcriptImport/chapterLayout";
import {
  getArtifactLayoutFloors,
  getArtifactMaxSize,
  getDefaultArtifactSize,
} from "@/lib/canvasNodeBounds";
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
];

const LEGAL_SPANS = [2, 3, 4].map(bentoSpanWidth);
const COL_PITCH = BENTO_COL_W + TILE_GAP;
const ROW_PITCH = BENTO_ROW_H + TILE_GAP;

function tile(
  id: string,
  natural: { w: number; h: number },
  floor = natural,
  max = { w: 1200, h: 1170 },
): BentoTile {
  return { id, natural, floor, max };
}

/** The only artifacts allowed to sit outside every chapter — the masthead. */
const MASTHEAD_KINDS = new Set(["episode", "linkgroup"]);

describe("packBentoGrid", () => {
  const quote = (id: string) => tile(id, { w: 520, h: 240 });
  const website = (id: string) => tile(id, { w: 520, h: 400 });
  const table = (id: string) =>
    tile(id, { w: 680, h: 512 }, { w: 680, h: 512 });

  it("is empty for no tiles", () => {
    expect(packBentoGrid([])).toEqual({ placed: [], width: 0, height: 0 });
  });

  it("hugs a lone tile instead of padding out the full grid", () => {
    const packed = packBentoGrid([quote("solo")]);
    expect(packed.placed).toHaveLength(1);
    expect(packed.width).toBe(bentoSpanWidth(2));
    expect(packed.width).toBeLessThan(CHAPTER_CONTENT_WIDTH);
  });

  it("lands every tile on the column and row lattice", () => {
    const packed = packBentoGrid([
      quote("a"),
      website("b"),
      table("c"),
      quote("d"),
      website("e"),
    ]);
    for (const t of packed.placed) {
      expect(t.x % COL_PITCH).toBe(0);
      expect(t.y % ROW_PITCH).toBe(0);
      expect(LEGAL_SPANS).toContain(t.w);
      expect([BENTO_ROW_H, BENTO_BAND_H]).toContain(t.h);
    }
  });

  it("fills every band to exactly six columns", () => {
    const packed = packBentoGrid([
      quote("a"),
      quote("b"),
      quote("c"),
      website("d"),
      table("e"),
      quote("f"),
    ]);
    const byBand = new Map<number, typeof packed.placed>();
    for (const t of packed.placed) {
      const band = Math.floor(t.y / ROW_PITCH);
      byBand.set(band, [...(byBand.get(band) ?? []), t]);
    }
    // A band is full when its distinct column starts tile the six columns.
    for (const tiles of byBand.values()) {
      const columns = new Map<number, number>();
      for (const t of tiles) columns.set(t.x, t.w);
      const cols = [...columns.values()].reduce(
        (sum, w) => sum + Math.round((w + TILE_GAP) / COL_PITCH),
        0,
      );
      expect([6, 2, 3, 4]).toContain(cols);
    }
  });

  it("never places a tile below its floor or above its max", () => {
    const packed = packBentoGrid([table("t1"), quote("q1"), table("t2")]);
    const floors: Record<string, { w: number; h: number }> = {
      t1: { w: 680, h: 512 },
      t2: { w: 680, h: 512 },
      q1: { w: 520, h: 240 },
    };
    for (const t of packed.placed) {
      expect(t.w).toBeGreaterThanOrEqual(floors[t.id]!.w);
      expect(t.h).toBeGreaterThanOrEqual(floors[t.id]!.h);
    }
  });

  it("gives a full-bleed tile its own band and widens the grid", () => {
    const timeline = tile(
      "timeline",
      { w: 1920, h: 480 },
      { w: 1920, h: 480 },
      { w: 2800, h: 1170 },
    );
    const packed = packBentoGrid([quote("a"), timeline, quote("b")]);
    const placedTimeline = packed.placed.find((t) => t.id === "timeline")!;
    expect(placedTimeline.y).toBe(0); // hoisted to the front
    expect(placedTimeline.w).toBe(1920);
    expect(packed.width).toBe(1920);
    for (const other of packed.placed.filter((t) => t.id !== "timeline")) {
      expect(other.y).toBeGreaterThan(0);
    }
  });

  it("stacks two short tiles inside one tall slot, gutter exact", () => {
    const packed = packBentoGrid([
      website("tall"),
      quote("short-a"),
      quote("short-b"),
    ]);
    const a = packed.placed.find((t) => t.id === "short-a")!;
    const b = packed.placed.find((t) => t.id === "short-b")!;
    expect(a.x).toBe(b.x);
    expect(a.w).toBe(b.w);
    expect(a.h).toBe(BENTO_ROW_H);
    expect(b.y - (a.y + a.h)).toBe(TILE_GAP);
  });

  it("is deterministic", () => {
    const build = () => [quote("a"), website("b"), table("c"), quote("d")];
    expect(packBentoGrid(build())).toEqual(packBentoGrid(build()));
  });

  it("never overlaps", () => {
    const packed = packBentoGrid(
      Array.from({ length: 9 }, (_, i) =>
        i % 3 === 0 ? website(`w${i}`) : quote(`q${i}`),
      ),
    );
    expect(packed.placed).toHaveLength(9);
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
