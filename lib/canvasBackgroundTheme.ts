import type { CanvasBackgroundStyle, CanvasTheme } from "@/lib/store";

/** Backgrounds available in light theme. */
export const LIGHT_THEME_BACKGROUNDS: readonly CanvasBackgroundStyle[] = [
  "grid",
  "ambient-gradient",
] as const;

/** Backgrounds only shown when dark theme is selected. */
export const DARK_THEME_ONLY_BACKGROUNDS: readonly CanvasBackgroundStyle[] = [
  "sky",
  "network",
  "rising-sun",
] as const;

export function isBackgroundAllowedForTheme(
  style: CanvasBackgroundStyle,
  theme: CanvasTheme,
): boolean {
  if (theme === "light") {
    return (LIGHT_THEME_BACKGROUNDS as readonly string[]).includes(style);
  }
  return true;
}

/** Coerce a background to one valid for the given theme (defaults to dot grid). */
export function resolveBackgroundForTheme(
  style: CanvasBackgroundStyle,
  theme: CanvasTheme,
): CanvasBackgroundStyle {
  return isBackgroundAllowedForTheme(style, theme) ? style : "grid";
}
