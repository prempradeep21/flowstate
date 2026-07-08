import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Card, Connection, Thread } from "@/lib/store";
import {
  INACTIVITY_MS,
  collectExpiredThreadsToCollapse,
  registerThreadInactivityHandlers,
  resetThreadActivity,
  resetThreadInactivityModuleForTests,
  runCollapsePass,
  scheduleNextCollapse,
  shouldAutoCollapseThread,
  touchThreadActivity,
  getThreadLastActivityMap,
  type ThreadInactivityState,
} from "@/lib/threadInactivity";

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
  overrides?: Partial<ThreadInactivityState>,
): ThreadInactivityState {
  const cards: Record<string, Card> = {
    c1: makeCard({ id: "c1", threadId: "t1" }),
    c2: makeCard({
      id: "c2",
      threadId: "t2",
      parentCardId: null,
      question: "Branch Q",
    }),
  };
  const threads: Record<string, Thread> = {
    t1: { id: "t1", accentColour: "#111" },
    t2: { id: "t2", accentColour: "#222" },
  };
  const connections: Connection[] = [
    {
      id: "conn_c1_c2",
      from: "c1",
      to: "c2",
      fromSide: "right",
      toSide: "left",
    },
  ];
  return {
    cards,
    cardOrder: ["c1", "c2"],
    connections,
    threads,
    threadOrder: ["t1", "t2"],
    collapsedCardIds: [],
    ...overrides,
  };
}

describe("threadInactivity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetThreadInactivityModuleForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetThreadInactivityModuleForTests();
  });

  it("shouldAutoCollapseThread returns true when idle past threshold", () => {
    const state = makeState();
    const now = INACTIVITY_MS + 1000;
    expect(shouldAutoCollapseThread(state, "t1", 0, now)).toBe(true);
  });

  it("skips threads that are streaming", () => {
    const state = makeState({
      cards: {
        c1: makeCard({ id: "c1", threadId: "t1", status: "streaming" }),
      },
      cardOrder: ["c1"],
      threadOrder: ["t1"],
      connections: [],
    });
    const now = INACTIVITY_MS + 1;
    expect(shouldAutoCollapseThread(state, "t1", 0, now)).toBe(false);
  });

  it("skips already-collapsed root cards", () => {
    const state = makeState({ collapsedCardIds: ["c1"] });
    const now = INACTIVITY_MS + 1;
    expect(shouldAutoCollapseThread(state, "t1", 0, now)).toBe(false);
  });

  it("skips empty root cards with no question", () => {
    const state = makeState({
      cards: {
        c1: makeCard({
          id: "c1",
          threadId: "t1",
          status: "empty",
          question: "",
        }),
      },
      cardOrder: ["c1"],
      threadOrder: ["t1"],
      connections: [],
    });
    const now = INACTIVITY_MS + 1;
    expect(shouldAutoCollapseThread(state, "t1", 0, now)).toBe(false);
  });

  it("touchThreadActivity bumps branch and parent timestamps", () => {
    const state = makeState();
    touchThreadActivity("t2", () => state);
    const map = getThreadLastActivityMap();
    expect(map.has("t2")).toBe(true);
    expect(map.has("t1")).toBe(true);
  });

  it("parent with recently active branch is not expired", () => {
    const state = makeState();
    const now = Date.now();
    resetThreadActivity(["t1", "t2"], now - INACTIVITY_MS - 1);
    touchThreadActivity("t2", () => state);
    const map = getThreadLastActivityMap();
    const expired = collectExpiredThreadsToCollapse(state, map, now);
    expect(expired).not.toContain("t1");
    expect(expired).not.toContain("t2");
  });

  it("collectExpiredThreadsToCollapse batches multiple idle threads", () => {
    const state = makeState({
      cards: {
        c1: makeCard({ id: "c1", threadId: "t1" }),
        c3: makeCard({ id: "c3", threadId: "t3", question: "Other" }),
      },
      threadOrder: ["t1", "t3"],
      threads: {
        t1: { id: "t1", accentColour: "#111" },
        t3: { id: "t3", accentColour: "#333" },
      },
      cardOrder: ["c1", "c3"],
      connections: [],
    });
    const map = new Map<string, number>([
      ["t1", 0],
      ["t3", 0],
    ]);
    const now = INACTIVITY_MS + 1;
    const expired = collectExpiredThreadsToCollapse(state, map, now);
    expect(expired).toEqual(["t1", "t3"]);
  });

  it("runCollapsePass applies collapse for expired threads", () => {
    const state = makeState();
    const collapsed: string[][] = [];
    registerThreadInactivityHandlers({
      readState: () => state,
      applyCollapse: (threadIds) => {
        collapsed.push(threadIds);
      },
    });
    resetThreadActivity(["t1"], Date.now() - INACTIVITY_MS - 1);
    runCollapsePass();
    expect(collapsed).toEqual([["t1"]]);
  });

  it("scheduleNextCollapse fires after inactivity window", () => {
    const collapsed: string[][] = [];
    const state = makeState();
    registerThreadInactivityHandlers({
      readState: () => state,
      applyCollapse: (threadIds) => {
        collapsed.push(threadIds);
      },
    });
    resetThreadActivity(["t1"], Date.now());
    scheduleNextCollapse();
    vi.advanceTimersByTime(INACTIVITY_MS);
    expect(collapsed).toEqual([["t1"]]);
  });

  it("resetting activity on manual expand prevents immediate re-collapse", () => {
    const state = makeState();
    const collapsed: string[][] = [];
    registerThreadInactivityHandlers({
      readState: () => state,
      applyCollapse: (threadIds) => {
        collapsed.push(threadIds);
      },
    });
    const expiredAt = Date.now() - INACTIVITY_MS - 1;
    resetThreadActivity(["t1"], expiredAt);
    expect(collectExpiredThreadsToCollapse(state, getThreadLastActivityMap(), Date.now())).toEqual([
      "t1",
    ]);

    touchThreadActivity("t1", () => state);
    expect(collectExpiredThreadsToCollapse(state, getThreadLastActivityMap(), Date.now())).toEqual(
      [],
    );
    runCollapsePass();
    expect(collapsed).toEqual([]);
  });
});
