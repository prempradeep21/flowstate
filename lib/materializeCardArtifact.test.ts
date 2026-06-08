import { describe, expect, it } from "vitest";
import {
  materializeCardArtifact,
  repairLoadedArtifactState,
  resolveArtifactPreviewStatus,
} from "@/lib/materializeCardArtifact";
import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import type { Card } from "@/lib/store";

describe("materializeCardArtifact", () => {
  it("commits pending artifact payloads into session artifacts", () => {
    const card: Card = {
      id: "card_1",
      threadId: "thread_1",
      question: "Make a table",
      answer: "Here is the table.",
      status: "done",
      position: { x: 0, y: 0 },
      artifactPayload: {
        type: "table",
        title: "Products to Research",
        data: {
          columns: [{ key: "name", label: "Name" }],
          rows: [{ name: "Widget" }],
        },
      },
    };

    const result = materializeCardArtifact(card, {}, {
      cards: { card_1: card },
      connections: [],
      cardOrder: ["card_1"],
    });

    expect(result).not.toBeNull();
    expect(result!.artifactId).toMatch(/^art_/);
    expect(result!.card.outputArtifactId).toBe(result!.artifactId);
    expect(result!.card.outputArtifactVersionId).toBe(result!.versionId);
    expect(result!.card.artifactPayload).toBeUndefined();
    expect(result!.sessionArtifacts[result!.artifactId]?.kind).toBe("table");
  });

  it("repairs missing outputArtifactVersionId from latest version", () => {
    const card: Card = {
      id: "card_1",
      threadId: "thread_1",
      question: "Table",
      answer: "Done",
      status: "done",
      position: { x: 0, y: 0 },
      outputArtifactId: "art_existing",
    };

    const sessionArtifacts = {
      art_existing: {
        id: "art_existing",
        title: "Products",
        kind: "table" as const,
        latestVersionId: "aver_1",
        versions: [
          {
            id: "aver_1",
            number: 1,
            createdAt: 1,
            sourceCardId: "card_1",
            payload: {
              type: "table" as const,
              title: "Products",
              data: { columns: [], rows: [] },
            },
          },
        ],
      },
    };

    const result = materializeCardArtifact(card, sessionArtifacts, {
      cards: { card_1: card },
      connections: [],
      cardOrder: ["card_1"],
    });

    expect(result?.versionId).toBe("aver_1");
    expect(result?.card.outputArtifactVersionId).toBe("aver_1");
  });
});

describe("resolveArtifactPreviewStatus", () => {
  it("marks done cards with pending payloads as failed", () => {
    const card = {
      status: "done",
      artifactPayload: { type: "table", title: "T", data: { columns: [], rows: [] } },
    } as Card;

    expect(resolveArtifactPreviewStatus(card)).toBe("failed");
  });

  it("marks streaming cards as generating", () => {
    const card = { status: "streaming" } as Card;
    expect(resolveArtifactPreviewStatus(card)).toBe("generating");
  });
});

describe("buildCanvasSnapshot", () => {
  it("materializes pending artifacts before persisting cards", () => {
    const card: Card = {
      id: "card_1",
      threadId: "thread_1",
      question: "Table please",
      answer: "Sure.",
      status: "streaming",
      position: { x: 0, y: 0 },
      responseType: "table",
      artifactPayload: {
        type: "table",
        title: "Products to Research",
        data: {
          columns: [{ key: "name", label: "Name" }],
          rows: [{ name: "Widget" }],
        },
      },
    };

    const snapshot = buildCanvasSnapshot({
      viewport: { x: 0, y: 0, scale: 1 },
      cards: { card_1: card },
      cardOrder: ["card_1"],
      connections: [],
      threads: {},
      threadOrder: [],
      groups: {},
      connectorStyle: "orthogonal",
      canvasBackgroundStyle: "grid",
      selectedModel: "claude-sonnet-4-6",
      viewMode: "canvas",
      sessionArtifacts: {},
      canvasArtifactNodes: {},
      canvasArtifactOrder: [],
      canvasTextLabels: {},
      canvasTextLabelOrder: [],
      uploadedAttachments: [],
      collaborationHasEdits: false,
    });

    const saved = snapshot.cards.card_1;
    expect(saved.status).toBe("done");
    expect(saved.artifactPayload).toBeUndefined();
    expect(saved.outputArtifactId).toMatch(/^art_/);
    expect(saved.outputArtifactVersionId).toBeTruthy();
    expect(Object.keys(snapshot.sessionArtifacts)).toHaveLength(1);
  });
});

describe("repairLoadedArtifactState", () => {
  it("repairs cards loaded with stale pending payloads", () => {
    const card: Card = {
      id: "card_1",
      threadId: "thread_1",
      question: "Table",
      answer: "Done",
      status: "done",
      position: { x: 0, y: 0 },
      artifactPayload: {
        type: "table",
        title: "Products",
        data: { columns: [], rows: [] },
      },
    };

    const repaired = repairLoadedArtifactState(
      { card_1: card },
      {},
      [],
      ["card_1"],
    );

    expect(repaired.cards.card_1.outputArtifactId).toMatch(/^art_/);
    expect(repaired.cards.card_1.artifactPayload).toBeUndefined();
    expect(Object.keys(repaired.sessionArtifacts)).toHaveLength(1);
  });
});
