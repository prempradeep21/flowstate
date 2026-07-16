import { describe, expect, it } from "vitest";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import { buildGuinnessCampaignCanvas } from "@/lib/sampleCanvases/guinnessCampaign/buildGuinnessCampaignCanvas";
import { ZONE_X } from "@/lib/sampleCanvases/guinnessCampaign/layout";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { countWords } from "@/lib/timelineArtifact";
import { parseYoutubeId } from "@/lib/youtube";

type Snapshot = ReturnType<typeof buildGuinnessCampaignCanvas>;

function latestPayloads(snapshot: Snapshot) {
  return Object.values(snapshot.sessionArtifacts).map((artifact) => {
    const version = getLatestVersion(artifact);
    expect(version).toBeDefined();
    return version!.payload;
  });
}

interface PlacedNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Every placed node — artifacts, assets and skills alike. */
function placedNodes(snapshot: Snapshot): PlacedNode[] {
  const out: PlacedNode[] = [];
  for (const id of snapshot.canvasArtifactOrder ?? []) {
    const n = snapshot.canvasArtifactNodes![id]!;
    out.push({ id, x: n.position.x, y: n.position.y, w: n.size?.w ?? 0, h: n.size?.h ?? 0 });
  }
  for (const id of snapshot.canvasAssetOrder ?? []) {
    const n = snapshot.canvasAssetNodes![id]!;
    out.push({ id, x: n.position.x, y: n.position.y, w: n.size?.w ?? 0, h: n.size?.h ?? 0 });
  }
  for (const id of snapshot.canvasSkillOrder ?? []) {
    const n = snapshot.canvasSkillNodes![id]!;
    out.push({ id, x: n.position.x, y: n.position.y, w: 280, h: 120 });
  }
  return out;
}

/** Vertical extent of every node whose x falls in [from, to). */
function verticalExtentInRange(snapshot: Snapshot, from: number, to: number) {
  const inRange = placedNodes(snapshot).filter((n) => n.x >= from && n.x < to);
  const min = Math.min(...inRange.map((n) => n.y));
  const max = Math.max(...inRange.map((n) => n.y + n.h));
  return max - min;
}

describe("buildGuinnessCampaignCanvas", () => {
  it("builds a version-1 snapshot that survives a JSON round-trip", () => {
    const snapshot = buildGuinnessCampaignCanvas();
    expect(snapshot.version).toBe(1);

    const roundTripped = parseCanvasSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(roundTripped).not.toBeNull();
    expect(Object.keys(roundTripped!.sessionArtifacts)).toHaveLength(
      Object.keys(snapshot.sessionArtifacts).length,
    );
    expect(roundTripped!.canvasArtifactOrder).toEqual(snapshot.canvasArtifactOrder);
    expect(roundTripped!.canvasAssetOrder).toEqual(snapshot.canvasAssetOrder);
    expect(roundTripped!.canvasSkillOrder).toEqual(snapshot.canvasSkillOrder);
    expect(roundTripped!.canvasTextLabelOrder).toEqual(snapshot.canvasTextLabelOrder);
  });

  it("keeps nodes, artifacts, and order arrays referentially consistent", () => {
    const snapshot = buildGuinnessCampaignCanvas();

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
    const placed = (snapshot.canvasArtifactOrder ?? []).map(
      (id) => snapshot.canvasArtifactNodes![id]!.artifactId,
    );
    expect(new Set(placed).size).toBe(placed.length);
    expect(new Set(placed)).toEqual(new Set(Object.keys(snapshot.sessionArtifacts)));

    // Asset and skill nodes resolve to real records.
    for (const id of snapshot.canvasAssetOrder ?? []) {
      const node = snapshot.canvasAssetNodes?.[id];
      expect(node).toBeDefined();
      expect(snapshot.canvasAssets?.[node!.assetId]).toBeDefined();
    }
    for (const id of snapshot.canvasSkillOrder ?? []) {
      const node = snapshot.canvasSkillNodes?.[id];
      expect(node).toBeDefined();
      expect(snapshot.canvasSkills?.[node!.skillId]).toBeDefined();
    }
  });

  it("ships only verified data shapes (urls, charts, timeline, coordinates)", () => {
    const snapshot = buildGuinnessCampaignCanvas();

    for (const payload of latestPayloads(snapshot)) {
      if (payload.type === "images") {
        for (const item of payload.data.items) {
          expect(item.url.startsWith("https://")).toBe(true);
          if (item.kind === "youtube") {
            expect(parseYoutubeId(item.url)).toBeTruthy();
            expect(item.thumb).toMatch(/^https:\/\/i\.ytimg\.com\//);
          }
          // Remote URLs only — builders have no storage context.
          if (item.kind === "image") {
            expect(item.url).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
          }
        }
      }
      if (payload.type === "website") {
        expect(payload.data.url.startsWith("https://")).toBe(true);
        expect(payload.data.title).not.toBe("");
        // Nothing enriches builder-authored website artifacts at render time —
        // /api/link-preview only runs when a user pastes a URL. Both fields are
        // researched at authoring time, or the card ships as a dead placeholder.
        expect(typeof payload.data.embeddable).toBe("boolean");
        expect(payload.data.previewImageUrl).toBeTruthy();
        expect(payload.data.previewImageUrl!.startsWith("https://")).toBe(true);
        // The real page title, not the "title pending" domain-label default.
        expect(payload.data.title).not.toBe(payload.data.domainLabel);
      }
      if (payload.type === "chart") {
        const { categories, series, slices } = payload.data;
        if (series?.length) {
          expect(categories?.length).toBeGreaterThan(0);
          for (const s of series) {
            expect(s.data).toHaveLength(categories!.length);
          }
        } else if (payload.data.chartType !== "gauge") {
          expect(slices?.length).toBeGreaterThan(0);
        }
        // Real market figures cite Diageo; invented ones say so.
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
        // The geocoder is server-side; a builder must ship coordinates itself.
        for (const pin of payload.data.savedPlaces ?? []) {
          expect(Number.isFinite(pin.lat)).toBe(true);
          expect(Number.isFinite(pin.lng)).toBe(true);
          expect(pin.group).toBeTruthy();
        }
      }
      if (payload.type === "audio") {
        // Catalog audio: a public path, no storage context, real peak count.
        expect(payload.data.storagePath).toBe("");
        expect(payload.data.publicUrl.startsWith("/")).toBe(true);
        expect(payload.data.peaks).toHaveLength(256);
        expect(payload.data.durationMs).toBeGreaterThan(0);
      }
    }
  });

  it("mounts the brief and the tone-of-voice skill from public/", () => {
    const snapshot = buildGuinnessCampaignCanvas();

    const assets = Object.values(snapshot.canvasAssets ?? {});
    const brief = assets.find((a) => a.mimeType === "application/pdf");
    expect(brief).toBeDefined();
    expect(brief!.publicUrl).toBe("/guinness-campaign/samples/guinness-00-brief.pdf");
    expect(brief!.kind).toBe("document");

    const skills = Object.values(snapshot.canvasSkills ?? {});
    expect(skills).toHaveLength(1);
    expect(skills[0]!.publicUrl).toBe(
      "/guinness-campaign/samples/guinness-tone-of-voice.md",
    );
  });

  it("always declares itself a fictional spec pitch", () => {
    const snapshot = buildGuinnessCampaignCanvas();

    // The guardrail: a real brand plus invented agency work must never be able
    // to read as genuine. Both the seed card and a sticky must say so.
    const seed = Object.values(snapshot.cards)[0]!;
    expect(seed.answer.toLowerCase()).toContain("fictional");

    const stickyText = latestPayloads(snapshot)
      .filter((p) => p.type === "stickynote")
      .map((p) => (p.type === "stickynote" ? p.data.text.toLowerCase() : ""))
      .join(" ");
    expect(stickyText).toContain("fictional spec pitch");
  });

  it("is an hourglass — territories and the idea are the waist", () => {
    const snapshot = buildGuinnessCampaignCanvas();

    const h = {
      input: verticalExtentInRange(snapshot, ZONE_X.input, ZONE_X.territories),
      territories: verticalExtentInRange(snapshot, ZONE_X.territories, ZONE_X.idea),
      idea: verticalExtentInRange(snapshot, ZONE_X.idea, ZONE_X.making),
      making: verticalExtentInRange(snapshot, ZONE_X.making, ZONE_X.cut),
      cut: verticalExtentInRange(snapshot, ZONE_X.cut, ZONE_X.output),
      output: verticalExtentInRange(snapshot, ZONE_X.output, Infinity),
    };

    // The whole point of the layout: gather wide, pinch to one line, fan out.
    // The waist is territories→idea; every other zone must be taller than both.
    const waist = Math.max(h.territories, h.idea);
    for (const zone of ["input", "making", "cut", "output"] as const) {
      expect(h[zone]).toBeGreaterThan(waist);
    }
    // And the gathering is the widest thing on the canvas, by a lot.
    expect(h.input).toBeGreaterThan(h.output);
  });

  it("lays out with no overlapping nodes, and every zone clears the next", () => {
    const snapshot = buildGuinnessCampaignCanvas();
    const nodes = placedNodes(snapshot);
    expect(nodes.length).toBeGreaterThan(60);

    // Artifacts are not all one width (a table is 680, most things are 520), so
    // a fixed column stride silently overlaps the next column. This is the check
    // that catches it.
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

    const keys = Object.keys(ZONE_X) as (keyof typeof ZONE_X)[];
    keys.forEach((key, i) => {
      if (i + 1 >= keys.length) return;
      const nextOrigin = ZONE_X[keys[i + 1]!];
      const rightEdge = Math.max(
        ...nodes
          .filter((n) => n.x >= ZONE_X[key] && n.x < nextOrigin)
          .map((n) => n.x + n.w),
      );
      // A zone that outgrows its slot runs into its neighbour.
      expect(rightEdge).toBeLessThanOrEqual(nextOrigin);
    });
  });

  it("opens with the seed card and the input zone on screen", () => {
    const snapshot = buildGuinnessCampaignCanvas();
    const { viewport } = snapshot;
    // screen = world * scale + viewport; a wrong sign strands the user in space.
    expect(viewport.scale).toBeGreaterThan(0);
    expect(viewport.x).toBeGreaterThan(0);
    expect(viewport.y).toBeGreaterThan(0);

    const toScreen = (wx: number, wy: number) => ({
      x: wx * viewport.scale + viewport.x,
      y: wy * viewport.scale + viewport.y,
    });

    // The seed card sits left of the input zone and carries the spec-pitch
    // disclaimer — framing that excludes it puts the one thing the reader must
    // see first off-screen.
    const seed = Object.values(snapshot.cards)[0]!;
    const seedScreen = toScreen(seed.position.x, seed.position.y);
    expect(seedScreen.x).toBeGreaterThanOrEqual(0);
    expect(seedScreen.y).toBeGreaterThanOrEqual(0);

    // The input zone lands within a typical viewport rather than way off right.
    const inputScreen = toScreen(ZONE_X.input, 0);
    expect(inputScreen.x).toBeLessThan(1280);
  });
});
