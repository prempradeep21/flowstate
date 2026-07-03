"use client";

import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import {
  patternDotRadius,
  patternOffset,
  patternTileSize,
} from "@/components/canvasBackgrounds/viewportSync";

import { CANVAS_BG } from "@/lib/design/tokens";

const BASE_SPACING = 22;
const BASE_DOT_RADIUS = 0.5;
/** Grid-only opacity — keeps global --canvas-dot tokens unchanged. */
const DOT_COLOR = "rgb(var(--canvas-dot) / 0.28)";
const BG_COLOR = CANVAS_BG;

export function GridBackground({
  viewport = { x: 0, y: 0, scale: 1 },
  className = "",
}: BackgroundRenderProps) {
  const tileSize = patternTileSize(BASE_SPACING, viewport.scale);
  const offset = patternOffset(viewport, tileSize);
  const dotRadius = patternDotRadius(BASE_DOT_RADIUS, viewport.scale);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full ${className}`}
      aria-hidden
      style={{
        backgroundColor: BG_COLOR,
        backgroundImage: `radial-gradient(circle, ${DOT_COLOR} ${dotRadius}px, transparent ${dotRadius}px)`,
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    />
  );
}
