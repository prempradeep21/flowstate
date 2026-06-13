import { describe, expect, it, afterEach } from "vitest";
import {
  beginCardAsk,
  endCardAsk,
  isCardAskInFlight,
  cancelCardAsk,
} from "@/lib/cardAskRegistry";
import {
  hasQaResponseError,
  isQaResponseFinalError,
  isQaResponseFinalMissing,
  isQaResponseMissing,
  isQaTurnInProgress,
  isChatAnswerInProgress,
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
  afterEach(() => {
    cancelCardAsk("c1");
  });

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

  it("detects empty done cards with no artifact", () => {
    const card = baseCard({ status: "done", answer: "" });
    expect(isQaResponseMissing(card)).toBe(true);
    expect(isQaResponseFinalMissing(card)).toBe(true);
    expect(shouldShowQaAnswerSection(card)).toBe(true);
  });

  it("withholds missing state while artifacts are still materializing", () => {
    const card = baseCard({ status: "done", answer: "" });
    const nodes = {
      n1: {
        id: "n1",
        artifactId: "",
        versionId: "",
        sourceCardId: "c1",
        position: { x: 0, y: 0 },
        size: { w: 100, h: 100 },
        generatingPreview: { kind: "map" as const, title: "Map" },
      },
    };
    expect(isQaResponseMissing(card)).toBe(true);
    expect(isQaResponseFinalMissing(card, nodes)).toBe(false);
    expect(shouldShowQaAnswerSection(card, nodes)).toBe(false);
    expect(resolveQaStatusLabel(card, nodes)).toBe("Building artifact…");
  });

  it("withholds missing state while the card ask is still in flight", () => {
    const card = baseCard({
      status: "done",
      answer: "",
      question: "Update the custom UI colors",
    });
    const token = beginCardAsk("c1");
    expect(isQaTurnInProgress(card)).toBe(true);
    expect(isQaResponseFinalMissing(card)).toBe(false);
    expect(shouldShowQaAnswerSection(card)).toBe(false);
    expect(resolveQaStatusLabel(card)).toBe("Putting it together…");
    endCardAsk("c1", token);
    expect(isQaResponseFinalMissing(card)).toBe(true);
  });

  it("withholds missing state while artifact payload is pending materialization", () => {
    const card = baseCard({
      status: "done",
      answer: "",
      responseType: "custom",
      outputArtifactId: "art_existing",
      artifactPayload: {
        type: "custom",
        title: "Game",
        data: { html: "<div></div>" },
      },
    });
    expect(isQaTurnInProgress(card)).toBe(true);
    expect(isQaResponseFinalMissing(card)).toBe(false);
    expect(shouldShowQaArtifactPreview(card)).toBe(true);
  });

  it("does not treat responseType alone as a finished artifact preview", () => {
    const card = baseCard({
      status: "done",
      responseType: "custom",
      answer: "Here is your custom UI…",
      question: "Build a custom UI artifact with this code",
    });
    expect(shouldShowQaArtifactPreview(card)).toBe(false);
    expect(isQaResponseMissing(card)).toBe(true);
    expect(isQaResponseFinalMissing(card)).toBe(true);
  });

  it("treats chat answer progress separately from artifact materialization", () => {
    const card = baseCard({ status: "done", answer: "Ready" });
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
    expect(isChatAnswerInProgress(card)).toBe(false);
    expect(isQaTurnInProgress(card, nodes)).toBe(true);
  });

  it("detects surfaced API errors only after the turn finishes", () => {
    expect(
      hasQaResponseError(baseCard({ answer: "⚠️ Network error" })),
    ).toBe(true);
    expect(
      resolveQaStatusLabel(
        baseCard({ status: "streaming", answer: "⚠️ Network error" }),
      ),
    ).toBe("Writing the answer…");
    expect(
      resolveQaStatusLabel(
        baseCard({ status: "done", answer: "⚠️ Network error" }),
      ),
    ).toBe("Couldn't finish");
    expect(
      isQaResponseFinalError(
        baseCard({ status: "done", answer: "⚠️ Network error" }),
      ),
    ).toBe(true);
  });
});
