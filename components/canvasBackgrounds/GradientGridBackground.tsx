"use client";

import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { CANVAS_BG } from "@/lib/design/tokens";

const GRID_LINE = "rgb(var(--canvas-border))";
const GLOW = "#d5c5ff";

export function GradientGridBackground({ className = "" }: BackgroundRenderProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0 size-full"
        style={{
          backgroundColor: CANVAS_BG,
          backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
          backgroundSize: "6rem 4rem",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle 800px at 100% 200px, ${GLOW}, transparent)`,
        }}
      />
    </div>
  );
}
