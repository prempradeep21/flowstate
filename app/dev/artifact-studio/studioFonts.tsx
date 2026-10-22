import type { CSSProperties, ReactNode } from "react";
import {
  DM_Sans,
  Fraunces,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Instrument_Serif,
  Inter_Tight,
  JetBrains_Mono,
  Manrope,
  Newsreader,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";
import { denton } from "@/lib/fonts/denton";
import { satoshi } from "@/lib/fonts/satoshi";

/**
 * The fonts every style family can draw with (styles/fonts.ts), loaded once
 * and exposed as `--sf-*` variables. The studio layout wraps its page in
 * {@link StudioFontScope}; anything else that renders studio artifacts
 * outside the studio (the demo-video scenes) wraps itself the same way.
 */

/** Style D's neo-grotesk — the reference's light, tightly set Helvetica feel. */
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sd" });

// The rest of the font menu in styles/fonts.ts (Figtree, Parkinsans, Archivo,
// Denton and Satoshi come from the root layout).
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--sf-dm-sans" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--sf-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--sf-space-grotesk" });
const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--sf-geist" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", variable: "--sf-fraunces" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", display: "swap", variable: "--sf-instrument-serif" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--sf-playfair" });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", variable: "--sf-newsreader" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--sf-geist-mono" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--sf-jetbrains-mono" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--sf-ibm-plex-mono" });

export const STUDIO_FONT_CLASSES = [
  interTight, denton, satoshi, dmSans, manrope, spaceGrotesk, geist, fraunces,
  instrumentSerif, playfair, newsreader, geistMono, jetbrainsMono, plexMono,
].map((f) => f.variable).join(" ");

/**
 * Resolved here, once, so an artifact can re-point the app's own font
 * variables at its pair (styles/fonts.ts) without a var() cycle.
 */
export const STUDIO_FONT_ALIASES = {
  "--sf-figtree": "var(--font-figtree)",
  "--sf-parkinsans": "var(--font-parkinsans)",
  "--sf-archivo": "var(--font-archivo)",
  "--sf-denton": "var(--font-denton)",
  "--sf-satoshi": "var(--font-satoshi)",
  "--sf-inter-tight": "var(--font-sd)",
} as CSSProperties;

/**
 * Headings default to the primary (the real node chrome's title is a bare h2);
 * code and anything set mono stays inside the artifact's two fonts.
 */
export const STUDIO_PAIR_CSS = [
  `:where([data-studio-fonts]) :where(h1, h2, h3, h4) { font-family: var(--studio-font-primary); }`,
  `[data-studio-fonts] :is(pre, code, kbd, samp, .font-mono) { font-family: var(--studio-font-secondary); }`,
].join("\n");

/** Everything inside can draw any family in its own fonts. */
export function StudioFontScope({ className = "", style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`${STUDIO_FONT_CLASSES} ${className}`} style={{ ...STUDIO_FONT_ALIASES, ...style }}>
      <style>{STUDIO_PAIR_CSS}</style>
      {children}
    </div>
  );
}
