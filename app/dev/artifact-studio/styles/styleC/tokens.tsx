"use client";

import { PRIMARY } from "../fonts";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Style C — "Integrated". The palette, type scale and the few shared pieces
 * every Style C body is built from.
 *
 * Colour rules
 *   Surfaces carry meaning, not decoration:
 *     lime  — the hero cards: one number or one shape you read first
 *             (gauge, pie, bar, quote, timeline)
 *     white — working data you read row by row (table, todo, calendar, code…)
 *     blue  — the world: places, pictures, sound, the web, and arguments
 *   Marks are ink first, blue second (on lime) or lime second (on blue).
 *   Orange is the single accent — at most one thing per card is orange, and
 *   it is always the thing the title is about (the peak, the latest, the next).
 *   Every card sits on forest; nothing is forest but the field.
 */

/**
 * The roles as CSS variables — the frame writes the active theme's colours
 * onto the card root (see `paletteVars`), so every body paints by role and
 * the themes below only change which colours fill the roles:
 *   field (forest) · hero (lime) · world (blue) · accent (orange) · ink
 * The keys keep the original theme's names; read `lime` as "hero".
 */
export const C = {
  forest: "var(--sc-field)",
  ink: "var(--sc-ink)",
  lime: "var(--sc-hero)",
  limeDeep: "var(--sc-hero-deep)",
  blue: "var(--sc-world)",
  blueDeep: "var(--sc-world-deep)",
  orange: "var(--sc-accent)",
  white: "#FFFFFF",
  well: "var(--sc-well)",
  hair: "color-mix(in srgb, var(--sc-ink) 12%, transparent)",
  muted: "color-mix(in srgb, var(--sc-ink) 62%, transparent)",
  faint: "color-mix(in srgb, var(--sc-ink) 42%, transparent)",
  /** Three quiet series colours that sit beside the roles in charts. */
  q1: "var(--sc-q1)",
  q2: "var(--sc-q2)",
  q3: "var(--sc-q3)",
} as const;

/** `color` at `pct`% over transparent — tints of a role. */
export const tint = (color: string, pct: number, over = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${over})`;

export interface Palette {
  field: string;
  ink: string;
  hero: string;
  heroDeep: string;
  world: string;
  worldDeep: string;
  accent: string;
  well: string;
  quiet: [string, string, string];
  /** Type on the field (the studio's labels around the cards). */
  fieldInk: string;
}

export interface StyleCTheme {
  id: string;
  name: string;
  hint: string;
  pal: Palette;
}

/** Five colour systems for the same roles. The first is the original reference. */
export const SC_THEMES: StyleCTheme[] = [
  {
    id: "forest",
    name: "Forest",
    hint: "The reference — lime heroes and sky-blue world cards on forest, orange accent",
    pal: { field: "#0E2A20", ink: "#0F2A1E", hero: "#EEF39D", heroDeep: "#D3DC80", world: "#A9D9EE", worldDeep: "#7CC2E0", accent: "#F7944B", well: "#EDEEEA", quiet: ["#8A9A45", "#2F6F8F", "#F6C9A4"], fieldInk: "#F3F6E4" },
  },
  {
    id: "midnight",
    name: "Midnight",
    hint: "Periwinkle heroes and blush world cards on deep navy, tangerine accent",
    pal: { field: "#151A3B", ink: "#171B3A", hero: "#CFC8FF", heroDeep: "#ADA2F4", world: "#FFD1E1", worldDeep: "#F4A6C4", accent: "#FF6A3D", well: "#EEEDF4", quiet: ["#6E64C8", "#3B4A9A", "#FFC2A8"], fieldInk: "#ECEBFF" },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    hint: "Sand heroes and sage world cards on cocoa, rust accent",
    pal: { field: "#3A1D13", ink: "#2E180F", hero: "#F6D9AE", heroDeep: "#E5BC82", world: "#C9DCC4", worldDeep: "#9DBF94", accent: "#E04E2B", well: "#F1ECE6", quiet: ["#A0703A", "#5E7F55", "#F2B8A2"], fieldInk: "#FBEBD8" },
  },
  {
    id: "lagoon",
    name: "Lagoon",
    hint: "Mint heroes and butter world cards on deep teal, coral-pink accent",
    pal: { field: "#06323A", ink: "#0A2A30", hero: "#BDF2E4", heroDeep: "#8EDFCA", world: "#FFE48A", worldDeep: "#F2CB45", accent: "#FF5C7A", well: "#EAF0EF", quiet: ["#3E9C8A", "#1F6470", "#FFC1CC"], fieldInk: "#E3FBF4" },
  },
  {
    id: "graphite",
    name: "Graphite",
    hint: "Signal-yellow heroes and lilac world cards on graphite, red-orange accent",
    pal: { field: "#1B1B1D", ink: "#161617", hero: "#FFE24A", heroDeep: "#F0C814", world: "#C8BDFF", worldDeep: "#A694F6", accent: "#FF4D2E", well: "#EFEFEC", quiet: ["#8C7A1E", "#5B4FB0", "#FFB3A3"], fieldInk: "#F4F4F0" },
  },
];

export function scThemeOf(themeId: string | null | undefined): StyleCTheme {
  return SC_THEMES.find((t) => t.id === themeId) ?? SC_THEMES[0]!;
}

/** A theme's palette as the CSS variables `C` reads. */
export function paletteVars(p: Palette): CSSProperties {
  return {
    "--sc-field": p.field,
    "--sc-ink": p.ink,
    "--sc-hero": p.hero,
    "--sc-hero-deep": p.heroDeep,
    "--sc-world": p.world,
    "--sc-world-deep": p.worldDeep,
    "--sc-accent": p.accent,
    "--sc-well": p.well,
    "--sc-q1": p.quiet[0],
    "--sc-q2": p.quiet[1],
    "--sc-q3": p.quiet[2],
  } as CSSProperties;
}

export type Surface = "lime" | "white" | "blue" | "ink";

export const SURFACE_BG: Record<Surface, string> = {
  lime: C.lime,
  white: C.white,
  blue: C.blue,
  ink: C.ink,
};

/** Which surface each kind sits on — the colour rule above, made concrete. */
export function surfaceOf(variant: string): Surface {
  switch (variant) {
    case "chart:bar":
    case "chart:pie":
    case "chart:gauge":
    case "quote":
    case "timeline":
      return "lime";
    case "chart:line":
    case "map":
    case "streetview":
    case "images":
    case "video":
    case "audio":
    case "3d":
    case "website":
    case "embed":
    case "claim":
      return "blue";
    default:
      return "white";
  }
}

/** Second mark colour on each surface — never the surface colour itself. */
export const SECOND_MARK: Record<Surface, string> = {
  lime: C.blueDeep,
  white: C.blue,
  blue: C.lime,
  ink: C.lime,
};

/** Series ramp for charts with many series, per surface. Ink → second → accent → quiet. */
export function seriesRamp(surface: Surface): string[] {
  const quiet = surface === "lime" ? ["#FFFFFF", C.q1, C.q2, C.q3] : [C.limeDeep, C.q1, C.q2, C.q3];
  return [C.ink, SECOND_MARK[surface], C.orange, ...quiet];
}

/** Geometry — the card radius, and the inset/radius pair for anything nested in it. */
export const CARD_RADIUS = 36;
export const NEST_INSET = 12;
export const NEST_RADIUS = CARD_RADIUS - NEST_INSET;
export const PAD = 30;

// ─── Type ───────────────────────────────────────────────────────────────────

/** Display type: large, regular weight, tight — the reference's "Health Score". */
export function sizeFor(text: string, steps: [maxChars: number, px: number][], fallback: number): number {
  const n = text.length;
  for (const [max, px] of steps) if (n <= max) return px;
  return fallback;
}

export function Display({
  children,
  size,
  align = "left",
  lines = 2,
  color = C.ink,
  className = "",
  style,
}: {
  children: ReactNode;
  size: number;
  align?: "left" | "center";
  lines?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <h3
      className={`font-normal ${className}`}
      style={{
        fontFamily: PRIMARY,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: size >= 30 ? "-0.028em" : "-0.018em",
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

/** The small line under a display title — "5% more than last month". */
export function Kicker({
  children,
  align = "left",
  color = C.muted,
  icon,
  size = 15,
}: {
  children: ReactNode;
  align?: "left" | "center";
  color?: string;
  icon?: ReactNode;
  size?: number;
}) {
  return (
    <p
      className={`flex min-w-0 items-center gap-2 font-sans font-medium leading-snug ${
        align === "center" ? "justify-center text-center" : ""
      }`}
      style={{ fontSize: size, color }}
    >
      {icon}
      <span className="line-clamp-2 min-w-0">{children}</span>
    </p>
  );
}

/** The reference's tilted-square marker, used before a kicker that states a change. */
export function Diamond({ color = C.ink, size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <rect x="2.5" y="2.5" width="9" height="9" rx="2" transform="rotate(45 7 7)" fill={color} />
      <path d="M7 4.6v4.8M4.8 6.8 7 4.6l2.2 2.2" stroke={C.lime} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Initials in a circle — the stand-in for a person when there is no photo. */
export function Avatar({ name, bg = C.blue, size = 40, icon = false }: { name: string; bg?: string; size?: number; /** Mark the initials as iconography for the Elements scan. */ icon?: boolean }) {
  const initials = name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      {...(icon ? { "data-el-kind": "icon" } : {})}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-sans font-semibold"
      style={{ width: size, height: size, background: bg, color: C.ink, fontSize: size * 0.38 }}
    >
      {initials || "·"}
    </span>
  );
}

// ─── Titles ─────────────────────────────────────────────────────────────────

export interface TitleParts {
  /** "Phil Knight" in "Phil Knight: Defining Milestones". */
  lead?: string;
  head: string;
  /** "the things that actually kill campaigns" in "Clearances — the things…". */
  sub?: string;
  /** "1909–1927" in "Model T Price (1909–1927)". */
  range?: string;
}

/**
 * Titles carry two or three ideas joined by punctuation. Pulling them apart
 * lets each body give each part its own weight instead of one long line.
 */
export function splitTitle(title: string): TitleParts {
  let rest = title.trim();
  let range: string | undefined;
  const paren = rest.match(/\s*\(([^()]{2,24})\)\s*$/);
  if (paren) {
    range = paren[1];
    rest = rest.slice(0, paren.index).trim();
  }
  // "Nights booked, 2019–2025" / "Nike Net Income, FY2025" — a trailing span of years.
  const years = rest.match(/,\s*((?:FY)?\d{4}(?:\s*[–-]\s*(?:FY)?\d{2,4})?)$/);
  if (!range && years) {
    range = years[1];
    rest = rest.slice(0, years.index).trim();
  }
  let lead: string | undefined;
  const colon = rest.match(/^([^:]{2,32}):\s+(.+)$/);
  if (colon) {
    lead = colon[1]!.trim();
    rest = colon[2]!.trim();
  }
  let sub: string | undefined;
  const dash = rest.match(/^(.{2,}?)\s+(?:—|–|\|)\s+(.+)$/);
  if (dash) {
    rest = dash[1]!.trim();
    sub = dash[2]!.trim();
  }
  return { lead, head: rest, sub, range };
}

export function sentenceCase(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

// ─── Numbers ────────────────────────────────────────────────────────────────

const CURRENCY: Record<string, string> = { usd: "$", $: "$", eur: "€", "€": "€", gbp: "£", "£": "£", inr: "₹", "₹": "₹" };

export function compact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e9) return `${+(v / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B`;
  if (a >= 1e6) return `${+(v / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e4) return `${+(v / 1e3).toFixed(0)}K`;
  if (Number.isInteger(v)) return v.toLocaleString("en-US");
  return `${+v.toFixed(a < 10 ? 2 : 1)}`;
}

/** A value with its unit, written the way a person would say it. */
export function withUnit(v: number, unit?: string): string {
  const u = (unit ?? "").trim();
  const cur = CURRENCY[u.toLowerCase()];
  if (cur) return `${v < 0 ? "−" : ""}${cur}${compact(Math.abs(v))}`;
  if (u === "%" || u.startsWith("% ")) return `${compact(v)}%`;
  // "USD millions", "$M" and friends.
  const curLead = u.match(/^(usd|\$|eur|€|gbp|£|inr|₹)\s*(.*)$/i);
  if (curLead) {
    const sym = CURRENCY[curLead[1]!.toLowerCase()]!;
    const scale = curLead[2]!.toLowerCase();
    const suffix = /^(m|mn|million|millions)$/.test(scale) ? "M" : /^(b|bn|billion|billions)$/.test(scale) ? "B" : scale ? ` ${scale}` : "";
    return `${v < 0 ? "−" : ""}${sym}${compact(Math.abs(v))}${suffix}`;
  }
  return u ? `${compact(v)} ${u}` : compact(v);
}

/** First number in a spoken figure: "31.9%" → 31.9, "about 2,000" → 2000. */
export function parseFigure(s: string): number | null {
  // Only strings that open with the figure — "Only her, 1992–2002" is not 1992.
  if (!/^[~≈<>]?\s*[$€£₹]?\s*[-−]?\d/.test(s.trim())) return null;
  const m = s.replace(/,/g, "").replace("−", "-").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// ─── Layout helpers ─────────────────────────────────────────────────────────

/** Pixel size of an element, for SVG marks drawn to whatever box the body gets. */
export function useBox<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setBox((p) => (Math.abs(p.w - width) < 0.5 && Math.abs(p.h - height) < 0.5 ? p : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

/** Smooth path through points (monotone-ish Catmull-Rom → cubic Bézier). */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0]!.x},${pts[0]!.y}`;
  let d = `M${pts[0]!.x},${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
    const c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
    // Clamp control y between the segment ends so the curve never overshoots.
    const lo = Math.min(p1.y, p2.y);
    const hi = Math.max(p1.y, p2.y);
    c1.y = Math.min(hi, Math.max(lo, c1.y));
    c2.y = Math.min(hi, Math.max(lo, c2.y));
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
}

/** Scrolls when the artifact is live; clips when it is a preview tile. */
export function scrollClass(interactive: boolean): string {
  return interactive ? "overflow-auto" : "overflow-hidden";
}
