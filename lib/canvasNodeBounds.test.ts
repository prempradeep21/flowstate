import { describe, expect, it } from "vitest";
import {
  clampArtifactSize,
  getDefaultArtifactSize,
  MAX_ARTIFACT_HEIGHT,
  MAX_ARTIFACT_WIDTH,
  MIN_ARTIFACT_HEIGHT,
  MIN_ARTIFACT_WIDTH,
  STREET_VIEW_ARTIFACT_HEIGHT,
  CANVAS_ARTIFACT_WIDTH,
  getArtifactBounds,
} from "@/lib/canvasNodeBounds";
import { createSessionArtifactFromPayload } from "@/lib/sessionArtifacts";
import { createWebsitePayload, markWebsiteEnriching } from "@/lib/websiteArtifact";

describe("clampArtifactSize", () => {
  it("passes through values within bounds", () => {
    expect(clampArtifactSize(520, 280)).toEqual({ w: 520, h: 280 });
  });

  it("clamps below minimum", () => {
    expect(clampArtifactSize(100, 80)).toEqual({
      w: MIN_ARTIFACT_WIDTH,
      h: MIN_ARTIFACT_HEIGHT,
    });
  });

  it("clamps above maximum", () => {
    expect(clampArtifactSize(2000, 2000)).toEqual({
      w: MAX_ARTIFACT_WIDTH,
      h: MAX_ARTIFACT_HEIGHT,
    });
  });
});

describe("street view default size", () => {
  it("defaults to a wide rectangle, then resizes freely", () => {
    // Street View is not aspect-locked — it spawns as a wide rectangle and
    // afterwards uses the shared free-resize path (clampArtifactSize).
    expect(getDefaultArtifactSize("streetview")).toEqual({
      w: CANVAS_ARTIFACT_WIDTH,
      h: STREET_VIEW_ARTIFACT_HEIGHT,
    });
    expect(CANVAS_ARTIFACT_WIDTH).toBeGreaterThan(STREET_VIEW_ARTIFACT_HEIGHT);
  });
});

describe("content sizing on saved canvases", () => {
  // A saved canvas stores each node's box from the day it was made. The size
  // rules for content-sized kinds still have to reach it — but only by
  // shrinking into that box, so nothing on the canvas moves or overlaps.
  const OLD_SLOT = { w: 520, h: 528 };

  const website = (extras: Parameters<typeof createWebsitePayload>[2]) =>
    createSessionArtifactFromPayload(
      createWebsitePayload("https://example.com", "Example", extras),
      "card",
    );

  it("draws a portrait hero at its own aspect ratio inside the old slot", () => {
    const art = website({
      previewImageUrl: "/poster.jpg",
      previewWidth: 276,
      previewHeight: 361,
    });
    const { w, h } = getArtifactBounds({ size: OLD_SLOT }, art);
    expect(w).toBeLessThanOrEqual(OLD_SLOT.w);
    expect(h).toBeLessThanOrEqual(OLD_SLOT.h);
    // The image area (inside the header, padding and casing) keeps 276:361.
    const imageW = w - 24 - 4;
    const imageH = h - 12 - 72 - 4;
    expect(imageW / imageH).toBeCloseTo(276 / 361, 1);
  });

  it("turns a settled site with no hero into the favicon square", () => {
    // Published before `embeddable` was stored: unresolved, and nothing will
    // ever resolve it, so it is an L1 card.
    const art = website({});
    expect(getArtifactBounds({ size: OLD_SLOT }, art)).toEqual({ w: 280, h: 280 });
  });

  it("keeps the default box while a link check is still running", () => {
    const art = website({});
    markWebsiteEnriching(art.id, true);
    try {
      expect(getArtifactBounds({ size: OLD_SLOT }, art)).toEqual(OLD_SLOT);
    } finally {
      markWebsiteEnriching(art.id, false);
    }
  });

  it("narrows a table to its columns but never past its old box", () => {
    const art = createSessionArtifactFromPayload(
      {
        type: "table",
        title: "Two columns",
        data: {
          columns: [
            { key: "a", label: "City" },
            { key: "b", label: "Position" },
          ],
          rows: [{ a: "Delhi", b: "First" }],
        },
      },
      "card",
    );
    const { w, h } = getArtifactBounds({ size: { w: 1088, h: 528 } }, art);
    expect(w).toBeLessThan(1088);
    expect(h).toBeLessThan(528);
    const cramped = getArtifactBounds({ size: { w: 200, h: 100 } }, art);
    expect(cramped).toEqual({ w: 200, h: 100 });
  });

  it("leaves a node the user resized exactly as they sized it", () => {
    const art = website({});
    expect(
      getArtifactBounds({ size: OLD_SLOT, userSetSize: true }, art),
    ).toEqual(OLD_SLOT);
  });
});
