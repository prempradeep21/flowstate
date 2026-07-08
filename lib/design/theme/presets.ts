import type { ThemePreset } from "@/lib/design/theme/types";

/**
 * Built-in theme presets. Each preset authors light-mode hexes only; dark
 * variants and category fills are derived in resolveTheme.ts. The default
 * `flowstate` preset mirrors the factory tokens in lib/design/tokens.ts /
 * globals.css, so a fresh profile renders identically with no injection.
 */
export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "flowstate",
    name: "Flowstate",
    description: "The original violet — calm, warm neutrals.",
    primary: "#6B4EFF",
    secondary: "#5B7FD6",
    tertiary: "#D97706",
    categories: {
      data: "#6B4EFF",
      viz: "#0284C7",
      geo: "#16A34A",
      media: "#DC2626",
      docs: "#D97706",
      dev: "#64748B",
      planning: "#DB2777",
    },
  },
  {
    id: "ember",
    name: "Ember",
    description: "Warm oranges and reds — energetic, tactile.",
    primary: "#EA580C",
    secondary: "#B45309",
    tertiary: "#DC2626",
    categories: {
      data: "#EA580C",
      viz: "#B45309",
      geo: "#65A30D",
      media: "#DC2626",
      docs: "#CA8A04",
      dev: "#78716C",
      planning: "#E11D48",
    },
  },
  {
    id: "tide",
    name: "Tide",
    description: "Blues and teals — cool, focused.",
    primary: "#0284C7",
    secondary: "#0E9EB5",
    tertiary: "#6366F1",
    categories: {
      data: "#0284C7",
      viz: "#6366F1",
      geo: "#0E9EB5",
      media: "#7C3AED",
      docs: "#0369A1",
      dev: "#64748B",
      planning: "#2563EB",
    },
  },
  {
    id: "moss",
    name: "Moss",
    description: "Greens and golds — grounded, organic.",
    primary: "#16A34A",
    secondary: "#4A7C59",
    tertiary: "#CA8A04",
    categories: {
      data: "#16A34A",
      viz: "#0E9EB5",
      geo: "#4A7C59",
      media: "#CA8A04",
      docs: "#A16207",
      dev: "#57534E",
      planning: "#65A30D",
    },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Near-monochrome ink — quiet, editorial.",
    primary: "#44403C",
    secondary: "#78716C",
    tertiary: "#6B4EFF",
    categories: {
      data: "#44403C",
      viz: "#57534E",
      geo: "#4A7C59",
      media: "#78716C",
      docs: "#A8A29A",
      dev: "#292524",
      planning: "#57534E",
    },
  },
];

export const DEFAULT_PRESET_ID = "flowstate";

/** Custom theme ids are namespaced so they never collide with built-ins. */
export const CUSTOM_THEME_ID_PREFIX = "custom:";

/** Slugified name + short random suffix, so re-saving the same name is safe. */
export function createCustomThemeId(name: string): string {
  const slug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "theme";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${CUSTOM_THEME_ID_PREFIX}${slug}-${suffix}`;
}

/**
 * Resolves a preset id to its definition. Checks built-ins first, then an
 * optional caller-supplied custom theme list (saved via the design panel —
 * see lib/design/theme/publishedTheme.server.ts). THEME_PRESETS itself is
 * never mutated by custom themes; this function is purely additive.
 */
export function getThemePreset(
  id: string,
  customThemes?: readonly ThemePreset[],
): ThemePreset {
  return (
    THEME_PRESETS.find((preset) => preset.id === id) ??
    customThemes?.find((preset) => preset.id === id) ??
    THEME_PRESETS.find((preset) => preset.id === DEFAULT_PRESET_ID)!
  );
}
