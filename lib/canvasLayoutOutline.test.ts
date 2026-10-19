import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildCanvasLayoutOutline,
  clearCanvasLayoutOutline,
  readCanvasLayoutOutline,
  writeCanvasLayoutOutline,
} from "@/lib/canvasLayoutOutline";
import type { CanvasSpatialInput } from "@/lib/canvasSpatialIndex";
import { buildHenryFordCanvas } from "@/lib/sampleCanvases/henryFord/buildHenryFordCanvas";

function spatialInput(): CanvasSpatialInput {
  const s = buildHenryFordCanvas();
  return {
    viewport: s.viewport,
    cards: s.cards,
    cardOrder: s.cardOrder,
    canvasArtifactNodes: s.canvasArtifactNodes ?? {},
    canvasArtifactOrder: s.canvasArtifactOrder ?? [],
    canvasAssets: s.canvasAssets ?? {},
    canvasAssetNodes: s.canvasAssetNodes ?? {},
    canvasAssetOrder: s.canvasAssetOrder ?? [],
    canvasGifNodes: s.canvasGifNodes ?? {},
    canvasGifOrder: s.canvasGifOrder ?? [],
    canvas3DNodes: s.canvas3DNodes ?? {},
    canvas3DOrder: s.canvas3DOrder ?? [],
    canvasSkills: s.canvasSkills ?? {},
    canvasSkillNodes: s.canvasSkillNodes ?? {},
    canvasSkillOrder: s.canvasSkillOrder ?? [],
    canvasTextLabels: s.canvasTextLabels ?? {},
    canvasTextLabelOrder: s.canvasTextLabelOrder ?? [],
    sessionArtifacts: s.sessionArtifacts,
  };
}

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  get size() {
    return this.map.size;
  }
}

describe("canvasLayoutOutline", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    (globalThis as { window?: unknown }).window = { localStorage: storage };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("sketches every artifact with its title, kind and bounds", () => {
    const input = spatialInput();
    const outline = buildCanvasLayoutOutline(input);
    const artifacts = outline.nodes.filter((n) => n.k === "artifact");

    expect(artifacts).toHaveLength(input.canvasArtifactOrder.length);
    const first = input.canvasArtifactNodes[input.canvasArtifactOrder[0]!]!;
    const sketch = artifacts[0]!;
    expect(sketch.x).toBe(Math.round(first.position.x));
    expect(sketch.y).toBe(Math.round(first.position.y));
    expect(sketch.w).toBeGreaterThan(0);
    expect(sketch.h).toBeGreaterThan(0);
    expect(sketch.a).toBe(input.sessionArtifacts[first.artifactId!]!.kind);
    expect(sketch.t).toBeTruthy();
    // Section headings come through as labels, so the layout reads.
    expect(outline.nodes.some((n) => n.k === "label" && n.t)).toBe(true);
  });

  it("round-trips through storage and clears", () => {
    const outline = buildCanvasLayoutOutline(spatialInput());
    writeCanvasLayoutOutline("c1", outline);
    expect(readCanvasLayoutOutline("c1")).toEqual(outline);

    clearCanvasLayoutOutline("c1");
    expect(readCanvasLayoutOutline("c1")).toBeNull();
  });

  it("drops the outline of an empty canvas instead of storing it", () => {
    writeCanvasLayoutOutline("c1", buildCanvasLayoutOutline(spatialInput()));
    writeCanvasLayoutOutline("c1", {
      v: 1,
      viewport: { x: 0, y: 0, scale: 1 },
      nodes: [],
    });
    expect(readCanvasLayoutOutline("c1")).toBeNull();
  });

  it("keeps only the most recent canvases", () => {
    const outline = buildCanvasLayoutOutline(spatialInput());
    for (let i = 0; i < 45; i += 1) writeCanvasLayoutOutline(`c${i}`, outline);

    expect(readCanvasLayoutOutline("c0")).toBeNull();
    expect(readCanvasLayoutOutline("c44")).not.toBeNull();
    // 40 outlines plus the index entry.
    expect(storage.size).toBe(41);
  });

  it("rejects malformed entries", () => {
    storage.setItem("flowstate:canvas-outline:bad", "{not json");
    storage.setItem(
      "flowstate:canvas-outline:zero",
      JSON.stringify({ v: 1, viewport: { x: 0, y: 0, scale: 0 }, nodes: [{}] }),
    );
    expect(readCanvasLayoutOutline("bad")).toBeNull();
    expect(readCanvasLayoutOutline("zero")).toBeNull();
  });
});
