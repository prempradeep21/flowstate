"use client";

import { PRIMARY, SECONDARY } from "../fonts";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { splitTitle, useBox } from "../styleC/tokens";
import { ROLE } from "../../textSpec";

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
 *   Ink is near-black, set light. Lime is the one accent: the thing that is
 *   now, next, or good. Hue lives in the glows, never in the type.
 */

export const D = {
  field: "#E4E4E2",
  frostTop: "#F7F7F6",
  frostBottom: "#EDEDEB",
  raised: "#FBFBFA",
  ink: "#1C1C1E",
  muted: "rgba(28, 28, 30, 0.56)",
  faint: "rgba(28, 28, 30, 0.36)",
  hair: "rgba(28, 28, 30, 0.08)",
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

/** The secondary font — body, labels, ticks, chips (styles/fonts.ts). */
export const FONT: CSSProperties = {
  fontFamily: SECONDARY,
  fontFeatureSettings: '"ss01", "cv11"',
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
export const useDMode = () => useContext(DModeContext);

/** Variants whose bodies paint their own bloom. */
export const SELF_BLOOM = new Set(["quote", "claim", "definition", "stickynote"]);

/**
 * Frost's solid surfaces. Frost has no coloured gradients at all: a hero card
 * is one flat colour — lime (the figure you read first), ink (a chart drawn
 * in lime), or sage (a quiet player) — and everything else is the white frost
 * card, whose pale gradient and sheen stay. Colour on frost is spread the way
 * the calendar spreads it: white raised pills, ink type, and one solid lime
 * mark for the thing that is now, next, or biggest.
 */
export const F = {
  lime: D.lime,
  ink: D.ink,
  sage: "#8C9386",
  sageDeep: "#5F665A",
  stone: "#C8CBC2",
  /** The accent darkened toward ink — a second step of the same colour. */
  olive: "color-mix(in oklab, var(--sd-lime, #DDF23F) 72%, #1C1C1E)",
  mist: "#E3E4DF",
} as const;

/** Series colours on frost: ink, lime, then the greens and greys — never a gradient, never a glow. */
export const FROST_SERIES = [F.ink, F.lime, F.sage, F.sageDeep, F.stone, F.olive, "#DADCD4"];

/** The surface a body sits on. `glow` is Aurora's; the rest are Frost's. */
export type OnSurface = "frost" | "lime" | "ink" | "sage" | "glow";
export const SurfaceContext = createContext<OnSurface>("frost");

/** Frost's surface for a variant: a flat colour for heroes and notes, frost for the rest. */
export function frostSurfaceOf(variant: string): Exclude<OnSurface, "glow"> {
  switch (variant) {
    case "chart:gauge":
    case "stat":
    case "stickynote":
      return "lime";
    case "chart:area":
      return "ink";
    case "audio":
      return "sage";
    default:
      return "frost";
  }
}

export const SURFACE_FILL: Record<Exclude<OnSurface, "glow" | "frost">, string> = { lime: F.lime, ink: F.ink, sage: F.sage };

/** The accent's own ink at a percentage — for quiet type on an accent card. */
export const onAccent = (pct: number) => `color-mix(in srgb, ${D.limeInk} ${pct}%, transparent)`;

/**
 * Ink for a body on its surface. `glow` means Aurora's lit colour (glass chips,
 * white light); `light` means the type is white (glow, ink, sage).
 */
export function useOn() {
  const surface = useContext(SurfaceContext);
  const glow = surface === "glow";
  if (glow)
    return { glow, light: true, ink: D.white, title: "rgba(255,255,255,0.9)", sub: "rgba(255,255,255,0.86)", faint: "rgba(255,255,255,0.7)", line: "#FFFFFF", ruler: "rgba(255,255,255,0.55)", marker: D.white, fill: "#FFFFFF" };
  if (surface === "ink")
    return { glow, light: true, ink: D.white, title: D.white, sub: "rgba(255,255,255,0.6)", faint: "rgba(255,255,255,0.4)", line: F.lime, ruler: "rgba(255,255,255,0.3)", marker: F.lime, fill: F.lime };
  if (surface === "sage")
    return { glow, light: true, ink: D.white, title: D.white, sub: "rgba(255,255,255,0.78)", faint: "rgba(255,255,255,0.6)", line: D.white, ruler: "rgba(255,255,255,0.45)", marker: D.white, fill: D.white };
  if (surface === "lime")
    return { glow, light: false, ink: D.limeInk, title: D.limeInk, sub: onAccent(62), faint: onAccent(45), line: D.limeInk, ruler: onAccent(28), marker: D.limeInk, fill: D.limeInk };
  return { glow, light: false, ink: D.ink, title: D.ink, sub: D.muted, faint: D.faint, line: D.ink, ruler: "rgba(28,28,30,0.22)", marker: D.ink, fill: D.ink };
}

/** Marks for charts and lists: Frost's solid greens and greys, or Aurora's hues. */
export function usePalette(uid: string) {
  const frost = useDMode() === "frost";
  return frost
    ? { frost, series: FROST_SERIES, peak: F.lime, dots: [F.ink], halo: false }
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
  "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 52%)",
  `linear-gradient(180deg, ${D.frostTop} 0%, ${D.frostBottom} 100%)`,
].join(", ");

/** Contact, near and ambient shadow, under a bright top rim. */
export const FROST_SHADOW = [
  "inset 0 1px 0 rgba(255,255,255,0.95)",
  "inset 0 0 0 1px rgba(255,255,255,0.6)",
  "0 1px 1px rgba(24, 24, 40, 0.04)",
  "0 8px 18px -8px rgba(24, 24, 40, 0.09)",
  "0 34px 60px -30px rgba(24, 24, 40, 0.2)",
].join(", ");

export const FROST_SHADOW_LIFT = [
  "inset 0 1px 0 rgba(255,255,255,0.95)",
  "inset 0 0 0 1px rgba(255,255,255,0.6)",
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
  background: `linear-gradient(180deg, #FFFFFF 0%, ${D.raised} 100%)`,
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,1)",
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

// ─── Progressive blur ───────────────────────────────────────────────────────

/**
 * Style E's blurs are progressive, never one flat blur: the same light is
 * drawn several times at rising blur, and each copy is masked to its own band,
 * so the softness ramps smoothly — a tighter core dissolving into a very soft
 * edge. `PROGRESSIVE_BOOST` is the overall level (1.3 = 30% more than the
 * first version).
 */
export const PROGRESSIVE_BOOST = 1.3;
export const PROGRESSIVE_STEPS = [0.7, 1, 1.5] as const;

/**
 * Masks for the three steps, sharpest first. They are a partition of unity —
 * at every point they sum to exactly 1 — and the copies are *added*
 * (plus-lighter), so each hand-over is a true crossfade from one blur level
 * to the next with no seam. `radial` ramps out from `at` (`scale` stretches
 * the bands; 1 = placed for a shape filling half the box); `up` ramps from
 * the bottom edge upward.
 */
export function progressiveMasks(shape: "radial" | "up", at = "50% 50%", scale = 1): [string, string, string] {
  const [r0, r1, r2, r3] = shape === "up" ? [16, 40, 52, 78] : [18, 38, 50, 72];
  const p = (n: number) => `${Math.min(100, n * (shape === "up" ? 1 : scale)).toFixed(1)}%`;
  const g = (stops: string) => (shape === "up" ? `linear-gradient(to top, ${stops})` : `radial-gradient(closest-side at ${at}, ${stops})`);
  return [
    g(`#000 ${p(r0)}, transparent ${p(r1)}`),
    g(`transparent ${p(r0)}, #000 ${p(r1)}, #000 ${p(r2)}, transparent ${p(r3)}`),
    g(`transparent ${p(r2)}, #000 ${p(r3)}`),
  ];
}

const maskStyle = (m: string): CSSProperties => ({ maskImage: m, WebkitMaskImage: m });

/**
 * One light drawn progressively: `children` (unblurred shapes) rendered once
 * per step inside a full-size layer, blurred at `blur × step × boost`,
 * masked to that step's band, and added to the others.
 */
export function ProgressiveLayer({
  blur,
  shape,
  at,
  children,
  unit = "px",
  scale,
}: {
  blur: number;
  shape: "radial" | "up";
  at?: string;
  children: ReactNode;
  unit?: "px" | "cqmin";
  scale?: number;
}) {
  const masks = progressiveMasks(shape, at, scale);
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ isolation: "isolate" }}>
      {PROGRESSIVE_STEPS.map((k, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            filter: `blur(${(blur * k * PROGRESSIVE_BOOST).toFixed(2)}${unit})`,
            mixBlendMode: "plus-lighter",
            transform: "translateZ(0)",
            ...maskStyle(masks[i]!),
          }}
        >
          {children}
        </span>
      ))}
    </span>
  );
}

/** Film grain — keeps the large blurs from banding and reads as a material. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Grain({ opacity = 0.22, name = "Grain" }: { opacity?: number; name?: string }) {
  return (
    <span
      data-el={name}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px", mixBlendMode: "overlay", opacity }}
    />
  );
}

/** A soft shape with no blur of its own — progressive layers blur it. */
function Shape({ color, style, name }: { color: string; style: CSSProperties; name: string }) {
  return (
    <span
      data-el={name}
      aria-hidden
      className="pointer-events-none absolute"
      style={{ background: `radial-gradient(closest-side, ${color} 0%, ${color} 35%, transparent 100%)`, ...style }}
    />
  );
}

/** One soft blob: a radial gradient, blurred again so its edge has no shape at all. */
function Blob({ color, style, blur, name }: { color: string; style: CSSProperties; blur: number; name: string }) {
  return (
    <span
      data-el={name}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        background: `radial-gradient(closest-side, ${color} 0%, ${color} 35%, transparent 100%)`,
        filter: `blur(${blur}px)`,
        transform: "translateZ(0)",
        ...style,
      }}
    />
  );
}

/**
 * The glow's light, inside the card. Four blobs make the colour (cool rim,
 * hot core, a brighter heat spot, a cool pool where the light enters), then a
 * frost veil softens the top, grain gives it material, and an inner rim
 * catches the light at the edge.
 */
export function GlowLayers({ hue }: { hue: HueId }) {
  const h = HUES[hue];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit", background: h.edge }}>
      {/* Clearer at the hot core, dissolving toward the card's edges. */}
      <ProgressiveLayer blur={42} shape="radial" at="54% 60%">
        <Shape name="Glow · cool pool" color={h.cool} style={{ left: "-25%", top: "-35%", width: "80%", height: "90%", opacity: 0.9 }} />
        <Shape name="Glow · core" color={h.core} style={{ left: "6%", top: "10%", width: "100%", height: "120%" }} />
        <Shape name="Glow · heat" color={h.heat} style={{ left: "30%", top: "34%", width: "48%", height: "56%", opacity: 0.85 }} />
        <Shape name="Glow · lower core" color={h.core} style={{ left: "52%", top: "48%", width: "60%", height: "70%", opacity: 0.55 }} />
      </ProgressiveLayer>
      {/* Frost veil — the top of the card is closer to the light, so it is paler. */}
      <span
        data-el="Glow · frost veil"
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 60%)" }}
      />
      <Grain opacity={0.26} name="Glow · grain" />
      <span
        data-el="Glow · rim light"
        className="absolute inset-0"
        style={{
          borderRadius: "inherit",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 -30px 60px -40px rgba(0,0,0,0.12)",
        }}
      />
    </span>
  );
}

/** The light a glow throws onto the ground beneath it. Sits behind the card. */
export function GlowSpill({ hue, strength = 1 }: { hue: HueId; strength?: number }) {
  // Progressive: a tight, bright pool right under the card, a wide faint one beyond it.
  const pools = [
    { inset: { left: "14%", right: "14%", top: "40%", bottom: "-3%" }, blur: 22, opacity: 0.55 },
    { inset: { left: "8%", right: "8%", top: "22%", bottom: "-7%" }, blur: 38, opacity: 0.5 },
    { inset: { left: "0%", right: "0%", top: "12%", bottom: "-14%" }, blur: 64, opacity: 0.4 },
  ];
  return (
    <>
      {pools.map((p, i) => (
        <span
          key={i}
          data-el="Light spill"
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            ...p.inset,
            borderRadius: CARD_RADIUS,
            background: HUES[hue].spill,
            filter: `blur(${p.blur * PROGRESSIVE_BOOST}px)`,
            opacity: p.opacity * strength,
            zIndex: -1,
          }}
        />
      ))}
    </>
  );
}

/**
 * A frost card's coloured wash along its lower edge — as in the reference's
 * quote cards. Two blobs of neighbouring tints, blurred into the card.
 */
export function Bloom({ hue, height = "48%", opacity = 1 }: { hue: HueId; height?: string; opacity?: number }) {
  const [a, b] = HUES[hue].bloom;
  const progressive = useDMode() === "aurora";
  if (progressive) {
    // Crisp along the card's bottom edge, dissolving as it rises; the whole
    // wash fades out before the top of its band so no edge is ever drawn.
    const fade = "linear-gradient(to top, #000 62%, transparent 100%)";
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
        style={{ height: `calc(${height} * 1.25)`, opacity, borderRadius: "inherit", maskImage: fade, WebkitMaskImage: fade }}
      >
        <ProgressiveLayer blur={32} shape="up">
          <Shape name="Bloom · left wash" color={a} style={{ left: "-20%", bottom: "-50%", width: "90%", height: "110%" }} />
          <Shape name="Bloom · right wash" color={b} style={{ right: "-18%", bottom: "-46%", width: "75%", height: "105%" }} />
        </ProgressiveLayer>
        <Grain opacity={0.14} name="Bloom · grain" />
      </span>
    );
  }
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ height, opacity, borderRadius: "inherit" }}>
      <Blob name="Bloom · left wash" color={a} blur={34} style={{ left: "-20%", bottom: "-45%", width: "90%", height: "120%" }} />
      <Blob name="Bloom · right wash" color={b} blur={30} style={{ right: "-18%", bottom: "-40%", width: "75%", height: "115%" }} />
      <Grain opacity={0.14} name="Bloom · grain" />
    </span>
  );
}

// ─── Type ───────────────────────────────────────────────────────────────────

/** Display type: light, tight, set like the reference's "Your results are pending". */
export function Title({
  children,
  size,
  align = "left",
  lines = 2,
  color = D.ink,
  weight = 400,
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
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

/** The quiet grey line under a title. */
export function Sub({
  children,
  align = "left",
  color = D.muted,
  size = 16,
  lines = 2,
  el,
}: {
  children: ReactNode;
  align?: "left" | "center";
  color?: string;
  size?: number;
  lines?: number;
  el?: string;
}) {
  return (
    <p
      data-el={el}
      style={{
        ...FONT,
        fontSize: size,
        lineHeight: 1.35,
        letterSpacing: "-0.005em",
        color,
        textAlign: align,
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
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
        ? { ...GLASS, color: D.white }
        : { ...RAISED, color: D.muted };
  return (
    <span
      data-el={el}
      className="inline-flex max-w-full shrink-0 items-center truncate rounded-full"
      style={{ ...FONT, ...look, fontSize: size, fontWeight: 500, lineHeight: 1, padding: `${size * 0.5}px ${size * 0.85}px` }}
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
        background: frost ? D.ink : "radial-gradient(circle at 32% 28%, #6E6E73 0%, #2A2A2E 70%)",
        boxShadow: frost ? "0 6px 14px -6px rgba(0,0,0,0.3)" : "0 6px 14px -6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
      }}
    >
      {initials || "·"}
    </span>
  );
}

// ─── Dot-matrix numerals ────────────────────────────────────────────────────

/** 5×7 glyphs (narrower for punctuation); `#` is a lit dot. */
const GLYPHS: Record<string, string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": [".", ".", ".", ".", ".", "#", "#"],
  ":": [".", ".", "#", ".", ".", "#", "."],
  "-": ["...", "...", "...", "###", "...", "...", "..."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "%": ["##...", "##..#", "...#.", "..#..", ".#...", "#..##", "...##"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
};
const ALIAS: Record<string, string> = { "−": "-", "–": "-", "—": "-", "×": "x", k: "K", m: "M", b: "B", X: "x" };

const normalize = (s: string) =>
  [...s.trim()].map((ch) => ALIAS[ch] ?? ch).join("");

/** True when every character has a dot glyph, so the figure can be set in dots. */
export function dottable(s: string, maxChars = 7): boolean {
  const n = normalize(s);
  return n.length > 0 && n.length <= maxChars && [...n].every((ch) => GLYPHS[ch]) && /\d/.test(n);
}

/**
 * A figure set in lit dots — the reference's "25" and "70". Dots carry a faint
 * halo of their own colour so they read as light, not print.
 */
export function DotNumber({
  text,
  height,
  color = D.white,
  glow = true,
  className = "",
  el,
}: {
  text: string;
  height: number;
  color?: string;
  glow?: boolean;
  className?: string;
  /**
   * The text-spec part this numeral is. The dots are drawn, not typed, so the
   * root carries the number as its label and the Elements panel reads it as text.
   */
  el?: string;
}) {
  const chars = [...normalize(text)].filter((ch) => GLYPHS[ch]);
  const pitch = height / 7;
  const r = pitch * 0.34;
  const dots: { x: number; y: number }[] = [];
  let x = 0;
  chars.forEach((ch, ci) => {
    const g = GLYPHS[ch]!;
    const w = g[0]!.length;
    g.forEach((row, ry) => {
      [...row].forEach((cell, rx) => {
        if (cell === "#") dots.push({ x: x + rx * pitch + pitch / 2, y: ry * pitch + pitch / 2 });
      });
    });
    x += w * pitch + (ci < chars.length - 1 ? pitch : 0);
  });
  return (
    <span data-el={el} role="img" aria-label={text} className={`block shrink-0 ${className}`} style={{ width: x, height }}>
      <svg
        width={x}
        height={height}
        viewBox={`0 0 ${x} ${height}`}
        className="block overflow-visible"
        style={glow ? { filter: `drop-shadow(0 0 ${pitch * 0.6}px ${color === D.white ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.08)"})` } : undefined}
        aria-hidden
      >
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={r} fill={color} />
        ))}
      </svg>
    </span>
  );
}

/** A figure in dots when it can be, in light type when it can't. */
export function Figure({
  text,
  height,
  color = D.ink,
  maxDots = 7,
  glow,
  el,
}: {
  text: string;
  height: number;
  color?: string;
  maxDots?: number;
  glow?: boolean;
  el?: string;
}) {
  if (dottable(text, maxDots)) return <DotNumber el={el} text={text} height={height} color={color} glow={glow ?? color === D.white} />;
  return (
    <span
      data-el={el}
      className="block min-w-0 truncate"
      style={{ ...DISPLAY, fontSize: height * 1.25, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.04em", color }}
    >
      {text}
    </span>
  );
}

// ─── Ruler ──────────────────────────────────────────────────────────────────

/**
 * The reference's tick ruler: quiet ticks of uneven height, one tall bright
 * tick at `at` (0–1). Ticks near the marker grow toward it.
 */
export function Ruler({ at, count = 44, height = 44, color = "rgba(255,255,255,0.55)", marker = D.white, lit = true }: { at: number; count?: number; height?: number; color?: string; marker?: string; lit?: boolean }) {
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
              width: i === mark ? 3.5 : 2,
              height: `${hgt * 100}%`,
              background: i === mark ? marker : color,
              boxShadow: i === mark && lit ? `0 0 10px ${marker}` : undefined,
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
  const line = light ? "rgba(255,255,255,0.55)" : "rgba(28,28,30,0.18)";
  const ring = light ? D.white : "rgba(28,28,30,0.42)";
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
 * Text that fills whatever height it is given and ends on a whole line with an
 * ellipsis — never a line cut through its middle by the card's edge.
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
  const lines = Math.max(1, Math.floor((box.h + 1) / (size * lineHeight)));
  return (
    <div ref={ref} data-el={el} className={`min-h-0 flex-1 overflow-hidden ${className}`}>
      <Tag
        style={{
          ...FONT,
          fontSize: size,
          lineHeight,
          display: "-webkit-box",
          WebkitLineClamp: box.h > 0 ? lines : undefined,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textWrap: "pretty",
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
