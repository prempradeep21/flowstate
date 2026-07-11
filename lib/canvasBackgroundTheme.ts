import type { CanvasBackgroundStyle, CanvasTheme } from "@/lib/store";
import { CANVAS_BACKGROUND_STYLES } from "@/lib/store";

/** Backgrounds available in all themes. */
export const LIGHT_THEME_BACKGROUNDS: readonly CanvasBackgroundStyle[] =
  CANVAS_BACKGROUND_STYLES;

export function isBackgroundAllowedForTheme(
  style: CanvasBackgroundStyle,
  _theme: CanvasTheme,
): boolean {
  return (CANVAS_BACKGROUND_STYLES as readonly string[]).includes(style);
}

/** Coerce a background to one valid for the given theme (defaults to dot grid). */
export function resolveBackgroundForTheme(
  style: CanvasBackgroundStyle,
  theme: CanvasTheme,
): CanvasBackgroundStyle {
  return isBackgroundAllowedForTheme(style, theme) ? style : "grid";
}
