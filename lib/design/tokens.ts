/**
 * Flowstate visual design tokens — single source of truth.
 * Consumed by tailwind.config.ts and runtime fallbacks in components/lib.
 * See docs/design-system/README.md.
 */

/** Primitive canvas palette */
export const canvasColors = {
  bg: "#FAFAF8",
  dot: "#8B8A86",
  card: "#FFFFFF",
  border: "#E6E4DF",
  ink: "#2C2A26",
  muted: "#8A867E",
  accent: "#6B4EFF",
  artifactIconBg: "#EDE9FE",
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
  mapPrimary: "#6B4EFF",
  mapSaved: "#d97706",
  tagDanger: "#be123c",
  tagDangerSoft: "#fff1f2",
  tagDangerRing: "#fecdd3",
} as const;

export const CANVAS_ACCENT = canvasColors.accent;
export const CANVAS_CONNECTOR = canvasColors.connector;
export const CANVAS_BG = canvasColors.bg;
export const CANVAS_DOT = canvasColors.dot;

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

/** Corner radii */
export const canvasRadii = {
  canvas: "12px",
  sm: "8px",
  xs: "2px",
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

/** Typography scale — [size, { lineHeight }] for Tailwind fontSize */
export const canvasFontSize = {
  micro: ["10px", { lineHeight: "1.4" }] as [string, { lineHeight: string }],
  caption: ["11px", { lineHeight: "1.45" }] as [string, { lineHeight: string }],
  compact: ["12px", { lineHeight: "1.5" }] as [string, { lineHeight: string }],
  "body-sm": ["13px", { lineHeight: "1.5" }] as [string, { lineHeight: string }],
  body: ["14px", { lineHeight: "1.55" }] as [string, { lineHeight: string }],
  "body-lg": ["15px", { lineHeight: "1.5" }] as [string, { lineHeight: string }],
  heading: ["18px", { lineHeight: "1.35" }] as [string, { lineHeight: string }],
  brand: ["22.5px", { lineHeight: "1.2" }] as [string, { lineHeight: string }],
  display: ["52px", { lineHeight: "1.05", letterSpacing: "-0.02em" }] as [
    string,
    { lineHeight: string; letterSpacing: string },
  ],
};
