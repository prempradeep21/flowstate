import { describe, expect, it } from "vitest";
import {
  classifyCanvasPersistChange,
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
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts: {},
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
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

  it("does not count answer-only card updates as content edits", () => {
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
      contentEdit: false,
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
});
