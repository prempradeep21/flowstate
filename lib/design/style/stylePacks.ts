import { canvasColors, darkCanvasColors } from "@/lib/design/tokens";
import type { ArtifactStylePreset } from "@/lib/design/style/types";

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

export const ARTIFACT_STYLE_PACKS: readonly ArtifactStylePreset[] = [
  VANILLA,
  NEO,
  NEOBRUTALISM,
  LIQUID_GLASS,
];

export function getArtifactStylePack(id: string): ArtifactStylePreset {
  return (
    ARTIFACT_STYLE_PACKS.find((pack) => pack.id === id) ?? VANILLA
  );
}
