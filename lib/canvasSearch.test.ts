import { describe, expect, it } from "vitest";
import {
  buildCanvasSearchIndex,
  searchCanvasIndex,
  type CanvasSearchIndexInput,
} from "@/lib/canvasSearch";
import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasTextLabel,
  Card,
  Connection,
} from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

function card(id: string, threadId: string, question: string): Card {
  return {
    id,
    threadId,
    question,
    answer: "",
    status: "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
  } as Card;
}

function artifact(id: string, title: string): SessionArtifact {
  return { id, title, kind: "table", versions: [], latestVersionId: "v1" };
}

function artifactNode(
  id: string,
  artifactId: string,
): CanvasArtifactNode {
  return {
    id,
    artifactId,
    versionId: "v1",
    sourceCardId: "c1",
    position: { x: 0, y: 0 },
  };
}

function asset(id: string, name: string): CanvasAsset {
  return {
    id,
    canvasId: "canvas1",
    ownerId: "u1",
    name,
    mimeType: "application/pdf",
    sizeBytes: 1,
    storagePath: "",
    publicUrl: "",
    kind: "document",
    createdAt: 0,
  };
}

function label(id: string, text: string): CanvasTextLabel {
  return { id, text, position: { x: 0, y: 0 }, fontSize: 40 };
}

/** Minimal canvas: one artifact, one chat thread, one asset, one label. */
function baseState(
  overrides: Partial<CanvasSearchIndexInput> = {},
): CanvasSearchIndexInput {
  return {
    cards: { c1: card("c1", "t1", "Revenue model assumptions") },
    cardOrder: ["c1"],
    connections: [],
    threads: { t1: { id: "t1", accentColour: "#000" } },
    threadOrder: ["t1"],
    collapsedBranchThreadIds: [],
    collapsedCardIds: [],
    canvasArtifactNodes: { n1: artifactNode("n1", "a1") },
    canvasArtifactOrder: ["n1"],
    sessionArtifacts: { a1: artifact("a1", "2026 Revenue model") },
    canvasAssets: { s1: asset("s1", "pitch-deck.pdf") },
    canvasAssetNodes: { an1: { id: "an1", assetId: "s1", position: { x: 0, y: 0 } } },
    canvasAssetOrder: ["an1"],
    canvasTextLabels: { l1: label("l1", "Growth levers") },
    canvasTextLabelOrder: ["l1"],
    ...overrides,
  };
}

describe("buildCanvasSearchIndex", () => {
  it("indexes all four kinds", () => {
    const index = buildCanvasSearchIndex(baseState());
    expect(index.map((e) => [e.kind, e.title])).toEqual([
      ["artifact", "2026 Revenue model"],
      ["chat", "Revenue model assumptions"],
      ["asset", "pitch-deck.pdf"],
      ["label", "Growth levers"],
    ]);
  });

  it("targets the thread root card, not the thread", () => {
    const index = buildCanvasSearchIndex(baseState());
    const chat = index.find((e) => e.kind === "chat");
    expect(chat?.target).toEqual({ type: "card", cardId: "c1" });
  });

  it("skips artifact nodes with no artifactId (generating previews)", () => {
    const pending = {
      id: "n2",
      artifactId: "",
      versionId: "",
      sourceCardId: "c1",
      position: { x: 0, y: 0 },
    } as CanvasArtifactNode;
    const index = buildCanvasSearchIndex(
      baseState({
        canvasArtifactNodes: { n1: artifactNode("n1", "a1"), n2: pending },
        canvasArtifactOrder: ["n1", "n2"],
      }),
    );
    expect(index.filter((e) => e.kind === "artifact")).toHaveLength(1);
  });

  it("skips threads hidden by chatsGloballyHidden", () => {
    const index = buildCanvasSearchIndex(
      baseState({ chatsGloballyHidden: true }),
    );
    expect(index.some((e) => e.kind === "chat")).toBe(false);
  });

  it("skips threads under a collapsed branch", () => {
    // t2 branches laterally off c1, so collapsing t2 hides its root card c2.
    const connections: Connection[] = [
      {
        id: "conn1",
        from: "c1",
        to: "c2",
        fromSide: "right",
        toSide: "left",
      },
    ];
    const index = buildCanvasSearchIndex(
      baseState({
        cards: {
          c1: card("c1", "t1", "Revenue model assumptions"),
          c2: card("c2", "t2", "Pricing sensitivity"),
        },
        cardOrder: ["c1", "c2"],
        connections,
        threads: {
          t1: { id: "t1", accentColour: "#000" },
          t2: { id: "t2", accentColour: "#111" },
        },
        threadOrder: ["t1", "t2"],
        collapsedBranchThreadIds: ["t2"],
      }),
    );
    const chatTitles = index.filter((e) => e.kind === "chat").map((e) => e.title);
    expect(chatTitles).toEqual(["Revenue model assumptions"]);
  });

  it("skips threads with no question yet", () => {
    const index = buildCanvasSearchIndex(
      baseState({ cards: { c1: card("c1", "t1", "  ") } }),
    );
    expect(index.some((e) => e.kind === "chat")).toBe(false);
  });

  it("collapses whitespace in multi-line label text", () => {
    const index = buildCanvasSearchIndex(
      baseState({ canvasTextLabels: { l1: label("l1", "Growth\n  levers") } }),
    );
    expect(index.find((e) => e.kind === "label")?.title).toBe("Growth levers");
  });
});

describe("searchCanvasIndex", () => {
  const index = buildCanvasSearchIndex(baseState());

  it("returns nothing for an empty or whitespace query", () => {
    expect(searchCanvasIndex(index, "")).toEqual([]);
    expect(searchCanvasIndex(index, "   ")).toEqual([]);
  });

  it("matches case-insensitively on title substrings", () => {
    expect(searchCanvasIndex(index, "GROWTH").map((e) => e.title)).toEqual([
      "Growth levers",
    ]);
  });

  it("requires every token to match (AND)", () => {
    expect(searchCanvasIndex(index, "revenue model")).toHaveLength(2);
    expect(searchCanvasIndex(index, "revenue nonsense")).toHaveLength(0);
  });

  it("matches tokens out of order", () => {
    expect(searchCanvasIndex(index, "model revenue")).toHaveLength(2);
  });

  it("ranks prefix above word-boundary above mid-word", () => {
    const ranked = buildCanvasSearchIndex(
      baseState({
        canvasTextLabels: {
          mid: label("mid", "Submarine"),
          boundary: label("boundary", "Deep marine survey"),
          prefix: label("prefix", "Marine biology"),
        },
        canvasTextLabelOrder: ["mid", "boundary", "prefix"],
        canvasArtifactOrder: [],
        canvasAssetOrder: [],
        threadOrder: [],
      }),
    );
    expect(searchCanvasIndex(ranked, "marine").map((e) => e.title)).toEqual([
      "Marine biology",
      "Deep marine survey",
      "Submarine",
    ]);
  });

  it("breaks a positional tie by kind priority", () => {
    // Both are exact prefixes at index 0 — artifact must outrank label.
    const tied = buildCanvasSearchIndex(
      baseState({
        sessionArtifacts: { a1: artifact("a1", "Atlas") },
        canvasTextLabels: { l1: label("l1", "Atlas") },
        canvasAssetOrder: [],
        threadOrder: [],
      }),
    );
    expect(searchCanvasIndex(tied, "atlas").map((e) => e.kind)).toEqual([
      "artifact",
      "label",
    ]);
  });

  it("caps the result count", () => {
    const many = buildCanvasSearchIndex(
      baseState({
        canvasTextLabels: Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`l${i}`, label(`l${i}`, `Note ${i}`)]),
        ),
        canvasTextLabelOrder: Array.from({ length: 20 }, (_, i) => `l${i}`),
        canvasArtifactOrder: [],
        canvasAssetOrder: [],
        threadOrder: [],
      }),
    );
    expect(searchCanvasIndex(many, "note")).toHaveLength(8);
    expect(searchCanvasIndex(many, "note", 3)).toHaveLength(3);
  });
});
