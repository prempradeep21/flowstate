import type { Viewport } from "@/lib/store";

export function patternTileSize(baseSpacing: number, scale: number): number {
  return baseSpacing * scale;
}

export function patternDotRadius(baseRadius: number, scale: number): number {
  return baseRadius * scale;
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

/** World-space distance between dots at the finest grid level. */
export const DOT_GRID_WORLD_SPACING = 22;
/** Below this on-screen spacing a level is fully faded out. */
const DOT_GRID_MIN_SCREEN_SPACING = 10;
/** At or above this on-screen spacing a level draws at full strength. */
const DOT_GRID_FULL_SCREEN_SPACING = 18;
/** On-screen dot radius bounds — dots stay legible zoomed out and never
 * balloon zoomed in (FigJam-style: spacing tracks zoom, dot size barely does). */
const DOT_GRID_MIN_RADIUS = 1;
const DOT_GRID_MAX_RADIUS = 1.6;

export interface DotGridPaint {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
}

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

function dotLayer(color: string, radius: number): string {
  // A 1px soft edge anti-aliases the dot instead of a hard, shimmering step.
  const core = Math.max(0, radius - 0.5);
  return `radial-gradient(circle at center, ${color} ${core}px, transparent ${radius + 0.5}px)`;
}

/**
 * Level-of-detail dot grid. Two layers are drawn: a fine level and the next
 * level up at twice the spacing, whose dots land on every other fine dot.
 * As zooming out crowds the fine dots below `DOT_GRID_FULL_SCREEN_SPACING`,
 * they fade (and shrink) away; once fully gone, the coarse level becomes the
 * new fine level — so the handoff is seamless at every zoom. Zooming in never
 * subdivides below the world spacing; dots just spread apart.
 */
export function dotGridPaint(
  viewport: Viewport,
  channelsVar = "--canvas-grid-dot",
): DotGridPaint {
  const scale = Math.max(viewport.scale, 1e-4);
  const baseScreen = DOT_GRID_WORLD_SPACING * scale;
  const level = Math.max(
    0,
    Math.ceil(Math.log2(DOT_GRID_MIN_SCREEN_SPACING / baseScreen)),
  );
  const fine = baseScreen * 2 ** level;
  const coarse = fine * 2;
  const fineAlpha = smoothstep(
    (fine - DOT_GRID_MIN_SCREEN_SPACING) /
      (DOT_GRID_FULL_SCREEN_SPACING - DOT_GRID_MIN_SCREEN_SPACING),
  );
  const radius = Math.min(
    DOT_GRID_MAX_RADIUS,
    Math.max(DOT_GRID_MIN_RADIUS, scale ** 0.4),
  );
  const fineRadius = radius * (0.6 + 0.4 * fineAlpha);

  // Gradients centre in their tile; shift by half a tile so dots sit on
  // world multiples of the spacing and coarse dots coincide with fine ones.
  const at = (tile: number) => {
    const x = positiveMod(viewport.x - tile / 2, tile);
    const y = positiveMod(viewport.y - tile / 2, tile);
    return `${x}px ${y}px`;
  };

  const solid = `rgb(var(${channelsVar}))`;
  const faded = `rgb(var(${channelsVar}) / ${fineAlpha.toFixed(3)})`;
  return {
    backgroundImage: `${dotLayer(solid, radius)}, ${dotLayer(faded, fineRadius)}`,
    backgroundSize: `${coarse}px ${coarse}px, ${fine}px ${fine}px`,
    backgroundPosition: `${at(coarse)}, ${at(fine)}`,
  };
}
