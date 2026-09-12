"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
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
  const customThemes = useThemeStore((s) => s.customThemes);
  const refreshCustomThemes = useThemeStore((s) => s.refreshCustomThemes);
  const setPreset = useThemeStore((s) => s.setPreset);
  const setMode = useThemeStore((s) => s.setMode);
  const setRoleColor = useThemeStore((s) => s.setRoleColor);
  const setCategoryColor = useThemeStore((s) => s.setCategoryColor);
  const setRadiusBase = useThemeStore((s) => s.setRadiusBase);
  const resetToPreset = useThemeStore((s) => s.resetToPreset);

  const preset = useMemo(
    () => getThemePreset(state.presetId, customThemes),
    [state.presetId, customThemes],
  );
  const radius = state.overrides.radiusBase ?? preset.radiusBase ?? canvasRadiusBasePx;
  const hasOverrides =
    state.overrides.primary != null ||
    state.overrides.secondary != null ||
    state.overrides.tertiary != null ||
    state.overrides.radiusBase != null ||
    Object.values(state.overrides.categories ?? {}).some((v) => v != null);

  const [saveName, setSaveName] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [publishStatus, setPublishStatus] = useState<
    | { kind: "idle" }
    | { kind: "publishing" }
    | { kind: "published" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const copyThemeJson = () => {
    void navigator.clipboard?.writeText(JSON.stringify(state, null, 2));
  };

  const saveCurrentAsTheme = async () => {
    const name = saveName.trim();
    if (!name) return;
    setSaveStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/theme/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          preset: {
            description: `Saved from ${preset.name}.`,
            primary: state.overrides.primary ?? preset.primary,
            secondary: state.overrides.secondary ?? preset.secondary,
            tertiary: state.overrides.tertiary ?? preset.tertiary,
            categories: Object.fromEntries(
              ARTIFACT_CATEGORY_IDS.map((category) => [
                category,
                state.overrides.categories?.[category] ?? preset.categories[category],
              ]),
            ),
            radiusBase: radius,
          },
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveStatus({ kind: "error", message: body?.error ?? `Save failed (${res.status})` });
        return;
      }
      setSaveName("");
      setSaveStatus({ kind: "idle" });
      await refreshCustomThemes();
    } catch {
      setSaveStatus({ kind: "error", message: "Network error while saving." });
    }
  };

  const deleteCustomTheme = async (id: string) => {
    try {
      await fetch(`/api/admin/theme/custom?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await refreshCustomThemes();
    } catch {
      // Best-effort — the grid just won't update until next load.
    }
  };

  const publishCurrentTheme = async () => {
    setPublishStatus({ kind: "publishing" });
    try {
      const res = await fetch("/api/admin/theme/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId: state.presetId, overrides: state.overrides }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPublishStatus({
          kind: "error",
          message: body?.error ?? `Publish failed (${res.status})`,
        });
        return;
      }
      setPublishStatus({ kind: "published" });
    } catch {
      setPublishStatus({ kind: "error", message: "Network error while publishing." });
    }
  };

  return (
    <div className="flex flex-col gap-7">
      {/* Theme presets */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((p) => {
            const active = p.id === state.presetId;
            const isFactoryDefault = p.id === "flowstate";
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
                <span className="min-w-0 flex-1 text-canvas-compact font-medium text-canvas-ink">
                  {p.name}
                </span>
                {isFactoryDefault ? (
                  <span
                    title="Baked in — always available as a safe reset point"
                    className="rounded-full bg-canvas-bg px-1.5 py-0.5 text-canvas-caption text-canvas-muted"
                  >
                    Default
                  </span>
                ) : null}
              </button>
            );
          })}
          {customThemes.map((p) => {
            const active = p.id === state.presetId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-canvas-md border px-3 py-2.5 ${
                  active
                    ? "border-canvas-ink bg-canvas-card"
                    : "border-canvas-border bg-canvas-card"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
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
                  <span className="min-w-0 flex-1 truncate text-canvas-compact font-medium text-canvas-ink">
                    {p.name}
                  </span>
                </button>
                <span className="rounded-full bg-canvas-artifactIconBg px-1.5 py-0.5 text-canvas-caption text-canvas-accent">
                  Custom
                </span>
                <CloseButton
                  onClick={() => deleteCustomTheme(p.id)}
                  label={`Delete ${p.name}`}
                />
              </div>
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

      {/* Save as custom theme */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Save theme</SectionLabel>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void saveCurrentAsTheme();
            }}
            placeholder="Name this theme…"
            className="min-w-0 flex-1 rounded-canvas-md border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm text-canvas-ink outline-none focus-visible:border-canvas-accent/50"
          />
          <Button
            variant="primary"
            onClick={saveCurrentAsTheme}
            disabled={!saveName.trim()}
            loading={saveStatus.kind === "saving"}
          >
            {saveStatus.kind === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
        {saveStatus.kind === "error" ? (
          <p className="text-canvas-caption text-canvas-danger">{saveStatus.message}</p>
        ) : null}
      </section>

      {/* Actions */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={resetToPreset} disabled={!hasOverrides}>
            Reset to preset
          </Button>
          <Button variant="ghost" onClick={copyThemeJson}>
            Copy theme JSON
          </Button>
          <Button
            variant="primary"
            onClick={publishCurrentTheme}
            loading={publishStatus.kind === "publishing"}
          >
            {publishStatus.kind === "publishing"
              ? "Publishing…"
              : publishStatus.kind === "published"
                ? "Published ✓"
                : "Publish as default"}
          </Button>
        </div>
        <p className="text-canvas-caption text-canvas-muted">
          Publish sets this as the default for new sessions on this local dev
          server. Commit the updated{" "}
          <code className="font-mono">publishedTheme.json</code> to ship it.
        </p>
        {publishStatus.kind === "error" ? (
          <p className="text-canvas-caption text-canvas-danger">{publishStatus.message}</p>
        ) : null}
      </section>
    </div>
  );
}
