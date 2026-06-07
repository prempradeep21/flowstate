import { describe, expect, it } from "vitest";
import {
  captureGraphSnapshot,
  graphSnapshotFromState,
  type GraphSnapshot,
} from "@/lib/undo";

function makeGraph(overrides?: Partial<GraphSnapshot>): GraphSnapshot {
  return {
    cards: {
      c1: {
        id: "c1",
        threadId: "t1",
        question: "Q",
        answer: "A".repeat(5000),
        status: "done",
        position: { x: 0, y: 0 },
        size: { w: 420, h: 300 },
        parentCardId: null,
        parentConversationId: null,
      },
    },
    cardOrder: ["c1"],
    connections: [],
    threads: { t1: { id: "t1", accentColour: "#000" } },
    threadOrder: ["t1"],
    activeThreadId: null,
    openArtifactCardId: null,
    sessionArtifacts: {},
    openSessionArtifactId: null,
    openSessionArtifactVersionId: null,
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    selectedCanvasArtifactId: null,
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    selectedCanvasTextLabelId: null,
    ...overrides,
  };
}

describe("captureGraphSnapshot", () => {
  it("does not include undoPast when snapshotting from full store-shaped object", () => {
    const graph = makeGraph();
    const prior: GraphSnapshot[] = [];
    for (let i = 0; i < 12; i++) {
      prior.push(captureGraphSnapshot(graph));
    }

    const fullStore = {
      ...graph,
      undoPast: prior,
      viewport: { x: 0, y: 0, scale: 1 },
    };

    const snap = graphSnapshotFromState(fullStore);
    const serialized = JSON.stringify(snap);

    expect(serialized).not.toContain("undoPast");
    expect(snap.cards.c1?.answer).toHaveLength(5000);

    const sizes = prior.map((p) => JSON.stringify(p).length);
    const lastSize = sizes[sizes.length - 1]!;
    for (const size of sizes) {
      expect(size).toBeLessThanOrEqual(lastSize * 1.1);
    }
  });

  it("produces independent clones", () => {
    const graph = makeGraph();
    const snap = captureGraphSnapshot(graph);
    snap.cards.c1!.question = "mutated";
    expect(graph.cards.c1!.question).toBe("Q");
  });
});
