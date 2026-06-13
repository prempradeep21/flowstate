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

describe("processArtifactSpawnQueue permission dedupe", () => {
  beforeEach(() => {
    resetStore();
  });

  it("spawns only one permission preview per payload", () => {
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

    const previews = Object.values(
      useCanvasStore.getState().canvasArtifactNodes,
    ).filter((n) => n.permissionPreview?.status === "pending");

    expect(previews).toHaveLength(1);
    expect(previews[0]?.permissionPreview?.title).toBe("GuitarTuner.jsx");
  });

  it("clears artifactPayload after spawning permission previews", () => {
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
