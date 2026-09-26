import { describe, expect, it } from "vitest";
import {
  CONVERSATION_CARD_LAYOUT_H,
  conversationBody,
  conversationTitle,
  isConversationCard,
} from "@/lib/conversationCard";
import type { Card } from "@/lib/store";

function card(overrides: Partial<Card>): Card {
  return {
    id: "c1",
    threadId: "t1",
    question: "Heading",
    answer: "Body prose",
    status: "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
    ...overrides,
  };
}

describe("CONVERSATION_CARD_LAYOUT_H", () => {
  it("matches the height the chapter engine reserves", () => {
    // The rendered card sets this height explicitly and layoutChapters reserves
    // the same box. If the two drift apart, connectors stop meeting the cards.
    expect(CONVERSATION_CARD_LAYOUT_H).toBe(300);
  });
});

describe("isConversationCard", () => {
  it("is true only for the conversation kind", () => {
    expect(isConversationCard(card({ cardKind: "conversation" }))).toBe(true);
  });

  it("is false for a qa card and for an absent cardKind", () => {
    // cardKind is optional, so every guard has to survive undefined — a card
    // made before the field existed is a normal qa card, not a conversation.
    expect(isConversationCard(card({ cardKind: "qa" }))).toBe(false);
    expect(isConversationCard(card({}))).toBe(false);
    expect(isConversationCard(null)).toBe(false);
    expect(isConversationCard(undefined)).toBe(false);
  });
});

describe("conversationTitle / conversationBody", () => {
  it("reads the heading from question and the prose from answer", () => {
    const c = card({ cardKind: "conversation" });
    expect(conversationTitle(c)).toBe("Heading");
    expect(conversationBody(c)).toBe("Body prose");
  });
});
