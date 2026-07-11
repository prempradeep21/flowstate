import { describe, expect, it } from "vitest";
import {
  computeFocusRootCardPosition,
  getLatestArtifactIdForThread,
  getLatestThreadIdForArtifact,
  type FocusViewLookupState,
} from "@/lib/focusView";
import type { Card, Connection, SessionArtifact } from "@/lib/store";

function makeCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    threadId: "t1",
    question: "Question",
    answer: "Answer",
    status: "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
    ...overrides,
  };
}

function makeArtifact(id: string): SessionArtifact {
  return {
    id,
    title: `Artifact ${id}`,
    kind: "table",
    versions: [
      {
        id: `${id}-v1`,
        number: 1,
        payload: { type: "table", title: `Artifact ${id}`, data: { columns: [], rows: [] } },
        createdAt: 1,
        sourceCardId: "c1",
      },
    ],
    latestVersionId: `${id}-v1`,
  } as SessionArtifact;
}

function makeState(
  overrides: Partial<FocusViewLookupState> = {},
): FocusViewLookupState {
  return {
    cards: {},
    cardOrder: [],
    connections: [],
    sessionArtifacts: {},
    artifactPlugConnections: [],
    canvasArtifactNodes: {},
    ...overrides,
  };
}

const chainConnections: Connection[] = [
  { id: "k1", from: "c1", to: "c2", fromSide: "bottom", toSide: "top" },
  { id: "k2", from: "c2", to: "c3", fromSide: "bottom", toSide: "top" },
];

describe("getLatestArtifactIdForThread", () => {
  it("returns the artifact from the latest card in the chain", () => {
    const state = makeState({
      cards: {
        c1: makeCard({ id: "c1", outputArtifactId: "a1" }),
        c2: makeCard({ id: "c2", parentCardId: "c1" }),
        c3: makeCard({ id: "c3", parentCardId: "c2", outputArtifactId: "a2" }),
      },
      cardOrder: ["c1", "c2", "c3"],
      connections: chainConnections,
      sessionArtifacts: { a1: makeArtifact("a1"), a2: makeArtifact("a2") },
    });
    expect(getLatestArtifactIdForThread(state, "t1")).toBe("a2");
  });

  it("prefers output over attachment, and skips deleted artifacts", () => {
    const state = makeState({
      cards: {
        c1: makeCard({ id: "c1", outputArtifactId: "a1" }),
        c2: makeCard({
          id: "c2",
          parentCardId: "c1",
          outputArtifactId: "gone",
          attachedArtifacts: [{ artifactId: "a2", versionId: "a2-v1" }],
        }),
      },
      cardOrder: ["c1", "c2"],
      connections: [chainConnections[0]],
      sessionArtifacts: { a1: makeArtifact("a1"), a2: makeArtifact("a2") },
    });
    expect(getLatestArtifactIdForThread(state, "t1")).toBe("a2");
  });

  it("returns null for a thread with no artifacts", () => {
    const state = makeState({
      cards: { c1: makeCard({ id: "c1" }) },
      cardOrder: ["c1"],
    });
    expect(getLatestArtifactIdForThread(state, "t1")).toBeNull();
  });
});

describe("getLatestThreadIdForArtifact", () => {
  it("returns the thread of the most recent card referencing the artifact", () => {
    const state = makeState({
      cards: {
        c1: makeCard({ id: "c1", threadId: "t1", outputArtifactId: "a1" }),
        c2: makeCard({
          id: "c2",
          threadId: "t2",
          attachedArtifacts: [{ artifactId: "a1", versionId: "a1-v1" }],
        }),
      },
      cardOrder: ["c1", "c2"],
      sessionArtifacts: { a1: makeArtifact("a1") },
    });
    expect(getLatestThreadIdForArtifact(state, "a1")).toBe("t2");
  });

  it("finds references made through artifact plug connections", () => {
    const state = makeState({
      cards: { c1: makeCard({ id: "c1", threadId: "t3" }) },
      cardOrder: ["c1"],
      canvasArtifactNodes: {
        n1: {
          id: "n1",
          artifactId: "a1",
          versionId: "a1-v1",
          sourceCardId: "c0",
          position: { x: 0, y: 0 },
        },
      },
      artifactPlugConnections: [
        { id: "p1", artifactNodeId: "n1", cardId: "c1", fromSide: "right", toSide: "left" },
      ],
    });
    expect(getLatestThreadIdForArtifact(state, "a1")).toBe("t3");
  });

  it("returns null when nothing references the artifact", () => {
    expect(getLatestThreadIdForArtifact(makeState(), "a1")).toBeNull();
  });
});

describe("computeFocusRootCardPosition", () => {
  it("places new roots to the right of existing content", () => {
    const card = makeCard({ id: "c1", position: { x: 100, y: 200 } });
    const state = {
      cards: { c1: card },
      cardOrder: ["c1"],
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
    };
    const pos = computeFocusRootCardPosition(state);
    expect(pos.x).toBeGreaterThan(100);
    expect(Number.isFinite(pos.y)).toBe(true);

    const second = makeCard({ id: "c2", position: pos });
    const pos2 = computeFocusRootCardPosition({
      ...state,
      cards: { ...state.cards, c2: second },
      cardOrder: ["c1", "c2"],
    });
    expect(pos2.x).toBeGreaterThan(pos.x);
  });
});
