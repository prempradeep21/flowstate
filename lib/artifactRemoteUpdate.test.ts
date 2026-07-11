import { afterEach, describe, expect, it } from "vitest";
import { beginCardAsk, endCardAsk } from "@/lib/cardAskRegistry";
import {
  findRemoteArtifactUpdatingCardId,
  isCardBuildingArtifactVersion,
  isOutputArtifactRemoteVersionInProgress,
  isSessionOutputArtifact,
} from "@/lib/artifactRemoteUpdate";
import type { Card } from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

function baseCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    threadId: "t1",
    question: "Update the table",
    answer: "",
    status: "streaming",
    parentCardId: null,
    parentConversationId: null,
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

function artTable(): SessionArtifact {
  return {
    id: "art_table",
    title: "Sales",
    kind: "table",
    latestVersionId: "aver_1",
    versions: [
      {
        id: "aver_1",
        number: 1,
        createdAt: 1,
        sourceCardId: "c_source",
        payload: {
          type: "table",
          title: "Sales",
          data: { columns: [], rows: [] },
        },
      },
    ],
  };
}

describe("artifactRemoteUpdate", () => {
  afterEach(() => {
    endCardAsk("c_follow");
  });

  it("detects session output artefacts", () => {
    expect(
      isSessionOutputArtifact("art_table", {
        c_source: baseCard({ id: "c_source", outputArtifactId: "art_table" }),
      }),
    ).toBe(true);
    expect(isSessionOutputArtifact("art_manual", {})).toBe(false);
  });

  it("shows remote progress when another chat streams the next version", () => {
    const sessionArtifacts = { art_table: artTable() };
    const cards = {
      c_source: baseCard({
        id: "c_source",
        status: "done",
        outputArtifactId: "art_table",
        outputArtifactVersionId: "aver_1",
      }),
      c_follow: baseCard({
        id: "c_follow",
        parentCardId: "c_source",
        status: "streaming",
        responseType: "table",
        artifactPayload: {
          type: "table",
          title: "Sales",
          data: { columns: [{ key: "a", label: "A" }], rows: [] },
        },
      }),
    };
    const ctx = {
      cards,
      cardOrder: ["c_source", "c_follow"],
      sessionArtifacts,
      connections: [],
      canvasArtifactNodes: {},
    };

    expect(
      isCardBuildingArtifactVersion(cards.c_follow, "art_table", ctx),
    ).toBe(true);
    expect(
      findRemoteArtifactUpdatingCardId("art_table", "c_source", ctx),
    ).toBe("c_follow");
    expect(
      isOutputArtifactRemoteVersionInProgress("art_table", "c_source", ctx),
    ).toBe(true);
  });

  it("ignores the source chat updating its own artefact", () => {
    const sessionArtifacts = { art_table: artTable() };
    const cards = {
      c_source: baseCard({
        id: "c_source",
        status: "streaming",
        outputArtifactId: "art_table",
        responseType: "table",
        artifactPayload: {
          type: "table",
          title: "Sales",
          data: { columns: [{ key: "a", label: "A" }], rows: [] },
        },
      }),
    };
    const ctx = {
      cards,
      cardOrder: ["c_source"],
      sessionArtifacts,
      connections: [],
      canvasArtifactNodes: {},
    };

    expect(
      findRemoteArtifactUpdatingCardId("art_table", "c_source", ctx),
    ).toBeNull();
  });

  it("ignores text-only follow-ups in an artefact thread", () => {
    const sessionArtifacts = { art_table: artTable() };
    const cards = {
      c_source: baseCard({
        id: "c_source",
        status: "done",
        outputArtifactId: "art_table",
      }),
      c_follow: baseCard({
        id: "c_follow",
        parentCardId: "c_source",
        status: "streaming",
        responseType: "text",
        answer: "Here is an explanation",
      }),
    };
    const ctx = {
      cards,
      cardOrder: ["c_source", "c_follow"],
      sessionArtifacts,
      connections: [],
      canvasArtifactNodes: {},
    };

    expect(
      isCardBuildingArtifactVersion(cards.c_follow, "art_table", ctx),
    ).toBe(false);
    expect(
      isOutputArtifactRemoteVersionInProgress("art_table", "c_source", ctx),
    ).toBe(false);
  });

  it("tracks in-flight asks before structured payload arrives", () => {
    const sessionArtifacts = { art_table: artTable() };
    const cards = {
      c_source: baseCard({
        id: "c_source",
        status: "done",
        outputArtifactId: "art_table",
      }),
      c_follow: baseCard({
        id: "c_follow",
        parentCardId: "c_source",
        status: "done",
        responseType: "table",
        answer: "",
        artifactPayload: {
          type: "table",
          title: "Sales",
          data: { columns: [{ key: "a", label: "A" }], rows: [] },
        },
      }),
    };
    const token = beginCardAsk("c_follow");
    const ctx = {
      cards,
      cardOrder: ["c_source", "c_follow"],
      sessionArtifacts,
      connections: [],
      canvasArtifactNodes: {},
    };

    expect(
      isOutputArtifactRemoteVersionInProgress("art_table", "c_source", ctx),
    ).toBe(true);
    endCardAsk("c_follow", token);
  });
});
