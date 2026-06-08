import { describe, expect, it } from "vitest";
import {
  shouldShowQaAnswerSection,
  shouldShowQaAnswerText,
  shouldShowQaArtifactPreview,
} from "@/lib/qaStreamDisplay";
import type { Card } from "@/lib/store";

function baseCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    threadId: "t1",
    question: "Q",
    answer: "",
    status: "streaming",
    parentCardId: null,
    parentConversationId: null,
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

describe("qaStreamDisplay", () => {
  it("withholds text while streaming", () => {
    const card = baseCard({ answer: "Partial response…" });
    expect(shouldShowQaAnswerText(card)).toBe(false);
    expect(shouldShowQaAnswerSection(card)).toBe(false);
  });

  it("shows text only when done", () => {
    const card = baseCard({ status: "done", answer: "Full response" });
    expect(shouldShowQaAnswerText(card)).toBe(true);
    expect(shouldShowQaAnswerSection(card)).toBe(true);
  });

  it("shows artifact preview during streaming once parsed", () => {
    const card = baseCard({
      responseType: "map",
      artifactPayload: {
        type: "map",
        title: "Beach cities",
        data: { markers: [] },
      },
    });
    expect(shouldShowQaArtifactPreview(card)).toBe(true);
    expect(shouldShowQaAnswerSection(card)).toBe(true);
    expect(shouldShowQaAnswerText(card)).toBe(false);
  });
});
