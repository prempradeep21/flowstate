"use client";

import { FROST_ACCENT_PRESETS, useFrostAccent } from "@/components/artifactStyles/styleD/accent";

/**
 * Style D's accent picker: preset swatches plus the system colour wheel.
 * Dragging in the wheel repaints every Frost artifact live.
 */
export function AccentPicker() {
  const { accent, setAccent, changed } = useFrostAccent();
  return (
    <div
      role="group"
      aria-label="Accent colour"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-canvas-border bg-canvas-card py-1 pl-3 pr-1"
    >
      <span className="mr-1 text-canvas-body-sm font-medium text-canvas-muted">Accent</span>
      {FROST_ACCENT_PRESETS.map((p) => {
        const active = p.hex.toLowerCase() === accent.toLowerCase();
        return (
          <button
            key={p.hex}
            type="button"
            title={p.name}
            aria-label={p.name}
            aria-pressed={active}
            onClick={() => setAccent(p.hex)}
            className="h-6 w-6 rounded-full transition-transform hover:scale-110"
            style={{
              background: p.hex,
              boxShadow: active ? "0 0 0 2px rgb(var(--canvas-card)), 0 0 0 3.5px rgb(var(--canvas-ink))" : "inset 0 0 0 1px rgba(0,0,0,0.12)",
            }}
          />
        );
      })}
      <label
        title="Pick any colour"
        className="relative ml-0.5 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-2 text-canvas-body-sm font-medium text-canvas-ink hover:bg-canvas-bg"
      >
        <span
          className="h-5 w-5 rounded-full"
          style={{ background: "conic-gradient(#f44, #fd4, #4f8, #4df, #66f, #f4f, #f44)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }}
        />
        <span className="font-mono text-[12px] uppercase tabular-nums text-canvas-muted">{accent}</span>
        <input
          type="color"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Custom accent colour"
        />
      </label>
      {changed ? (
        <button
          type="button"
          onClick={() => setAccent(null)}
          title="Back to lime"
          className="rounded-full px-2 py-1 text-canvas-micro font-medium text-canvas-muted hover:text-canvas-ink"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}
