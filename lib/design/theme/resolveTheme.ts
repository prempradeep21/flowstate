import { canvasRadiusBasePx, hexToRgbChannels } from "@/lib/design/tokens";
import {
  deriveCategoryFill,
  deriveDarkAccent,
  withLightness,
} from "@/lib/design/theme/color";
import {
  DEFAULT_PRESET_ID,
  getThemePreset,
} from "@/lib/design/theme/presets";
import {
  ARTIFACT_CATEGORY_IDS,
  type ResolvedTheme,
  type ThemePreset,
  type ThemeState,
} from "@/lib/design/theme/types";

export const DEFAULT_THEME_STATE: ThemeState = {
  presetId: DEFAULT_PRESET_ID,
  mode: "light",
  overrides: {},
};

export function isDefaultThemeState(state: ThemeState): boolean {
  const o = state.overrides;
  return (
    state.presetId === DEFAULT_PRESET_ID &&
    o.primary == null &&
    o.secondary == null &&
    o.tertiary == null &&
    o.radiusBase == null &&
    (o.categories == null ||
      Object.values(o.categories).every((v) => v == null))
  );
}

function cssBlock(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(
    ([name, value]) => `  ${name}: ${value};`,
  );
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/**
 * Pure resolution: theme state -> CSS variable sets for both modes plus an
 * injectable stylesheet. Mode-dependent values live under
 * `html[data-theme="dark"]` so the attribute (owned by ThemeApplier /
 * per-canvas settings) keeps selecting the right values.
 */
export function resolveTheme(
  state: ThemeState,
  customThemes?: readonly ThemePreset[],
): ResolvedTheme {
  const preset = getThemePreset(state.presetId, customThemes);
  const overrides = state.overrides ?? {};

  const primary = overrides.primary ?? preset.primary;
  const secondary = overrides.secondary ?? preset.secondary;
  const tertiary = overrides.tertiary ?? preset.tertiary;
  const radiusBase =
    overrides.radiusBase ?? preset.radiusBase ?? canvasRadiusBasePx;

  const lightVars: Record<string, string> = {
    "--canvas-radius-base": `${radiusBase}px`,
    "--canvas-accent": hexToRgbChannels(primary),
    "--canvas-map-primary": hexToRgbChannels(primary),
    "--canvas-secondary": hexToRgbChannels(secondary),
    "--canvas-tertiary": hexToRgbChannels(tertiary),
    // Accent-soft chip fill follows primary so badges stay on-theme.
    "--canvas-artifact-icon-bg": hexToRgbChannels(
      withLightness(primary, 0.93, 0.9),
    ),
  };
  const darkVars: Record<string, string> = {
    "--canvas-accent": hexToRgbChannels(deriveDarkAccent(primary)),
    "--canvas-map-primary": hexToRgbChannels(deriveDarkAccent(primary)),
    "--canvas-secondary": hexToRgbChannels(deriveDarkAccent(secondary)),
    "--canvas-tertiary": hexToRgbChannels(deriveDarkAccent(tertiary)),
    "--canvas-artifact-icon-bg": hexToRgbChannels(
      withLightness(primary, 0.2, 0.5),
    ),
  };

  for (const category of ARTIFACT_CATEGORY_IDS) {
    const base = overrides.categories?.[category] ?? preset.categories[category];
    const fill = deriveCategoryFill(base);
    lightVars[`--artifact-cat-${category}-bg`] = hexToRgbChannels(fill.lightBg);
    lightVars[`--artifact-cat-${category}-fg`] = hexToRgbChannels(fill.lightFg);
    darkVars[`--artifact-cat-${category}-bg`] = hexToRgbChannels(fill.darkBg);
    darkVars[`--artifact-cat-${category}-fg`] = hexToRgbChannels(fill.darkFg);
  }

  const css =
    cssBlock(":root", lightVars) +
    "\n" +
    cssBlock('html[data-theme="dark"]', darkVars);

  return {
    css,
    lightVars,
    darkVars,
    radiusBase,
    isDefault: isDefaultThemeState(state),
  };
}
