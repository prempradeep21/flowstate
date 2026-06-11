import { describe, expect, it } from "vitest";
import {
  clampArtifactSize,
  clampStreetViewArtifactSize,
  MAX_ARTIFACT_HEIGHT,
  MAX_ARTIFACT_WIDTH,
  MIN_ARTIFACT_HEIGHT,
  MIN_ARTIFACT_WIDTH,
  STREET_VIEW_ARTIFACT_HEIGHT,
  CANVAS_ARTIFACT_WIDTH,
} from "@/lib/canvasNodeBounds";
import { STREET_VIEW_NODE_CHROME_PX } from "@/lib/streetViewArtifact";

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

describe("clampStreetViewArtifactSize", () => {
  it("keeps a square content area at the default width", () => {
    expect(clampStreetViewArtifactSize(CANVAS_ARTIFACT_WIDTH)).toEqual({
      w: CANVAS_ARTIFACT_WIDTH,
      h: STREET_VIEW_ARTIFACT_HEIGHT,
    });
  });

  it("caps width when height would exceed the artifact maximum", () => {
    expect(clampStreetViewArtifactSize(MAX_ARTIFACT_WIDTH)).toEqual({
      w: MAX_ARTIFACT_HEIGHT - STREET_VIEW_NODE_CHROME_PX,
      h: MAX_ARTIFACT_HEIGHT,
    });
  });
});
