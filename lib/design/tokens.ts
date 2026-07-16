/**
 * Flowstate visual design tokens — single source of truth.
 * Consumed by tailwind.config.ts and runtime fallbacks in components/lib.
 * See docs/design-system/README.md.
 */

/** Primitive canvas palette */
export const canvasColors = {
  bg: "#F0F0F0",
  dot: "#8B8A86",
  card: "#FFFFFF",
  border: "#E6E4DF",
  ink: "#2C2A26",
  /** AA on bg (4.65:1) and card (5.30:1) — do not lighten past #7A766E. */
  muted: "#6F6B63",
  /** Primary brand cobalt (matches the logo mark) — selected/active states. */
  accent: "#2066EB",
  /** Soft accent tint — selected-row/toggle fills (withLightness 0.93/0.9). */
  accentSoft: "#E0E9FA",
  /** Text/icons on solid accent fills — AA against `accent` in both modes. */
  onAccent: "#FFFFFF",
  secondary: "#5B7FD6",
  tertiary: "#D97706",
  artifactIconBg: "#E0E9FA",
  artifactStage: "#F3F2EF",
  connector: "#B8B5AE",
  plugFill: "#F7F6F3",
  stageDark: "#1a1a1a",
  codeBg: "#f4f4f5",
  /** Syntax highlight (code artifacts) */
  syntaxComment: "#116329",
  syntaxString: "#953800",
  syntaxKeyword: "#0550AE",
  /** Semantic — status & feedback */
  danger: "#dc2626",
  /** Text/icons on solid danger fills — AA against `danger` in both modes. */
  onDanger: "#FFFFFF",
  dangerSoft: "#fef2f2",
  dangerBorder: "#fecaca",
  success: "#10b981",
  successText: "#047857",
  successSoft: "#ecfdf5",
  successRing: "#a7f3d0",
  warning: "#b45309",
  warningSoft: "#fffbeb",
  warningRing: "#fde68a",
  warningText: "#92400e",
  info: "#0284c7",
  infoText: "#0369a1",
  infoSoft: "#f0f9ff",
  infoRing: "#bae6fd",
  /** Map marker pins */
  mapPrimary: "#2066EB",
  mapSaved: "#d97706",
  tagDanger: "#be123c",
  tagDangerSoft: "#fff1f2",
  tagDangerRing: "#fecdd3",
  /** Neobrutalism pack (lib/design/style) — loud, flat, opaque. */
  brutCanvas: "#FFF4CF",
  brutInk: "#000000",
  brutPop: "#FF4081",
  brutSun: "#FFEB3B",
} as const;

/**
 * Dark theme palette. Tuned against Material Design and Apple HIG dark-mode
 * guidance: warm near-black surfaces (never pure black), off-white text
 * (never pure white) to reduce halation, elevation via progressively lighter
 * surfaces, and lightened/desaturated accents + status hues for AA contrast.
 */
export const darkCanvasColors: Record<keyof typeof canvasColors, string> = {
  bg: "#181715",
  dot: "#3A3833",
  card: "#211F1C",
  border: "#34322D",
  ink: "#ECEAE3",
  muted: "#A8A29A",
  accent: "#2066EB",
  accentSoft: "#1F2D47",
  /** Brand primary on dark; white text/icons clear AA (5.05:1) on this blue. */
  onAccent: "#FFFFFF",
  secondary: "#8EA6E0",
  tertiary: "#F5A447",
  artifactIconBg: "#1F2D47",
  artifactStage: "#1E1D1A",
  connector: "#4E4B45",
  plugFill: "#1E1D1A",
  stageDark: "#0F0F0E",
  codeBg: "#1C1B1A",
  syntaxComment: "#8B949E",
  syntaxString: "#A5D6FF",
  syntaxKeyword: "#FF7B72",
  danger: "#F87171",
  /** Dark danger is a light red — near-black text keeps AA on solid fills. */
  onDanger: "#181715",
  dangerSoft: "#2A1818",
  dangerBorder: "#5C2A2A",
  success: "#34D399",
  successText: "#6EE7B7",
  successSoft: "#11261F",
  successRing: "#1F5C45",
  warning: "#FBBF24",
  warningSoft: "#2A2114",
  warningRing: "#5C4A1F",
  warningText: "#FCD34D",
  info: "#38BDF8",
  infoText: "#7DD3FC",
  infoSoft: "#14222A",
  infoRing: "#1F4A5C",
  mapPrimary: "#2066EB",
  mapSaved: "#FBBF24",
  tagDanger: "#FB7185",
  tagDangerSoft: "#2A1620",
  tagDangerRing: "#5C2A3A",
  brutCanvas: "#191324",
  brutInk: "#F2ECDF",
  brutPop: "#FF7AA8",
  brutSun: "#3A2F55",
};

/** "#RRGGBB" -> "R G B" space-separated channels for `rgb(var(--x) / a)`. */
export function hexToRgbChannels(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Maps a palette to `--canvas-*` CSS variable channel strings. */
function toThemeVars(palette: Record<string, string>): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette)) {
    const name = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    vars[`--canvas-${name}`] = hexToRgbChannels(value);
  }
  return vars;
}

export const lightThemeVars = toThemeVars(canvasColors);
export const darkThemeVars = toThemeVars(darkCanvasColors);

/**
 * Runtime color constants resolve through CSS variables so JS-driven
 * rendering (canvas backgrounds, SVG connectors) follows the active theme.
 */
export const CANVAS_ACCENT = "rgb(var(--canvas-accent))";
export const CANVAS_CONNECTOR = "rgb(var(--canvas-connector))";
export const CANVAS_BG = "rgb(var(--canvas-bg))";
export const CANVAS_DOT = "rgb(var(--canvas-dot))";

/** Thread accent palette — cycles per thread (OQ-01); first entry matches UI accent */
export const THREAD_ACCENT_PALETTE = [
  canvasColors.accent,
  "#FF8FA3",
  "#6FCF97",
  "#F2C94C",
  "#BB6BD9",
  "#56CCF2",
  "#F2994A",
  "#9B51E0",
] as const;

/**
 * Corner radius scale — a single tweakable base (px) drives every tier
 * through CSS variables (see globals.css / ThemeProvider). Tiers:
 * - xs: fixed 2px (resize handles, minimap)
 * - sm: 0.6× base (compact overlays, chips)
 * - md: 1× base (buttons, inputs, menu rows)
 * - lg: 1.4× base (panels, popovers, artifact windows)
 * - inner: lg − chrome padding, clamped (nested/clipped chrome, e.g. collapsed toolbar)
 */
export const canvasRadiusBasePx = 10;
export const canvasRadiusFactors = { sm: 0.6, md: 1, lg: 1.4 } as const;

export function resolveRadiusPx(
  step: keyof typeof canvasRadiusFactors | "xs",
  base: number = canvasRadiusBasePx,
): number {
  if (step === "xs") return 2;
  return Math.round(base * canvasRadiusFactors[step]);
}

/** Corner radii — resolve through CSS vars so the base is runtime-tweakable. */
export const canvasRadii = {
  canvas: "var(--canvas-radius-lg)",
  lg: "var(--canvas-radius-lg)",
  md: "var(--canvas-radius-md)",
  sm: "var(--canvas-radius-sm)",
  xs: "var(--canvas-radius-xs)",
  inner: "var(--canvas-radius-inner)",
} as const;

/**
 * Padding for floating canvas chrome (side panels, bottom toolbar shell).
 * Tailwind: p-3 (12px). Use class `floating-chrome-padding` in globals.css.
 */
export const canvasFloatingChrome = {
  padding: "12px",
  gap: "8px",
  /** Compact logo in collapsed left panel */
  brandIcon: "28px",
  /** Footer chips (auth, save status) in expanded panels */
  chipText: "body-sm" as const,
} as const;

/**
 * Canvas inset scale (px). See lib/design/canvasInsets.ts for usage.
 * - compact: asset chips, floating chrome
 * - section: Q&A blocks, panel bodies, artifact chrome reveal
 */
export const canvasSpacing = {
  compact: 12,
  section: 16,
} as const;

/**
 * Typography scale — [size, { lineHeight }] for Tailwind fontSize.
 * Consolidated to 7 distinct sizes (11/12/13/14/18/22/52). `micro` and
 * `body-lg` are retained as aliases of `caption` and `body` so existing
 * call sites keep working while the scale stays meaningful.
 */
export const canvasFontSize = {
  micro: ["11px", { lineHeight: "1.45" }] as [string, { lineHeight: string }],
  caption: ["11px", { lineHeight: "1.45" }] as [string, { lineHeight: string }],
  compact: ["12px", { lineHeight: "1.5" }] as [string, { lineHeight: string }],
  "body-sm": ["13px", { lineHeight: "1.5" }] as [string, { lineHeight: string }],
  body: ["14px", { lineHeight: "1.55" }] as [string, { lineHeight: string }],
  "body-lg": ["14px", { lineHeight: "1.55" }] as [string, { lineHeight: string }],
  heading: ["18px", { lineHeight: "1.35" }] as [string, { lineHeight: string }],
  brand: ["22px", { lineHeight: "1.2" }] as [string, { lineHeight: string }],
  display: ["52px", { lineHeight: "1.05", letterSpacing: "-0.02em" }] as [
    string,
    { lineHeight: string; letterSpacing: string },
  ],
};
