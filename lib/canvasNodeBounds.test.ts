import { describe, expect, it } from "vitest";
import {
  clampArtifactSize,
  MAX_ARTIFACT_HEIGHT,
  MAX_ARTIFACT_WIDTH,
  MIN_ARTIFACT_HEIGHT,
  MIN_ARTIFACT_WIDTH,
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
