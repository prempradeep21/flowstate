import type { ArtifactKind } from "@/lib/artifactTypes";

/**
 * Modular theme system — types.
 *
 * Semantic color roles (panel label -> CSS variable):
 * - primary   -> --canvas-accent (brand + actions; also --canvas-map-primary)
 * - secondary -> --canvas-secondary (supporting UI accents)
 * - tertiary  -> --canvas-tertiary (highlights, warm counterpoint)
 *
 * Each role is authored as a single light-mode hex; the dark variant is
 * derived (see lib/design/theme/color.ts). Artifact categories work the same
 * way: one base hex per category derives the header circle fill + icon tint
 * for both modes.
 */

export type ThemeMode = "light" | "dark";

export type ArtifactCategoryId =
  | "data"
  | "viz"
  | "geo"
  | "media"
  | "docs"
  | "dev"
  | "planning";

export const ARTIFACT_CATEGORY_IDS: readonly ArtifactCategoryId[] = [
  "data",
  "viz",
  "geo",
  "media",
  "docs",
  "dev",
  "planning",
];

/** Kinds ArtifactTypeIcon accepts beyond the persisted ArtifactKind union. */
export type ArtifactCategoryKind = ArtifactKind | "video";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  /** Light-mode hex per semantic role; dark variants are derived. */
  primary: string;
  secondary: string;
  tertiary: string;
  /** Light-mode base hex per artifact category; fills are derived. */
  categories: Record<ArtifactCategoryId, string>;
  /** Optional preset-specific base corner radius (px). */
  radiusBase?: number;
}

/** User-tweakable overrides layered on top of the active preset. */
export interface ThemeOverrides {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  categories?: Partial<Record<ArtifactCategoryId, string>>;
  radiusBase?: number;
}

export interface ThemeState {
  presetId: string;
  mode: ThemeMode;
  overrides: ThemeOverrides;
}

/** Resolved output — CSS ready to inject; vars grouped per mode. */
export interface ResolvedTheme {
  css: string;
  lightVars: Record<string, string>;
  darkVars: Record<string, string>;
  radiusBase: number;
  /** True when the state matches factory defaults (no injection needed). */
  isDefault: boolean;
}
