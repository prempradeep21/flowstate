import { describe, expect, it } from "vitest";
import {
  materializeCardArtifact,
  repairLoadedArtifactState,
  resolveArtifactPreviewStatus,
} from "@/lib/materializeCardArtifact";
import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  appendArtifactVersion,
  resolveInheritedArtifactIdForParent,
  resolvePreviewVersionNumber,
} from "@/lib/sessionArtifacts";
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

  it("appends map updates to inherited thread artifact", () => {
    const parent: Card = {
      id: "card_1",
      threadId: "thread_1",
      question: "Show Bangalore on a map",
      answer: "Here is Bangalore.",
      status: "done",
      position: { x: 0, y: 0 },
      outputArtifactId: "art_map",
    };
    const child: Card = {
      id: "card_2",
      threadId: "thread_1",
      question: "Add nurseries to the map",
      answer: "Added markers.",
      status: "done",
      position: { x: 0, y: 400 },
      parentCardId: "card_1",
      inheritedArtifactId: "art_map",
      artifactPayload: {
        type: "map",
        title: "Bangalore nurseries",
        data: {
          place: { name: "Bangalore, India" },
          savedPlaces: [
            { id: "p1", label: "Lalbagh", lat: 12.95, lng: 77.58 },
          ],
        },
      },
    };

    const sessionArtifacts = {
      art_map: {
        id: "art_map",
        title: "Bangalore",
        kind: "map" as const,
        latestVersionId: "aver_1",
        versions: [
          {
            id: "aver_1",
            number: 1,
            createdAt: 1,
            sourceCardId: "card_1",
            payload: {
              type: "map" as const,
              title: "Bangalore",
              data: { place: { name: "Bangalore, India" } },
            },
          },
        ],
      },
    };

    const result = materializeCardArtifact(child, sessionArtifacts, {
      cards: { card_1: parent, card_2: child },
      connections: [],
      cardOrder: ["card_1", "card_2"],
    });

    expect(result).not.toBeNull();
    expect(result!.artifactId).toBe("art_map");
    expect(result!.versionId).not.toBe("aver_1");
    expect(result!.sessionArtifacts.art_map.versions).toHaveLength(2);
  });
});

describe("resolveInheritedArtifactIdForParent", () => {
  it("walks the parent chain when the immediate parent has no output artifact", () => {
    const root: Card = {
      id: "card_1",
      threadId: "thread_1",
      question: "Table",
      answer: "Done",
      status: "done",
      position: { x: 0, y: 0 },
      outputArtifactId: "art_table",
    };
    const middle: Card = {
      id: "card_2",
      threadId: "thread_1",
      question: "Explain row 1",
      answer: "Sure",
      status: "done",
      position: { x: 0, y: 200 },
      parentCardId: "card_1",
      inheritedArtifactId: "art_table",
    };

    expect(
      resolveInheritedArtifactIdForParent(
        "card_2",
        { card_1: root, card_2: middle },
        [],
        ["card_1", "card_2"],
      ),
    ).toBe("art_table");
  });
});

describe("appendArtifactVersion", () => {
  it("keeps the artifact title on follow-up edits", () => {
    const artifact = {
      id: "art_table",
      title: "Top Companies by Contribution to World GDP",
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
            title: "Top Companies by Contribution to World GDP",
            data: { columns: [], rows: [] },
          },
        },
      ],
    };

    const { artifact: next, versionId } = appendArtifactVersion(
      artifact,
      {
        type: "table",
        title: "Add a column for publicly traded or private company",
        data: { columns: [{ key: "listing", label: "Listing" }], rows: [] },
      },
      "card_2",
    );

    expect(versionId).toBeTruthy();
    expect(next.title).toBe("Top Companies by Contribution to World GDP");
    expect(next.versions[1]?.payload.title).toBe(
      "Top Companies by Contribution to World GDP",
    );
  });
});

describe("resolvePreviewVersionNumber", () => {
  it("returns the next version while a follow-up is generating", () => {
    const parent: Card = {
      id: "card_1",
      threadId: "thread_1",
      question: "Table",
      answer: "Done",
      status: "done",
      position: { x: 0, y: 0 },
      outputArtifactId: "art_table",
    };
    const child: Card = {
      id: "card_2",
      threadId: "thread_1",
      question: "Add rows",
      answer: "",
      status: "streaming",
      position: { x: 0, y: 400 },
      parentCardId: "card_1",
      inheritedArtifactId: "art_table",
      artifactPayload: {
        type: "table",
        title: "Table",
        data: { columns: [], rows: [] },
      },
    };

    expect(
      resolvePreviewVersionNumber(
        child,
        {
          art_table: {
            id: "art_table",
            title: "Table",
            kind: "table",
            latestVersionId: "aver_1",
            versions: [
              {
                id: "aver_1",
                number: 1,
                createdAt: 1,
                sourceCardId: "card_1",
                payload: {
                  type: "table",
                  title: "Table",
                  data: { columns: [], rows: [{ name: "A" }] },
                },
              },
            ],
          },
        },
        { card_1: parent, card_2: child },
        [],
        ["card_1", "card_2"],
      ),
    ).toBe(2);
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
      canvasTheme: "light",
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
