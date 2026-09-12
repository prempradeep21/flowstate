import { describe, expect, it } from "vitest";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import { buildPhilKnightCanvas } from "@/lib/sampleCanvases/philKnight/buildPhilKnightCanvas";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { countWords } from "@/lib/timelineArtifact";
import { parseYoutubeId } from "@/lib/youtube";

function latestPayloads(snapshot: ReturnType<typeof buildPhilKnightCanvas>) {
  return Object.values(snapshot.sessionArtifacts).map((artifact) => {
    const version = getLatestVersion(artifact);
    expect(version).toBeDefined();
    return version!.payload;
  });
}

describe("buildPhilKnightCanvas", () => {
  it("builds a version-1 snapshot that survives a JSON round-trip", () => {
    const snapshot = buildPhilKnightCanvas();
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
    const snapshot = buildPhilKnightCanvas();

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
    const snapshot = buildPhilKnightCanvas();

    for (const payload of latestPayloads(snapshot)) {
      if (payload.type === "images") {
        for (const item of payload.data.items) {
          expect(item.url.startsWith("https://")).toBe(true);
          if (item.kind === "youtube") {
            expect(parseYoutubeId(item.url)).toBeTruthy();
            expect(item.thumb).toMatch(/^https:\/\/i\.ytimg\.com\//);
          }
          // Galleries point at remote files only — builders have no storage context.
          if (item.kind === "image") {
            expect(item.url).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
          }
        }
      }
      if (payload.type === "website") {
        expect(payload.data.url.startsWith("https://")).toBe(true);
        expect(payload.data.title).not.toBe("");
        // Nothing enriches builder-authored website artifacts at render time —
        // /api/link-preview only runs when a user pastes a URL. So both fields
        // are researched at authoring time, or the card ships as a dead
        // "No preview image" placeholder that never becomes interactive.
        expect(typeof payload.data.embeddable).toBe("boolean");
        expect(payload.data.previewImageUrl).toBeTruthy();
        expect(payload.data.previewImageUrl!.startsWith("https://")).toBe(true);
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

  it("frames the opened canvas on the overview band", () => {
    const { viewport } = buildPhilKnightCanvas();
    // screen = world * scale + viewport; the band starts near world origin, so a
    // wrong sign here strands the user in empty space.
    expect(viewport.scale).toBeGreaterThan(0);
    expect(viewport.x).toBeGreaterThanOrEqual(0);
    expect(viewport.y).toBeGreaterThanOrEqual(0);
  });
});
