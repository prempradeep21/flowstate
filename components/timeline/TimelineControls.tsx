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
      className="flex shrink-0 flex-wrap items-center gap-3 border-b border-canvas-border px-3 py-2"
      data-no-drag
    >
      <label className="flex items-center gap-2 text-xs text-canvas-muted">
        <span className="sr-only">Time scale</span>
        <select
          value={scale}
          disabled={disabled}
          onChange={(e) => onScaleChange(e.target.value as TimelineScale)}
          className="rounded-full border border-canvas-border bg-canvas-card px-2.5 py-1 text-xs font-medium text-canvas-ink outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
          data-no-drag
        >
          {SCALE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex items-center gap-1.5" data-no-drag>
        <button
          type="button"
          disabled={zoomLocked}
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-canvas-border text-sm text-canvas-ink transition-colors hover:bg-canvas-border/40 disabled:opacity-40"
          data-no-drag
        >
          −
        </button>
        <span className="min-w-[3rem] text-center text-xs tabular-nums text-canvas-muted">
          {zoomPercent}%
        </span>
        <button
          type="button"
          disabled={zoomLocked}
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-canvas-border text-sm text-canvas-ink transition-colors hover:bg-canvas-border/40 disabled:opacity-40"
          data-no-drag
        >
          +
        </button>
      </div>
    </div>
  );
}
