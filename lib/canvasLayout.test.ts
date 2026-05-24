import { describe, expect, it } from "vitest";
import {
  FOLLOW_UP_GAP,
  computeFollowUpPosition,
  followUpInvariantHolds,
  layoutVerticalChain,
  relayoutChildrenOf,
  repairCanvasLayout,
} from "@/lib/canvasLayout";
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

  it("relayouts a three-card chain when middle card grows", () => {
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
    const connections = [conn("a", "b"), conn("b", "c")];
    const state = {
      cards: { a, b, c },
      connections,
      cardOrder: ["a", "b", "c"],
    };

    const grownB = { ...b, size: { w: 420, h: 400 } };
    const withSize = { ...state, cards: { a, b: grownB, c } };
    const next = relayoutChildrenOf(withSize, "b");

    expect(followUpInvariantHolds({ ...state, cards: next }, "a", "b")).toBe(true);
    expect(followUpInvariantHolds({ ...state, cards: next }, "b", "c")).toBe(true);
    expect(next.c.position.y).toBe(
      next.b.position.y + 400 + FOLLOW_UP_GAP,
    );
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
