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
} from "@/lib/canvasNodeBounds";

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
