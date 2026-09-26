import { afterEach, describe, expect, it } from "vitest";
import { useCanvasStore, type Card } from "@/lib/store";

/**
 * A conversation card is imported content, not a turn the user took, so nothing
 * may hang off it until the branch build lands.
 *
 * The canvas surface renders no composer for one, but ChatView's thread
 * composer and QnaTurnBlock's "Try again" both call createFollowUp directly —
 * and a conversation card's status is always "done", so their own done-checks
 * let it through. The store is the one place that closes every caller.
 */

function card(id: string, kind: Card["cardKind"]): Card {
  return {
    id,
    threadId: "t-main",
    cardKind: kind,
    question: "Why Gen Z lacks resilience",
    answer: "Resilience isn't taught because judgment starts at home.",
    status: "done",
    position: { x: 0, y: 0 },
    size: { w: 420, h: 300 },
    parentCardId: null,
    parentConversationId: null,
  };
}

function seed(kind: Card["cardKind"]) {
  useCanvasStore.setState({
    cards: { c1: card("c1", kind) },
    cardOrder: ["c1"],
    connections: [],
    threads: { "t-main": { id: "t-main", accentColour: "#000" } },
    threadOrder: ["t-main"],
    groups: {},
  });
}

afterEach(() => {
  useCanvasStore.setState({
    cards: {},
    cardOrder: [],
    connections: [],
    threads: {},
    threadOrder: [],
    groups: {},
  });
});

describe("createFollowUp on a conversation card", () => {
  it("refuses to create a child", () => {
    seed("conversation");
    const result = useCanvasStore.getState().createFollowUp("c1", "And then?");

    expect(result).toBeNull();
    const state = useCanvasStore.getState();
    expect(state.cardOrder).toEqual(["c1"]);
    expect(state.connections).toEqual([]);
  });

  it("still works on a normal qa card", () => {
    // Guard the one kind, not the call — a regression here would silently
    // disable follow-ups everywhere and look like a chat bug.
    seed("qa");
    const result = useCanvasStore.getState().createFollowUp("c1", "And then?");

    expect(result).not.toBeNull();
    expect(useCanvasStore.getState().cardOrder).toHaveLength(2);
  });
});
