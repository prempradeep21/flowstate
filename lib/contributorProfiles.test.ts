import { describe, expect, it } from "vitest";
import { artifactContributorIds } from "@/lib/contributorProfiles";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

function artifact(
  versions: SessionArtifact["versions"],
): SessionArtifact {
  return {
    id: "art_1",
    title: "Test",
    kind: "embed",
    versions,
    latestVersionId: versions[versions.length - 1]!.id,
  };
}

describe("artifactContributorIds", () => {
  it("puts the first-version creator first, then other version authors", () => {
    const ids = artifactContributorIds(
      artifact([
        {
          id: "v1",
          number: 1,
          createdAt: 1,
          sourceCardId: "card_1",
          payload: { type: "embed", title: "A", data: { url: "u", provider: "x" } },
          createdByUserId: "user_b",
        },
        {
          id: "v2",
          number: 2,
          createdAt: 2,
          sourceCardId: "card_2",
          payload: { type: "embed", title: "A", data: { url: "u", provider: "x" } },
          createdByUserId: "user_a",
        },
      ]),
    );

    expect(ids).toEqual(["user_b", "user_a"]);
  });

  it("falls back to source card contributors before the canvas owner", () => {
    const ids = artifactContributorIds(
      artifact([
        {
          id: "v1",
          number: 1,
          createdAt: 1,
          sourceCardId: "card_1",
          payload: { type: "embed", title: "A", data: { url: "u", provider: "x" } },
        },
      ]),
      {
        card_1: {
          id: "card_1",
          question: "q",
          answer: "",
          status: "done",
          position: { x: 0, y: 0 },
          size: { w: 1, h: 1 },
          contributorIds: ["user_paster", "user_other"],
        },
      },
      "user_owner",
    );

    expect(ids).toEqual(["user_paster", "user_other"]);
  });
});
