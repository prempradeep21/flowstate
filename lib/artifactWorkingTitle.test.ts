import { describe, expect, it } from "vitest";
import type { ArtifactKind } from "@/lib/artifactTypes";
import {
  artifactKindTitle,
  generatingArtifactHeadline,
  generatingArtifactLabel,
} from "@/lib/artifactWorkingTitle";

const KINDS: ArtifactKind[] = [
  "table", "images", "3d", "custom", "code", "todo", "calendar", "map",
  "streetview", "website", "repo", "embed", "google-doc", "timeline", "chart",
  "audio", "stickynote", "quote", "stat", "definition", "claim", "mechanism",
  "episode", "linkgroup",
];

describe("artifactWorkingTitle", () => {
  it("has a working label and a noun for every kind", () => {
    for (const kind of KINDS) {
      expect(generatingArtifactLabel(kind)).not.toBe("Working on it");
      expect(artifactKindTitle(kind)).toMatch(/^[A-Z0-9]/);
    }
  });

  it("uses the model's title once known and the working label until then", () => {
    expect(generatingArtifactHeadline({ kind: "table", title: "" })).toBe("Cooking up a table");
    expect(generatingArtifactHeadline({ kind: "table", title: "  " })).toBe("Cooking up a table");
    expect(generatingArtifactHeadline({ kind: "table", title: "Top theatres" })).toBe("Top theatres");
  });
});
