"use client";

import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import {
  patternOffset,
  patternTileSize,
} from "@/components/canvasBackgrounds/viewportSync";

const BASE_SPACING = 22;
const DOT_COLOR = "#8B8A86";
const BG_COLOR = "#FAFAF8";

export function GridBackground({
  viewport = { x: 0, y: 0, scale: 1 },
  className = "",
}: BackgroundRenderProps) {
  const tileSize = patternTileSize(BASE_SPACING, viewport.scale);
  const offset = patternOffset(viewport, tileSize);
  const dotRadius = Math.max(0.5, 0.5 * viewport.scale);

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
