import { DM_Sans, Inter_Tight } from "next/font/google";
import type { CSSProperties } from "react";

/**
 * Frost's two fonts (Artifact Studio Style D): Inter Tight is the voice —
 * titles, hero figures, quotes — and DM Sans the workhorse. Not preloaded:
 * they download only on a canvas that wears Frost.
 */
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-sd",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--sf-dm-sans",
});

/** Class names that define the font variables on the Frost scope. */
export const FROST_FONT_CLASSES = `${interTight.variable} ${dmSans.variable}`;

/**
 * Variables the Style D bodies (and Frost CSS) resolve their pair through.
 * `--sf-inter-tight` is the studio's alias for Inter Tight; the
 * `--frost-font-*` pair is for CSS-styled surfaces (cards, menus, groups).
 */
export const FROST_FONT_VARS = {
  "--sf-inter-tight": "var(--font-sd)",
  "--frost-font-primary": "var(--font-sd), 'Helvetica Neue', Helvetica, ui-sans-serif, system-ui, sans-serif",
  "--frost-font-secondary": "var(--sf-dm-sans), ui-sans-serif, system-ui, sans-serif",
} as CSSProperties;
