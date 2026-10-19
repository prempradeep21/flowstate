import { describe, expect, it } from "vitest";
import {
  buildAncestorHistory,
  collectAncestorCardIds,
  formatQuestionForContext,
} from "@/lib/buildAncestorHistory";
import type { Card, Connection } from "@/lib/store";

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

describe("formatQuestionForContext", () => {
  it("notes attached images on ancestor questions", () => {
    const text = formatQuestionForContext(
      makeCard({
        id: "c1",
        question: "What is this?",
        attachedImages: [{ url: "data:image/png;base64,abc", alt: "diagram" }],
      }),
    );
    expect(text).toContain("What is this?");
    expect(text).toContain("diagram");
  });
});

describe("collectAncestorCardIds", () => {
  it("returns ancestor ids root-first", () => {
    const cards = {
      c1: makeCard({ id: "c1", threadId: "t1" }),
      c2: makeCard({ id: "c2", threadId: "t1", parentCardId: "c1" }),
      c3: makeCard({ id: "c3", threadId: "t1", parentCardId: "c2" }),
    };
    const connections: Connection[] = [
      { id: "a", from: "c1", to: "c2", fromSide: "bottom" },
      { id: "b", from: "c2", to: "c3", fromSide: "bottom" },
    ];
    expect(collectAncestorCardIds({ cards, connections }, "c3")).toEqual([
      "c1",
      "c2",
    ]);
  });
});

describe("buildAncestorHistory with a conversation ancestor", () => {
  it("frames an imported card instead of passing it off as a real exchange", () => {
    // A conversation card's question is a heading and its answer is imported
    // prose — nobody asked it and the model never said it. /api/chat splices
    // each history entry in as a user/assistant pair, so sending it raw would
    // have the model build on a false account of who said what.
    const cards: Record<string, Card> = {
      chapter: makeCard({
        id: "chapter",
        cardKind: "conversation",
        question: "Why Gen Z lacks resilience",
        answer: "Resilience isn't taught because judgment starts at home.",
      }),
      child: makeCard({
        id: "child",
        question: "What would change that?",
        answer: "",
        parentConversationId: "chapter",
      }),
    };

    const history = buildAncestorHistory({ cards, connections: [] }, "child");

    expect(history).toHaveLength(1);
    expect(history[0]!.question).toContain("Imported transcript excerpt");
    expect(history[0]!.question).toContain("Why Gen Z lacks resilience");
    expect(history[0]!.question).not.toBe("Why Gen Z lacks resilience");
    expect(history[0]!.answer).toContain("judgment starts at home");
  });

  it("leaves a normal qa ancestor untouched", () => {
    const cards: Record<string, Card> = {
      parent: makeCard({
        id: "parent",
        question: "What is neuroplasticity?",
        answer: "The nervous system's ability to change.",
      }),
      child: makeCard({
        id: "child",
        question: "How long does it take?",
        answer: "",
        parentConversationId: "parent",
      }),
    };

    const history = buildAncestorHistory({ cards, connections: [] }, "child");

    expect(history).toHaveLength(1);
    expect(history[0]!.question).toBe("What is neuroplasticity?");
  });
});
