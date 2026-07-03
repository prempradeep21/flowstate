"use client";

import { useMemo } from "react";
import { canvasColors, darkCanvasColors, canvasRadiusBasePx } from "@/lib/design/tokens";
import { contrastRatio, gradeContrast } from "@/lib/design/contrast";
import { ARTIFACT_CATEGORY_META } from "@/lib/design/theme/artifactCategories";
import { getThemePreset, THEME_PRESETS } from "@/lib/design/theme/presets";
import { useThemeStore } from "@/lib/design/theme/themeStore";
import { ARTIFACT_CATEGORY_IDS } from "@/lib/design/theme/types";

const ROLE_LABELS = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["tertiary", "Accent"],
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-canvas-caption font-semibold uppercase tracking-wider text-canvas-muted">
      {children}
    </p>
  );
}

function ColorSwatchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-canvas-border">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: value }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function ContrastBadge({ hex, mode }: { hex: string; mode: "light" | "dark" }) {
  const surface = mode === "dark" ? darkCanvasColors.card : canvasColors.card;
  const ratio = contrastRatio(hex, surface);
  const grade = gradeContrast(ratio);
  const tone =
    grade === "fail"
      ? "bg-canvas-danger-soft text-canvas-danger"
      : "bg-canvas-success-soft text-canvas-success-text";
  return (
    <span
      title={`Contrast vs. card surface: ${ratio.toFixed(2)}:1`}
      className={`rounded-full px-2 py-0.5 text-canvas-caption font-medium tabular-nums ${tone}`}
    >
      {grade === "fail" ? `${ratio.toFixed(1)}:1` : grade}
    </span>
  );
}

export function PanelControls() {
  const state = useThemeStore((s) => s.state);
  const setPreset = useThemeStore((s) => s.setPreset);
  const setMode = useThemeStore((s) => s.setMode);
  const setRoleColor = useThemeStore((s) => s.setRoleColor);
  const setCategoryColor = useThemeStore((s) => s.setCategoryColor);
  const setRadiusBase = useThemeStore((s) => s.setRadiusBase);
  const resetToPreset = useThemeStore((s) => s.resetToPreset);

  const preset = useMemo(() => getThemePreset(state.presetId), [state.presetId]);
  const radius = state.overrides.radiusBase ?? preset.radiusBase ?? canvasRadiusBasePx;
  const hasOverrides =
    state.overrides.primary != null ||
    state.overrides.secondary != null ||
    state.overrides.tertiary != null ||
    state.overrides.radiusBase != null ||
    Object.values(state.overrides.categories ?? {}).some((v) => v != null);

  const copyThemeJson = () => {
    void navigator.clipboard?.writeText(JSON.stringify(state, null, 2));
  };

  return (
    <div className="flex flex-col gap-7">
      {/* Theme presets */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((p) => {
            const active = p.id === state.presetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`flex items-center gap-2.5 rounded-canvas-md border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-canvas-ink bg-canvas-card"
                    : "border-canvas-border bg-canvas-card hover:border-canvas-ink/40"
                }`}
              >
                <span className="flex -space-x-1">
                  {[p.primary, p.secondary, p.tertiary].map((hex, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-canvas-card"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span className="text-canvas-compact font-medium text-canvas-ink">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mode */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Mode</SectionLabel>
        <div className="flex w-fit rounded-canvas-md border border-canvas-border bg-canvas-card p-0.5">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-[calc(var(--canvas-radius-md)-2px)] px-4 py-1.5 text-canvas-compact font-medium capitalize transition-colors ${
                state.mode === m
                  ? "bg-canvas-ink text-canvas-card"
                  : "text-canvas-muted hover:text-canvas-ink"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* Role colors */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Colors</SectionLabel>
        <div className="flex flex-col gap-2">
          {ROLE_LABELS.map(([role, label]) => {
            const value = state.overrides[role] ?? preset[role];
            return (
              <div
                key={role}
                className="flex items-center gap-3 rounded-canvas-md border border-canvas-border bg-canvas-card px-3 py-2"
              >
                <ColorSwatchInput
                  value={value}
                  onChange={(hex) => setRoleColor(role, hex)}
                />
                <span className="flex-1 text-canvas-body-sm font-medium text-canvas-ink">
                  {label}
                </span>
                <span className="font-mono text-canvas-caption text-canvas-muted">
                  {value}
                </span>
                <ContrastBadge hex={value} mode={state.mode} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Artifact category colors */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Artifact categories</SectionLabel>
        <div className="flex flex-col gap-2">
          {ARTIFACT_CATEGORY_IDS.map((category) => {
            const meta = ARTIFACT_CATEGORY_META[category];
            const value =
              state.overrides.categories?.[category] ??
              preset.categories[category];
            return (
              <div
                key={category}
                className="flex items-center gap-3 rounded-canvas-md border border-canvas-border bg-canvas-card px-3 py-2"
              >
                <ColorSwatchInput
                  value={value}
                  onChange={(hex) => setCategoryColor(category, hex)}
                />
                <span className="flex-1">
                  <span className="block text-canvas-body-sm font-medium text-canvas-ink">
                    {meta.label}
                  </span>
                  <span className="block text-canvas-caption text-canvas-muted">
                    {meta.kinds.join(", ")}
                  </span>
                </span>
                <span className="font-mono text-canvas-caption text-canvas-muted">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Corner radius */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Corner radius</SectionLabel>
        <div className="flex items-center gap-3 rounded-canvas-md border border-canvas-border bg-canvas-card px-3 py-3">
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={radius}
            onChange={(e) => setRadiusBase(Number(e.target.value))}
            className="flex-1 accent-[rgb(var(--canvas-accent))]"
          />
          <span className="w-12 text-right font-mono text-canvas-caption text-canvas-muted">
            {radius}px
          </span>
        </div>
      </section>

      {/* Actions */}
      <section className="flex items-center gap-2">
        <button
          type="button"
          onClick={resetToPreset}
          disabled={!hasOverrides}
          className="rounded-canvas-md border border-canvas-border bg-canvas-card px-4 py-2 text-canvas-compact font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset to preset
        </button>
        <button
          type="button"
          onClick={copyThemeJson}
          className="rounded-canvas-md border border-canvas-border bg-canvas-card px-4 py-2 text-canvas-compact font-medium text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          Copy theme JSON
        </button>
      </section>
    </div>
  );
}
