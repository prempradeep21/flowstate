"use client";

import type { CSSProperties } from "react";
import { Grain, HUES, PROGRESSIVE_BOOST, PROGRESSIVE_STEPS, ProgressiveLayer, type HueId } from "./tokens";

/**
 * Style E's atmosphere — the blurred backgrounds its cards sit in, and the
 * glass edge every card has. Style D (Frost) uses none of this.
 *
 * Backgrounds
 *   Each card holds a few orbs of light: soft multi-tone spheres (iris is a
 *   blue core going violet, then pink at one side), blurred until they have
 *   no edge at all, under a faint grain. A card's palette follows its accent
 *   hue, and its composition — where the orbs sit — is picked per artifact
 *   from a small set, so a board reads as a family without repeating.
 *   Cards you read line by line (tables, lists, code) only get compositions
 *   that keep the light off the text.
 *
 * Glass edge
 *   The card is a slab of glass lit from the top-left. Its rim is a gradient
 *   ring: bright at the top-left corner, fading to nothing along the sides,
 *   then picking up the card's own colour along the bottom edge — the light
 *   inside the glass carried to its far edge — and a last white glint at the
 *   bottom-right. Just inside the rim, a refraction band: a pale light
 *   pooled under the top edge, a tinted one over the bottom edge, and faint
 *   light down each side.
 */

// ─── Palettes ───────────────────────────────────────────────────────────────

export type PaletteId = "iris" | "sky" | "mint" | "peach" | "blush" | "lilac";

/** Three tones per orb: its core, the colour it turns into, and the tint at its far side. */
export const PALETTES: Record<PaletteId, { tones: [string, string, string]; edge: string }> = {
  iris: { tones: ["#8DB2FF", "#B19BF7", "#F6C3DF"], edge: "#8E9BF2" },
  sky: { tones: ["#6FC0FF", "#A6E3FF", "#C7D6FF"], edge: "#5DB2F5" },
  mint: { tones: ["#94E3B6", "#CDEFA4", "#B5E9DE"], edge: "#6FCB97" },
  peach: { tones: ["#FFB487", "#FF9EB3", "#FFD9A6"], edge: "#FF9A6B" },
  blush: { tones: ["#FF9DC2", "#FFC2AA", "#E3B9F7"], edge: "#F27FAB" },
  lilac: { tones: ["#C5B2FF", "#F1C5E9", "#B7D0FF"], edge: "#A98EF2" },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A palette that agrees with the card's accent hue. */
export function paletteOf(hue: HueId, uid: string): PaletteId {
  const pick = (a: PaletteId, b: PaletteId) => (hash(uid + "p") % 2 ? a : b);
  switch (hue) {
    case "ember":
    case "sun":
      return "peach";
    case "rose":
      return pick("blush", "lilac");
    case "grove":
    case "lime":
      return "mint";
    case "lilac":
      return "lilac";
    default:
      return pick("iris", "sky");
  }
}

// ─── Compositions ───────────────────────────────────────────────────────────

/**
 * Where the light sits. Positions are the orb's centre in % of the card;
 * size is in `cqmin` so an orb is the same shape on a square card and a
 * long timeline.
 */
type Orb = { x: number; y: number; size: number; opacity: number; tone: 0 | 1 | 2 };
type Composition = { id: string; label: string; orbs: Orb[] };

const COMPOSITIONS: Record<string, Composition> = {
  // One big sphere floating above the middle — the reference's "Reflections".
  halo: {
    id: "halo",
    label: "halo",
    orbs: [
      { x: 50, y: 46, size: 86, opacity: 0.9, tone: 0 },
      { x: 64, y: 54, size: 52, opacity: 0.7, tone: 2 },
    ],
  },
  // Light coming in from the lower-right corner, a faint answer top-left.
  drift: {
    id: "drift",
    label: "drift",
    orbs: [
      { x: 96, y: 100, size: 120, opacity: 0.72, tone: 0 },
      { x: 78, y: 112, size: 70, opacity: 0.55, tone: 2 },
      { x: -4, y: -8, size: 64, opacity: 0.4, tone: 1 },
    ],
  },
  // A wash along the top edge, as on the frosted calendar sheet.
  dawn: {
    id: "dawn",
    label: "dawn",
    orbs: [
      { x: 18, y: -16, size: 96, opacity: 0.7, tone: 0 },
      { x: 78, y: -12, size: 84, opacity: 0.62, tone: 2 },
      { x: 52, y: -22, size: 60, opacity: 0.5, tone: 1 },
    ],
  },
  // Light rising out of the bottom edge.
  rise: {
    id: "rise",
    label: "rise",
    orbs: [
      { x: 30, y: 118, size: 110, opacity: 0.7, tone: 0 },
      { x: 76, y: 112, size: 90, opacity: 0.62, tone: 2 },
    ],
  },
  // Two lights at opposite corners.
  pair: {
    id: "pair",
    label: "pair",
    orbs: [
      { x: 2, y: 4, size: 80, opacity: 0.6, tone: 0 },
      { x: 100, y: 98, size: 96, opacity: 0.66, tone: 2 },
    ],
  },
};

/** Cards read line by line keep the light off the text. */
const QUIET = new Set(["table", "todo", "calendar", "code", "linkgroup", "episode", "timeline", "mechanism", "images", "video", "website", "map", "streetview", "3d", "embed", "custom"]);

export function compositionOf(variant: string, uid: string): Composition {
  const pool = QUIET.has(variant) ? ["drift", "rise", "pair"] : ["halo", "drift", "dawn", "rise", "pair"];
  return COMPOSITIONS[pool[hash(uid + "c") % pool.length]!]!;
}

/**
 * One orb: three tones, offset inside one sphere of light, blurred
 * progressively — a clearer core dissolving into a very soft halo. The box is
 * sized to the orb plus the reach of its softest blur, so that step never
 * meets its own edge, and no bigger (large blurred boxes are costly to paint).
 */
function OrbLight({ orb, tones, name }: { orb: Orb; tones: [string, string, string]; name: string }) {
  const [a, b, c] = [tones[orb.tone], tones[(orb.tone + 1) % 3], tones[(orb.tone + 2) % 3]];
  const S = orb.size;
  const reach = ORB_BLUR * PROGRESSIVE_BOOST * PROGRESSIVE_STEPS[2] * 2.4;
  const half = S * 0.62 + reach;
  // Tone centres as offsets from the orb's centre (in cqmin), mapped into the box.
  const at = (dx: number, dy: number) => `${50 + ((dx * S) / (2 * half)) * 100}% ${50 + ((dy * S) / (2 * half)) * 100}%`;
  const light = [
    `radial-gradient(circle ${S * 0.52}cqmin at ${at(-0.08, -0.07)}, ${a} 0%, ${a} 52%, transparent 100%)`,
    `radial-gradient(circle ${S * 0.46}cqmin at ${at(0.08, 0.12)}, ${b} 0%, ${b} 46%, transparent 100%)`,
    `radial-gradient(circle ${S * 0.36}cqmin at ${at(0.24, -0.06)}, ${c} 0%, ${c} 40%, transparent 100%)`,
  ].join(", ");
  // Mask bands are fractions of the box's half-width; put them where the orb's own edge is.
  const edge = (S * 0.5) / half;
  return (
    <span
      data-el={name}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: `${orb.x}%`,
        top: `${orb.y}%`,
        width: `${half * 2}cqmin`,
        height: `${half * 2}cqmin`,
        transform: "translate(-50%, -50%)",
        opacity: Math.min(1, orb.opacity * 1.3),
      }}
    >
      <ProgressiveLayer blur={ORB_BLUR} unit="cqmin" shape="radial" at="52% 52%" scale={edge / 0.5}>
        <span className="absolute inset-0" style={{ background: light, filter: "saturate(1.15)" }} />
      </ProgressiveLayer>
    </span>
  );
}

/** The orbs' blur at the middle step, before the boost — the first version's single blur. */
const ORB_BLUR = 6.5;

/** The card's background light — palette and composition, under grain. */
export function Atmosphere({ hue, uid, variant, strength }: { hue: HueId; uid: string; variant: string; strength?: number }) {
  const palette = PALETTES[paletteOf(hue, uid)];
  const comp = compositionOf(variant, uid);
  strength ??= QUIET.has(variant) ? 0.8 : 1;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ borderRadius: "inherit", containerType: "size", opacity: strength } as CSSProperties}
    >
      {comp.orbs.map((orb, i) => (
        <OrbLight key={i} orb={orb} tones={palette.tones} name={`Light · ${comp.label} ${i + 1}`} />
      ))}
      <Grain opacity={0.12} name="Light · grain" />
    </span>
  );
}

// ─── Glass edge ─────────────────────────────────────────────────────────────

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** A ring the width of the rim, cut out of a gradient by masking its middle. */
const RING_MASK: CSSProperties = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
};

/**
 * The glass rim and the light refracted just inside it. `tint` is the colour
 * the bottom edge carries; on a glowing card (`lit`) the rim is brighter and
 * thicker, and the inner light stronger, as on a saturated glass slab.
 */
export function GlassEdge({ tint, lit = false }: { tint: string; lit?: boolean }) {
  const rim = lit ? 2 : 1.5;
  return (
    <>
      <span
        data-el="Glass · refraction"
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "inherit",
          boxShadow: (lit
            ? [
                "inset 0 0 0 1px rgba(255,255,255,0.18)",
                "inset 0 0 18px rgba(255,255,255,0.22)",
                "inset 0 22px 30px -24px rgba(255,255,255,0.75)",
                "inset 0 -26px 40px -26px rgba(0,0,0,0.18)",
                "inset 14px 0 26px -24px rgba(255,255,255,0.5)",
              ]
            : [
                "inset 0 16px 24px -20px rgba(255,255,255,1)",
                `inset 0 -18px 30px -22px ${hexA(tint, 0.42)}`,
                "inset 12px 0 22px -20px rgba(255,255,255,0.8)",
                "inset -12px 0 22px -20px rgba(255,255,255,0.55)",
              ]
          ).join(", "),
        }}
      />
      <span
        data-el="Glass · rim"
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          ...RING_MASK,
          borderRadius: "inherit",
          padding: rim,
          background: [
            // The glint where the light enters, and the far corner it lands on.
            `radial-gradient(60% 40% at 6% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)`,
            `radial-gradient(40% 30% at 100% 100%, rgba(255,255,255,${lit ? 0.85 : 0.95}) 0%, rgba(255,255,255,0) 70%)`,
            // Top-down: bright, clear along the sides, the card's colour at the foot.
            `linear-gradient(180deg, rgba(255,255,255,${lit ? 0.7 : 0.95}) 0%, rgba(255,255,255,0.15) 22%, rgba(255,255,255,0) 50%, ${hexA(tint, lit ? 0.0 : 0.25)} 78%, ${lit ? "rgba(255,255,255,0.45)" : hexA(tint, 0.55)} 100%)`,
          ].join(", "),
        }}
      />
    </>
  );
}

/** The bottom-edge tint for a card: its palette's edge colour, or the glow's own hue. */
export function edgeTintOf(hue: HueId, uid: string, lit: boolean): string {
  return lit ? HUES[hue].heat : PALETTES[paletteOf(hue, uid)].edge;
}

// ─── Surfaces ───────────────────────────────────────────────────────────────

/** Style E's field: cool, almost white, with the faintest light in it. */
export const E_FIELD = [
  "radial-gradient(70% 50% at 12% 0%, rgba(205, 214, 255, 0.35) 0%, rgba(205, 214, 255, 0) 70%)",
  "radial-gradient(60% 50% at 100% 100%, rgba(255, 214, 230, 0.28) 0%, rgba(255, 214, 230, 0) 70%)",
  "linear-gradient(180deg, #F5F6F9 0%, #EEF0F4 100%)",
].join(", ");

/** Style E's card: cool frost, flatter than D's, with the sheen still in the top-left. */
export const E_CARD_BG = [
  "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 55%)",
  "linear-gradient(180deg, #FAFBFC 0%, #F2F4F7 100%)",
].join(", ");

/** Soft and wide — the cards float rather than sit. */
export const E_SHADOW = ["0 1px 2px rgba(40, 44, 72, 0.05)", "0 10px 24px -12px rgba(40, 44, 72, 0.12)", "0 40px 70px -36px rgba(40, 44, 72, 0.22)"].join(", ");
export const E_SHADOW_LIFT = ["0 2px 3px rgba(40, 44, 72, 0.06)", "0 16px 32px -14px rgba(40, 44, 72, 0.16)", "0 56px 90px -40px rgba(40, 44, 72, 0.3)"].join(", ");
