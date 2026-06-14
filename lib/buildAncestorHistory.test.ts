import { describe, expect, it } from "vitest";
import {
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
