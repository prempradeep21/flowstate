import { afterEach, describe, expect, it } from "vitest";
import { computeGroupBounds } from "@/lib/groupBounds";
import {
  findGroupForCard,
  groupGestureRefs,
} from "@/lib/groupMembership";
import { useCanvasStore, type BranchGroup, type Card } from "@/lib/store";

/**
 * Chapter groups name their cards individually rather than by thread family —
 * five chapters can sit on one thread, so the family lookup would sweep a
 * neighbour's cards into the wrong box.
 */

function card(id: string, x: number, y: number): Card {
  return {
    id,
    threadId: "t-main",
    cardKind: "conversation",
    question: id,
    answer: "answer",
    status: "done",
    position: { x, y },
    size: { w: 400, h: 200 },
    parentCardId: null,
    parentConversationId: null,
  } as Card;
}

const GROUP_A: BranchGroup = {
  id: "g-a",
  label: "Chapter 1",
  familyRootThreadIds: [],
  cardIds: ["c1", "c2"],
  items: [],
  summaryMarkdown: null,
};

function seedStore() {
  useCanvasStore.setState({
    cards: { c1: card("c1", 0, 0), c2: card("c2", 500, 0), c3: card("c3", 5000, 0) },
    cardOrder: ["c1", "c2", "c3"],
    connections: [],
    threads: { "t-main": { id: "t-main", accentColour: "#000" } },
    threadOrder: ["t-main"],
    groups: { "g-a": GROUP_A },
  });
}

describe("groups with individually named cards", () => {
  afterEach(() => {
    useCanvasStore.setState({ cards: {}, cardOrder: [], groups: {} });
  });

  it("bounds the named cards and nothing else on the thread", () => {
    seedStore();
    const bounds = computeGroupBounds(
      useCanvasStore.getState(),
      GROUP_A,
      0,
    );
    expect(bounds).toEqual({ x: 0, y: 0, w: 900, h: 200 });
  });

  it("claims a named card without claiming its thread siblings", () => {
    seedStore();
    const state = useCanvasStore.getState();
    expect(findGroupForCard(state, "c1")?.id).toBe("g-a");
    expect(findGroupForCard(state, "c3")).toBeNull();
  });

  it("drags every named card as one unit", () => {
    seedStore();
    useCanvasStore.getState().moveGroupBy("g-a", 100, 50);
    const { cards } = useCanvasStore.getState();
    expect(cards.c1!.position).toEqual({ x: 100, y: 50 });
    expect(cards.c2!.position).toEqual({ x: 600, y: 50 });
    // A card on the same thread but outside the group stays put.
    expect(cards.c3!.position).toEqual({ x: 5000, y: 0 });
  });

  it("includes named cards in the gesture refs", () => {
    seedStore();
    const refs = groupGestureRefs(useCanvasStore.getState(), GROUP_A);
    expect(refs).toContainEqual({ kind: "card", id: "c1" });
    expect(refs).toContainEqual({ kind: "card", id: "c2" });
    expect(refs).not.toContainEqual({ kind: "card", id: "c3" });
  });
});
