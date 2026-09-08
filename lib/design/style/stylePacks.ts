import { canvasColors, darkCanvasColors } from "@/lib/design/tokens";
import type {
  ArtifactStyleCategoryTones,
  ArtifactStylePreset,
} from "@/lib/design/style/types";
import type { ArtifactCategoryId } from "@/lib/design/theme/types";

/**
 * Artifact style pack registry. Packs are add-only: a new visual language
 * (from a new reference) is a new entry here plus a scoped rule block in
 * app/styles/artifact-styles.css — no component changes.
 */

export const DEFAULT_ARTIFACT_STYLE_ID = "vanilla";

/**
 * Vanilla documents the current factory look (ground truth for a future
 * full-token refactor). It is never resolved into CSS — the resolver
 * short-circuits so vanilla stays a structural no-op.
 */
const VANILLA: ArtifactStylePreset = {
  id: DEFAULT_ARTIFACT_STYLE_ID,
  name: "Vanilla",
  description: "The current Flowstate look — quiet chrome revealed on hover.",
  strokeWidth: "1px",
  radius: "var(--canvas-radius-md)",
  controlStrokeWidth: "1px",
  checkboxStrokeWidth: "1px",
  pillRadius: "999px",
  density: 1,
  showKindLabel: false,
  selectedRing: "none",
  selectedChin: "none",
  tilt: "0deg",
  hoverLift: "0px, 0px",
  pressPush: "0px, 0px",
  light: {
    cardFill: "#FFFFFF",
    stroke: "#E6E4DF",
    ambientShadow: "var(--canvas-artifact-shadow)",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: "none",
    canvasBg: null,
    canvasDot: null,
    hardShadow: "none",
  },
  dark: {
    cardFill: darkCanvasColors.card,
    stroke: darkCanvasColors.border,
    ambientShadow: "var(--canvas-artifact-shadow)",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: "none",
    canvasBg: null,
    canvasDot: null,
    hardShadow: "none",
  },
};

/**
 * Neo — the marketing-landing language (public/landing/css/style.css):
 * ink wire strokes, solid no-blur chin, 14px corners, cream card fill,
 * cobalt #2066EB accent reserved for selected/active/highlight states.
 * Dark tokens are machine-derived placeholders (light-first), tuned later.
 */
const NEO: ArtifactStylePreset = {
  id: "neo",
  name: "Neo",
  description:
    "Landing-page language — ink strokes, solid chin shadows, cobalt accents.",
  accent: "#2066EB",
  strokeWidth: "1.6px",
  radius: "14px",
  controlStrokeWidth: "1.3px",
  checkboxStrokeWidth: "1.4px",
  pillRadius: "999px",
  density: 1,
  showKindLabel: true,
  selectedRing: "0 0 0 4px rgb(var(--canvas-accent) / 0.16)",
  selectedChin: "0 2px 0 rgb(var(--canvas-accent-deep) / 0.55)",
  tilt: "0deg",
  hoverLift: "0px, 0px",
  pressPush: "0px, 0px",
  light: {
    cardFill: "#F4F3EE",
    stroke: "#232323",
    ambientShadow: "0 10px 28px rgba(16, 16, 16, 0.14)",
    chinShadow: "0 2px 0 rgba(16, 16, 16, 0.5)",
    headerBg: "rgba(255, 255, 255, 0.5)",
    headerRule: "1.4px solid rgba(16, 16, 16, 0.55)",
    canvasBg: null,
    canvasDot: null,
    hardShadow: "none",
  },
  dark: {
    cardFill: darkCanvasColors.card,
    stroke: darkCanvasColors.ink,
    ambientShadow: "0 10px 28px rgba(0, 0, 0, 0.5)",
    chinShadow: "0 2px 0 rgba(0, 0, 0, 0.55)",
    headerBg: "rgba(255, 255, 255, 0.06)",
    headerRule: "1.4px solid rgba(236, 234, 227, 0.4)",
    canvasBg: null,
    canvasDot: null,
    hardShadow: "none",
  },
};

/**
 * Brut — neobrutalism: thick pure-black borders, hard zero-blur offset
 * shadows, flat opaque fills, and per-category loud sticker headers (colored
 * in app/styles/artifact-styles.css). The canvas backdrop is left to the
 * active theme (no pack recolor). Cards tilt a hair and physically lift on
 * hover / press down on click (the three-pillar formula: hard shadows, bold
 * borders, high contrast). Dark mode swaps ink for bone white and shadows for
 * hot pink.
 */
const NEOBRUTALISM: ArtifactStylePreset = {
  id: "neobrutalism",
  name: "Brut",
  description:
    "Neobrutalism — thick ink borders, hard offset shadows, loud flat color.",
  accent: canvasColors.brutPop,
  strokeWidth: "3px",
  radius: "4px",
  controlStrokeWidth: "2px",
  checkboxStrokeWidth: "2.5px",
  pillRadius: "4px",
  density: 1,
  showKindLabel: true,
  selectedRing: "0 0 0 3px rgb(var(--canvas-accent))",
  selectedChin: "8px 8px 0 rgb(var(--canvas-accent-deep))",
  tilt: "-0.5deg",
  hoverLift: "-2px, -2px",
  pressPush: "2px, 2px",
  light: {
    cardFill: "#FFFFFF",
    stroke: canvasColors.brutInk,
    ambientShadow: "none",
    chinShadow: "none",
    headerBg: canvasColors.brutSun,
    headerRule: `3px solid ${canvasColors.brutInk}`,
    canvasBg: null,
    canvasDot: null,
    hardShadow: `6px 6px 0 ${canvasColors.brutInk}`,
  },
  dark: {
    cardFill: "#241F35",
    stroke: darkCanvasColors.brutInk,
    ambientShadow: "none",
    chinShadow: "none",
    headerBg: darkCanvasColors.brutSun,
    headerRule: `3px solid ${darkCanvasColors.brutInk}`,
    canvasBg: null,
    canvasDot: null,
    hardShadow: `6px 6px 0 ${darkCanvasColors.brutPop}`,
  },
};

/**
 * Liquid Glass — Apple's WWDC 2025 material: translucent blurred glass with
 * specular edge highlights and large continuous corners. Fill hexes carry no
 * alpha (token contract) — translucency composes at consumption via
 * cardFillAlpha; the blur lives on --canvas-artifact-backdrop-filter and is
 * applied on exactly one element per node. No pack accent: glass adapts to
 * the active theme accent. The canvas backdrop is tinted (cool blue-grey /
 * deep charcoal) so the blur and saturation have content to refract.
 */
const LIQUID_GLASS: ArtifactStylePreset = {
  id: "liquid-glass",
  name: "Liquid Glass",
  description:
    "Apple-style liquid glass — translucent blurred material, specular edges, continuous corners.",
  backdropFilter: "blur(20px) saturate(1.7)",
  strokeWidth: "1px",
  radius: "24px",
  controlStrokeWidth: "1px",
  checkboxStrokeWidth: "1.5px",
  pillRadius: "999px",
  density: 1,
  showKindLabel: false,
  selectedRing: "0 0 0 3px rgb(var(--canvas-accent) / 0.38)",
  selectedChin: "none",
  tilt: "0deg",
  hoverLift: "0px, 0px",
  pressPush: "0px, 0px",
  light: {
    cardFill: "#F7FAFF",
    cardFillAlpha: 0.55,
    stroke: "#FFFFFF",
    ambientShadow:
      "0 12px 32px rgba(24, 39, 75, 0.16), 0 2px 8px rgba(24, 39, 75, 0.08)",
    chinShadow: "none",
    innerHighlight:
      "inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.3)",
    headerBg: "rgba(255, 255, 255, 0.35)",
    headerRule: "1px solid rgba(255, 255, 255, 0.55)",
    canvasBg: "#DDE5EF",
    canvasDot: "#93A0B4",
    hardShadow: "none",
  },
  dark: {
    cardFill: "#232A36",
    cardFillAlpha: 0.5,
    stroke: "#8A93A6",
    ambientShadow:
      "0 12px 32px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35)",
    chinShadow: "none",
    innerHighlight:
      "inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
    headerBg: "rgba(255, 255, 255, 0.06)",
    headerRule: "1px solid rgba(255, 255, 255, 0.12)",
    canvasBg: "#101319",
    canvasDot: "#3A4252",
    hardShadow: "none",
  },
};

/* -------------------------------------------------------------------------- */
/* Color-led packs                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Bento — the solid tonal system (nue / finance-bento references). One hue
 * per artifact category, and EVERY card is that hue at full strength, header
 * band included: a saturated fill edge to edge with light ink and huge type.
 * There is no pale card role any more — `pale` / `ink` / `muted` stay in the
 * table as the derivation source for hairlines, stages and the contrast test,
 * but app/styles/artifact-styles.css binds every node to the solid pair.
 * Anything painted ON a card (chips, table head, step blocks, rules) inverts
 * to the on-solid tone. All solids share L≈0.36 so eight hues still read as
 * one family; dark mode brightens them and flips the ink to a deep tint of
 * the hue. Every text pair is AA-checked in stylePacks.contrast.test.
 */
const BENTO_LIGHT_CATEGORIES: Record<ArtifactCategoryId, ArtifactStyleCategoryTones> = {
  data:      { solid: "#2B5BE0", onSolid: "#FFFFFF", onSolidMuted: "#E1E8FB", pale: "#E3E9FC", ink: "#17265C", muted: "#4A5A8E", vivid: "#2B5BE0" },
  viz:       { solid: "#0E7C9A", onSolid: "#FFFFFF", onSolidMuted: "#FAFCFD", pale: "#DCF1F7", ink: "#0B3A48", muted: "#3B6A78", vivid: "#0E7C9A" },
  geo:       { solid: "#1F7A4C", onSolid: "#FFFFFF", onSolidMuted: "#E9F2ED", pale: "#DDF3E6", ink: "#123D2A", muted: "#3C6B52", vivid: "#1F7A4C" },
  media:     { solid: "#C93D36", onSolid: "#FFFFFF", onSolidMuted: "#FDF7F7", pale: "#FBE3E0", ink: "#5A1F1B", muted: "#8A4540", vivid: "#C93D36" },
  docs:      { solid: "#F2C230", onSolid: "#2B2105", onSolidMuted: "#57440E", pale: "#FBF0C8", ink: "#4A3708", muted: "#7A5E14", vivid: "#F2C230" },
  dev:       { solid: "#4B5563", onSolid: "#FFFFFF", onSolidMuted: "#D7DADD", pale: "#E7EAEF", ink: "#1F2937", muted: "#4B5563", vivid: "#4B5563" },
  planning:  { solid: "#C92C6D", onSolid: "#FFFFFF", onSolidMuted: "#FCF2F6", pale: "#FCE4EF", ink: "#5C1435", muted: "#8E3560", vivid: "#C92C6D" },
  discourse: { solid: "#5B2DEE", onSolid: "#FFFFFF", onSolidMuted: "#DBD1FB", pale: "#EAE4FB", ink: "#2A1A6E", muted: "#5A4A9E", vivid: "#5B2DEE" },
};

const BENTO_DARK_CATEGORIES: Record<ArtifactCategoryId, ArtifactStyleCategoryTones> = {
  data:      { solid: "#4F7BFF", onSolid: "#0A1235", onSolidMuted: "#0D163D", pale: "#1C2340", ink: "#DCE4FF", muted: "#A4B2E6", vivid: "#4F7BFF" },
  viz:       { solid: "#22B0D3", onSolid: "#06232B", onSolidMuted: "#0B3C49", pale: "#16303A", ink: "#D6F1F9", muted: "#93C6D6", vivid: "#22B0D3" },
  geo:       { solid: "#34B57A", onSolid: "#06241A", onSolidMuted: "#0E3E2B", pale: "#173229", ink: "#D6F5E4", muted: "#93CDB0", vivid: "#34B57A" },
  media:     { solid: "#F0655C", onSolid: "#3A0E0B", onSolidMuted: "#4C1713", pale: "#3A2220", ink: "#FBE0DD", muted: "#E2A39E", vivid: "#F0655C" },
  docs:      { solid: "#F5C842", onSolid: "#2B2105", onSolidMuted: "#574612", pale: "#3A3116", ink: "#FBF0C8", muted: "#D9C27A", vivid: "#F5C842" },
  dev:       { solid: "#8B96A8", onSolid: "#0F141B", onSolidMuted: "#252B34", pale: "#262B33", ink: "#E5E9EF", muted: "#AEB6C2", vivid: "#8B96A8" },
  planning:  { solid: "#F0569A", onSolid: "#3A0B21", onSolidMuted: "#49112B", pale: "#3A1E2C", ink: "#FCE0EC", muted: "#E39EBF", vivid: "#F0569A" },
  discourse: { solid: "#8B6BFF", onSolid: "#140A3A", onSolidMuted: "#1B1046", pale: "#2A2344", ink: "#EAE4FB", muted: "#B9ACE8", vivid: "#8B6BFF" },
};

const BENTO: ArtifactStylePreset = {
  id: "bento",
  name: "Bento",
  description:
    "Tonal bento — every card is one solid category color, edge to edge, no strokes.",
  strokeWidth: "0px",
  radius: "36px",
  controlStrokeWidth: "0px",
  checkboxStrokeWidth: "2px",
  pillRadius: "999px",
  density: 1,
  showKindLabel: true,
  // Selected ring is category-toned, so it lives in the stylesheet (per-node
  // --art-* vars are out of scope for pack tokens).
  selectedRing: "none",
  selectedChin: "none",
  tilt: "0deg",
  hoverLift: "0px, -1px",
  pressPush: "0px, 0px",
  typography: {
    // One face per canvas: display + eyebrow inherit the canvas font.
    displayFamily: "inherit",
    displayWeight: "700",
    displayTracking: "-0.03em",
    displaySize: "120px",
    quoteSize: "30px",
    eyebrowFamily: "inherit",
    eyebrowTracking: "0.08em",
  },
  previewSwatches: ["#5B2DEE", "#0E7C9A", "#F2C230"],
  light: {
    cardFill: "#E3E9FC",
    stroke: "#D6D5DE",
    ambientShadow:
      "0 8px 24px rgba(30, 25, 80, 0.10), 0 1px 2px rgba(30, 25, 80, 0.06)",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: "none",
    canvasBg: "#DCDBE4",
    canvasDot: "#9B99AA",
    hardShadow: "none",
    categories: BENTO_LIGHT_CATEGORIES,
    surfaceBorder: "#D6D5DE",
    canvasConnector: "#8E8C9E",
    chart: {
      series: ["#0E7C9A", "#2B5BE0", "#5B2DEE", "#C92C6D", "#F2C230", "#1F7A4C", "#C93D36"],
      ink: "#0B3A48",
      muted: "#3B6A78",
      grid: "rgba(11, 58, 72, 0.14)",
      bg: "#DCF1F7",
    },
    timeline: ["#C92C6D", "#E58BB4", "#8E3560", "#F4BFD6"],
  },
  dark: {
    cardFill: "#1C2340",
    stroke: "#2A2937",
    ambientShadow: "0 10px 28px rgba(0, 0, 0, 0.55), 0 1px 2px rgba(0, 0, 0, 0.4)",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: "none",
    canvasBg: "#15141D",
    canvasDot: "#3B3A4A",
    hardShadow: "none",
    categories: BENTO_DARK_CATEGORIES,
    surfaceBorder: "#2A2937",
    canvasConnector: "#5A5870",
    chart: {
      series: ["#22B0D3", "#4F7BFF", "#8B6BFF", "#F0569A", "#F5C842", "#34B57A", "#F0655C"],
      ink: "#D6F1F9",
      muted: "#93C6D6",
      grid: "rgba(214, 241, 249, 0.14)",
      bg: "#16303A",
    },
    timeline: ["#F0569A", "#B23C70", "#F9A3C8", "#7A2A4E"],
  },
};

/**
 * Riso — paper, ink and printed color (lime-quote / outlined-stat / flowchart
 * poster references). Every card is the same warm paper with a UNIFORM 1.5px
 * ink outline and a 3px hard offset shadow (zero blur). Color is printed onto
 * the paper: a vivid category ink for glyphs, chips, chart series; a
 * text-safe deep tone for numerals and category text; a pastel tint for
 * fills and pill nodes. Type mixes a heavy grotesque (Archivo) with bracketed
 * mono eyebrows. Dark mode is the same print on charcoal paper — bone ink
 * lines, tints darkened, vivid inks lifted; the hard shadow turns bone so it
 * reads as misregistered print. `vivid` is never used for running text.
 */
const RISO_LIGHT_INK = "#1E1B16";
const RISO_LIGHT_PAPER = "#FFFDF7";
const RISO_LIGHT_MUTED = "#6B655A";
const RISO_DARK_INK = "#EDE6D6";
const RISO_DARK_PAPER = "#262320";
const RISO_DARK_MUTED = "#B0A896";

const RISO_LIGHT_CATEGORIES: Record<ArtifactCategoryId, ArtifactStyleCategoryTones> = {
  data:      { solid: "#2F55E6", onSolid: RISO_LIGHT_PAPER, onSolidMuted: RISO_LIGHT_PAPER, pale: "#DDE4FF", ink: "#1E3AA8", muted: RISO_LIGHT_MUTED, vivid: "#2F55E6" },
  viz:       { solid: "#12A3B8", onSolid: RISO_LIGHT_INK,   onSolidMuted: RISO_LIGHT_INK,   pale: "#D3F0F4", ink: "#0C6572", muted: RISO_LIGHT_MUTED, vivid: "#12A3B8" },
  geo:       { solid: "#2DB36A", onSolid: RISO_LIGHT_INK,   onSolidMuted: RISO_LIGHT_INK,   pale: "#D9F3E3", ink: "#1B6E42", muted: RISO_LIGHT_MUTED, vivid: "#2DB36A" },
  media:     { solid: "#F0553C", onSolid: RISO_LIGHT_INK,   onSolidMuted: RISO_LIGHT_INK,   pale: "#FDE0D9", ink: "#A8331F", muted: RISO_LIGHT_MUTED, vivid: "#F0553C" },
  docs:      { solid: "#FFC61A", onSolid: RISO_LIGHT_INK,   onSolidMuted: RISO_LIGHT_INK,   pale: "#FFEDA6", ink: "#7A5A00", muted: RISO_LIGHT_MUTED, vivid: "#FFC61A" },
  dev:       { solid: "#6747E8", onSolid: RISO_LIGHT_PAPER, onSolidMuted: RISO_LIGHT_PAPER, pale: "#E6DFFD", ink: "#4B32B8", muted: RISO_LIGHT_MUTED, vivid: "#6747E8" },
  planning:  { solid: "#FF4D8D", onSolid: RISO_LIGHT_INK,   onSolidMuted: RISO_LIGHT_INK,   pale: "#FFDCE9", ink: "#B0175A", muted: RISO_LIGHT_MUTED, vivid: "#FF4D8D" },
  discourse: { solid: "#FF7A1A", onSolid: RISO_LIGHT_INK,   onSolidMuted: RISO_LIGHT_INK,   pale: "#FFE3CC", ink: "#9C4508", muted: RISO_LIGHT_MUTED, vivid: "#FF7A1A" },
};

const RISO_DARK_CATEGORIES: Record<ArtifactCategoryId, ArtifactStyleCategoryTones> = {
  data:      { solid: "#6B8CFF", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#283152", ink: "#B7C6FF", muted: RISO_DARK_MUTED, vivid: "#6B8CFF" },
  viz:       { solid: "#2FC4DA", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#173840", ink: "#A6E6F0", muted: RISO_DARK_MUTED, vivid: "#2FC4DA" },
  geo:       { solid: "#45C784", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#193A2A", ink: "#A9E9C6", muted: RISO_DARK_MUTED, vivid: "#45C784" },
  media:     { solid: "#FF7A62", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#4A2A25", ink: "#FFB8AA", muted: RISO_DARK_MUTED, vivid: "#FF7A62" },
  docs:      { solid: "#FFD23F", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#3F3616", ink: "#F5DC8A", muted: RISO_DARK_MUTED, vivid: "#FFD23F" },
  dev:       { solid: "#9C82FF", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#322B52", ink: "#CDBFFF", muted: RISO_DARK_MUTED, vivid: "#9C82FF" },
  planning:  { solid: "#FF6FA5", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#4C2535", ink: "#FFB3CF", muted: RISO_DARK_MUTED, vivid: "#FF6FA5" },
  discourse: { solid: "#FF9440", onSolid: RISO_LIGHT_INK, onSolidMuted: RISO_LIGHT_INK, pale: "#43291A", ink: "#FFC58F", muted: RISO_DARK_MUTED, vivid: "#FF9440" },
};

const RISO: ArtifactStylePreset = {
  id: "riso",
  name: "Riso",
  description:
    "Risograph print — warm paper, one uniform ink outline, hard offset shadows, vivid printed color.",
  strokeWidth: "1.5px",
  radius: "18px",
  controlStrokeWidth: "1.5px",
  checkboxStrokeWidth: "1.5px",
  pillRadius: "8px",
  density: 1,
  showKindLabel: true,
  // Selected chin + header tint are category-toned — expressed in CSS.
  selectedRing: "none",
  selectedChin: "none",
  tilt: "0deg",
  hoverLift: "-1px, -1px",
  pressPush: "1px, 1px",
  typography: {
    // One face per canvas: display + eyebrow inherit the canvas font. The
    // print voice comes from weight, tracking and the bracket devices.
    displayFamily: "inherit",
    displayWeight: "800",
    displayTracking: "-0.025em",
    displaySize: "120px",
    quoteSize: "30px",
    eyebrowFamily: "inherit",
    eyebrowTracking: "0.1em",
  },
  previewSwatches: ["#FFC61A", "#FF4D8D", "#2F55E6"],
  light: {
    cardFill: RISO_LIGHT_PAPER,
    stroke: RISO_LIGHT_INK,
    ambientShadow: "none",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: `1.5px solid ${RISO_LIGHT_INK}`,
    canvasBg: "#F3EFE6",
    canvasDot: "#B9B09E",
    hardShadow: `3px 3px 0 ${RISO_LIGHT_INK}`,
    categories: RISO_LIGHT_CATEGORIES,
    surfaceCard: RISO_LIGHT_PAPER,
    surfaceInk: RISO_LIGHT_INK,
    surfaceMuted: RISO_LIGHT_MUTED,
    surfaceBorder: RISO_LIGHT_INK,
    canvasConnector: RISO_LIGHT_INK,
    chart: {
      series: ["#2F55E6", "#FF7A1A", "#2DB36A", "#FF4D8D", "#FFC61A", "#6747E8", "#12A3B8", "#F0553C"],
      ink: RISO_LIGHT_INK,
      muted: RISO_LIGHT_MUTED,
      grid: "rgba(30, 27, 22, 0.18)",
      bg: RISO_LIGHT_PAPER,
    },
    timeline: ["#FF4D8D", "#FFC61A", "#2F55E6", "#2DB36A"],
  },
  dark: {
    cardFill: RISO_DARK_PAPER,
    stroke: RISO_DARK_INK,
    ambientShadow: "none",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: `1.5px solid ${RISO_DARK_INK}`,
    canvasBg: "#1B1915",
    canvasDot: "#4A453B",
    hardShadow: `3px 3px 0 ${RISO_DARK_INK}`,
    categories: RISO_DARK_CATEGORIES,
    surfaceCard: RISO_DARK_PAPER,
    surfaceInk: RISO_DARK_INK,
    surfaceMuted: RISO_DARK_MUTED,
    surfaceBorder: RISO_DARK_INK,
    canvasConnector: RISO_DARK_INK,
    chart: {
      series: ["#6B8CFF", "#FF9440", "#45C784", "#FF6FA5", "#FFD23F", "#9C82FF", "#2FC4DA", "#FF7A62"],
      ink: RISO_DARK_INK,
      muted: RISO_DARK_MUTED,
      grid: "rgba(237, 230, 214, 0.18)",
      bg: RISO_DARK_PAPER,
    },
    timeline: ["#FF6FA5", "#FFD23F", "#6B8CFF", "#45C784"],
  },
};

export const ARTIFACT_STYLE_PACKS: readonly ArtifactStylePreset[] = [
  VANILLA,
  NEO,
  NEOBRUTALISM,
  LIQUID_GLASS,
  BENTO,
  RISO,
];

export function getArtifactStylePack(id: string): ArtifactStylePreset {
  return (
    ARTIFACT_STYLE_PACKS.find((pack) => pack.id === id) ?? VANILLA
  );
}
