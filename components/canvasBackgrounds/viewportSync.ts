import type { Viewport } from "@/lib/store";

export function patternTileSize(baseSpacing: number, scale: number): number {
  return baseSpacing * scale;
}

export function patternOffset(viewport: Viewport, tileSize: number): {
  x: number;
  y: number;
} {
  return {
    x: viewport.x % tileSize,
    y: viewport.y % tileSize,
  };
}
