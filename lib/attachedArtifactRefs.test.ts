import { describe, expect, it } from "vitest";
import { resolveCardAttachedArtifactRefs } from "@/lib/attachedArtifactRefs";
import type { Card } from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import { createSessionArtifactFromPayload } from "@/lib/sessionArtifacts";

const baseCard = (id: string, patch: Partial<Card> = {}): Card => ({
  id,
  threadId: "thread_1",
  question: "",
  answer: "",
  status: "empty",
  position: { x: 0, y: 0 },
  parentCardId: null,
  parentConversationId: null,
  ...patch,
});

describe("resolveCardAttachedArtifactRefs", () => {
  it("prefers persisted attachedArtifacts on the card", () => {
    const refs = resolveCardAttachedArtifactRefs("card_1", {
      cards: {
        card_1: baseCard("card_1", {
          attachedArtifacts: [{ artifactId: "art_a", versionId: "ver_a" }],
        }),
      },
      artifactPlugConnections: [],
      canvasArtifactNodes: {},
      plugComposerAttachments: {},
    });
    expect(refs).toEqual([{ artifactId: "art_a", versionId: "ver_a" }]);
  });

  it("falls back to visual plug connection when card has no attachment", () => {
    const timeline = createSessionArtifactFromPayload(
      {
        type: "timeline",
        title: "Untitled timeline",
        data: { scale: "month", events: [] },
      },
      "__manual_timeline__",
    );
    const refs = resolveCardAttachedArtifactRefs("card_1", {
      cards: { card_1: baseCard("card_1") },
      artifactPlugConnections: [
        {
          id: "plug_1",
          artifactNodeId: "node_1",
          cardId: "card_1",
          fromSide: "right",
          toSide: "left",
        },
      ],
      canvasArtifactNodes: {
        node_1: {
          id: "node_1",
          artifactId: timeline.id,
          versionId: timeline.latestVersionId,
          sourceCardId: "__manual_timeline__",
          position: { x: 0, y: 0 },
        },
      },
      plugComposerAttachments: {},
      sessionArtifacts: { [timeline.id]: timeline },
    });
    expect(refs[0]?.artifactId).toBe(timeline.id);
  });
});
