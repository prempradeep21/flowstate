import { describe, expect, it } from "vitest";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { createSessionArtifactFromPayload } from "@/lib/sessionArtifacts";

// Mirror filterAlreadySpawnedPayloads from processArtifactSpawnQueue.ts
import { canAppendArtifactVersion } from "@/lib/sessionArtifacts";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import type { Card } from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

function filterAlreadySpawnedPayloads(
  card: Card,
  payloads: ArtifactPayload[],
  sessionArtifacts: Record<string, SessionArtifact>,
  editingArtifactId: string | null,
): ArtifactPayload[] {
  if (!card.outputArtifactId) return payloads;
  const art = sessionArtifacts[card.outputArtifactId];
  if (!art) return payloads;
  if (editingArtifactId && editingArtifactId === card.outputArtifactId) {
    return payloads.filter((p) => canAppendArtifactVersion(art, p));
  }
  return payloads.filter((p) => payloadToArtifactKind(p) !== art.kind);
}

const timelineUpdate: ArtifactPayload = {
  type: "timeline",
  title: "WWII timeline",
  data: {
    scale: "year",
    events: [{ id: "e1", label: "War begins", at: "1939-09-01T12:00:00.000Z" }],
  },
};

describe("filterAlreadySpawnedPayloads", () => {
  it("allows same-kind timeline updates when editing the output artefact", () => {
    const art = createSessionArtifactFromPayload(
      {
        type: "timeline",
        title: "Untitled timeline",
        data: { scale: "month", events: [] },
      },
      "__manual_timeline__",
    );
    const card: Card = {
      id: "card_1",
      threadId: "t1",
      question: "Update timeline",
      answer: "",
      status: "streaming",
      position: { x: 0, y: 0 },
      parentCardId: null,
      parentConversationId: null,
      outputArtifactId: art.id,
    };
    const filtered = filterAlreadySpawnedPayloads(
      card,
      [timelineUpdate],
      { [art.id]: art },
      art.id,
    );
    expect(filtered).toHaveLength(1);
  });

  it("still filters duplicate spawns of the same kind for unrelated output", () => {
    const art = createSessionArtifactFromPayload(
      {
        type: "table",
        title: "Table",
        data: { columns: [], rows: [] },
      },
      "card_0",
    );
    const card: Card = {
      id: "card_1",
      threadId: "t1",
      question: "Another table",
      answer: "",
      status: "streaming",
      position: { x: 0, y: 0 },
      parentCardId: null,
      parentConversationId: null,
      outputArtifactId: art.id,
    };
    const filtered = filterAlreadySpawnedPayloads(
      card,
      [timelineUpdate],
      { [art.id]: art },
      null,
    );
    expect(filtered).toHaveLength(1);
  });
});
