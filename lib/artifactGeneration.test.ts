import { afterEach, describe, expect, it } from "vitest";
import { beginCardAsk, cancelCardAsk, endCardAsk } from "@/lib/cardAskRegistry";
import {
  finalizeCardResponse,
  resolveEditingPayloadForApi,
} from "@/lib/artifactGeneration";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

function seedCard(card: Card) {
  useCanvasStore.setState((state) => ({
    cards: { ...state.cards, [card.id]: card },
    cardOrder: state.cardOrder.includes(card.id)
      ? state.cardOrder
      : [...state.cardOrder, card.id],
  }));
}

describe("finalizeCardResponse", () => {
  afterEach(() => {
    cancelCardAsk("c1");
    useCanvasStore.setState((state) => {
      const { c1: _removed, ...cards } = state.cards;
      return {
        cards,
        cardOrder: state.cardOrder.filter((id) => id !== "c1"),
      };
    });
  });

  it("marks a text turn done after the ask ends", () => {
    seedCard({
      id: "c1",
      threadId: "t1",
      question: "What are the top five restaurants in London?",
      answer: "Here are five standout restaurants in London…",
      status: "streaming",
      parentCardId: null,
      parentConversationId: null,
      position: { x: 0, y: 0 },
    });

    const token = beginCardAsk("c1");
    expect(finalizeCardResponse("c1", { responseType: "text" })).toBeNull();
    expect(useCanvasStore.getState().cards.c1?.status).toBe("streaming");

    endCardAsk("c1", token);
    expect(finalizeCardResponse("c1", { responseType: "text" })).toBeNull();
    expect(useCanvasStore.getState().cards.c1?.status).toBe("done");
  });
});

describe("resolveEditingPayloadForApi", () => {
  afterEach(() => {
    useCanvasStore.setState((state) => {
      const { h1: _h, ...cards } = state.cards;
      return { cards, cardOrder: state.cardOrder.filter((id) => id !== "h1") };
    });
  });

  // Without the flag, resolveEditingArtifactId walks the parent chain, finds
  // the parent's custom artifact, and /api/custom-ui surgically edits THAT
  // instead of building a new component from the handoff's data.
  it("returns null for a build_custom_ui handoff card", () => {
    seedCard({
      id: "h1",
      threadId: "t1",
      question: "Build an interactive Knowledge graph explorer from the memory results",
      answer: "",
      status: "thinking",
      parentCardId: "c1",
      parentConversationId: "c1",
      position: { x: 0, y: 0 },
      inheritedArtifactId: "artifact-from-parent",
      suppressArtifactInheritance: true,
    });

    expect(resolveEditingPayloadForApi("h1")).toBeNull();
  });
});
