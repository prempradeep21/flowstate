"use client";

import { useEffect, useMemo, useState } from "react";
import { mixHex } from "@/lib/design/theme/color";
import { hexToRgbChannels } from "@/lib/design/tokens";
import {
  ARTIFACT_CATEGORY_META,
  artifactCategoryOf,
} from "@/lib/design/theme/artifactCategories";
import { ARTIFACT_CATEGORY_IDS } from "@/lib/design/theme/types";
import type {
  ArtifactCategoryId,
  ArtifactCategoryKind,
} from "@/lib/design/theme/types";
import { useCanvasStore } from "@/lib/store";
import { ARTIFACT_TONES_EVENT } from "@/hooks/useCategoryTones";

/**
 * TEMPORARY dev tool — Bento colour lab.
 *
 * Bento is a one-solid-colour-per-card system, so picking those colours is the
 * whole design. This panel maps EVERY artifact kind (not just its category) to
 * a colour from an editable palette and writes the result straight into the
 * pack's `--art-*` channels — light and dark kept separately — so the canvas
 * behind it repaints live. Nothing here ships: it mounts only for dev builds
 * with the Bento pack active, and "Copy map" emits the JSON to fold into
 * lib/design/style/stylePacks.ts once a set wins.
 */

// v2 — bumped when the shipped default palette grows, so a stored copy of
// the older, shorter list does not hide the new swatches.
const PALETTE_STORAGE_KEY = "flowstate.bentoColorLab.palette.v2";
// v2 — per-kind mapping; v1 was per-category and is migrated on first load.
const MAPPING_STORAGE_KEY = "flowstate.bentoColorLab.mapping.v2";
const LEGACY_MAPPING_STORAGE_KEY = "flowstate.bentoColorLab.mapping";

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
--steel-azure: #004e98ff;

/* Moodboard set — the hues that recur across the reference collection
   (Superside principles, Bowl'd, klubi, nobrand, the bills/dashboard UI,
   the Pinterest palette cards). Ordered by family so the strip reads as a
   spectrum. */
--acid-lime: #e4f04e;
--chartreuse: #d3ec3a;
--pistachio: #c6e86b;
--willow-wash: #b6e3ce;
--sea-mint: #a9d9d4;
--vert-sauge: #aebba0;
--emerald: #2ba36b;
--forest: #1e4034;
--pine-deep: #14302a;
--powder-blue: #cbdff5;
--sky-blue: #7fb2e5;
--cobalt-soft: #4a7fd1;
--deep-navy: #12384a;
--ink-navy: #0e2233;
--lilac: #c4b7ee;
--violet: #7b5be0;
--plum-deep: #3c1f52;
--cassis: #35102a;
--blush: #f6b7b0;
--coral-sand: #f79e8c;
--burnt-orange: #ee5b2b;
--tangerine: #f58220;
--hot-pink: #ff4fa3;
--magenta: #e93c8c;
--cream: #efe7da;
--sand: #e0d5c3;
--charcoal: #1a1a1a;`;

type Mode = "light" | "dark";
type KindMap = Partial<Record<ArtifactCategoryKind, string>>;
type Mapping = Record<Mode, KindMap>;

const EMPTY_MAPPING: Mapping = { light: {}, dark: {} };

/** Every kind the pack colours, grouped the way the categories group them. */
const KIND_GROUPS = ARTIFACT_CATEGORY_IDS.map((category) => ({
  category,
  label: ARTIFACT_CATEGORY_META[category].label,
  kinds: ARTIFACT_CATEGORY_META[category].kinds,
}));

const ALL_KINDS = KIND_GROUPS.flatMap((group) => group.kinds);

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

/** The `--art-*` set a node binds, overridden for one kind. */
function kindVars(hex: string): string {
  const t = tonesFor(hex);
  return [
    ["--art-solid", t.solid],
    ["--art-on-solid", t.onSolid],
    ["--art-on-solid-muted", t.onSolidMuted],
    ["--art-pale", t.pale],
    ["--art-ink", t.ink],
    ["--art-muted", t.muted],
    ["--art-vivid", t.vivid],
    ["--art-line", t.line],
    ["--art-stage", t.stage],
    ["--art-solid-line", t.solidLine],
    ["--art-solid-stage", t.solidStage],
  ]
    .map(([name, value]) => `    ${name}: ${hexToRgbChannels(value)};`)
    .join("\n");
}

/** Scope-level channels the JS renderers (charts, timeline) read back. */
function kindChannels(kind: ArtifactCategoryKind, hex: string): string {
  const t = tonesFor(hex);
  return [
    `  --art-kind-${kind}-solid: ${hexToRgbChannels(t.solid)};`,
    `  --art-kind-${kind}-on-solid: ${hexToRgbChannels(t.onSolid)};`,
  ].join("\n");
}

/**
 * Light rides on `:not([data-theme="dark"])` so a light-only mapping never
 * leaks into dark. The per-kind rule carries one attribute more than the
 * pack's own `[data-artifact-category]` binding, so it wins outright.
 */
function buildCss(mapping: Mapping): string {
  const blocks: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    const entries = Object.entries(mapping[mode]).filter(([, hex]) => !!hex) as [
      ArtifactCategoryKind,
      string,
    ][];
    if (!entries.length) continue;
    const scope =
      mode === "light"
        ? 'html:not([data-theme="dark"]) [data-artifact-style="bento"]'
        : 'html[data-theme="dark"] [data-artifact-style="bento"]';
    blocks.push(
      `${scope} {\n${entries
        .map(([kind, hex]) => kindChannels(kind, hex))
        .join("\n")}\n}`,
    );
    for (const [kind, hex] of entries) {
      blocks.push(
        `${scope} [data-artifact-kind="${kind}"] {\n${kindVars(hex)}\n  }`,
      );
    }
  }
  return blocks.join("\n");
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** v1 stored one colour per category — fan it out over that category's kinds. */
function migrateLegacyMapping(): Mapping | null {
  const legacy = readStored<Record<
    Mode,
    Partial<Record<ArtifactCategoryId, string>>
  > | null>(LEGACY_MAPPING_STORAGE_KEY, null);
  if (!legacy) return null;
  const next: Mapping = { light: {}, dark: {} };
  for (const mode of ["light", "dark"] as const) {
    for (const [category, hex] of Object.entries(legacy[mode] ?? {})) {
      if (!hex) continue;
      for (const kind of ARTIFACT_CATEGORY_META[category as ArtifactCategoryId]
        ?.kinds ?? []) {
        next[mode][kind] = hex;
      }
    }
  }
  return next;
}

export function BentoColorLab() {
  const [open, setOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteText, setPaletteText] = useState(DEFAULT_PALETTE_TEXT);
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING);
  const [selectedKind, setSelectedKind] = useState<ArtifactCategoryKind>(
    ALL_KINDS[0] ?? "table",
  );
  const [copied, setCopied] = useState(false);
  /** Persist only once the stored state has landed — otherwise the first
      commit (and StrictMode's second effect pass) writes the empty default
      back over it. */
  const [hydrated, setHydrated] = useState(false);

  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const setCanvasTheme = useCanvasStore((s) => s.setCanvasTheme);
  const mode: Mode = canvasTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    setPaletteText(readStored(PALETTE_STORAGE_KEY, DEFAULT_PALETTE_TEXT));
    const stored = readStored<Mapping | null>(MAPPING_STORAGE_KEY, null);
    setMapping(stored ?? migrateLegacyMapping() ?? EMPTY_MAPPING);
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

  const assign = (kind: ArtifactCategoryKind, hex: string | null) =>
    setMapping((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [kind]: hex ?? undefined },
    }));

  /** Same colour across every kind in the selected kind's category. */
  const assignCategory = (hex: string | null) => {
    const category = artifactCategoryOf(selectedKind);
    setMapping((prev) => {
      const next = { ...prev[mode] };
      for (const kind of ARTIFACT_CATEGORY_META[category].kinds) {
        if (hex) next[kind] = hex;
        else delete next[kind];
      }
      return { ...prev, [mode]: next };
    });
  };

  const copyMap = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(mapping[mode]).map(([kind, hex]) => [
            kind,
            { hex, ...tonesFor(hex as string) },
          ]),
        ),
        null,
        2,
      ),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const chosen = mapping[mode][selectedKind];
  const tones = chosen ? tonesFor(chosen) : null;

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
              {swatches.slice(0, 4).map((s) => (
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
          <div className="flex max-h-[min(80vh,780px)] w-[560px] flex-col overflow-hidden rounded-2xl bg-[#141318] text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
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

            <div className="flex min-h-0 flex-1">
              {/* Every artifact kind, grouped the way categories group them —
                  but each one carries its own colour. */}
              <div className="w-[186px] shrink-0 overflow-y-auto border-r border-white/10 py-2">
                {KIND_GROUPS.map((group) => (
                  <div key={group.category} className="mb-1.5">
                    <p className="m-0 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
                      {group.label}
                    </p>
                    {group.kinds.map((kind) => {
                      const hex = mapping[mode][kind];
                      const active = kind === selectedKind;
                      return (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setSelectedKind(kind)}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors ${
                            active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/5"
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded ring-1 ring-white/20"
                            style={{
                              background: hex ?? "transparent",
                              backgroundImage: hex
                                ? undefined
                                : "linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.3) 55%, transparent 55%)",
                            }}
                          />
                          <span className="truncate">{kind}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1 overflow-y-auto px-4 py-3">
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-[13px] font-medium">{selectedKind}</span>
                  <span className="text-[10px] text-white/35">
                    {ARTIFACT_CATEGORY_META[artifactCategoryOf(selectedKind)].label}
                  </span>
                  {tones ? (
                    <span
                      className={`ml-auto text-[10px] tabular-nums ${
                        tones.ratio >= 4.5 ? "text-emerald-300/80" : "text-amber-300/90"
                      }`}
                    >
                      {tones.ratio.toFixed(1)}:1
                    </span>
                  ) : (
                    <span className="ml-auto text-[10px] text-white/35">
                      pack default
                    </span>
                  )}
                </div>

                {tones ? (
                  <div
                    className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: tones.solid, color: tones.onSolid }}
                  >
                    <span className="text-[12px] font-semibold">Aa {chosen}</span>
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

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => assign(selectedKind, null)}
                    title="Reset this kind to the pack default"
                    className="h-6 w-6 shrink-0 rounded text-[10px] leading-none text-white/40 ring-1 ring-white/15 hover:text-white"
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
                        onClick={() => assign(selectedKind, s.hex)}
                        style={{ background: s.hex }}
                        className={`h-6 w-6 shrink-0 rounded transition-transform ${
                          active
                            ? "scale-125 ring-2 ring-white"
                            : "ring-1 ring-white/15 hover:scale-125"
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    disabled={!chosen}
                    onClick={() => assignCategory(chosen ?? null)}
                    className="rounded-full px-2.5 py-1 ring-1 ring-white/15 hover:bg-white/10 disabled:opacity-35"
                  >
                    Apply to whole group
                  </button>
                  <button
                    type="button"
                    onClick={() => assignCategory(null)}
                    className="rounded-full px-2.5 py-1 text-white/60 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    Reset group
                  </button>
                </div>
              </div>
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
                  onClick={copyMap}
                  className="rounded-full px-2.5 py-1 ring-1 ring-white/15 hover:bg-white/10"
                >
                  {copied ? "Copied" : `Copy ${mode} map`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMapping((prev) => ({ ...prev, dark: { ...prev.light } }))
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
                <span className="ml-auto text-[10px] text-white/30">
                  {swatches.length} colours
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
