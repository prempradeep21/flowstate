import { describe, expect, it } from "vitest";
import {
  areCanvasPersistSlicesEqual,
  classifyCanvasPersistChange,
  classifyCanvasPersistChangeFast,
  isViewportOnlyChange,
  pickCanvasPersistSlice,
  type CanvasPersistSlice,
} from "@/lib/canvasPersistDirty";
import type { Card } from "@/lib/store";

function emptySlice(overrides: Partial<CanvasPersistSlice> = {}): CanvasPersistSlice {
  return {
    viewport: { x: 0, y: 0, scale: 1 },
    cards: {},
    cardOrder: [],
    connections: [],
    threads: {},
    threadOrder: [],
    groups: {},
    connectorStyle: "orthogonal",
    canvasBackgroundStyle: "grid",
    canvasBackgroundImageId: "grok-5f2e9dd9",
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

const baseCard: Card = {
  id: "c1",
  question: "Hello?",
  answer: "",
  position: { x: 0, y: 0 },
  size: { w: 420, h: 240 },
  status: "done",
  threadId: "t1",
  parentCardId: null,
  parentConversationId: null,
};

describe("classifyCanvasPersistChange", () => {
  it("treats viewport pan/zoom as persist-only, not a content edit", () => {
    const prev = emptySlice();
    const next = emptySlice({ viewport: { x: 120, y: 80, scale: 0.5 } });
    expect(classifyCanvasPersistChange(prev, next)).toEqual({
      persist: true,
      contentEdit: false,
    });
  });

  it("counts a new question card as a content edit", () => {
    const prev = emptySlice();
    const next = emptySlice({
      cards: { c1: baseCard },
      cardOrder: ["c1"],
    });
    expect(classifyCanvasPersistChange(prev, next)).toEqual({
      persist: true,
      contentEdit: true,
    });
  });

  it("counts artifact payload changes as content edits", () => {
    const prev = emptySlice({
      sessionArtifacts: {
        a1: {
          id: "a1",
          title: "Todo",
          latestVersionId: "v1",
          versions: [
            {
              id: "v1",
              createdAt: 1,
              payload: {
                type: "todo",
                title: "Todo",
                data: { items: [] },
              },
            },
          ],
        },
      },
    });
    const next = emptySlice({
      sessionArtifacts: {
        a1: {
          id: "a1",
          title: "Todo",
          latestVersionId: "v1",
          versions: [
            {
              id: "v1",
              createdAt: 1,
              payload: {
                type: "todo",
                title: "Todo",
                data: {
                  items: [{ id: "1", text: "Ship", done: false }],
                },
              },
            },
          ],
        },
      },
    });
    expect(classifyCanvasPersistChange(prev, next)).toEqual({
      persist: true,
      contentEdit: true,
    });
  });

  it("counts answer-only card updates as priority content edits", () => {
    const prev = emptySlice({
      cards: { c1: baseCard },
      cardOrder: ["c1"],
    });
    const next = emptySlice({
      cards: {
        c1: { ...baseCard, answer: "Here is the answer." },
      },
      cardOrder: ["c1"],
    });
    expect(classifyCanvasPersistChange(prev, next)).toEqual({
      persist: true,
      contentEdit: true,
    });
  });

  it("counts canvas image placement as a priority content edit", () => {
    const prev = emptySlice();
    const next = emptySlice({
      canvasAssets: { a1: { id: "a1", kind: "image" } },
      canvasAssetNodes: { n1: { id: "n1", assetId: "a1" } },
      canvasAssetOrder: ["n1"],
    });
    expect(classifyCanvasPersistChange(prev, next)).toEqual({
      persist: true,
      contentEdit: true,
    });
  });

  it("pickCanvasPersistSlice is stable for identical state", () => {
    const slice = emptySlice({ viewport: { x: 1, y: 2, scale: 1 } });
    expect(pickCanvasPersistSlice(slice)).toEqual(slice);
  });

  it("detects viewport-only changes without full JSON compare", () => {
    const prev = emptySlice();
    const next = emptySlice({ viewport: { x: 50, y: 50, scale: 1.2 } });
    expect(classifyCanvasPersistChange(prev, next)).toEqual({
      persist: true,
      contentEdit: false,
    });
  });

  it("detects equal persist slices regardless of object identity", () => {
    const a = emptySlice({
      cards: { c1: baseCard },
      cardOrder: ["c1"],
    });
    const b = emptySlice({
      cards: { c1: { ...baseCard } },
      cardOrder: ["c1"],
    });
    expect(areCanvasPersistSlicesEqual(a, b)).toBe(true);
  });
});

describe("classifyCanvasPersistChangeFast (per-store-write hot path)", () => {
  /** Simulates store-style immutable updates: shared refs except changed fields. */
  function storeNext(
    prev: CanvasPersistSlice,
    overrides: Partial<CanvasPersistSlice>,
  ): CanvasPersistSlice {
    return { ...prev, ...overrides };
  }

  it("no change → no persist", () => {
    const prev = emptySlice();
    const next = storeNext(prev, {});
    expect(classifyCanvasPersistChangeFast(prev, next)).toEqual({
      persist: false,
      contentEdit: false,
    });
  });

  it("viewport-only store write → persist without content edit", () => {
    const prev = emptySlice();
    const next = storeNext(prev, { viewport: { x: 10, y: 5, scale: 0.8 } });
    expect(classifyCanvasPersistChangeFast(prev, next)).toEqual({
      persist: true,
      contentEdit: false,
    });
  });

  it("card map replacement (drag move) → content edit", () => {
    const prev = emptySlice({ cards: { c1: baseCard }, cardOrder: ["c1"] });
    const next = storeNext(prev, {
      cards: { c1: { ...baseCard, position: { x: 40, y: 12 } } },
    });
    expect(classifyCanvasPersistChangeFast(prev, next)).toEqual({
      persist: true,
      contentEdit: true,
    });
  });

  it("never misses a change the deep classifier would persist", () => {
    const prev = emptySlice({ cards: { c1: baseCard }, cardOrder: ["c1"] });
    const cases: CanvasPersistSlice[] = [
      storeNext(prev, { viewport: { x: 1, y: 1, scale: 1 } }),
      storeNext(prev, { cards: { c1: { ...baseCard, answer: "hi" } } }),
      storeNext(prev, { connectorStyle: "curvy" }),
      storeNext(prev, { canvasTextLabels: { l1: { id: "l1" } } }),
      storeNext(prev, { collaborationHasEdits: true }),
    ];
    for (const next of cases) {
      const slow = classifyCanvasPersistChange(prev, next);
      const fast = classifyCanvasPersistChangeFast(prev, next);
      // Safe direction only: fast may over-persist, never under-persist.
      if (slow.persist) expect(fast.persist).toBe(true);
      if (slow.contentEdit) expect(fast.contentEdit).toBe(true);
    }
  });
});

describe("isViewportOnlyChange fast path", () => {
  it("uses reference walk for store-sourced slices (shared refs)", () => {
    const prev = emptySlice({ cards: { c1: baseCard }, cardOrder: ["c1"] });
    const next = {
      ...prev,
      viewport: { x: 99, y: 0, scale: 2 },
    };
    expect(isViewportOnlyChange(prev, next)).toBe(true);
  });

  it("falls back to deep compare for snapshot-sourced slices (fresh refs)", () => {
    const prev = emptySlice({ cards: { c1: baseCard }, cardOrder: ["c1"] });
    const next = emptySlice({
      viewport: { x: 99, y: 0, scale: 2 },
      cards: { c1: { ...baseCard } },
      cardOrder: ["c1"],
    });
    expect(isViewportOnlyChange(prev, next)).toBe(true);
  });

  it("rejects when content actually changed alongside viewport", () => {
    const prev = emptySlice({ cards: { c1: baseCard }, cardOrder: ["c1"] });
    const next = emptySlice({
      viewport: { x: 99, y: 0, scale: 2 },
      cards: { c1: { ...baseCard, answer: "changed" } },
      cardOrder: ["c1"],
    });
    expect(isViewportOnlyChange(prev, next)).toBe(false);
  });
});
