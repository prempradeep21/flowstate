"use client";

import { useEffect, useMemo, useState } from "react";
import { mixHex } from "@/lib/design/theme/color";
import { hexToRgbChannels } from "@/lib/design/tokens";
import { ARTIFACT_CATEGORY_META } from "@/lib/design/theme/artifactCategories";
import { ARTIFACT_CATEGORY_IDS } from "@/lib/design/theme/types";
import type { ArtifactCategoryId } from "@/lib/design/theme/types";
import { useCanvasStore } from "@/lib/store";
import { ARTIFACT_TONES_EVENT } from "@/hooks/useCategoryTones";

/**
 * TEMPORARY dev tool — Bento colour lab.
 *
 * Bento is a one-solid-colour-per-category system, so picking those eight
 * hues is the whole design. This panel maps each category to a colour from an
 * editable palette and writes the result straight into the pack's
 * `--art-cat-*` channels (light and dark kept separately), so the canvas
 * behind it repaints live. Nothing here ships: it is mounted only by the
 * dev-only artifact catalog, and the "Copy pack tones" button emits the TS
 * literal to paste into lib/design/style/stylePacks.ts once a set wins.
 */

const PALETTE_STORAGE_KEY = "flowstate.bentoColorLab.palette";
const MAPPING_STORAGE_KEY = "flowstate.bentoColorLab.mapping";

const DEFAULT_PALETTE_TEXT = `--strawberry-red: #f94144ff;
--atomic-tangerine: #f3722cff;
--carrot-orange: #f8961eff;
--coral-glow: #f9844aff;
--tuscan-sun: #f9c74fff;
--willow-green: #90be6dff;
--seagrass: #43aa8bff;
--dark-cyan: #4d908eff;
--blue-slate: #577590ff;
--cerulean: #277da1ff;
--pumpkin-spice: #ff6700ff;
--platinum: #ebebebff;
--silver: #c0c0c0ff;
--cornflower-ocean: #3a6ea5ff;
--steel-azure: #004e98ff;`;

type Mode = "light" | "dark";
type Mapping = Record<Mode, Partial<Record<ArtifactCategoryId, string>>>;

const EMPTY_MAPPING: Mapping = { light: {}, dark: {} };

type Swatch = { name: string; hex: string };

/** `--name: #rrggbb[aa];` lines, bare hexes, one per line — anything else is skipped. */
function parsePalette(text: string): Swatch[] {
  const out: Swatch[] = [];
  const seen = new Set<string>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(
      /^(?:--)?([a-zA-Z0-9_-]+)?\s*:?\s*(#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*;?$/,
    );
    if (!match) continue;
    const hex = `#${match[2].slice(1, 7).toUpperCase()}`;
    if (seen.has(hex)) continue;
    seen.add(hex);
    out.push({ name: match[1] ?? hex, hex });
  }
  return out;
}

function srgbChannel(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = srgbChannel(parseInt(h.slice(0, 2), 16));
  const g = srgbChannel(parseInt(h.slice(2, 4), 16));
  const b = srgbChannel(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * One chosen hue -> the full tone set the pack needs. The card is always the
 * solid, so the only real decision is the ink on top: white, or a deeply
 * darkened version of the hue itself (keeps the card in one family). Whichever
 * carries more contrast wins.
 */
export function tonesFor(hex: string) {
  const darkInk = mixHex(hex, "#000000", 0.84);
  const onSolid =
    contrast(hex, "#FFFFFF") >= contrast(hex, darkInk) ? "#FFFFFF" : darkInk;
  const onSolidMuted = mixHex(onSolid, hex, 0.28);
  return {
    solid: hex,
    onSolid,
    onSolidMuted,
    // No pale role any more — every surface is the solid, so `pale` mirrors it
    // and `ink` / `muted` are the on-solid pair.
    pale: hex,
    ink: onSolid,
    muted: onSolidMuted,
    vivid: onSolid,
    line: mixHex(hex, onSolid, 0.28),
    stage: mixHex(hex, onSolid, 0.1),
    solidLine: mixHex(hex, onSolid, 0.28),
    solidStage: mixHex(hex, onSolid, 0.1),
    ratio: contrast(hex, onSolid),
  };
}

function categoryVars(category: ArtifactCategoryId, hex: string): string {
  const t = tonesFor(hex);
  const p = `--art-cat-${category}`;
  return [
    `${p}-solid: ${hexToRgbChannels(t.solid)};`,
    `${p}-on-solid: ${hexToRgbChannels(t.onSolid)};`,
    `${p}-on-solid-muted: ${hexToRgbChannels(t.onSolidMuted)};`,
    `${p}-pale: ${hexToRgbChannels(t.pale)};`,
    `${p}-ink: ${hexToRgbChannels(t.ink)};`,
    `${p}-muted: ${hexToRgbChannels(t.muted)};`,
    `${p}-vivid: ${hexToRgbChannels(t.vivid)};`,
    `${p}-line: ${hexToRgbChannels(t.line)};`,
    `${p}-stage: ${hexToRgbChannels(t.stage)};`,
    `${p}-solid-line: ${hexToRgbChannels(t.solidLine)};`,
    `${p}-solid-stage: ${hexToRgbChannels(t.solidStage)};`,
  ]
    .map((line) => `  ${line}`)
    .join("\n");
}

/**
 * Light rides on `:not([data-theme="dark"])` so a light-only mapping never
 * leaks into dark; both blocks outweigh the pack's own scope block (the dark
 * one ties on specificity and wins on document order, since this style tag is
 * rendered after ArtifactStyleScope's).
 */
function buildCss(mapping: Mapping): string {
  const blocks: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    const entries = Object.entries(mapping[mode]).filter(([, hex]) => !!hex) as [
      ArtifactCategoryId,
      string,
    ][];
    if (!entries.length) continue;
    const selector =
      mode === "light"
        ? 'html:not([data-theme="dark"]) [data-artifact-style="bento"]'
        : 'html[data-theme="dark"] [data-artifact-style="bento"]';
    blocks.push(
      `${selector} {\n${entries
        .map(([category, hex]) => categoryVars(category, hex))
        .join("\n")}\n}`,
    );
  }
  return blocks.join("\n");
}

function packSnippet(mapping: Mapping, mode: Mode): string {
  const rows = ARTIFACT_CATEGORY_IDS.map((category) => {
    const hex = mapping[mode][category];
    if (!hex) return `  // ${category}: unmapped — keeps the pack default`;
    const t = tonesFor(hex);
    return `  ${category.padEnd(10)} { solid: "${t.solid}", onSolid: "${t.onSolid}", onSolidMuted: "${t.onSolidMuted}", pale: "${t.pale}", ink: "${t.ink}", muted: "${t.muted}", vivid: "${t.vivid}" },`;
  });
  return `// BENTO_${mode.toUpperCase()}_CATEGORIES\n${rows.join("\n")}`;
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function BentoColorLab() {
  const [open, setOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteText, setPaletteText] = useState(DEFAULT_PALETTE_TEXT);
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING);
  const [copied, setCopied] = useState<string | null>(null);
  /** Persist only once the stored state has landed — otherwise the first
      commit (and StrictMode's second effect pass) writes the empty default
      back over it. */
  const [hydrated, setHydrated] = useState(false);

  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const setCanvasTheme = useCanvasStore((s) => s.setCanvasTheme);
  const mode: Mode = canvasTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    setPaletteText(readStored(PALETTE_STORAGE_KEY, DEFAULT_PALETTE_TEXT));
    setMapping(readStored(MAPPING_STORAGE_KEY, EMPTY_MAPPING));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(paletteText));
  }, [paletteText, hydrated]);
  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
    }
    // CSS repaints itself off the new channels; the canvas/SVG renderers
    // (charts, timeline, calendar) have to be told to re-read them.
    window.dispatchEvent(new Event(ARTIFACT_TONES_EVENT));
  }, [mapping, hydrated]);

  const swatches = useMemo(() => parsePalette(paletteText), [paletteText]);
  const css = useMemo(() => buildCss(mapping), [mapping]);

  const assign = (category: ArtifactCategoryId, hex: string | null) =>
    setMapping((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [category]: hex ?? undefined },
    }));

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1400);
  };

  return (
    <>
      <style>{css}</style>

      <div className="pointer-events-auto fixed bottom-4 right-4 z-[70] font-sans">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#141318] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/15"
          >
            <span className="flex gap-0.5">
              {(swatches.slice(0, 4).length ? swatches.slice(0, 4) : []).map((s) => (
                <span
                  key={s.hex}
                  className="h-3 w-3 rounded-full"
                  style={{ background: s.hex }}
                />
              ))}
            </span>
            Bento colours
          </button>
        ) : (
          <div className="flex max-h-[min(78vh,760px)] w-[420px] flex-col overflow-hidden rounded-2xl bg-[#141318] text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  Temporary
                </p>
                <p className="m-0 text-[14px] font-medium">Bento colour lab</p>
              </div>
              <div className="flex overflow-hidden rounded-full ring-1 ring-white/15">
                {(["light", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCanvasTheme(m)}
                    className={`px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                      mode === m ? "bg-white text-[#141318]" : "text-white/65"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Collapse"
                className="ml-1 rounded-full px-2 py-1 text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <p className="m-0 mb-3 text-[11px] leading-relaxed text-white/45">
                Editing the <strong className="font-semibold text-white/70">{mode}</strong>{" "}
                map — {swatches.length} colours in the palette. Every card in this
                pack is one solid, so the ink on top is picked automatically for
                contrast (ratio shown per row).
              </p>

              {ARTIFACT_CATEGORY_IDS.map((category) => {
                const meta = ARTIFACT_CATEGORY_META[category];
                const chosen = mapping[mode][category];
                const tones = chosen ? tonesFor(chosen) : null;
                return (
                  <div key={category} className="mb-3.5">
                    <div className="mb-1.5 flex items-baseline gap-2">
                      <span className="text-[12px] font-medium">{meta.label}</span>
                      <span className="min-w-0 flex-1 truncate text-[10px] text-white/35">
                        {meta.kinds.join(" · ")}
                      </span>
                      {tones ? (
                        <span
                          className={`shrink-0 text-[10px] tabular-nums ${
                            tones.ratio >= 4.5 ? "text-emerald-300/80" : "text-amber-300/90"
                          }`}
                        >
                          {tones.ratio.toFixed(1)}:1
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="shrink-0 text-[10px] text-white/35"
                          onClick={() => assign(category, null)}
                        >
                          pack default
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => assign(category, null)}
                        title="Reset to the pack default"
                        className="mr-1 h-6 w-6 shrink-0 rounded-md text-[11px] leading-none text-white/40 ring-1 ring-white/15 hover:text-white"
                      >
                        ⌀
                      </button>
                      {swatches.map((s) => {
                        const active = chosen?.toUpperCase() === s.hex;
                        return (
                          <button
                            key={s.hex}
                            type="button"
                            title={`${s.name} ${s.hex}`}
                            onClick={() => assign(category, s.hex)}
                            style={{ background: s.hex }}
                            className={`h-6 w-6 shrink-0 rounded-md transition-transform ${
                              active
                                ? "scale-110 ring-2 ring-white"
                                : "ring-1 ring-white/15 hover:scale-110"
                            }`}
                          />
                        );
                      })}
                    </div>
                    {tones ? (
                      <div
                        className="mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                        style={{ background: tones.solid, color: tones.onSolid }}
                      >
                        <span className="text-[11px] font-semibold">Aa {chosen}</span>
                        <span className="text-[10px]" style={{ color: tones.muted }}>
                          muted label
                        </span>
                        <span
                          className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                          style={{ background: tones.onSolid, color: tones.solid }}
                        >
                          chip
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 px-4 py-2.5">
              {showPalette ? (
                <textarea
                  value={paletteText}
                  onChange={(e) => setPaletteText(e.target.value)}
                  spellCheck={false}
                  rows={8}
                  className="mb-2 w-full resize-y rounded-lg bg-black/40 p-2 font-mono text-[11px] leading-relaxed text-white/80 ring-1 ring-white/10 outline-none focus:ring-white/25"
                  placeholder="--name: #rrggbb;"
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowPalette((v) => !v)}
                  className="rounded-full px-2.5 py-1 ring-1 ring-white/15 hover:bg-white/10"
                >
                  {showPalette ? "Hide palette" : "Edit palette"}
                </button>
                <button
                  type="button"
                  onClick={() => copy("tones", packSnippet(mapping, mode))}
                  className="rounded-full px-2.5 py-1 ring-1 ring-white/15 hover:bg-white/10"
                >
                  {copied === "tones" ? "Copied" : `Copy ${mode} pack tones`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMapping((prev) => ({
                      ...prev,
                      dark: { ...prev.light },
                    }))
                  }
                  className="rounded-full px-2.5 py-1 ring-1 ring-white/15 hover:bg-white/10"
                >
                  Light → dark
                </button>
                <button
                  type="button"
                  onClick={() => setMapping((prev) => ({ ...prev, [mode]: {} }))}
                  className="rounded-full px-2.5 py-1 text-white/60 ring-1 ring-white/10 hover:bg-white/10"
                >
                  Clear {mode}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
