import { beforeEach, describe, expect, it } from "vitest";
import {
  applyArtifactDraft,
  discardArtifactDraft,
  useArtifactDraftStore,
} from "@/lib/artifactDrafts";
import { useCanvasStore } from "@/lib/store";

const cardId = "card_1";

function resetStore() {
  useArtifactDraftStore.setState({ drafts: {} });
  useCanvasStore.setState({
    cards: {
      [cardId]: {
        id: cardId,
        threadId: "t1",
        question: "Plan a weekend in Paris",
        answer: "",
        status: "thinking",
        position: { x: 0, y: 0 },
        parentCardId: null,
        parentConversationId: null,
      },
    },
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    sessionArtifacts: {},
    connections: [],
    cardOrder: [cardId],
    selectedCanvasArtifactId: null,
  });
}

function previews() {
  return Object.values(useCanvasStore.getState().canvasArtifactNodes).filter(
    (n) => n.generatingPreview,
  );
}

describe("applyArtifactDraft", () => {
  beforeEach(resetStore);

  it("pops one skeleton per streamed artifact and fills it", () => {
    applyArtifactDraft(cardId, { id: "a", type: "table", title: "Itinerary" });
    applyArtifactDraft(cardId, { id: "b", type: "map", title: "Paris" });
    applyArtifactDraft(cardId, {
      id: "a",
      type: "table",
      title: "Itinerary",
      data: { columns: [{ key: "day", label: "Day" }], rows: [{ day: "Sat" }] },
    });

    const nodes = previews();
    expect(nodes.map((n) => n.generatingPreview?.kind).sort()).toEqual([
      "map",
      "table",
    ]);
    const table = nodes.find((n) => n.generatingPreview?.kind === "table")!;
    expect(table.generatingPreview?.draftId).toBe("a");
    const draft = useArtifactDraftStore.getState().drafts[table.id];
    expect(draft?.type).toBe("table");
    expect(draft?.type === "table" && draft.data.rows).toHaveLength(1);
  });

  it("claims a skeleton spawned from intent instead of adding another", () => {
    const early = useCanvasStore
      .getState()
      .spawnGeneratingArtifactPreview(cardId, "table", "Plan a weekend");
    applyArtifactDraft(cardId, { id: "a", type: "table", title: "Itinerary" });

    const nodes = previews();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.id).toBe(early);
    expect(nodes[0]?.generatingPreview?.title).toBe("Itinerary");
  });

  it("lets a repeat same-kind call take over the skeleton instead of stacking", () => {
    const rows = (city: string) => ({
      columns: [{ key: "city", label: "City" }],
      rows: [{ city }],
    });
    applyArtifactDraft(cardId, { id: "dup_a", type: "table", title: "Top 10", data: rows("Paris") });
    applyArtifactDraft(cardId, { id: "dup_b", type: "table", title: "Top 10 (v2)", data: rows("Lyon") });
    applyArtifactDraft(cardId, { id: "dup_c", type: "table", title: "Top 10 (v3)", data: rows("Nice") });
    // A late chunk from a superseded call must not steal the skeleton back.
    applyArtifactDraft(cardId, { id: "dup_a", type: "table", title: "Top 10", data: rows("Paris") });

    const nodes = previews();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.generatingPreview?.draftId).toBe("dup_c");
    expect(nodes[0]?.generatingPreview?.title).toBe("Top 10 (v3)");
    const draft = useArtifactDraftStore.getState().drafts[nodes[0]!.id];
    expect(draft?.type === "table" && draft.data.rows[0]).toMatchObject({ city: "Nice" });

    // Rejecting a superseded call leaves the live skeleton alone.
    discardArtifactDraft(cardId, "dup_a");
    expect(previews()).toHaveLength(1);
  });

  it("drops the skeleton when the server rejects the call", () => {
    applyArtifactDraft(cardId, { id: "a", type: "todo", title: "Packing" });
    expect(previews()).toHaveLength(1);
    discardArtifactDraft(cardId, "a");
    expect(previews()).toHaveLength(0);
  });

  it("removes every leftover skeleton for the card at turn end", () => {
    applyArtifactDraft(cardId, { id: "a", type: "table", title: "Itinerary" });
    applyArtifactDraft(cardId, { id: "b", type: "map", title: "Paris" });
    useCanvasStore.getState().removeGeneratingArtifactPreview(cardId);
    expect(previews()).toHaveLength(0);
  });
});
