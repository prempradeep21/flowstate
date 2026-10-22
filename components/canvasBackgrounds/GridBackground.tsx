"use client";

import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { dotGridPaint } from "@/components/canvasBackgrounds/viewportSync";

import { CANVAS_BG } from "@/lib/design/tokens";

export function GridBackground({
  viewport = { x: 0, y: 0, scale: 1 },
  className = "",
}: BackgroundRenderProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full ${className}`}
      aria-hidden
      data-canvas-grid=""
      style={{ backgroundColor: CANVAS_BG, ...dotGridPaint(viewport) }}
    />
  );
}
