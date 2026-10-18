import { describe, expect, it, beforeEach } from "vitest";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { processArtifactSpawnQueue } from "@/lib/processArtifactSpawnQueue";
import { useCanvasStore } from "@/lib/store";

const codePayload: ArtifactPayload = {
  type: "code",
  title: "GuitarTuner.jsx",
  data: {
    files: [{ path: "GuitarTuner.jsx", content: "export default function GuitarTuner() {}" }],
  },
};

function resetStore() {
  useCanvasStore.setState({
    cards: {},
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    sessionArtifacts: {},
    connections: [],
    cardOrder: [],
    selectedCanvasArtifactId: null,
  });
}

describe("processArtifactSpawnQueue additional artifacts", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates an additional artifact directly, once, without a permission prompt", () => {
    const cardId = "card_1";
    useCanvasStore.setState({
      cards: {
        [cardId]: {
          id: cardId,
          threadId: "t1",
          question: "Also show me a tuner component",
          answer: "Done",
          status: "done",
          position: { x: 0, y: 0 },
          parentCardId: null,
          parentConversationId: null,
          artifactPayload: codePayload,
          responseType: "code",
        },
      },
      canvasArtifactNodes: {
        existing: {
          id: "existing",
          artifactId: "art_existing",
          versionId: "ver_existing",
          sourceCardId: cardId,
          position: { x: 400, y: 0 },
        },
      },
    });

    processArtifactSpawnQueue(cardId);
    processArtifactSpawnQueue(cardId);

    const state = useCanvasStore.getState();
    const nodes = Object.values(state.canvasArtifactNodes);
    expect(nodes.filter((n) => n.permissionPreview)).toHaveLength(0);

    const created = nodes.filter((n) => n.id !== "existing");
    expect(created).toHaveLength(1);
    const art = state.sessionArtifacts[created[0]!.artifactId];
    expect(art?.kind).toBe("code");
    expect(art?.title).toBe("GuitarTuner.jsx");
  });

  it("clears artifactPayload after spawning additional artifacts", () => {
    const cardId = "card_1";
    useCanvasStore.setState({
      cards: {
        [cardId]: {
          id: cardId,
          threadId: "t1",
          question: "Also show me a tuner component",
          answer: "Done",
          status: "done",
          position: { x: 0, y: 0 },
          parentCardId: null,
          parentConversationId: null,
          artifactPayload: codePayload,
          responseType: "code",
        },
      },
      canvasArtifactNodes: {
        existing: {
          id: "existing",
          artifactId: "art_existing",
          versionId: "ver_existing",
          sourceCardId: cardId,
          position: { x: 400, y: 0 },
        },
      },
    });

    processArtifactSpawnQueue(cardId);

    expect(useCanvasStore.getState().cards[cardId]?.artifactPayload).toBeUndefined();
  });
});
