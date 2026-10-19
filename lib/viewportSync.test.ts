import { describe, expect, it } from "vitest";
import {
  dotGridPaint,
  patternDotRadius,
  patternOffset,
  patternTileSize,
  positiveMod,
} from "@/components/canvasBackgrounds/viewportSync";

describe("positiveMod", () => {
  it("returns non-negative offsets for negative viewport values", () => {
    expect(positiveMod(-1, 22)).toBe(21);
    expect(positiveMod(-50, 22)).toBe(16);
    expect(positiveMod(-22, 22)).toEqual(0);
  });

  it("matches standard modulo for positive values", () => {
    expect(positiveMod(50, 22)).toBe(6);
    expect(positiveMod(0, 22)).toBe(0);
  });
});

describe("patternOffset", () => {
  it("never returns negative pattern offsets", () => {
    const tile = patternTileSize(22, 0.25);
    const offset = patternOffset({ x: -400, y: -250, scale: 0.25 }, tile);
    expect(offset.x).toBeGreaterThanOrEqual(0);
    expect(offset.y).toBeGreaterThanOrEqual(0);
    expect(offset.x).toBeLessThan(tile);
    expect(offset.y).toBeLessThan(tile);
  });
});

describe("patternDotRadius", () => {
  it("scales proportionally without a screen-space floor", () => {
    expect(patternDotRadius(0.5, 0.1)).toBe(0.05);
    expect(patternDotRadius(0.5, 1)).toBe(0.5);
    expect(patternDotRadius(0.5, 3)).toBe(1.5);
  });

  it("keeps a constant dot-to-spacing ratio across zoom levels", () => {
    const baseSpacing = 22;
    const baseRadius = 0.5;
    const expectedRatio = baseRadius / baseSpacing;

    for (const scale of [0.1, 0.25, 1, 2, 3]) {
      const tile = patternTileSize(baseSpacing, scale);
      const radius = patternDotRadius(baseRadius, scale);
      expect(radius / tile).toBeCloseTo(expectedRatio, 5);
    }
  });
});

describe("dotGridPaint", () => {
  const sizes = (scale: number) =>
    dotGridPaint({ x: 0, y: 0, scale })
      .backgroundSize.split(", ")
      .map((s) => parseFloat(s));

  it("keeps the fine level at least 10px apart on screen", () => {
    for (const scale of [0.1, 0.2, 0.33, 0.5, 0.75, 1, 2, 4]) {
      const [coarse, fine] = sizes(scale);
      expect(fine).toBeGreaterThanOrEqual(10 - 1e-9);
      expect(coarse).toBeCloseTo(fine! * 2);
    }
  });

  it("never subdivides below the world spacing when zoomed in", () => {
    expect(sizes(3)[1]).toBeCloseTo(66);
  });

  it("draws the fine level at full strength at 100%", () => {
    expect(dotGridPaint({ x: 0, y: 0, scale: 1 }).backgroundImage).toContain(
      "/ 1.000)",
    );
  });
});
