"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

/**
 * Every style family is set in exactly two fonts:
 *
 *   Primary   — the voice: titles and headers, hero figures, quotes, terms.
 *   Secondary — the workhorse: body copy, labels, axis ticks, table cells,
 *               chips, meta lines and code.
 *
 * Families write `PRIMARY` / `SECONDARY` and never a font stack of their own;
 * `fontPairStyle` points both at real fonts on the artifact's root, so the
 * pair can be swapped live from the studio toolbar. It also re-points the app's
 * own font variables (Tailwind's font-sans / font-display) and monospace so
 * nothing inside an artifact can slip out of the pair.
 */

export const PRIMARY = "var(--studio-font-primary)";
export const SECONDARY = "var(--studio-font-secondary)";

export type FontId =
  | "figtree"
  | "inter-tight"
  | "satoshi"
  | "parkinsans"
  | "archivo"
  | "dm-sans"
  | "manrope"
  | "space-grotesk"
  | "geist"
  | "denton"
  | "fraunces"
  | "instrument-serif"
  | "playfair"
  | "newsreader"
  | "geist-mono"
  | "jetbrains-mono"
  | "ibm-plex-mono";

export interface FontOption {
  id: FontId;
  name: string;
  group: "Sans" | "Serif" | "Mono";
  stack: string;
}

const SANS = "ui-sans-serif, system-ui, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

/** `--sf-*` variables are set by the studio layout (layout.tsx). */
export const FONT_OPTIONS: FontOption[] = [
  { id: "figtree", name: "Figtree", group: "Sans", stack: `var(--sf-figtree), ${SANS}` },
  { id: "inter-tight", name: "Inter Tight", group: "Sans", stack: `var(--sf-inter-tight), 'Helvetica Neue', Helvetica, ${SANS}` },
  { id: "satoshi", name: "Satoshi", group: "Sans", stack: `var(--sf-satoshi), ${SANS}` },
  { id: "parkinsans", name: "Parkinsans", group: "Sans", stack: `var(--sf-parkinsans), ${SANS}` },
  { id: "archivo", name: "Archivo", group: "Sans", stack: `var(--sf-archivo), ${SANS}` },
  { id: "dm-sans", name: "DM Sans", group: "Sans", stack: `var(--sf-dm-sans), ${SANS}` },
  { id: "manrope", name: "Manrope", group: "Sans", stack: `var(--sf-manrope), ${SANS}` },
  { id: "space-grotesk", name: "Space Grotesk", group: "Sans", stack: `var(--sf-space-grotesk), ${SANS}` },
  { id: "geist", name: "Geist", group: "Sans", stack: `var(--sf-geist), ${SANS}` },
  { id: "denton", name: "Denton", group: "Serif", stack: `var(--sf-denton), ${SERIF}` },
  { id: "fraunces", name: "Fraunces", group: "Serif", stack: `var(--sf-fraunces), ${SERIF}` },
  { id: "instrument-serif", name: "Instrument Serif", group: "Serif", stack: `var(--sf-instrument-serif), ${SERIF}` },
  { id: "playfair", name: "Playfair Display", group: "Serif", stack: `var(--sf-playfair), ${SERIF}` },
  { id: "newsreader", name: "Newsreader", group: "Serif", stack: `var(--sf-newsreader), ${SERIF}` },
  { id: "geist-mono", name: "Geist Mono", group: "Mono", stack: `var(--sf-geist-mono), ${MONO}` },
  { id: "jetbrains-mono", name: "JetBrains Mono", group: "Mono", stack: `var(--sf-jetbrains-mono), ${MONO}` },
  { id: "ibm-plex-mono", name: "IBM Plex Mono", group: "Mono", stack: `var(--sf-ibm-plex-mono), ${MONO}` },
];

export function fontOf(id: FontId): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0]!;
}

export interface FontPair {
  primary: FontId;
  secondary: FontId;
}

export type FontSlot = keyof FontPair;

/** Root style for an artifact drawn in `pair`. */
export function fontPairStyle(pair: FontPair): CSSProperties {
  const primary = fontOf(pair.primary).stack;
  const secondary = fontOf(pair.secondary).stack;
  return {
    "--studio-font-primary": primary,
    "--studio-font-secondary": secondary,
    // The app's own font variables (Tailwind font-sans / font-display, Style D's
    // --font-sd) — anything still reaching for them lands on the pair.
    "--font-figtree": secondary,
    "--font-parkinsans": secondary,
    "--font-archivo": secondary,
    "--font-satoshi": secondary,
    "--font-sd": secondary,
    "--font-denton": primary,
    fontFamily: secondary,
  } as CSSProperties;
}

// ─── Per-family overrides (this browser) ────────────────────────────────────

const STORE_KEY = "flowstate.artifactStudio.fonts";
type Overrides = Record<string, FontPair>;

/**
 * What every artifact draws with: saved overrides, plus the one font being
 * auditioned in a picker (hovered, not yet committed), so every tile of that
 * family previews it at once.
 */
interface FontState {
  saved: Overrides;
  preview: { familyId: string; pair: FontPair } | null;
}

let cache: FontState | null = null;
const listeners = new Set<() => void>();
const EMPTY: FontState = { saved: {}, preview: null };

function readSaved(): Overrides {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Overrides) : {};
    const valid = new Set(FONT_OPTIONS.map((f) => f.id));
    return Object.fromEntries(
      Object.entries(parsed).filter(([, p]) => p && valid.has(p.primary) && valid.has(p.secondary)),
    );
  } catch {
    return {};
  }
}

function read(): FontState {
  if (!cache) cache = { saved: readSaved(), preview: null };
  return cache;
}

function emit(next: FontState) {
  cache = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Saved overrides and the live preview, keyed by family id. */
export function useFontState(): FontState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** The pair a family draws with right now: preview, else saved, else its default. */
export function fontsFor(state: FontState, familyId: string, fallback: FontPair): FontPair {
  if (state.preview?.familyId === familyId) return state.preview.pair;
  return state.saved[familyId] ?? fallback;
}

/** Commit a family's pair; `null` (or the family's default) clears the override. */
export function setFamilyFonts(familyId: string, pair: FontPair | null) {
  const saved = { ...read().saved };
  if (pair) saved[familyId] = pair;
  else delete saved[familyId];
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  } catch {
    // Private window / blocked storage — the change still holds for this tab.
  }
  emit({ saved, preview: null });
}

/** Audition a pair on every artifact of a family without saving it. */
export function previewFamilyFonts(familyId: string, pair: FontPair | null) {
  const cur = read();
  if (!pair && !cur.preview) return;
  emit({ ...cur, preview: pair ? { familyId, pair } : null });
}
