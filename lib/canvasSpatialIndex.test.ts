import { describe, expect, it } from "vitest";
import {
  buildCanvasSpatialIndex,
  CanvasSpatialIndexManager,
  CULLING_QUANTIZE,
  CULLING_VIEWPORT_PADDING,
  getVisibleWorldRect,
  quantizedVisibleRect,
  queryVisibleNodes,
  shouldEnableViewportCulling,
  visibleNodesEqual,
  type CanvasSpatialInput,
  type VisibleNodes,
} from "@/lib/canvasSpatialIndex";
import type { Card } from "@/lib/store";

function makeCard(id: string, x: number, y: number): Card {
  return {
    id,
    threadId: "thread_1",
    question: "Q",
    answer: "A",
    status: "done",
    position: { x, y },
    parentCardId: null,
    parentConversationId: null,
  };
}

function spatialInput(
  overrides: Partial<CanvasSpatialInput> = {},
): CanvasSpatialInput {
  return {
    viewport: { x: 0, y: 0, scale: 1 },
    cards: {},
    cardOrder: [],
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    canvasAssets: {},
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasGifNodes: {},
    canvasGifOrder: [],
    canvas3DNodes: {},
    canvas3DOrder: [],
    canvasSkills: {},
    canvasSkillNodes: {},
    canvasSkillOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    sessionArtifacts: {},
    ...overrides,
  };
}

function visibleWith(cards: string[]): VisibleNodes {
  return {
    cards: new Set(cards),
    artifacts: new Set(),
    assets: new Set(),
    gifs: new Set(),
    threeD: new Set(),
    skills: new Set(),
    labels: new Set(),
  };
}

describe("canvasSpatialIndex", () => {
  it("enables culling at 30+ nodes", () => {
    expect(shouldEnableViewportCulling(29)).toBe(false);
    expect(shouldEnableViewportCulling(30)).toBe(true);
  });

  it("maps screen viewport to world rect", () => {
    const rect = getVisibleWorldRect(
      { x: 100, y: 50, scale: 2 },
      800,
      600,
      0,
    );
    expect(rect.minX).toBe(-50);
    expect(rect.minY).toBe(-25);
    expect(rect.maxX).toBe(350);
    expect(rect.maxY).toBe(275);
  });

  it("returns only nodes intersecting the viewport", () => {
    const visible = queryVisibleNodes(
      spatialInput({
        cards: {
          near: makeCard("near", 0, 0),
          far: makeCard("far", 5000, 5000),
        },
        cardOrder: ["near", "far"],
      }),
      { width: 800, height: 600 },
    );

    expect(visible.cards.has("near")).toBe(true);
    expect(visible.cards.has("far")).toBe(false);
  });

  it("always includes pinned card ids", () => {
    const visible = queryVisibleNodes(
      spatialInput({
        cards: { far: makeCard("far", 9000, 9000) },
        cardOrder: ["far"],
      }),
      { width: 800, height: 600 },
      { cards: ["far"] },
    );

    expect(visible.cards.has("far")).toBe(true);
  });

  it("builds a searchable index for many nodes quickly", () => {
    const cards: Record<string, Card> = {};
    const cardOrder: string[] = [];
    for (let i = 0; i < 200; i++) {
      const id = `card_${i}`;
      cards[id] = makeCard(id, (i % 20) * 500, Math.floor(i / 20) * 300);
      cardOrder.push(id);
    }

    const start = performance.now();
    const tree = buildCanvasSpatialIndex(spatialInput({ cards, cardOrder }));
    const hits = tree.search({ minX: 0, minY: 0, maxX: 600, maxY: 400 });
    const elapsed = performance.now() - start;

    expect(hits.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });
});

describe("CanvasSpatialIndexManager", () => {
  it("reuses the tree across viewport-only queries and rebuilds after markDirty", () => {
    const manager = new CanvasSpatialIndexManager();
    const base = spatialInput({
      cards: { a: makeCard("a", 0, 0) },
      cardOrder: ["a"],
    });

    const first = manager.query(base, { width: 800, height: 600 });
    expect(first.cards.has("a")).toBe(true);

    // Stale-tree proof: geometry changed but not marked dirty — the manager
    // intentionally still answers from the old tree.
    const moved = spatialInput({
      cards: { a: makeCard("a", 9000, 9000) },
      cardOrder: ["a"],
    });
    const stale = manager.query(moved, { width: 800, height: 600 });
    expect(stale.cards.has("a")).toBe(true);

    manager.markDirty();
    const fresh = manager.query(moved, { width: 800, height: 600 });
    expect(fresh.cards.has("a")).toBe(false);
  });

  it("bumps version on markDirty (geometry epoch for query-skip callers)", () => {
    const manager = new CanvasSpatialIndexManager();
    const v0 = manager.version;
    manager.markDirty();
    expect(manager.version).toBe(v0 + 1);
    manager.markDirty();
    expect(manager.version).toBe(v0 + 2);
  });
});

describe("quantizedVisibleRect", () => {
  const size = { width: 800, height: 600 };

  it("is stable across small pans within a quantize band", () => {
    const a = quantizedVisibleRect({ x: 0, y: 0, scale: 1 }, size);
    const b = quantizedVisibleRect({ x: -30, y: -30, scale: 1 }, size);
    expect(b).toEqual(a);
  });

  it("changes when the viewport crosses a band edge", () => {
    const a = quantizedVisibleRect({ x: 0, y: 0, scale: 1 }, size);
    const b = quantizedVisibleRect({ x: -500, y: 0, scale: 1 }, size);
    expect(b).not.toEqual(a);
  });

  it("matches the rect searchVisibleNodes queries (grid-aligned, padded)", () => {
    const rect = quantizedVisibleRect({ x: 0, y: 0, scale: 1 }, size);
    expect(Math.abs(rect.minX % CULLING_QUANTIZE)).toBe(0);
    expect(Math.abs(rect.minY % CULLING_QUANTIZE)).toBe(0);
    expect(Math.abs(rect.maxX % CULLING_QUANTIZE)).toBe(0);
    expect(Math.abs(rect.maxY % CULLING_QUANTIZE)).toBe(0);
    expect(rect.minX).toBeLessThanOrEqual(-CULLING_VIEWPORT_PADDING);
    expect(rect.maxX).toBeGreaterThanOrEqual(800 + CULLING_VIEWPORT_PADDING);
  });
});

describe("visibleNodesEqual", () => {
  it("matches identical sets and rejects different ones", () => {
    expect(visibleNodesEqual(visibleWith(["a", "b"]), visibleWith(["b", "a"]))).toBe(
      true,
    );
    expect(visibleNodesEqual(visibleWith(["a"]), visibleWith(["a", "b"]))).toBe(
      false,
    );
    expect(visibleNodesEqual(null, visibleWith([]))).toBe(false);
    expect(visibleNodesEqual(null, null)).toBe(true);
  });
});
