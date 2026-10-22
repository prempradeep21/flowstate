"use client";

import { PRIMARY, SECONDARY } from "../fonts";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { useHugs } from "../hug";
import { splitTitle, useBox } from "../styleC/tokens";
import { ROLE } from "../textSpec";

export { compact, parseFigure, scrollClass, sentenceCase, sizeFor, smoothPath, splitTitle, useBox, withUnit } from "../styleC/tokens";

/**
 * Style D — "Aurora". Palette, light, and the shared pieces every body is
 * built from.
 *
 * Light
 *   One soft light from the top-left. Every card catches it: a white sheen in
 *   its top-left corner, a bright 1px rim on its top edge, and a shadow that
 *   falls down and away in three layers (contact, near, ambient). Nothing has
 *   a hard edge — the light does the separating.
 *
 * Surfaces
 *   frost — a pale, slightly translucent card for anything read row by row.
 *   glow  — the hero cards (one number you read first): colour that is lit
 *           from inside, built from several blurred blobs under a frost veil,
 *           with grain, a rim light, and its own light spilling onto the
 *           ground beneath it.
 *   bloom — a frost card whose lower edge is tinted by a blurred wash of
 *           colour (quotes, claims, notes).
 *   raised — anything nested in a card sits *above* it (a whiter pill with
 *           its own small shadow), never sunk into it.
 *
 * Colour
 *   Ink is near-black, set medium (500) and always the surface's strongest
 *   ink — no grey type; size and position carry hierarchy. Lime is the one
 *   accent: the thing that is now, next, or good. Hue lives in the glows,
 *   never in the type.
 *
 * Type
 *   Two fonts and nothing else: PRIMARY (titles, quotes, the headword) and
 *   SECONDARY (every other word — and every figure: a hero number is the
 *   secondary font set very large). Nothing is ever clamped or cut: a card
 *   hugs what it holds (see `hug` in ./index), and the clamps below only act
 *   where a card has been given a fixed box.
 *
 * The written rules: docs/design-system/artifacts-frost.md
 *
 * Dark
 *   The neutrals are CSS variables with their light values as defaults; a
 *   dark card sets {@link SD_DARK_VARS} on its root and every body follows.
 *   The frost turns to smoked glass — charcoal, still lit from the top-left,
 *   with the sheen and rim at a fraction of their light-mode strength — the
 *   ink flips to off-white, and the lime and the hues stay exactly as they are.
 */

export const D = {
  field: "#E4E4E2",
  frostTop: "var(--sd-frost-top, #F7F7F6)",
  frostBottom: "var(--sd-frost-bottom, #EDEDEB)",
  raised: "var(--sd-raised, #FBFBFA)",
  raisedTop: "var(--sd-raised-top, #FFFFFF)",
  /** The bright inset line along a raised pill's top edge. */
  raisedRim: "var(--sd-raised-rim, rgba(255,255,255,1))",
  /** The picture well, and the softer disc a favicon sits in. */
  well: "var(--sd-well, #E9E9E7)",
  wellSoft: "var(--sd-well-soft, #F1F1EF)",
  /** The frost card's rim light and its softer inner line. */
  rim: "var(--sd-rim, rgba(255,255,255,0.95))",
  rimSoft: "var(--sd-rim-soft, rgba(255,255,255,0.6))",
  /** The sheen pooled in a frost card's top-left corner. */
  sheen: "var(--sd-sheen, rgba(255,255,255,0.85))",
  /** The ring of card colour around a marker on the line chart. */
  ring: "var(--sd-ring, rgba(255,255,255,0.9))",
  ink: "var(--sd-ink, #1C1C1E)",
  /** Ink as a surface — the ink hero card, the avatar disc. Dark in both modes. */
  inkSurface: "var(--sd-ink-surface, #1C1C1E)",
  muted: "var(--sd-muted, rgba(28, 28, 30, 0.56))",
  faint: "var(--sd-faint, rgba(28, 28, 30, 0.36))",
  hair: "var(--sd-hair, rgba(28, 28, 30, 0.08))",
  /** Frost's accent — lime by default, swappable live from the studio's accent picker (see ./accent). */
  lime: "var(--sd-lime, #DDF23F)",
  /** Type that sits on the accent: ink on a light accent, white on a dark one. */
  limeInk: "var(--sd-lime-ink, #1C1C1E)",
  limeDeep: "#C4DB1E",
  /** The card's accent — lime in Frost, the card's own hue in Aurora (set by the frame). */
  accent: "var(--sd-accent, #DDF23F)",
  accentInk: "var(--sd-accent-ink, #1C1C1E)",
  accentShadow: "var(--sd-accent-shadow, rgba(160,190,0,0.55))",
  accentHalo: "var(--sd-accent-halo, rgba(221,242,63,0.25))",
  white: "#FFFFFF",
} as const;

/** The ink at `pct`% — the tints bodies rule, dot and dash with. */
export const inkA = (pct: number) => `color-mix(in srgb, ${D.ink} ${pct}%, transparent)`;

/** The dark side of every neutral above, set on a card root in dark mode. */
export const SD_DARK_VARS: CSSProperties = {
  "--sd-ink": "#F2F2F0",
  "--sd-muted": "rgba(242, 242, 240, 0.6)",
  "--sd-faint": "rgba(242, 242, 240, 0.4)",
  "--sd-hair": "rgba(242, 242, 240, 0.1)",
  "--sd-frost-top": "#2B2B2F",
  "--sd-frost-bottom": "#202024",
  "--sd-raised": "#34343A",
  "--sd-raised-top": "#3D3D44",
  "--sd-raised-rim": "rgba(255,255,255,0.14)",
  "--sd-well": "#19191C",
  "--sd-well-soft": "#3A3A40",
  "--sd-rim": "rgba(255,255,255,0.13)",
  "--sd-rim-soft": "rgba(255,255,255,0.06)",
  "--sd-sheen": "rgba(255,255,255,0.09)",
  "--sd-ring": "rgba(32,32,36,0.92)",
  "--sd-ink-surface": "#0E0E10",
  "--sd-glow-halo": "rgba(255,255,255,0.55)",
} as CSSProperties;

/** Frost's field in dark: the same light from the top-left on smoked glass. */
export const FROST_FIELD_DARK = "radial-gradient(130% 90% at 18% 0%, #232326 0%, #18181B 48%, #0F0F11 100%)";

/** The secondary font — body, labels, ticks, chips (styles/fonts.ts). */
export const FONT: CSSProperties = {
  fontFamily: SECONDARY,
  fontFeatureSettings: '"ss01", "cv11"',
  // Every text in the family is medium; hierarchy comes from size and place, not weight or grey.
  fontWeight: 500,
};

/** The primary font — titles, hero figures, quotes. */
export const DISPLAY: CSSProperties = { ...FONT, fontFamily: PRIMARY };

// ─── Geometry ───────────────────────────────────────────────────────────────

/** Card radius and padding at canvas size — generous: the light needs room. */
export const CARD_RADIUS = 44;
export const PAD = 40;
/** Anything nested at NEST_INSET keeps its corners concentric with the card. */
export const NEST_INSET = 14;
export const NEST_RADIUS = CARD_RADIUS - NEST_INSET;
/**
 * Media cards have one inset: the title, the kicker and the picture well all
 * start on the same line, MEDIA_INSET from the card's edge, and the well's
 * corners stay concentric with the card's (R = r + D).
 */
export const MEDIA_INSET = 24;
export const MEDIA_RADIUS = CARD_RADIUS - MEDIA_INSET;

// ─── Hues ───────────────────────────────────────────────────────────────────

export type HueId = "ember" | "rose" | "grove" | "tide" | "sun" | "lilac" | "lime";

/**
 * A glow is a cool rim around a hot core. `edge` is the colour the card
 * fades to at its corners, `core` the saturated centre, `heat` a brighter
 * spot inside the core, `cool` a tint pooled in the top-left where the light
 * comes from, and `spill` the colour it throws onto the ground.
 */
export interface Hue {
  edge: string;
  core: string;
  heat: string;
  cool: string;
  spill: string;
  /** A single representative colour for marks and legends. */
  mark: string;
  /** The pale wash a bloom card's lower edge takes. */
  bloom: [string, string];
}

export const HUES: Record<HueId, Hue> = {
  ember: {
    edge: "#CFCBD8",
    core: "#FF6F12",
    heat: "#FFB23E",
    cool: "#C9D2EE",
    spill: "rgba(255, 112, 24, 0.55)",
    mark: "#F7731E",
    bloom: ["#FFD7A8", "#FFB27A"],
  },
  rose: {
    edge: "#F2C9D6",
    core: "#FF3B78",
    heat: "#FF7FA6",
    cool: "#F7DCE5",
    spill: "rgba(255, 59, 120, 0.5)",
    mark: "#F2457F",
    bloom: ["#FFC9CF", "#FF9AA6"],
  },
  grove: {
    edge: "#D9D6B8",
    core: "#22B33A",
    heat: "#8BDD3C",
    cool: "#F2B866",
    spill: "rgba(40, 170, 60, 0.5)",
    mark: "#2DAF46",
    bloom: ["#D9F2B5", "#A9E28A"],
  },
  tide: {
    edge: "#D3D9E8",
    core: "#3F7BF2",
    heat: "#7FB4FF",
    cool: "#C4B7EE",
    spill: "rgba(63, 123, 242, 0.5)",
    mark: "#4C86F0",
    bloom: ["#BFD4F5", "#9EC6E4"],
  },
  sun: {
    edge: "#ECE4C4",
    core: "#FFC21A",
    heat: "#FFE45C",
    cool: "#F7E7B0",
    spill: "rgba(255, 196, 26, 0.5)",
    mark: "#F2B90F",
    bloom: ["#FFF0A6", "#FFE066"],
  },
  lime: {
    edge: "#E6EBD2",
    core: "#B9E02A",
    heat: "#E4F75A",
    cool: "#F4F7E4",
    spill: "rgba(170, 210, 20, 0.4)",
    mark: "#9CC41A",
    bloom: ["#F1F9C2", "#DDF23F"],
  },
  lilac: {
    edge: "#DAD5EA",
    core: "#8B6CF0",
    heat: "#B9A2FF",
    cool: "#C8D8F4",
    spill: "rgba(139, 108, 240, 0.48)",
    mark: "#8F74EE",
    bloom: ["#D9CFF7", "#B9C5F0"],
  },
};

const GLOW_HUES: HueId[] = ["ember", "rose", "grove", "tide"];
const BLOOM_HUES: HueId[] = ["sun", "tide", "rose", "grove", "lilac"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Each artifact keeps the same hue across reloads; neighbours tend to differ. */
export const glowHueOf = (uid: string): HueId => GLOW_HUES[hash(uid) % GLOW_HUES.length]!;
export const bloomHueOf = (uid: string): HueId => BLOOM_HUES[hash(uid + "b") % BLOOM_HUES.length]!;

/** Series colours for charts: ink first, then the hues by mark colour. */
export const SERIES = [D.ink, HUES.ember.mark, HUES.tide.mark, HUES.rose.mark, HUES.grove.mark, HUES.lilac.mark, HUES.sun.mark];

// ─── Surfaces ───────────────────────────────────────────────────────────────

export type Surface = "frost" | "glow";

/**
 * Style D was one family with two lights in it; it is now two families that
 * share these bodies and differ by mode:
 *   frost  — Style D: white frost cards with lime. Hero cards don't glow,
 *            they rise from a white-to-lime wash; text cards bloom lime.
 *   aurora — Style E: everything is lit. Hero cards glow from inside, every
 *            other card blooms in its own hue, and the accent is that hue.
 */
export type DMode = "frost" | "aurora";
export const DModeContext = createContext<DMode>("aurora");

/**
 * How hard Aurora's colour hits: 1 is the reference's full saturation. Every
 * coloured light in the family — hero glow and its spill, the atmospheres,
 * the blooms and the glass rim's tint — is scaled by this, so the look dims
 * as one. Marks, series and accents are not: they carry data.
 */
export const E_PUNCH = 0.5;
export const useDMode = () => useContext(DModeContext);

/** Variants whose bodies paint their own bloom. */
export const SELF_BLOOM = new Set(["quote", "claim", "definition", "stickynote"]);

/**
 * Frost's solid surfaces. Frost has no coloured gradients at all, and — bar
 * the sticky note, whose colour is its nature — no coloured cards either:
 * every artifact is the white frost card, whose pale gradient and sheen stay,
 * and colour is spread the way the calendar spreads it: white raised pills,
 * ink type, and one solid lime element for the thing that is now, next, or
 * biggest (a unit pill, the header band, the area under a line, the marker).
 * `ink` and `sage` remain for marks and the dark avatar disc.
 */
export const F = {
  lime: D.lime,
  ink: D.inkSurface,
  sage: "#8C9386",
  sageDeep: "#5F665A",
  stone: "#C8CBC2",
  /** The accent darkened toward ink — a second step of the same colour. */
  olive: "color-mix(in oklab, var(--sd-lime, #DDF23F) 72%, #1C1C1E)",
  mist: "#E3E4DF",
} as const;

/** Series colours on frost: ink, lime, then the greens and greys — never a gradient, never a glow. */
export const FROST_SERIES = [D.ink, F.lime, F.sage, F.sageDeep, F.stone, F.olive, "#DADCD4"];

/** The surface a body sits on. `glow` is Aurora's; the rest are Frost's. */
export type OnSurface = "frost" | "lime" | "ink" | "sage" | "glow";
export const SurfaceContext = createContext<OnSurface>("frost");

/** Frost's surface for a variant: lime for the note, white frost for everything else. */
export function frostSurfaceOf(variant: string): Exclude<OnSurface, "glow"> {
  return variant === "stickynote" ? "lime" : "frost";
}

export const SURFACE_FILL: Record<Exclude<OnSurface, "glow" | "frost">, string> = { lime: F.lime, ink: F.ink, sage: F.sage };

/** The accent's own ink at a percentage — for quiet type on an accent card. */
export const onAccent = (pct: number) => `color-mix(in srgb, ${D.limeInk} ${pct}%, transparent)`;

/**
 * Ink for a body on its surface. `glow` means Aurora's lit colour (glass chips,
 * white light); `light` means the type is white (ink, sage). Aurora's glow is a
 * pale wash in light mode and a dark one in dark, so its type is `D.ink` — which
 * the dark vars flip to off-white — never a fixed white.
 */
export function useOn() {
  const surface = useContext(SurfaceContext);
  const glow = surface === "glow";
  if (glow)
    return { glow, light: false, ink: D.ink, title: D.ink, sub: D.ink, faint: D.ink, line: "#FFFFFF", ruler: inkA(34), marker: D.ink, fill: "#FFFFFF" };
  if (surface === "ink")
    return { glow, light: true, ink: D.white, title: D.white, sub: D.white, faint: D.white, line: F.lime, ruler: "rgba(255,255,255,0.3)", marker: F.lime, fill: F.lime };
  if (surface === "sage")
    return { glow, light: true, ink: D.white, title: D.white, sub: D.white, faint: D.white, line: D.white, ruler: "rgba(255,255,255,0.45)", marker: D.white, fill: D.white };
  if (surface === "lime")
    return { glow, light: false, ink: D.limeInk, title: D.limeInk, sub: D.limeInk, faint: D.limeInk, line: D.limeInk, ruler: onAccent(28), marker: D.limeInk, fill: D.limeInk };
  return { glow, light: false, ink: D.ink, title: D.ink, sub: D.ink, faint: D.ink, line: D.ink, ruler: inkA(22), marker: D.lime, fill: D.lime };
}

/** Marks for charts and lists: Frost's solid greens and greys, or Aurora's hues. */
export function usePalette(uid: string) {
  const frost = useDMode() === "frost";
  return frost
    ? { frost, series: FROST_SERIES, peak: F.lime, dots: [D.ink], halo: false }
    : { frost, series: SERIES, peak: HUES[glowHueOf(uid)].mark, dots: [HUES.ember.mark, HUES.tide.mark, HUES.rose.mark, HUES.grove.mark, HUES.lilac.mark], halo: true };
}

/** The hue a card's bloom (and, in Aurora, its accent) takes — the same hue its charts draw in. */
export function cardHueOf(mode: DMode, uid: string): HueId {
  return mode === "frost" ? "lime" : glowHueOf(uid);
}

/**
 * The accent as CSS variables for a card root. Frost's accent is solid lime
 * with a neutral shadow — except on a lime card, where it turns ink so it
 * still reads. Aurora's is the card's hue.
 */
export function accentVars(mode: DMode, uid: string, surface: OnSurface = "frost"): CSSProperties {
  if (mode === "frost") {
    if (surface === "lime")
      return {
        "--sd-accent": D.limeInk,
        "--sd-accent-ink": F.lime,
        "--sd-accent-shadow": "rgba(24,24,40,0.22)",
        "--sd-accent-halo": onAccent(12),
      } as CSSProperties;
    return {
      "--sd-accent": F.lime,
      "--sd-accent-ink": D.limeInk,
      "--sd-accent-shadow": "rgba(24,24,40,0.16)",
      "--sd-accent-halo": surface === "frost" ? "rgba(255,255,255,0.9)" : `color-mix(in srgb, ${F.lime} 25%, transparent)`,
    } as CSSProperties;
  }
  const h = HUES[cardHueOf(mode, uid)];
  return {
    "--sd-accent": `linear-gradient(135deg, ${h.heat} 0%, ${h.core} 100%)`,
    "--sd-accent-ink": D.white,
    "--sd-accent-shadow": h.spill,
    "--sd-accent-halo": h.spill.replace(/[\d.]+\)$/, "0.22)"),
  } as CSSProperties;
}

/** Hero cards glow; everything else is frost. */
export function surfaceOf(variant: string): Surface {
  switch (variant) {
    case "chart:gauge":
    case "chart:area":
    case "stat":
    case "audio":
      return "glow";
    default:
      return "frost";
  }
}

/** The frost card's fill: a pale vertical gradient with the light's sheen in the top-left. */
export const FROST_BG = [
  `radial-gradient(120% 80% at 0% 0%, ${D.sheen} 0%, rgba(255,255,255,0) 52%)`,
  `linear-gradient(180deg, ${D.frostTop} 0%, ${D.frostBottom} 100%)`,
].join(", ");

/** Contact, near and ambient shadow, under a bright top rim. */
export const FROST_SHADOW = [
  `inset 0 1px 0 ${D.rim}`,
  `inset 0 0 0 1px ${D.rimSoft}`,
  "0 1px 1px rgba(24, 24, 40, 0.04)",
  "0 8px 18px -8px rgba(24, 24, 40, 0.09)",
  "0 34px 60px -30px rgba(24, 24, 40, 0.2)",
].join(", ");

export const FROST_SHADOW_LIFT = [
  `inset 0 1px 0 ${D.rim}`,
  `inset 0 0 0 1px ${D.rimSoft}`,
  "0 2px 2px rgba(24, 24, 40, 0.04)",
  "0 14px 28px -10px rgba(24, 24, 40, 0.13)",
  "0 50px 80px -34px rgba(24, 24, 40, 0.28)",
].join(", ");

/** Shadow for Frost's flat colour cards — the same fall as frost, no rim light. */
export const SOLID_SHADOW = [
  "0 1px 1px rgba(24, 24, 40, 0.05)",
  "0 8px 18px -8px rgba(24, 24, 40, 0.1)",
  "0 34px 60px -30px rgba(24, 24, 40, 0.22)",
].join(", ");

export const SOLID_SHADOW_LIFT = [
  "0 2px 2px rgba(24, 24, 40, 0.05)",
  "0 14px 28px -10px rgba(24, 24, 40, 0.14)",
  "0 50px 80px -34px rgba(24, 24, 40, 0.3)",
].join(", ");

/** A pill or panel sitting on a card — whiter, with its own small shadow. */
export const RAISED: CSSProperties = {
  background: `linear-gradient(180deg, ${D.raisedTop} 0%, ${D.raised} 100%)`,
  boxShadow: [
    `inset 0 1px 0 ${D.raisedRim}`,
    "0 1px 1px rgba(24, 24, 40, 0.05)",
    "0 6px 16px -6px rgba(24, 24, 40, 0.12)",
  ].join(", "),
};

/** A glass chip over colour or pictures — it blurs what is behind it. */
export const GLASS: CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.22) 100%)",
  backdropFilter: "blur(14px) saturate(1.4)",
  WebkitBackdropFilter: "blur(14px) saturate(1.4)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.28), 0 8px 20px -8px rgba(0,0,0,0.18)",
};

// ─── Soft light ─────────────────────────────────────────────────────────────

/**
 * Every light in Style E is one layer with one blur: its shapes are stacked
 * radial gradients in a single background, and a single `filter: blur()`
 * melts them together. No stacked copies, masks, blend modes, grain or
 * forced GPU layers — they made a board of cards slow to first paint.
 */
const soft = (color: string, x: string, y: string, w: string, h: string, opacity = 1) =>
  `radial-gradient(${w} ${h} at ${x} ${y}, ${opacity < 1 ? `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)` : color} 0%, transparent 100%)`;

/**
 * The glow's light, inside the card: a cool pool where the light enters, a
 * hot core, a brighter heat spot, all in one blurred layer — then a frost
 * veil that pales the top and an inner rim that catches the light.
 */
/** The colour a glow card fades to at its corners — in dark, that colour sunk into the night. */
export function glowEdge(hue: HueId, dark = false): string {
  return dark ? `color-mix(in srgb, ${HUES[hue].edge} 38%, #14151B)` : HUES[hue].edge;
}

export function GlowLayers({ hue, dark = false }: { hue: HueId; dark?: boolean }) {
  const h = HUES[hue];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit", background: glowEdge(hue, dark) }}>
      <span
        data-el="Glow · light"
        className="absolute"
        style={{
          inset: "-12%",
          background: [
            soft(h.heat, "60%", "64%", "30%", "34%", 0.85),
            soft(h.core, "78%", "84%", "36%", "40%", 0.55),
            soft(h.core, "56%", "64%", "56%", "66%"),
            soft(h.cool, "14%", "8%", "46%", "48%", 0.9),
          ].join(", "),
          filter: "blur(40px)",
          opacity: E_PUNCH,
        }}
      />
      <span
        data-el="Glow · frost veil"
        className="absolute inset-0"
        style={{ background: dark ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 38%, rgba(255,255,255,0) 60%)" : "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 60%)" }}
      />
      <span
        data-el="Glow · rim light"
        className="absolute inset-0"
        style={{
          borderRadius: "inherit",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 0 1px rgba(255,255,255,0.22)",
        }}
      />
    </span>
  );
}

/** The light a glow throws onto the ground beneath it. Sits behind the card. */
export function GlowSpill({ hue, strength = 1 }: { hue: HueId; strength?: number }) {
  return (
    <span
      data-el="Light spill"
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: "8%",
        right: "8%",
        top: "24%",
        bottom: "-7%",
        borderRadius: CARD_RADIUS,
        background: HUES[hue].spill,
        filter: "blur(44px)",
        opacity: 0.6 * strength * E_PUNCH,
        zIndex: -1,
      }}
    />
  );
}

/**
 * A frost card's coloured wash along its lower edge — as in the reference's
 * quote cards. Two neighbouring tints in one blurred layer.
 */
export function Bloom({ hue, height = "48%", opacity = 1 }: { hue: HueId; height?: string; opacity?: number }) {
  const [a, b] = HUES[hue].bloom;
  const punch = useDMode() === "aurora" ? E_PUNCH : 1;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ height, opacity: opacity * punch, borderRadius: "inherit" }}>
      <span
        data-el="Bloom · wash"
        className="absolute"
        style={{
          inset: "0 -10% -40% -10%",
          background: [soft(b, "82%", "88%", "42%", "60%"), soft(a, "26%", "84%", "50%", "64%")].join(", "),
          filter: "blur(32px)",
        }}
      />
    </span>
  );
}

// ─── Type ───────────────────────────────────────────────────────────────────

/**
 * Display type: light, tight, set like the reference's "Your results are
 * pending". `lines` only clamps in a fixed box — a hugging card holds the
 * whole title.
 */
export function Title({
  children,
  size,
  align = "left",
  lines = 2,
  color = D.ink,
  weight = 500,
  className = "",
  style,
  el,
}: {
  children: ReactNode;
  size: number;
  align?: "left" | "center";
  lines?: number;
  color?: string;
  weight?: number;
  className?: string;
  style?: CSSProperties;
  /** The text-spec part this is (textSpec.ts) — omit when a wrapper names it. */
  el?: string;
}) {
  const hugs = useHugs();
  return (
    <h3
      data-el={el}
      className={className}
      style={{
        ...DISPLAY,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.12,
        letterSpacing: size >= 30 ? "-0.032em" : "-0.02em",
        color,
        textAlign: align,
        textWrap: "balance",
        overflowWrap: "break-word",
        ...(hugs ? {} : clampStyle(lines)),
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

/** Multi-line clamp for a fixed box; a hugging card never uses it. */
export function clampStyle(lines: number): CSSProperties {
  return { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" };
}

/** Whether lists and text should clamp to their box (false while the card hugs its content). */
export const useClamps = () => !useHugs();

/** The line under a title — same ink as the title, smaller. */
export function Sub({
  children,
  align = "left",
  color = D.ink,
  size = 16,
  lines = 2,
  el,
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "center";
  color?: string;
  size?: number;
  lines?: number;
  el?: string;
  className?: string;
}) {
  const hugs = useHugs();
  return (
    <p
      data-el={el}
      className={className}
      style={{
        ...FONT,
        fontSize: size,
        lineHeight: 1.35,
        letterSpacing: "-0.005em",
        color,
        textAlign: align,
        textWrap: "pretty",
        overflowWrap: "break-word",
        ...(hugs ? {} : clampStyle(lines)),
      }}
    >
      {children}
    </p>
  );
}

/**
 * The artifact's title, all of it, as one part: the head (with its lead) set
 * in display type, and the rest of its own words — the second idea after a
 * dash, the year range — as the quiet grey line under it. Nothing a body
 * computes is ever added to that line; it is the title as written.
 */
export function TitleBlock({
  title,
  sizes,
  fallback,
  lines = 2,
  align = "left",
  color,
  subColor,
  subSize = 16,
  gap = 8,
  weight,
  className = "",
}: {
  title: string;
  sizes: [number, number][];
  fallback: number;
  lines?: number;
  align?: "left" | "center";
  color?: string;
  subColor?: string;
  subSize?: number;
  gap?: number;
  weight?: number;
  className?: string;
}) {
  const t = splitTitle(title);
  const head = t.lead ? `${t.lead}: ${t.head}` : t.head;
  const sub = [t.sub ? sentenceCaseFirst(t.sub) : null, t.range].filter(Boolean).join(" · ");
  return (
    <div data-el={ROLE.title} className={`flex min-w-0 flex-col ${className}`} style={{ gap }}>
      <Title size={sizeOf(head, sizes, fallback)} lines={lines} align={align} color={color} weight={weight}>
        {head}
      </Title>
      {sub ? (
        <Sub align={align} color={subColor} size={subSize} lines={1}>
          {sub}
        </Sub>
      ) : null}
    </div>
  );
}

const sentenceCaseFirst = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const sizeOf = (text: string, steps: [number, number][], fallback: number) => {
  for (const [max, px] of steps) if (text.length <= max) return px;
  return fallback;
};

/** "In range", "Out of range" — the small raised label beside a figure. */
export function Tag({ children, tone = "raised", size = 14, el }: { children: ReactNode; tone?: "raised" | "lime" | "glass"; size?: number; el?: string }) {
  const look: CSSProperties =
    tone === "lime"
      ? { background: D.accent, color: D.accentInk, boxShadow: `0 4px 12px -4px ${D.accentShadow}, inset 0 1px 0 rgba(255,255,255,0.6)` }
      : tone === "glass"
        ? { ...GLASS, color: D.ink }
        : { ...RAISED, color: D.ink };
  return (
    <span
      data-el={el}
      className="inline-flex max-w-full shrink-0 items-center rounded-full text-center"
      style={{ ...FONT, ...look, fontSize: size, fontWeight: 500, lineHeight: 1.1, padding: `${size * 0.5}px ${size * 0.85}px`, overflowWrap: "break-word" }}
    >
      {children}
    </span>
  );
}

/** The round white button in a card's corner (the reference's + and ×). */
export function CornerButton({ glyph = "plus", size = 48, glass = false }: { glyph?: "plus" | "arrow"; size?: number; glass?: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, ...(glass ? GLASS : RAISED) }}
    >
      <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 16 16" fill="none" stroke={glass ? D.white : D.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {glyph === "plus" ? <path d="M8 2.5v11M2.5 8h11" /> : <path d="M4.5 11.5l7-7M6 4.5h5.5V10" />}
      </svg>
    </span>
  );
}

/** Initials on a soft grey sphere — a person without a photo. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const frost = useDMode() === "frost";
  const initials = name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      data-el-kind="icon"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        ...FONT,
        width: size,
        height: size,
        fontSize: size * 0.36,
        fontWeight: 500,
        color: frost ? D.lime : D.white,
        background: frost ? D.inkSurface : "radial-gradient(circle at 32% 28%, #6E6E73 0%, #2A2A2E 70%)",
        boxShadow: frost ? "0 6px 14px -6px rgba(0,0,0,0.3)" : "0 6px 14px -6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
      }}
    >
      {initials || "·"}
    </span>
  );
}

// ─── Figures ────────────────────────────────────────────────────────────────

/**
 * A figure is the secondary font set large: no display face, no dot matrix,
 * no third font. Weight stays medium; the size does the talking. `size` is
 * the font size — pick it with {@link figureSize} so a long figure never
 * outgrows its card.
 */
export function Figure({
  text,
  size,
  color = D.ink,
  align = "left",
  el,
  className = "",
  style,
}: {
  text: string;
  size: number;
  color?: string;
  align?: "left" | "center" | "right";
  el?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      data-el={el}
      className={`block min-w-0 ${className}`}
      style={{
        ...FONT,
        fontSize: size,
        fontWeight: 500,
        lineHeight: 0.98,
        letterSpacing: size >= 60 ? "-0.045em" : "-0.03em",
        fontVariantNumeric: "lining-nums proportional-nums",
        color,
        textAlign: align,
        textWrap: "balance",
        overflowWrap: "break-word",
        ...style,
      }}
    >
      {text}
    </span>
  );
}

/**
 * The hero figure's size by how many characters it has: a short figure
 * ("18", "98.5%") is set as big as the card allows, a spoken one ("About a
 * year and a half") steps down so it still sets in a line or two.
 */
export function figureSize(text: string, hero: number): number {
  const n = text.trim().length;
  if (n <= 4) return hero;
  if (n <= 7) return Math.round(hero * 0.72);
  if (n <= 12) return Math.round(hero * 0.6);
  if (n <= 24) return Math.round(hero * 0.42);
  return Math.round(hero * 0.32);
}

// ─── Ruler ──────────────────────────────────────────────────────────────────

/**
 * The reference's tick ruler: quiet ticks of uneven height, one tall bright
 * tick at `at` (0–1). Ticks near the marker grow toward it.
 */
export function Ruler({ at, count = 44, height = 44, color = "rgba(255,255,255,0.55)", marker = D.white, lit = true, ring }: { at: number; count?: number; height?: number; color?: string; marker?: string; lit?: boolean; /** On frost the lime marker is ringed in ink so it reads on white. */ ring?: string }) {
  const mark = Math.round(Math.max(0, Math.min(1, at)) * (count - 1));
  return (
    <div className="flex w-full items-end justify-between" style={{ height }} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const near = Math.max(0, 1 - Math.abs(i - mark) / 6);
        const base = i % 5 === 0 ? 0.62 : 0.34 + ((i * 37) % 11) / 60;
        const hgt = i === mark ? 1 : Math.min(0.86, base + near * 0.22);
        return (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: i === mark ? (ring ? 7 : 3.5) : 2,
              height: `${hgt * 100}%`,
              background: i === mark ? marker : color,
              boxShadow: i === mark ? (ring ? `inset 0 0 0 1.5px ${ring}` : lit ? `0 0 10px ${marker}` : undefined) : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * The reference's "7–10 days" track: a lime dot where you are, a thin line,
 * and a ringed end with two trailing dots — where you're going.
 */
export function Track({ share, light = false }: { share: number; light?: boolean }) {
  const line = light ? "rgba(255,255,255,0.55)" : inkA(18);
  const ring = light ? D.white : inkA(42);
  const at = Math.max(0, Math.min(1, share));
  return (
    <div className="relative h-[22px] w-full" aria-hidden>
      <span className="absolute left-0 right-[34px] top-1/2 h-[1.5px] -translate-y-1/2" style={{ background: line }} />
      <span
        className="absolute top-1/2 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `calc(${at} * (100% - 44px) + 10px)`, background: D.accent, boxShadow: `0 0 0 4px ${D.accentHalo}, 0 4px 10px -2px ${D.accentShadow}` }}
      />
      <span className="absolute right-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full" style={{ boxShadow: `inset 0 0 0 1.5px ${ring}` }}>
        <span className="absolute inset-[4px] rounded-full" style={{ background: ring }} />
      </span>
      <span className="absolute right-[8px] top-[6px] h-[4px] w-[4px] rounded-full" style={{ background: ring }} />
      <span className="absolute right-[2px] top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full" style={{ boxShadow: `inset 0 0 0 1px ${ring}` }} />
    </div>
  );
}

// ─── Fitting text ───────────────────────────────────────────────────────────

/**
 * Text that, in a fixed box, fills the height it is given and ends on a whole
 * line with an ellipsis — never a line cut through its middle by the card's
 * edge. In a hugging card it is simply all of the text.
 */
export function Clamp({
  children,
  size,
  lineHeight = 1.3,
  className = "",
  style,
  as: Tag = "p",
  el,
}: {
  children: ReactNode;
  size: number;
  lineHeight?: number;
  className?: string;
  style?: CSSProperties;
  as?: "p" | "blockquote";
  el?: string;
}) {
  const [ref, box] = useBox<HTMLDivElement>();
  // A hugging card's height follows this text, so there is nothing to clamp to.
  const hugs = useHugs();
  const lines = Math.max(1, Math.floor((box.h + 1) / (size * lineHeight)));
  return (
    <div ref={ref} data-el={el} className={`min-h-0 flex-1 ${hugs ? "" : "overflow-hidden"} ${className}`}>
      <Tag
        style={{
          ...FONT,
          fontSize: size,
          lineHeight,
          textWrap: "pretty",
          overflowWrap: "break-word",
          ...(hugs ? {} : { ...clampStyle(lines), WebkitLineClamp: box.h > 0 ? lines : undefined }),
          ...style,
        }}
      >
        {children}
      </Tag>
    </div>
  );
}

/** Scrolling lists fade out at the bottom instead of cutting a row in half. */
export const FADE_BOTTOM: CSSProperties = {
  maskImage: "linear-gradient(to bottom, #000 calc(100% - 36px), transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 36px), transparent)",
};

/**
 * How a list sits in its card: in a fixed box it scrolls (live) or clips
 * (tile) and fades at the bottom; in a hugging card it is simply all there.
 */
export function useListBox(interactive: boolean): { className: string; style: CSSProperties } {
  const hugs = useHugs();
  if (hugs) return { className: "", style: {} };
  return { className: interactive ? "overflow-auto" : "overflow-hidden", style: FADE_BOTTOM };
}
