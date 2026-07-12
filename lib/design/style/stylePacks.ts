import { darkCanvasColors } from "@/lib/design/tokens";
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
  light: {
    cardFill: "#FFFFFF",
    stroke: "#E6E4DF",
    ambientShadow: "var(--canvas-artifact-shadow)",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: "none",
  },
  dark: {
    cardFill: darkCanvasColors.card,
    stroke: darkCanvasColors.border,
    ambientShadow: "var(--canvas-artifact-shadow)",
    chinShadow: "none",
    headerBg: "transparent",
    headerRule: "none",
  },
};

/**
 * Neo — the marketing-landing language (public/landing/css/style.css):
 * ink wire strokes, solid no-blur chin, 14px corners, cream card fill,
 * cobalt #1754C6 accent reserved for selected/active/highlight states.
 * Dark tokens are machine-derived placeholders (light-first), tuned later.
 */
const NEO: ArtifactStylePreset = {
  id: "neo",
  name: "Neo",
  description:
    "Landing-page language — ink strokes, solid chin shadows, cobalt accents.",
  accent: "#1754C6",
  strokeWidth: "1.6px",
  radius: "14px",
  controlStrokeWidth: "1.3px",
  checkboxStrokeWidth: "1.4px",
  pillRadius: "999px",
  density: 1,
  showKindLabel: true,
  selectedRing: "0 0 0 4px rgb(var(--canvas-accent) / 0.16)",
  selectedChin: "0 2px 0 rgb(var(--canvas-accent-deep) / 0.55)",
  light: {
    cardFill: "#F4F3EE",
    stroke: "#232323",
    ambientShadow: "0 10px 28px rgba(16, 16, 16, 0.14)",
    chinShadow: "0 2px 0 rgba(16, 16, 16, 0.5)",
    headerBg: "rgba(255, 255, 255, 0.5)",
    headerRule: "1.4px solid rgba(16, 16, 16, 0.55)",
  },
  dark: {
    cardFill: darkCanvasColors.card,
    stroke: darkCanvasColors.ink,
    ambientShadow: "0 10px 28px rgba(0, 0, 0, 0.5)",
    chinShadow: "0 2px 0 rgba(0, 0, 0, 0.55)",
    headerBg: "rgba(255, 255, 255, 0.06)",
    headerRule: "1.4px solid rgba(236, 234, 227, 0.4)",
  },
};

export const ARTIFACT_STYLE_PACKS: readonly ArtifactStylePreset[] = [
  VANILLA,
  NEO,
];

export function getArtifactStylePack(id: string): ArtifactStylePreset {
  return (
    ARTIFACT_STYLE_PACKS.find((pack) => pack.id === id) ?? VANILLA
  );
}
