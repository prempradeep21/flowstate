import { describe, expect, it, afterEach } from "vitest";
import { beginCardAsk, cancelCardAsk, endCardAsk } from "@/lib/cardAskRegistry";
import { computeLiveDrakkarCounts } from "@/lib/liveDrakkar";
import { isChatAnswerInProgress } from "@/lib/qaStreamDisplay";
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

function emptyState(overrides: Partial<Parameters<typeof computeLiveDrakkarCounts>[0]> = {}) {
  return {
    cards: {},
    cardOrder: [] as string[],
    sessionArtifacts: {},
    canvasArtifactNodes: {},
    connections: [],
    ...overrides,
  };
}

describe("isChatAnswerInProgress", () => {
  afterEach(() => {
    cancelCardAsk("c1");
  });

  it("counts thinking and streaming cards", () => {
    expect(isChatAnswerInProgress(baseCard({ status: "thinking" }))).toBe(true);
    expect(isChatAnswerInProgress(baseCard({ status: "streaming" }))).toBe(true);
  });

  it("stops counting once the answer turn finishes", () => {
    expect(isChatAnswerInProgress(baseCard({ status: "done", answer: "Done" }))).toBe(
      false,
    );
    expect(
      isChatAnswerInProgress(baseCard({ status: "done", answer: "⚠️ Failed" })),
    ).toBe(false);
  });

  it("keeps counting while the ask is still in flight after done", () => {
    const token = beginCardAsk("c1");
    expect(isChatAnswerInProgress(baseCard({ status: "done", answer: "" }))).toBe(true);
    endCardAsk("c1", token);
    expect(isChatAnswerInProgress(baseCard({ status: "done", answer: "" }))).toBe(false);
  });
});

describe("computeLiveDrakkarCounts", () => {
  afterEach(() => {
    cancelCardAsk("c1");
  });

  it("returns zero when nothing is active", () => {
    expect(computeLiveDrakkarCounts(emptyState())).toEqual({
      chatsInProgress: 0,
      artifactsInProgress: 0,
    });
  });

  it("counts an active chat separately from a building artifact", () => {
    const card = baseCard({
      status: "streaming",
      responseType: "map",
      artifactPayload: {
        type: "map",
        title: "Trip",
        data: { markers: [] },
      },
    });
    expect(
      computeLiveDrakkarCounts(
        emptyState({
          cards: { c1: card },
          cardOrder: ["c1"],
        }),
      ),
    ).toEqual({
      chatsInProgress: 1,
      artifactsInProgress: 1,
    });
  });

  it("drops the chat once done but keeps artifacts until materialized", () => {
    const card = baseCard({ status: "done", answer: "Here is your table." });
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
    expect(
      computeLiveDrakkarCounts(
        emptyState({
          cards: { c1: card },
          cardOrder: ["c1"],
          canvasArtifactNodes: nodes,
        }),
      ),
    ).toEqual({
      chatsInProgress: 0,
      artifactsInProgress: 1,
    });
  });
});
