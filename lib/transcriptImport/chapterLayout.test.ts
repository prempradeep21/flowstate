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
  BENTO_SHRINK_FLOOR,
  CHAPTER_CONTENT_WIDTH,
  TILE_GAP,
  packBentoGrid,
  type BentoTile,
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

function tile(
  id: string,
  natural: { w: number; h: number },
  flexible = true,
): BentoTile {
  return { id, natural, flexible };
}

/**
 * The only artifacts allowed to sit outside every chapter — the masthead. A
 * chart is allowed there for the episode-level measured series (airtime per
 * chapter, theme counts per chapter), which belong to no single chapter.
 */
const MASTHEAD_KINDS = new Set(["episode", "linkgroup", "chart"]);

describe("packBentoGrid", () => {
  const quote = (id: string) => tile(id, { w: 520, h: 240 });
  const claim = (id: string) => tile(id, { w: 680, h: 420 });
  const table = (id: string, w = 584) => tile(id, { w, h: 423 }, false);
  const favicon = (id: string) => tile(id, { w: 280, h: 280 }, false);
  const hero = (id: string, w = 420, h = 664) => tile(id, { w, h }, false);

  const byId = (packed: ReturnType<typeof packBentoGrid>, id: string) =>
    packed.placed.find((t) => t.id === id)!;

  it("is empty for no tiles", () => {
    expect(packBentoGrid([])).toEqual({ placed: [], width: 0, height: 0 });
  });

  it("hugs a lone tile at its own size", () => {
    const packed = packBentoGrid([table("solo")]);
    expect(byId(packed, "solo")).toMatchObject({ x: 0, y: 0, w: 584, h: 423 });
    expect(packed.width).toBe(584);
  });

  it("places content-sized tiles at exactly their content size", () => {
    const packed = packBentoGrid(
      [quote("q"), table("t"), favicon("f"), claim("c")],
      { minWidth: CHAPTER_CONTENT_WIDTH },
    );
    expect(byId(packed, "t")).toMatchObject({ w: 584, h: 423 });
    expect(byId(packed, "f")).toMatchObject({ w: 280, h: 280 });
  });

  it("never runs a row past the content width, and never squeezes text below its floor", () => {
    const packed = packBentoGrid(
      Array.from({ length: 10 }, (_, i) =>
        i % 3 === 0 ? table(`t${i}`) : i % 3 === 1 ? quote(`q${i}`) : favicon(`f${i}`),
      ),
    );
    for (const t of packed.placed) {
      expect(t.x + t.w).toBeLessThanOrEqual(CHAPTER_CONTENT_WIDTH + 1);
      if (t.id.startsWith("q")) {
        expect(t.w).toBeGreaterThanOrEqual(520 * BENTO_SHRINK_FLOOR - 1);
      }
    }
  });

  it("justifies reflowing tiles toward the block width, leaving content-sized ones alone", () => {
    const packed = packBentoGrid([quote("q"), table("t")], { minWidth: 1400 });
    const q = byId(packed, "q");
    const t = byId(packed, "t");
    expect(q.w).toBeGreaterThan(520);
    expect(t.w).toBe(584);
    expect(t.x).toBe(q.x + q.w + TILE_GAP);
  });

  it("gives a full-row tile a row of its own, hoisted to the top", () => {
    const timeline = tile("timeline", { w: 1920, h: 480 }, false);
    const packed = packBentoGrid([quote("a"), timeline, quote("b")]);
    expect(byId(packed, "timeline")).toMatchObject({ x: 0, y: 0, w: 1920 });
    expect(packed.width).toBe(1920);
    for (const other of packed.placed.filter((t) => t.id !== "timeline")) {
      expect(other.y).toBeGreaterThanOrEqual(480 + TILE_GAP);
    }
  });

  it("stacks two short tiles beside a tall one, gutter exact", () => {
    const packed = packBentoGrid([claim("tall"), quote("short-a"), quote("short-b")]);
    const a = byId(packed, "short-a");
    const b = byId(packed, "short-b");
    expect(a.x).toBe(b.x);
    expect(a.w).toBe(b.w);
    expect(b.y - (a.y + a.h)).toBe(TILE_GAP);
    expect(b.y + b.h).toBeGreaterThanOrEqual(420);
  });

  it("keeps a hero image at its own aspect ratio, whatever the row", () => {
    const packed = packBentoGrid(
      [favicon("f"), hero("portrait"), quote("q"), hero("banner", 588, 388)],
      { minWidth: CHAPTER_CONTENT_WIDTH },
    );
    expect(byId(packed, "portrait")).toMatchObject({ w: 420, h: 664 });
    expect(byId(packed, "banner")).toMatchObject({ w: 588, h: 388 });
  });

  it("is deterministic", () => {
    const build = () => [quote("a"), favicon("b"), table("c"), quote("d"), hero("e")];
    expect(packBentoGrid(build())).toEqual(packBentoGrid(build()));
  });

  it("never overlaps", () => {
    const packed = packBentoGrid(
      Array.from({ length: 12 }, (_, i) =>
        [quote, claim, table, favicon, hero][i % 5]!(`n${i}`),
      ),
    );
    expect(packed.placed).toHaveLength(12);
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
