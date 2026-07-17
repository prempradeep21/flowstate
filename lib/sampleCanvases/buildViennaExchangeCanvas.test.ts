import { describe, expect, it } from "vitest";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import { buildViennaExchangeCanvas } from "@/lib/sampleCanvases/viennaExchange/buildViennaExchangeCanvas";
import { VIENNA_ZONE_X } from "@/lib/sampleCanvases/viennaExchange/data";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { countWords } from "@/lib/timelineArtifact";
import { parseYoutubeId } from "@/lib/youtube";

type Snapshot = ReturnType<typeof buildViennaExchangeCanvas>;

function latestPayloads(snapshot: Snapshot) {
  return Object.values(snapshot.sessionArtifacts).map((a) => getLatestVersion(a)!.payload);
}

interface PlacedNode { id: string; x: number; y: number; w: number; h: number }

function placedNodes(snapshot: Snapshot): PlacedNode[] {
  return (snapshot.canvasArtifactOrder ?? []).map((id) => {
    const n = snapshot.canvasArtifactNodes![id]!;
    return { id, x: n.position.x, y: n.position.y, w: n.size?.w ?? 0, h: n.size?.h ?? 0 };
  });
}

describe("buildViennaExchangeCanvas", () => {
  it("builds a version-1 snapshot that survives a JSON round-trip", () => {
    const snapshot = buildViennaExchangeCanvas();
    expect(snapshot.version).toBe(1);
    const round = parseCanvasSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(round).not.toBeNull();
    expect(Object.keys(round!.sessionArtifacts)).toHaveLength(
      Object.keys(snapshot.sessionArtifacts).length,
    );
    expect(round!.canvasArtifactOrder).toEqual(snapshot.canvasArtifactOrder);
    expect(round!.canvasTextLabelOrder).toEqual(snapshot.canvasTextLabelOrder);
  });

  it("keeps nodes, artifacts, and order arrays referentially consistent", () => {
    const snapshot = buildViennaExchangeCanvas();
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
    const placed = (snapshot.canvasArtifactOrder ?? []).map(
      (id) => snapshot.canvasArtifactNodes![id]!.artifactId,
    );
    expect(new Set(placed).size).toBe(placed.length);
    expect(new Set(placed)).toEqual(new Set(Object.keys(snapshot.sessionArtifacts)));
  });

  it("ships only verified data shapes", () => {
    const snapshot = buildViennaExchangeCanvas();
    for (const payload of latestPayloads(snapshot)) {
      if (payload.type === "images") {
        for (const item of payload.data.items) {
          expect(item.url.startsWith("https://")).toBe(true);
          if (item.kind === "youtube") {
            expect(parseYoutubeId(item.url)).toBeTruthy();
            expect(item.thumb).toMatch(/^https:\/\/i\.ytimg\.com\//);
          }
          if (item.kind === "image") {
            expect(item.url).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
          }
        }
      }
      if (payload.type === "website") {
        expect(payload.data.url.startsWith("https://")).toBe(true);
        expect(payload.data.title).not.toBe("");
        expect(typeof payload.data.embeddable).toBe("boolean");
        expect(payload.data.previewImageUrl).toBeTruthy();
        expect(payload.data.previewImageUrl!.startsWith("https://")).toBe(true);
        expect(payload.data.title).not.toBe(payload.data.domainLabel);
      }
      if (payload.type === "chart") {
        const { categories, series, slices } = payload.data;
        if (series?.length) {
          expect(categories?.length).toBeGreaterThan(0);
          for (const s of series) expect(s.data).toHaveLength(categories!.length);
        } else if (payload.data.chartType !== "gauge") {
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
      if (payload.type === "map") {
        for (const pin of payload.data.savedPlaces ?? []) {
          expect(Number.isFinite(pin.lat)).toBe(true);
          expect(Number.isFinite(pin.lng)).toBe(true);
          expect(pin.group).toBeTruthy();
        }
      }
      if (payload.type === "audio") {
        expect(payload.data.storagePath).toBe("");
        expect(payload.data.publicUrl.startsWith("/")).toBe(true);
        expect(payload.data.peaks).toHaveLength(256);
        expect(payload.data.durationMs).toBeGreaterThan(0);
      }
    }
  });

  it("always declares itself a fictional film", () => {
    const snapshot = buildViennaExchangeCanvas();
    const seed = Object.values(snapshot.cards)[0]!;
    expect(seed.answer.toLowerCase()).toContain("fictional");
    const stickyText = latestPayloads(snapshot)
      .filter((p) => p.type === "stickynote")
      .map((p) => (p.type === "stickynote" ? p.data.text.toLowerCase() : ""))
      .join(" ");
    expect(stickyText).toContain("fictional film");
  });

  it("lays out a dense wall with no overlaps, every zone clearing the next", () => {
    const snapshot = buildViennaExchangeCanvas();
    const nodes = placedNodes(snapshot);
    expect(nodes.length).toBeGreaterThan(25);

    const collisions: string[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
          collisions.push(`${a.id} overlaps ${b.id}`);
        }
      }
    }
    expect(collisions).toEqual([]);

    const keys = Object.keys(VIENNA_ZONE_X);
    keys.forEach((key, i) => {
      if (i + 1 >= keys.length) return;
      const nextOrigin = VIENNA_ZONE_X[keys[i + 1]!]!;
      const inZone = nodes.filter((n) => n.x >= VIENNA_ZONE_X[key]! && n.x < nextOrigin);
      if (inZone.length === 0) return;
      const rightEdge = Math.max(...inZone.map((n) => n.x + n.w));
      expect(rightEdge, `zone "${key}" runs into "${keys[i + 1]}"`).toBeLessThanOrEqual(nextOrigin);
    });
  });

  it("opens with the seed card and the pitch on screen", () => {
    const { viewport, cards } = buildViennaExchangeCanvas();
    expect(viewport.scale).toBeGreaterThan(0);
    const toScreen = (wx: number, wy: number) => ({
      x: wx * viewport.scale + viewport.x,
      y: wy * viewport.scale + viewport.y,
    });
    const seed = Object.values(cards)[0]!;
    const seedScreen = toScreen(seed.position.x, seed.position.y);
    expect(seedScreen.x).toBeGreaterThanOrEqual(0);
    const pitchScreen = toScreen(VIENNA_ZONE_X.pitch!, 0);
    expect(pitchScreen.x).toBeLessThan(1280);
  });
});
