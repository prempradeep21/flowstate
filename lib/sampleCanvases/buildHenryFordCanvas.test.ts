import { describe, expect, it } from "vitest";
import { isVideoArtifactPayload } from "@/lib/artifactTypes";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import { buildHenryFordCanvas } from "@/lib/sampleCanvases/henryFord/buildHenryFordCanvas";
import { SAMPLE_CANVAS_REGISTRY } from "@/lib/sampleCanvases/registry";
import type { SampleCanvasStats } from "@/lib/sampleCanvases/types";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { countWords } from "@/lib/timelineArtifact";
import { parseYoutubeId } from "@/lib/youtube";

function latestPayloads(snapshot: ReturnType<typeof buildHenryFordCanvas>) {
  return Object.values(snapshot.sessionArtifacts).map((artifact) => {
    const version = getLatestVersion(artifact);
    expect(version).toBeDefined();
    return version!.payload;
  });
}

describe("buildHenryFordCanvas", () => {
  it("builds a version-1 snapshot that survives a JSON round-trip", () => {
    const snapshot = buildHenryFordCanvas();
    expect(snapshot.version).toBe(1);

    const roundTripped = parseCanvasSnapshot(
      JSON.parse(JSON.stringify(snapshot)),
    );
    expect(roundTripped).not.toBeNull();
    expect(Object.keys(roundTripped!.sessionArtifacts)).toHaveLength(
      Object.keys(snapshot.sessionArtifacts).length,
    );
    expect(roundTripped!.canvasArtifactOrder).toEqual(
      snapshot.canvasArtifactOrder,
    );
    expect(roundTripped!.canvasTextLabelOrder).toEqual(
      snapshot.canvasTextLabelOrder,
    );
    expect(roundTripped!.cardOrder).toEqual(snapshot.cardOrder);
  });

  it("keeps nodes, artifacts, and order arrays referentially consistent", () => {
    const snapshot = buildHenryFordCanvas();

    const nodeIds = Object.keys(snapshot.canvasArtifactNodes ?? {});
    expect(snapshot.canvasArtifactOrder).toHaveLength(nodeIds.length);
    expect(new Set(snapshot.canvasArtifactOrder)).toEqual(new Set(nodeIds));

    for (const id of snapshot.canvasArtifactOrder ?? []) {
      const node = snapshot.canvasArtifactNodes?.[id];
      expect(node).toBeDefined();
      const artifact = snapshot.sessionArtifacts[node!.artifactId];
      expect(artifact).toBeDefined();
      expect(node!.versionId).toBe(artifact!.latestVersionId);
      expect(node!.size).toBeDefined();
    }

    // Every artifact is placed exactly once.
    const placedArtifactIds = (snapshot.canvasArtifactOrder ?? []).map(
      (id) => snapshot.canvasArtifactNodes![id]!.artifactId,
    );
    expect(new Set(placedArtifactIds).size).toBe(placedArtifactIds.length);
    expect(new Set(placedArtifactIds)).toEqual(
      new Set(Object.keys(snapshot.sessionArtifacts)),
    );

    const labelIds = Object.keys(snapshot.canvasTextLabels ?? {});
    expect(new Set(snapshot.canvasTextLabelOrder)).toEqual(new Set(labelIds));
  });

  it("ships only verified data shapes (urls, charts, timeline, coordinates)", () => {
    const snapshot = buildHenryFordCanvas();

    for (const payload of latestPayloads(snapshot)) {
      if (payload.type === "images") {
        for (const item of payload.data.items) {
          expect(item.url.startsWith("https://")).toBe(true);
          if (item.kind === "youtube") {
            expect(parseYoutubeId(item.url)).toBeTruthy();
            expect(item.thumb).toMatch(/^https:\/\/i\.ytimg\.com\//);
          }
        }
      }
      if (payload.type === "website") {
        expect(payload.data.url.startsWith("https://")).toBe(true);
        expect(payload.data.title).not.toBe("");
        // embeddable resolves at render time — builders must not pin it
        expect(payload.data.embeddable).toBeUndefined();
      }
      if (payload.type === "chart") {
        const { categories, series, slices } = payload.data;
        if (series?.length) {
          expect(categories?.length).toBeGreaterThan(0);
          for (const s of series) {
            expect(s.data).toHaveLength(categories!.length);
          }
        } else {
          expect(slices?.length).toBeGreaterThan(0);
        }
        expect(payload.data.source).toBeTruthy();
      }
      if (payload.type === "timeline") {
        for (const event of payload.data.events) {
          expect(Number.isNaN(Date.parse(event.at))).toBe(false);
          expect(countWords(event.label)).toBeLessThanOrEqual(10);
        }
      }
      if (payload.type === "map" || payload.type === "streetview") {
        const { lat, lng } = payload.data.place;
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      }
    }
  });
});

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
      expect(actual).toEqual(entry.stats);
    }
  });
});
