"use client";

import type { TimelineScale } from "@/lib/artifactTypes";

const SCALE_OPTIONS: { value: TimelineScale; label: string }[] = [
  { value: "year", label: "Years" },
  { value: "month", label: "Months" },
  { value: "day", label: "Days" },
];

export function TimelineControls({
  scale,
  onScaleChange,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  disabled,
  zoomDisabled,
}: {
  scale: TimelineScale;
  onScaleChange: (scale: TimelineScale) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
  zoomDisabled?: boolean;
}) {
  const zoomLocked = zoomDisabled ?? disabled;
  return (
    <div
      className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
      data-no-drag
    >
      <label className="flex items-center gap-1 text-[8px] text-canvas-muted">
        <span className="sr-only">Time scale</span>
        <select
          value={scale}
          disabled={disabled}
          onChange={(e) => onScaleChange(e.target.value as TimelineScale)}
          className="h-3 rounded border border-canvas-border bg-canvas-card px-1 text-[9px] font-medium text-canvas-ink outline-none focus-visible:ring-1 focus-visible:ring-canvas-accent/40"
          data-no-drag
        >
          {SCALE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-0.5" data-no-drag>
        <button
          type="button"
          disabled={zoomLocked}
          onClick={onZoomOut}
          aria-label="Zoom out timeline"
          className="flex h-3 w-3 items-center justify-center rounded-canvas-xs text-canvas-caption leading-none text-canvas-ink transition-colors hover:bg-canvas-border/50 disabled:opacity-40"
          data-no-drag
        >
          −
        </button>
        <span className="min-w-[1.75rem] text-center text-[8px] tabular-nums text-canvas-muted">
          {zoomPercent}%
        </span>
        <button
          type="button"
          disabled={zoomLocked}
          onClick={onZoomIn}
          aria-label="Zoom in timeline"
          className="flex h-3 w-3 items-center justify-center rounded-canvas-xs text-canvas-caption leading-none text-canvas-ink transition-colors hover:bg-canvas-border/50 disabled:opacity-40"
          data-no-drag
        >
          +
        </button>
      </div>
    </div>
  );
}
