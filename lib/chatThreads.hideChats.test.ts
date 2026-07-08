import { describe, expect, it } from "vitest";
import type { Card, Connection, Thread } from "@/lib/store";
import {
  getHiddenCardIds,
  isConnectionHidden,
  type CollapseVisibilityState,
} from "@/lib/chatThreads";

function makeCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    threadId: "t1",
    question: "Question",
    answer: "Answer",
    status: "done",
    position: { x: 0, y: 0 },
    size: { w: 420, h: 200 },
    parentCardId: null,
    parentConversationId: null,
    ...overrides,
  };
}

function makeState(
  overrides?: Partial<CollapseVisibilityState>,
): CollapseVisibilityState {
  const cards: Record<string, Card> = {
    c1: makeCard({ id: "c1", threadId: "t1" }),
    c2: makeCard({
      id: "c2",
      threadId: "t2",
      parentCardId: "c1",
      question: "Follow-up",
    }),
    c3: makeCard({
      id: "c3",
      threadId: "t3",
      parentCardId: null,
      question: "Branch Q",
    }),
  };
  const threads: Record<string, Thread> = {
    t1: { id: "t1", accentColour: "#111" },
    t2: { id: "t2", accentColour: "#222" },
    t3: { id: "t3", accentColour: "#333" },
  };
  const connections: Connection[] = [
    {
      id: "conn_c1_c2",
      from: "c1",
      to: "c2",
      fromSide: "bottom",
      toSide: "top",
    },
    {
      id: "conn_c1_c3",
      from: "c1",
      to: "c3",
      fromSide: "right",
      toSide: "left",
    },
  ];
  return {
    cards,
    cardOrder: ["c1", "c2", "c3", "deleted-id"],
    connections,
    threads,
    threadOrder: ["t1", "t2", "t3"],
    collapsedBranchThreadIds: [],
    collapsedCardIds: [],
    ...overrides,
  };
}

describe("getHiddenCardIds with chatsGloballyHidden", () => {
  it("returns all live card ids when chatsGloballyHidden is true", () => {
    const hidden = getHiddenCardIds(
      makeState({ chatsGloballyHidden: true }),
    );
    expect([...hidden].sort()).toEqual(["c1", "c2", "c3"]);
  });

  it("does not include deleted card ids absent from cards", () => {
    const hidden = getHiddenCardIds(
      makeState({ chatsGloballyHidden: true }),
    );
    expect(hidden.has("deleted-id")).toBe(false);
  });

  it("restores collapse rules when chatsGloballyHidden is false", () => {
    const hidden = getHiddenCardIds(
      makeState({
        chatsGloballyHidden: false,
        collapsedCardIds: ["c1"],
      }),
    );
    expect(hidden.has("c1")).toBe(false);
    expect(hidden.has("c2")).toBe(true);
    expect(hidden.has("c3")).toBe(true);
  });
});

describe("isConnectionHidden with chatsGloballyHidden", () => {
  it("hides every connection when chatsGloballyHidden is true", () => {
    const state = makeState({ chatsGloballyHidden: true });
    for (const conn of state.connections) {
      expect(isConnectionHidden(state, conn)).toBe(true);
    }
  });
});
