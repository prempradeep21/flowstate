import type { Viewport } from "@/lib/store";

export function patternTileSize(baseSpacing: number, scale: number): number {
  return baseSpacing * scale;
}

/** Mathematical modulo — JS `%` returns negative remainders for negative values. */
export function positiveMod(value: number, period: number): number {
  if (period <= 0) return 0;
  return ((value % period) + period) % period;
}

export function patternOffset(viewport: Viewport, tileSize: number): {
  x: number;
  y: number;
} {
  return {
    x: positiveMod(viewport.x, tileSize),
    y: positiveMod(viewport.y, tileSize),
  };
}
