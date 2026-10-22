"use client";

import { createContext, useContext, type CSSProperties } from "react";
import type { ArtifactCategoryId } from "@/lib/design/theme/types";

/**
 * The kit — what the eight themed style families share.
 *
 * A family is two things:
 *   a Look   — its discrete rules: geometry, type, the shape of a bar, a chip,
 *              a rule, a legend swatch. One per family; themes never change it.
 *   Themes   — three colour systems per family, each a complete set of the
 *              same named colours (field, card, ink, accent, series…), and
 *              each decided twice: once for light mode, once for dark.
 *
 * The frame writes the active theme into CSS variables on the card root
 * (`--k-ink`, `--k-accent`, …) and provides the Look through context, so one
 * set of bodies draws every family: the Look decides *how* a table rules its
 * rows or a chart ends its bars, the theme decides what colour they are.
 */

export interface ThemeVars {
  /** The ground the cards sit on. */
  field: string;
  /** Card surface and a second, quieter surface for wells inside it. */
  card: string;
  well: string;
  ink: string;
  muted: string;
  faint: string;
  hair: string;
  /** The one accent: the peak, the next item, the live thing. */
  accent: string;
  accentInk: string;
  /** Header surface and the ink set on it (families with a header band). */
  head: string;
  headInk: string;
  /** Chart series, first to last. At least five. */
  series: string[];
  pos: string;
  neg: string;
  /** Families that colour by kind map each visual family to a colour here. */
  cat?: Partial<Record<ArtifactCategoryId, string>>;
  /** Ink to set on a `cat` colour (defaults to `ink`). */
  catInk?: Partial<Record<ArtifactCategoryId, string>>;
}

export interface StyleTheme {
  id: string;
  name: string;
  /** How this theme relates to the family's others: "tints of one blue", "vivid"… */
  hint: string;
  /** The theme in light mode. */
  vars: ThemeVars;
  /** The same theme in dark mode — every colour decided again, the rules unchanged. */
  dark: ThemeVars;
}

/** The colours a theme draws with in a mode. */
export function themeVarsOf(theme: StyleTheme, mode: "light" | "dark" | undefined): ThemeVars {
  return mode === "dark" ? theme.dark : theme.vars;
}

/** The board a theme's cards sit on, with label inks that read on it. */
export function fieldBackdrop(vars: ThemeVars): { background: string; ink: string; muted: string } {
  const dark = isDarkHex(vars.field);
  return { background: vars.field, ink: dark ? "#F5F5F2" : vars.ink, muted: dark ? "rgba(245,245,242,0.62)" : vars.muted };
}

function isDarkHex(hex: string): boolean {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return false;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

export interface Look {
  /** Card radius, the radius of anything nested one inset in, and the body padding. */
  radius: number;
  nest: number;
  pad: number;
  font: {
    display: string;
    body: string;
    mono: string;
    displayWeight: number;
    displayTracking: string;
    /** Micro labels (column heads, kickers): tracked caps or plain. */
    labelCase: "upper" | "none";
    numberWeight: number;
  };
  /** How a bar ends. `cap` adds a contrasting cap on top (the fintech bento). */
  bar: "pill" | "square" | "cap" | "outline";
  /** Legend swatch shape. */
  legend: "dot" | "square" | "dash";
  /** Row separators. */
  rule: "hair" | "dashed" | "thick" | "none";
  /** Tags, status chips, file tabs. */
  chip: "pill" | "block" | "outline";
  /** Outline width on outlined marks (bars, slices, chips). */
  stroke: number;
  /** Fill chart shapes with a hatch pattern instead of solid colour. */
  hatch?: boolean;
  /**
   * Top padding of every body, overriding each body's own. Set it to 0 when
   * the header alone should carry the gap to the content (Capsule's pill).
   */
  bodyTop?: number;
}

/** A body's top padding: the Look's override, else the body's own. */
export const padTop = (look: Look, own: number) => look.bodyTop ?? own;

export const LookContext = createContext<Look | null>(null);

export function useLook(): Look {
  const look = useContext(LookContext);
  if (!look) throw new Error("useLook: no LookContext — bodies must render inside a kit Frame");
  return look;
}

/** The theme's colours as CSS custom properties for a card root. */
export function themeStyle(vars: ThemeVars, category: ArtifactCategoryId): CSSProperties {
  const cat = vars.cat?.[category] ?? vars.accent;
  const catInk = vars.catInk?.[category] ?? (vars.cat?.[category] ? vars.ink : vars.accentInk);
  const out: Record<string, string> = {
    "--k-field": vars.field,
    "--k-card": vars.card,
    "--k-well": vars.well,
    "--k-ink": vars.ink,
    "--k-muted": vars.muted,
    "--k-faint": vars.faint,
    "--k-hair": vars.hair,
    "--k-accent": vars.accent,
    "--k-accent-ink": vars.accentInk,
    "--k-head": vars.head,
    "--k-head-ink": vars.headInk,
    "--k-pos": vars.pos,
    "--k-neg": vars.neg,
    "--k-cat": cat,
    "--k-cat-ink": catInk,
  };
  vars.series.forEach((c, i) => (out[`--k-s${i}`] = c));
  for (let i = vars.series.length; i < 8; i++) out[`--k-s${i}`] = vars.series[i % vars.series.length]!;
  return out as CSSProperties;
}

/** Colour tokens as var() strings — what bodies paint with. */
export const V = {
  field: "var(--k-field)",
  card: "var(--k-card)",
  well: "var(--k-well)",
  ink: "var(--k-ink)",
  muted: "var(--k-muted)",
  faint: "var(--k-faint)",
  hair: "var(--k-hair)",
  accent: "var(--k-accent)",
  accentInk: "var(--k-accent-ink)",
  head: "var(--k-head)",
  headInk: "var(--k-head-ink)",
  pos: "var(--k-pos)",
  neg: "var(--k-neg)",
  cat: "var(--k-cat)",
  catInk: "var(--k-cat-ink)",
  s: (i: number) => `var(--k-s${i % 8})`,
} as const;

/**
 * Type rules every kit family keeps: all text is medium (500) and set in the
 * surface's strongest ink (`V.ink`, or the contrasting ink of a chip / accent
 * surface) — hierarchy comes from size and position, never from grey or alpha.
 * `muted`, `faint` and `hair` are for lines, tracks and placeholders only.
 */
export const TEXT_WEIGHT = 500;

/** The micro-label style every family shares, cased per Look. */
export function labelStyle(look: Look, size = 13, color: string = V.ink): CSSProperties {
  return {
    fontFamily: look.font.body,
    fontSize: size,
    fontWeight: TEXT_WEIGHT,
    color,
    letterSpacing: look.font.labelCase === "upper" ? "0.08em" : "0",
    textTransform: look.font.labelCase === "upper" ? "uppercase" : "none",
    lineHeight: 1.2,
  };
}

export function ruleStyle(look: Look, color: string = V.hair): CSSProperties {
  switch (look.rule) {
    case "dashed":
      return { borderTop: `1.5px dashed ${color}` };
    case "thick":
      return { borderTop: `2px solid ${V.ink}` };
    case "none":
      return {};
    default:
      return { borderTop: `1px solid ${color}` };
  }
}

export function chipStyle(look: Look, bg: string, fg: string): CSSProperties {
  switch (look.chip) {
    case "block":
      return { background: bg, color: fg, borderRadius: 4, border: `${look.stroke}px solid ${V.ink}`, boxShadow: `2px 2px 0 ${V.ink}` };
    case "outline":
      return { background: "transparent", color: fg === V.ink ? V.ink : bg, borderRadius: 999, border: `${look.stroke}px solid ${bg}` };
    default:
      return { background: bg, color: fg, borderRadius: 999 };
  }
}

/** Legend swatch per Look. */
export function Swatch({ color, size = 14 }: { color: string; size?: number }) {
  const look = useLook();
  if (look.legend === "dash") return <span className="inline-block shrink-0" style={{ width: size + 6, height: 3, background: color, borderRadius: 2 }} />;
  return (
    <span
      className="inline-block shrink-0"
      style={{
        width: size,
        height: size,
        background: look.hatch ? "transparent" : color,
        borderRadius: look.legend === "dot" ? 999 : 2,
        boxShadow: look.legend === "square" && look.stroke >= 2 ? `inset 0 0 0 ${look.stroke}px ${V.ink}` : look.hatch ? `inset 0 0 0 1.5px ${color}` : undefined,
        backgroundImage: look.hatch ? `repeating-linear-gradient(135deg, ${color} 0 1.5px, transparent 1.5px 4px)` : undefined,
      }}
    />
  );
}
