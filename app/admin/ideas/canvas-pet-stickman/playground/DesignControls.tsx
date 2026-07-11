"use client";

import type { PetConfig } from "@/lib/pet/types";
import { StickmanFigure } from "./StickmanFigure";

/** Minimal design phase: stroke color + figure size, with a live preview. */
export function DesignControls({
  config,
  onChange,
}: {
  config: PetConfig;
  onChange: (config: PetConfig) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[280px_1fr]">
      <div className="space-y-5 rounded-canvas border border-canvas-border bg-canvas-card p-4">
        <div>
          <label className="mb-2 block text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.color}
              onChange={(e) => onChange({ ...config, color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded-canvas-sm border border-canvas-border bg-canvas-bg p-0.5"
            />
            <span className="font-mono text-canvas-body-sm text-canvas-muted">
              {config.color}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
            Size
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={36}
              max={80}
              step={2}
              value={config.size}
              onChange={(e) =>
                onChange({ ...config, size: Number(e.target.value) })
              }
              className="flex-1 accent-[rgb(var(--canvas-accent))]"
            />
            <span className="w-12 text-right font-mono text-canvas-body-sm text-canvas-muted">
              {config.size}px
            </span>
          </div>
        </div>

        <p className="text-canvas-caption text-canvas-muted">
          The figure is pure SVG strokes — one head, one torso, four limb
          joints. Poses are CSS keyframes, so the design stays this light no
          matter what it does.
        </p>
      </div>

      {/* Live preview: idle breathing on a pedestal. */}
      <div className="flex items-end justify-center rounded-canvas border border-canvas-border bg-canvas-bg pb-16">
        <div className="flex flex-col items-center">
          <div
            className="sm-pet"
            style={{ position: "relative" }}
            data-pose="stand"
            data-facing="1"
          >
            <div className="sm-facing">
              <StickmanFigure color={config.color} size={config.size} />
            </div>
          </div>
          <div className="h-2 w-36 rounded-full bg-canvas-border" />
          <span className="mt-3 text-canvas-caption text-canvas-muted">
            idle preview
          </span>
        </div>
      </div>
    </div>
  );
}
