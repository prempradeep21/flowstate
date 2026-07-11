import { describe, expect, it } from "vitest";
import { applyOps, diffSlices } from "@/lib/canvasOps";
import type { CanvasPersistSlice } from "@/lib/canvasPersistDirty";
import type { Card } from "@/lib/store";

function emptySlice(
  overrides: Partial<CanvasPersistSlice> = {},
): CanvasPersistSlice {
  return {
    viewport: { x: 0, y: 0, scale: 1 },
    cards: {},
    cardOrder: [],
    connections: [],
    threads: {},
    threadOrder: [],
    groups: {},
    connectorStyle: "curvy",
    canvasBackgroundStyle: "grid",
    canvasBackgroundImageId: "img-1",
    canvasTheme: "light",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts: {},
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    canvasAssets: {},
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    canvasGifNodes: {},
    canvasGifOrder: [],
    canvas3DNodes: {},
    canvas3DOrder: [],
    canvasStrokes: {},
    canvasStrokeOrder: [],
    uploadedAttachments: [],
    collaborationHasEdits: false,
    ...overrides,
  };
}

const card = (id: string, x = 0, y = 0): Card => ({
  id,
  threadId: `t-${id}`,
  question: `Q ${id}`,
  answer: `A ${id}`,
  status: "done",
  position: { x, y },
  parentCardId: null,
  parentConversationId: null,
});

/** Round-trip: applying the diff to prev must reproduce next (sans viewport). */
function expectRoundTrip(prev: CanvasPersistSlice, next: CanvasPersistSlice) {
  const replayed = applyOps(prev, diffSlices(prev, next));
  const strip = (s: CanvasPersistSlice) => ({
    ...s,
    viewport: null,
    collaborationHasEdits: null,
  });
  expect(strip(replayed)).toEqual(strip(next));
}

describe("canvasOps diff/apply", () => {
  it("empty diff for identical slices", () => {
    const a = emptySlice({ cards: { c1: card("c1") }, cardOrder: ["c1"] });
    expect(diffSlices(a, a)).toEqual([]);
  });

  it("round-trips card add, move, delete and order changes", () => {
    const prev = emptySlice({
      cards: { c1: card("c1"), c2: card("c2") },
      cardOrder: ["c1", "c2"],
    });
    const next = emptySlice({
      cards: {
        c1: card("c1", 120, 80), // moved
        c3: card("c3"), // added (c2 deleted)
      },
      cardOrder: ["c1", "c3"],
    });
    const ops = diffSlices(prev, next);
    expect(ops).toContainEqual({
      t: "delete",
      field: "cards",
      id: "c2",
    });
    expectRoundTrip(prev, next);
  });

  it("round-trips connections and style scalars", () => {
    const prev = emptySlice();
    const next = emptySlice({
      connections: [
        { id: "k1", from: "a", to: "b", fromSide: "bottom", toSide: "top" },
      ],
      connectorStyle: "orthogonal",
      canvasTheme: "dark",
    });
    expectRoundTrip(prev, next);
  });

  it("round-trips artifact nodes and labels", () => {
    const prev = emptySlice({
      canvasArtifactNodes: { n1: { id: "n1", position: { x: 0, y: 0 } } },
      canvasArtifactOrder: ["n1"],
    });
    const next = emptySlice({
      canvasArtifactNodes: {
        n1: { id: "n1", position: { x: 40, y: 20 } },
        n2: { id: "n2", position: { x: 5, y: 5 } },
      },
      canvasArtifactOrder: ["n1", "n2"],
      canvasTextLabels: { l1: { id: "l1", text: "hi" } },
      canvasTextLabelOrder: ["l1"],
    });
    expectRoundTrip(prev, next);
  });

  it("apply is idempotent for whole-entity upserts", () => {
    const prev = emptySlice({ cards: { c1: card("c1") }, cardOrder: ["c1"] });
    const next = emptySlice({
      cards: { c1: card("c1", 9, 9) },
      cardOrder: ["c1"],
    });
    const ops = diffSlices(prev, next);
    const once = applyOps(prev, ops);
    const twice = applyOps(once, ops);
    expect(twice).toEqual(once);
  });

  it("does not mutate the input slice", () => {
    const prev = emptySlice({ cards: { c1: card("c1") }, cardOrder: ["c1"] });
    const frozenCards = prev.cards;
    const next = emptySlice({
      cards: { c1: card("c1", 3, 3) },
      cardOrder: ["c1"],
    });
    applyOps(prev, diffSlices(prev, next));
    expect(prev.cards).toBe(frozenCards);
    expect(prev.cards.c1.position).toEqual({ x: 0, y: 0 });
  });

  it("never emits viewport ops", () => {
    // Store-style immutable update: shared refs except the changed field.
    const prev = emptySlice();
    const next = { ...prev, viewport: { x: 500, y: 300, scale: 2 } };
    expect(diffSlices(prev, next)).toEqual([]);
  });
});
