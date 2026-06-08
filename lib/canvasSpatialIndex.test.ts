import { describe, expect, it } from "vitest";
import {
  buildCanvasSpatialIndex,
  getVisibleWorldRect,
  queryVisibleNodes,
  shouldEnableViewportCulling,
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
    const cards: Record<string, Card> = {
      near: makeCard("near", 0, 0),
      far: makeCard("far", 5000, 5000),
    };

    const visible = queryVisibleNodes(
      {
        viewport: { x: 0, y: 0, scale: 1 },
        cards,
        cardOrder: ["near", "far"],
        canvasArtifactNodes: {},
        canvasArtifactOrder: [],
        canvasAssets: {},
        canvasAssetNodes: {},
        canvasAssetOrder: [],
        canvasTextLabels: {},
        canvasTextLabelOrder: [],
        sessionArtifacts: {},
      },
      { width: 800, height: 600 },
    );

    expect(visible.cards.has("near")).toBe(true);
    expect(visible.cards.has("far")).toBe(false);
  });

  it("always includes pinned card ids", () => {
    const cards: Record<string, Card> = {
      far: makeCard("far", 9000, 9000),
    };

    const visible = queryVisibleNodes(
      {
        viewport: { x: 0, y: 0, scale: 1 },
        cards,
        cardOrder: ["far"],
        canvasArtifactNodes: {},
        canvasArtifactOrder: [],
        canvasAssets: {},
        canvasAssetNodes: {},
        canvasAssetOrder: [],
        canvasTextLabels: {},
        canvasTextLabelOrder: [],
        sessionArtifacts: {},
      },
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
    const tree = buildCanvasSpatialIndex({
      viewport: { x: 0, y: 0, scale: 1 },
      cards,
      cardOrder,
      canvasArtifactNodes: {},
      canvasArtifactOrder: [],
      canvasAssets: {},
      canvasAssetNodes: {},
      canvasAssetOrder: [],
      canvasTextLabels: {},
      canvasTextLabelOrder: [],
      sessionArtifacts: {},
    });
    const hits = tree.search({ minX: 0, minY: 0, maxX: 600, maxY: 400 });
    const elapsed = performance.now() - start;

    expect(hits.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });
});
