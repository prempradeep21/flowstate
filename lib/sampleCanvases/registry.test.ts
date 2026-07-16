import { describe, expect, it } from "vitest";
import { isVideoArtifactPayload } from "@/lib/artifactTypes";
import { SAMPLE_CANVAS_REGISTRY } from "@/lib/sampleCanvases/registry";
import type { SampleCanvasStats } from "@/lib/sampleCanvases/types";
import { getLatestVersion } from "@/lib/sessionArtifacts";

/**
 * Registry-wide checks. These live in their own file deliberately: they iterate
 * every entry and build every snapshot, so when an entry's `stats` are wrong the
 * failure should name the registry — not whichever builder's test file happened
 * to host the block.
 */
describe("SAMPLE_CANVAS_REGISTRY", () => {
  it("has unique slugs", () => {
    const slugs = SAMPLE_CANVAS_REGISTRY.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("reports stats that match what each builder actually creates", () => {
    for (const entry of SAMPLE_CANVAS_REGISTRY) {
      const snapshot = entry.buildSnapshot();
      const actual: SampleCanvasStats = {
        charts: 0,
        tables: 0,
        timelines: 0,
        videos: 0,
        websites: 0,
        maps: 0,
        other: 0,
      };
      for (const artifact of Object.values(snapshot.sessionArtifacts)) {
        const payload = getLatestVersion(artifact)!.payload;
        if (payload.type === "chart") actual.charts += 1;
        else if (payload.type === "table") actual.tables += 1;
        else if (payload.type === "timeline") actual.timelines += 1;
        else if (isVideoArtifactPayload(payload)) actual.videos += 1;
        else if (payload.type === "website") actual.websites += 1;
        else if (payload.type === "map" || payload.type === "streetview")
          actual.maps += 1;
        else actual.other += 1;
      }
      expect(actual, `stats for "${entry.slug}"`).toEqual(entry.stats);
    }
  });

  it("only gives skill-produced canvases a createdWithSkillVersion", () => {
    for (const entry of SAMPLE_CANVAS_REGISTRY) {
      if (entry.createdWithSkillVersion !== undefined) {
        expect(
          entry.createdWithSkillVersion,
          `"${entry.slug}" must name a skill and a version`,
        ).toMatch(/^(research-canvas|company-canvas)@\d+\.\d+\.\d+$/);
        expect(entry.kind).toBe("research");
      }
    }
  });
});
