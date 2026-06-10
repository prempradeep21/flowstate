import { describe, expect, it } from "vitest";
import {
  FOLLOW_UP_GAP,
  computeFollowUpPosition,
  followUpInvariantHolds,
  layoutVerticalChain,
  relayoutChildrenOf,
  repairCanvasLayout,
  resolveBranchDropPosition,
  shiftBottomAttachedSubtrees,
} from "@/lib/canvasLayout";
import { plugAnchorAt } from "@/lib/plugConnector";

/** Simulates setCardSize: update size only, no relayout (absolute canvas policy). */
function applySizeOnly<T extends { id: string; size?: { w: number; h: number } }>(
  cards: Record<string, T>,
  id: string,
  size: { w: number; h: number },
): Record<string, T> {
  const existing = cards[id];
  if (!existing) return cards;
  return { ...cards, [id]: { ...existing, size } };
}
import type { Card, Connection } from "@/lib/store";

function card(
  id: string,
  overrides: Partial<Card> & Pick<Card, "position">,
): Card {
  return {
    id,
    threadId: "t1",
    question: "q",
    answer: "a",
    status: "done",
    parentCardId: null,
    parentConversationId: null,
    ...overrides,
  };
}

function conn(from: string, to: string, fromSide: Connection["fromSide"] = "bottom"): Connection {
  return {
    id: `c_${from}_${to}`,
    from,
    to,
    fromSide,
    toSide: fromSide === "bottom" ? "top" : fromSide === "left" ? "right" : "left",
  };
}

describe("computeFollowUpPosition", () => {
  it("places child parent.bottom + gap", () => {
    const parent = card("p", {
      position: { x: 10, y: 20 },
      size: { w: 420, h: 300 },
    });
    const state = {
      cards: { p: parent },
      connections: [],
      cardOrder: ["p"],
    };
    expect(computeFollowUpPosition(state, "p", parent)).toEqual({
      x: 10,
      y: 20 + 300 + FOLLOW_UP_GAP,
    });
  });
});

describe("layoutVerticalChain", () => {
  it("maintains invariant for parent and follow-up", () => {
    const parent = card("p", {
      position: { x: 0, y: 0 },
      size: { w: 420, h: 240 },
    });
    const child = card("c", {
      position: { x: 0, y: 999 },
      parentCardId: "p",
    });
    const state = {
      cards: { p: parent, c: child },
      connections: [conn("p", "c")],
      cardOrder: ["p", "c"],
    };
    const next = layoutVerticalChain(state, "p");
    expect(followUpInvariantHolds({ ...state, cards: next }, "p", "c")).toBe(true);
  });

  it("moves child up when parent height shrinks (composer removal)", () => {
    const composerExtra = 80;
    const parent = card("p", {
      position: { x: 0, y: 0 },
      size: { w: 420, h: 300 + composerExtra },
    });
    const child = card("c", {
      position: { x: 0, y: 300 + composerExtra + FOLLOW_UP_GAP },
      size: { w: 420, h: 120 },
      parentCardId: "p",
    });
    const state = {
      cards: { p: parent, c: child },
      connections: [conn("p", "c")],
      cardOrder: ["p", "c"],
    };
    const shrunkParent = {
      ...parent,
      size: { w: 420, h: 300 },
    };
    const next = layoutVerticalChain(
      { ...state, cards: { ...state.cards, p: shrunkParent } },
      "p",
    );
    expect(next.c.position.y).toBe(300 + FOLLOW_UP_GAP);
    expect(next.c.position.y).toBe(child.position.y - composerExtra);
  });

  it("connector anchors align when follow-up invariant holds", () => {
    const parent = card("p", {
      position: { x: 100, y: 50 },
      size: { w: 420, h: 300 },
    });
    const child = card("c", {
      position: { x: 100, y: 50 + 300 + FOLLOW_UP_GAP },
      size: { w: 420, h: 180 },
      parentCardId: "p",
    });
    const state = {
      cards: { p: parent, c: child },
      connections: [conn("p", "c")],
      cardOrder: ["p", "c"],
    };
    expect(followUpInvariantHolds(state, "p", "c")).toBe(true);

    const from = plugAnchorAt(100, 50, 420, 300, "bottom");
    const to = plugAnchorAt(child.position.x, child.position.y, 420, 180, "top");
    expect(from.px).toBe(to.px);
    expect(to.py - from.py).toBe(FOLLOW_UP_GAP);
  });

  it("does not move siblings when a card only grows in size (absolute positions)", () => {
    const a = card("a", {
      position: { x: 0, y: 0 },
      size: { w: 420, h: 200 },
    });
    const b = card("b", {
      position: { x: 0, y: 300 },
      size: { w: 420, h: 150 },
      parentCardId: "a",
    });
    const c = card("c", {
      position: { x: 0, y: 800 },
      parentCardId: "b",
    });
    const cards = { a, b, c };
    const next = applySizeOnly(cards, "b", { w: 420, h: 400 });
    expect(next.b.position).toEqual(b.position);
    expect(next.c.position).toEqual(c.position);
  });

  it("re-snaps follow-up after parent height drops (composer removed)", () => {
    const parent = card("p", {
      position: { x: 0, y: 0 },
      size: { w: 420, h: 500 },
    });
    const child = card("c", {
      position: { x: 0, y: 540 },
      parentCardId: "p",
      size: { w: 420, h: 100 },
    });
    const state = {
      cards: { p: parent, c: child },
      connections: [conn("p", "c")],
      cardOrder: ["p", "c"],
    };
    const shrunkParent = { ...parent, size: { w: 420, h: 400 } };
    const laid = layoutVerticalChain(
      { ...state, cards: { ...state.cards, p: shrunkParent } },
      "p",
    );
    expect(laid.c.position.y).toBe(400 + FOLLOW_UP_GAP);
    expect(followUpInvariantHolds(
      { cards: { ...state.cards, p: shrunkParent, c: laid.c }, connections: state.connections, cardOrder: state.cardOrder },
      "p",
      "c",
    )).toBe(true);
  });
});

describe("shiftBottomAttachedSubtrees", () => {
  it("shifts a follow-up child by dy when the parent grows", () => {
    const parent = card("p", {
      position: { x: 0, y: 0 },
      size: { w: 420, h: 200 },
    });
    const child = card("c", {
      position: { x: 0, y: 240 },
      size: { w: 420, h: 150 },
      parentCardId: "p",
    });
    const cards = { p: parent, c: child };
    const next = shiftBottomAttachedSubtrees(cards, [conn("p", "c")], "p", 100);
    expect(next.p.position).toEqual(parent.position);
    expect(next.c.position).toEqual({ x: 0, y: 340 });
  });

  it("does not shift lateral branches when the parent grows", () => {
    const parent = card("p", {
      position: { x: 0, y: 0 },
      size: { w: 420, h: 200 },
    });
    const right = card("r", {
      position: { x: 900, y: 240 },
      threadId: "t2",
    });
    const cards = { p: parent, r: right };
    const next = shiftBottomAttachedSubtrees(
      cards,
      [conn("p", "r", "right")],
      "p",
      120,
    );
    expect(next.r.position).toEqual(right.position);
  });

  it("propagates the shift through deeper bottom chains", () => {
    const parent = card("p", { position: { x: 0, y: 0 } });
    const childA = card("a", {
      position: { x: 0, y: 250 },
      parentCardId: "p",
    });
    const childB = card("b", {
      position: { x: 0, y: 500 },
      parentCardId: "a",
    });
    const cards = { p: parent, a: childA, b: childB };
    const next = shiftBottomAttachedSubtrees(
      cards,
      [conn("p", "a"), conn("a", "b")],
      "p",
      60,
    );
    expect(next.a.position).toEqual({ x: 0, y: 310 });
    expect(next.b.position).toEqual({ x: 0, y: 560 });
  });

  it("shifts bottom descendants but skips lateral branches below them", () => {
    const parent = card("p", { position: { x: 0, y: 0 } });
    const follow = card("f", {
      position: { x: 0, y: 250 },
      parentCardId: "p",
    });
    const lateralOfFollow = card("l", {
      position: { x: 900, y: 250 },
      threadId: "t2",
    });
    const cards = { p: parent, f: follow, l: lateralOfFollow };
    const next = shiftBottomAttachedSubtrees(
      cards,
      [conn("p", "f"), conn("f", "l", "right")],
      "p",
      40,
    );
    expect(next.f.position).toEqual({ x: 0, y: 290 });
    expect(next.l.position).toEqual(lateralOfFollow.position);
  });

  it("returns the same cards reference when dy is 0", () => {
    const parent = card("p", { position: { x: 0, y: 0 } });
    const cards = { p: parent };
    const next = shiftBottomAttachedSubtrees(cards, [], "p", 0);
    expect(next).toBe(cards);
  });
});

describe("repairCanvasLayout", () => {
  it("fixes intentionally wrong follow-up Y on hydrate", () => {
    const parent = card("p", {
      position: { x: 5, y: 10 },
      size: { w: 420, h: 280 },
    });
    const child = card("c", {
      position: { x: 5, y: 2000 },
      parentCardId: "p",
    });
    const connections = [conn("p", "c")];
    const cardOrder = ["p", "c"];
    const repaired = repairCanvasLayout(
      { p: parent, c: child },
      connections,
      cardOrder,
    );
    expect(followUpInvariantHolds(
      { cards: repaired, connections, cardOrder },
      "p",
      "c",
    )).toBe(true);
  });

  it("aligns lateral branch to same band as follow-up after parent resize", () => {
    const parent = card("p", {
      position: { x: 0, y: 0 },
      size: { w: 420, h: 500 },
    });
    const follow = card("f", {
      position: { x: 0, y: 300 },
      size: { w: 420, h: 100 },
    });
    const branch = card("b", {
      position: { x: 900, y: 1200 },
      threadId: "t2",
    });
    const connections = [
      conn("p", "f"),
      conn("p", "b", "right"),
    ];
    const cardOrder = ["p", "f", "b"];
    const state = {
      cards: { p: parent, f: follow, b: branch },
      connections,
      cardOrder,
    };
    const next = relayoutChildrenOf(state, "p");
    const bandY = parent.position.y + 500 + FOLLOW_UP_GAP;
    expect(next.f.position.y).toBe(bandY);
    expect(next.b.position.y).toBe(bandY);
  });
});

describe("resolveBranchDropPosition", () => {
  const tuning = {
    cardWidth: 420,
    branchCardWidth: 420,
    branchHorizontalGap: 420,
    emptyCardHeight: 80,
    followUpGap: 40,
  } as import("@/lib/canvasTuning").ResolvedCanvasTuning;

  const source = {
    id: "p",
    position: { x: 100, y: 200 },
    size: { w: 420, h: 300 },
  };

  it("uses cursor Y and centers X on the pointer when clear of parent column", () => {
    const drop = resolveBranchDropPosition(900, 500, "right", source, tuning);
    expect(drop).toEqual({ x: 900 - 210, y: 500 - 44 });
  });

  it("snaps X to the default side gap but keeps cursor Y when overlapping parent column", () => {
    const drop = resolveBranchDropPosition(300, 500, "right", source, tuning);
    expect(drop.x).toBe(100 + 420 + 420);
    expect(drop.y).toBe(500 - 44);
  });

  it("snaps left branches to the left column when overlapping", () => {
    const drop = resolveBranchDropPosition(200, 350, "left", source, tuning);
    expect(drop.x).toBe(100 - 420 - 420);
    expect(drop.y).toBe(350 - 44);
  });
});
