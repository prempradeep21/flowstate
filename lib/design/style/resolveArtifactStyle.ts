import { hexToRgbChannels } from "@/lib/design/tokens";
import {
  deriveDarkAccent,
  hexToHsl,
  withLightness,
} from "@/lib/design/theme/color";
import {
  DEFAULT_ARTIFACT_STYLE_ID,
  getArtifactStylePack,
} from "@/lib/design/style/stylePacks";
import type {
  ArtifactStyleId,
  ArtifactStylePreset,
  ArtifactStyleSurfaceTokens,
  ResolvedArtifactStyle,
} from "@/lib/design/style/types";

function cssBlock(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(
    ([name, value]) => `  ${name}: ${value};`,
  );
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/**
 * Deeper companion to an accent — used for chins and active borders. The
 * ratio matches the landing pair (#0f4fc7 -> #0c3f9e), derived rather than
 * hardcoded so it tracks any accent hex.
 */
function deriveDeepAccent(hex: string): string {
  const hsl = hexToHsl(hex);
  return withLightness(hex, hsl.l * 0.79);
}

/** Accent re-declarations mirroring resolveTheme's role derivations. */
function accentVars(
  primary: string,
  mode: "light" | "dark",
): Record<string, string> {
  const accent = mode === "light" ? primary : deriveDarkAccent(primary);
  return {
    "--canvas-accent": hexToRgbChannels(accent),
    "--canvas-map-primary": hexToRgbChannels(accent),
    "--canvas-artifact-icon-bg": hexToRgbChannels(
      mode === "light"
        ? withLightness(primary, 0.93, 0.9)
        : withLightness(primary, 0.2, 0.5),
    ),
    "--canvas-accent-deep": hexToRgbChannels(deriveDeepAccent(accent)),
  };
}

function surfaceVars(tokens: ArtifactStyleSurfaceTokens): Record<string, string> {
  const vars: Record<string, string> = {
    "--canvas-artifact-card-fill": hexToRgbChannels(tokens.cardFill),
    "--canvas-artifact-stroke": hexToRgbChannels(tokens.stroke),
    "--canvas-artifact-ambient-shadow": tokens.ambientShadow,
    "--canvas-artifact-chin-shadow": tokens.chinShadow,
    "--canvas-artifact-header-bg": tokens.headerBg,
    "--canvas-artifact-header-rule": tokens.headerRule,
    "--canvas-artifact-hard-shadow": tokens.hardShadow,
  };
  // Canvas backdrop override — the grid/gradient backgrounds resolve
  // rgb(var(--canvas-bg)) / rgb(var(--canvas-dot)) inside the scope, so
  // re-declaring here recolors the whole canvas without touching the
  // body/theme layer. The grid still draws its own zoom-scaled dots.
  if (tokens.canvasBg) {
    vars["--canvas-bg"] = hexToRgbChannels(tokens.canvasBg);
    vars["--canvas-artifact-stage"] = hexToRgbChannels(tokens.canvasBg);
  }
  if (tokens.canvasDot) {
    vars["--canvas-dot"] = hexToRgbChannels(tokens.canvasDot);
  }
  return vars;
}

function structureVars(pack: ArtifactStylePreset): Record<string, string> {
  return {
    "--canvas-artifact-stroke-w": pack.strokeWidth,
    "--canvas-artifact-radius": pack.radius,
    "--canvas-artifact-control-stroke-w": pack.controlStrokeWidth,
    "--canvas-artifact-checkbox-stroke-w": pack.checkboxStrokeWidth,
    "--canvas-artifact-pill-radius": pack.pillRadius,
    "--canvas-artifact-density": String(pack.density),
    "--canvas-artifact-selected-ring": pack.selectedRing,
    "--canvas-artifact-selected-chin": pack.selectedChin,
    "--canvas-artifact-tilt": pack.tilt,
    "--canvas-artifact-hover-lift": pack.hoverLift,
    "--canvas-artifact-press-push": pack.pressPush,
  };
}

/**
 * Pure resolution: style pack id -> scoped CSS variable payload. Vanilla is
 * the absence of styling (empty payload, isDefault) so the factory look is a
 * no-op by construction. Non-default packs emit two blocks scoped under
 * `[data-artifact-style="<id>"]`, with dark values selected by the existing
 * `html[data-theme="dark"]` attribute (owned by ThemeApplier).
 */
export function resolveArtifactStyle(
  styleId: ArtifactStyleId,
): ResolvedArtifactStyle {
  const pack = getArtifactStylePack(styleId);
  if (pack.id === DEFAULT_ARTIFACT_STYLE_ID) {
    return { css: "", lightVars: {}, darkVars: {}, isDefault: true };
  }

  const lightVars: Record<string, string> = {
    ...structureVars(pack),
    ...surfaceVars(pack.light),
    ...(pack.accent ? accentVars(pack.accent, "light") : {}),
  };
  const darkVars: Record<string, string> = {
    ...surfaceVars(pack.dark),
    ...(pack.accent ? accentVars(pack.accent, "dark") : {}),
  };

  const scope = `[data-artifact-style="${pack.id}"]`;
  const css =
    cssBlock(scope, lightVars) +
    "\n" +
    cssBlock(`html[data-theme="dark"] ${scope}`, darkVars);

  return { css, lightVars, darkVars, isDefault: false };
}
