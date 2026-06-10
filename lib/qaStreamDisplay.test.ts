import { describe, expect, it } from "vitest";
import {
  hasQaResponseError,
  isQaTurnInProgress,
  resolveQaStatusLabel,
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

  it("shows pending artifact preview while thinking", () => {
    const card = baseCard({
      status: "thinking",
      responseType: "custom",
      outputArtifactId: "art-1",
    });
    expect(shouldShowQaArtifactPreview(card)).toBe(true);
    expect(shouldShowQaAnswerSection(card)).toBe(true);
  });

  it("keeps turn in progress while generating preview nodes exist", () => {
    const card = baseCard({ status: "done" });
    const nodes = {
      n1: {
        id: "n1",
        artifactId: "",
        versionId: "",
        sourceCardId: "c1",
        position: { x: 0, y: 0 },
        size: { w: 100, h: 100 },
        generatingPreview: { kind: "table" as const, title: "Table" },
      },
    };
    expect(isQaTurnInProgress(card, nodes)).toBe(true);
    expect(resolveQaStatusLabel(card, nodes)).toBe("Building artifact…");
  });

  it("detects surfaced API errors in answer text", () => {
    expect(
      hasQaResponseError(baseCard({ answer: "⚠️ Network error" })),
    ).toBe(true);
    expect(
      resolveQaStatusLabel(
        baseCard({ status: "streaming", answer: "⚠️ Network error" }),
      ),
    ).toBe("Request failed");
  });
});
