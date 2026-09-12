import { describe, expect, it } from "vitest";
import { CANVAS_TABLE_ARTIFACT_WIDTH } from "@/lib/canvasNodeBounds";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import { buildAirbnbCanvas } from "@/lib/sampleCanvases/airbnb/buildAirbnbCanvas";
import { ABNB_DISTRICTS } from "@/lib/sampleCanvases/airbnb/data";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { countWords } from "@/lib/timelineArtifact";
import { parseYoutubeId } from "@/lib/youtube";

type Snapshot = ReturnType<typeof buildAirbnbCanvas>;

function latestPayloads(snapshot: Snapshot) {
  return Object.values(snapshot.sessionArtifacts).map((artifact) => {
    const version = getLatestVersion(artifact);
    expect(version).toBeDefined();
    return version!.payload;
  });
}

function nodeRects(snapshot: Snapshot) {
  return Object.values(snapshot.canvasArtifactNodes ?? {}).map((node) => {
    expect(node.size).toBeDefined();
    return {
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      w: node.size!.w,
      h: node.size!.h,
    };
  });
}

describe("buildAirbnbCanvas", () => {
  it("builds a version-1 snapshot that survives a JSON round-trip", () => {
    const snapshot = buildAirbnbCanvas();
    expect(snapshot.version).toBe(1);

    const roundTripped = parseCanvasSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(roundTripped).not.toBeNull();
    expect(Object.keys(roundTripped!.sessionArtifacts)).toHaveLength(
      Object.keys(snapshot.sessionArtifacts).length,
    );
    expect(roundTripped!.canvasArtifactOrder).toEqual(snapshot.canvasArtifactOrder);
    expect(roundTripped!.canvasTextLabelOrder).toEqual(snapshot.canvasTextLabelOrder);
    expect(roundTripped!.cardOrder).toEqual(snapshot.cardOrder);
  });

  it("keeps nodes, artifacts, and order arrays referentially consistent", () => {
    const snapshot = buildAirbnbCanvas();
    const nodes = snapshot.canvasArtifactNodes ?? {};
    const order = snapshot.canvasArtifactOrder ?? [];

    expect(order).toHaveLength(Object.keys(nodes).length);
    expect(new Set(order)).toEqual(new Set(Object.keys(nodes)));

    const placed = new Set<string>();
    for (const node of Object.values(nodes)) {
      const artifact = snapshot.sessionArtifacts[node.artifactId];
      expect(artifact, `node ${node.id} → ${node.artifactId}`).toBeDefined();
      expect(node.versionId).toBe(artifact!.latestVersionId);
      expect(node.size).toBeDefined();
      placed.add(node.artifactId);
    }
    // Every artifact placed exactly once — an authored-but-unplaced artifact is
    // invisible on the canvas and would otherwise ship silently.
    expect(placed).toEqual(new Set(Object.keys(snapshot.sessionArtifacts)));

    const labels = snapshot.canvasTextLabels ?? {};
    const labelOrder = snapshot.canvasTextLabelOrder ?? [];
    expect(labelOrder).toHaveLength(Object.keys(labels).length);
    expect(new Set(labelOrder)).toEqual(new Set(Object.keys(labels)));
  });

  it("ships only verified, well-formed payload data", () => {
    const snapshot = buildAirbnbCanvas();

    for (const payload of latestPayloads(snapshot)) {
      if (payload.type === "images") {
        for (const item of payload.data.items) {
          expect(item.url.startsWith("https://")).toBe(true);
          if (item.kind === "youtube") {
            expect(parseYoutubeId(item.url), item.url).toBeTruthy();
            expect(item.thumb).toMatch(/^https:\/\/i\.ytimg\.com\//);
          } else {
            // Builders have no storage context — remote Commons URLs only.
            expect(item.url).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
          }
        }
      }

      if (payload.type === "website") {
        const { url, title, domainLabel, embeddable, previewImageUrl } = payload.data;
        expect(url.startsWith("https://")).toBe(true);
        expect(title).not.toBe("");
        // A card titled with its own domain means the real page title was never
        // fetched.
        expect(title).not.toBe(domainLabel);
        // Both are researched, never left to resolve at render: nothing enriches
        // a builder-authored website artifact.
        expect(typeof embeddable, url).toBe("boolean");
        expect(previewImageUrl, url).toBeTruthy();
        expect(previewImageUrl!.startsWith("https://")).toBe(true);
      }

      if (payload.type === "chart") {
        const { chartType, categories, series, slices, source } = payload.data;
        // The normalizer has three mutually exclusive branches and each drops
        // the others' fields: a gauge keeps neither `series` nor `slices`, and a
        // pie keeps only `slices`. Assert per branch or a gauge reads as empty.
        if (chartType === "gauge") {
          expect(payload.data.gaugeValue, payload.title).toBeDefined();
          expect(payload.data.gaugeMax ?? 100).toBeGreaterThan(0);
        } else if (chartType === "pie") {
          expect(slices?.length ?? 0, payload.title).toBeGreaterThan(0);
        } else {
          expect(series?.length ?? 0, payload.title).toBeGreaterThan(0);
          for (const entry of series ?? []) {
            expect(entry.data).toHaveLength(categories?.length ?? 0);
          }
        }
        // Every number on this canvas is traceable to the filing that reports it.
        expect(source, payload.title).toBeTruthy();
      }

      if (payload.type === "timeline") {
        for (const event of payload.data.events) {
          expect(Number.isNaN(Date.parse(event.at))).toBe(false);
          // Longer labels are silently truncated by the normalizer.
          expect(countWords(event.label), event.label).toBeLessThanOrEqual(10);
        }
      }

      if (payload.type === "map" || payload.type === "streetview") {
        const { lat, lng } = payload.data.place;
        expect(lat).toBeDefined();
        expect(lng).toBeDefined();
        expect(lat!).toBeGreaterThanOrEqual(-90);
        expect(lat!).toBeLessThanOrEqual(90);
        expect(lng!).toBeGreaterThanOrEqual(-180);
        expect(lng!).toBeLessThanOrEqual(180);
      }
    }
  });

  it("places no two nodes on top of each other", () => {
    const rects = nodeRects(buildAirbnbCanvas());
    const overlaps: string[] = [];
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i]!;
        const b = rects[j]!;
        if (
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y
        ) {
          overlaps.push(`${a.id} overlaps ${b.id}`);
        }
      }
    }
    expect(overlaps).toEqual([]);
  });

  it("actually exercises the mixed-width case the overlap test exists for", () => {
    // The stride bug only bites when a non-520 artifact sits in a cluster
    // column: a 680 table under a `520 + gap` assumption runs 80px into the
    // sticky column. Without this guard, an edit that moved every table out of
    // the districts would leave the overlap test green while the geometry was
    // still wrong.
    const rects = nodeRects(buildAirbnbCanvas());
    const wideInClusters = rects.filter(
      (rect) => rect.w === CANVAS_TABLE_ARTIFACT_WIDTH && rect.y > 2000,
    );
    expect(wideInClusters.length).toBeGreaterThan(0);
  });

  it("declares both lens branches and well-formed districts", () => {
    for (const district of ABNB_DISTRICTS) {
      expect(district.label.trim()).not.toBe("");
      expect(district.subtitle.trim()).not.toBe("");
      expect(district.clusters.length).toBeGreaterThanOrEqual(1);
      expect(district.clusters.length).toBeLessThanOrEqual(3);
      for (const cluster of district.clusters) {
        expect(cluster.columns.length).toBeGreaterThanOrEqual(1);
        expect(cluster.stickies.length).toBeGreaterThanOrEqual(1);
      }
    }
    // Airbnb crossed from private to public, so it must earn both branches of
    // the lens set the skill promises — this is the canvas that proves them.
    const lenses = ABNB_DISTRICTS.map((district) => district.lens);
    expect(lenses).toContain("public");
    expect(lenses).toContain("private");
  });

  it("opens framed on the scoreboard with the seed card on screen", () => {
    const snapshot = buildAirbnbCanvas();
    const { viewport } = snapshot;
    expect(viewport.scale).toBeGreaterThan(0);

    // screen = world * scale + viewport. The seed card carries the question the
    // canvas answers; framing bounds that exclude it strand it off the left edge.
    const card = snapshot.cards[snapshot.cardOrder[0]!]!;
    const screenX = card.position.x * viewport.scale + viewport.x;
    const screenY = card.position.y * viewport.scale + viewport.y;
    expect(screenX).toBeGreaterThanOrEqual(0);
    expect(screenY).toBeGreaterThanOrEqual(0);
  });
});
