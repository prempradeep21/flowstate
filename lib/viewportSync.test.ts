import { describe, expect, it } from "vitest";
import {
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
