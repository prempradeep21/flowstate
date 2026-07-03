import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/design/contrast";
import { darkCanvasColors, canvasColors } from "@/lib/design/tokens";
import { deriveCategoryFill, deriveDarkAccent } from "@/lib/design/theme/color";
import { THEME_PRESETS } from "@/lib/design/theme/presets";
import {
  DEFAULT_THEME_STATE,
  isDefaultThemeState,
  resolveTheme,
} from "@/lib/design/theme/resolveTheme";
import { ARTIFACT_CATEGORY_IDS } from "@/lib/design/theme/types";

describe("resolveTheme", () => {
  it("marks the factory state as default (no injection needed)", () => {
    expect(isDefaultThemeState(DEFAULT_THEME_STATE)).toBe(true);
    expect(resolveTheme(DEFAULT_THEME_STATE).isDefault).toBe(true);
  });

  it("treats any override as non-default", () => {
    const resolved = resolveTheme({
      ...DEFAULT_THEME_STATE,
      overrides: { radiusBase: 8 },
    });
    expect(resolved.isDefault).toBe(false);
    expect(resolved.css).toContain("--canvas-radius-base: 8px");
  });

  it("emits both mode blocks with the full variable set", () => {
    const resolved = resolveTheme({
      presetId: "tide",
      mode: "light",
      overrides: {},
    });
    expect(resolved.css).toContain(":root {");
    expect(resolved.css).toContain('html[data-theme="dark"] {');
    for (const category of ARTIFACT_CATEGORY_IDS) {
      expect(resolved.lightVars[`--artifact-cat-${category}-bg`]).toBeTruthy();
      expect(resolved.darkVars[`--artifact-cat-${category}-fg`]).toBeTruthy();
    }
  });
});

describe("preset accessibility", () => {
  it("category icon tints hold >= 3:1 (graphics) against their circle fill", () => {
    for (const preset of THEME_PRESETS) {
      for (const category of ARTIFACT_CATEGORY_IDS) {
        const fill = deriveCategoryFill(preset.categories[category]);
        expect(
          contrastRatio(fill.lightFg, fill.lightBg),
          `${preset.id}/${category} light`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrastRatio(fill.darkFg, fill.darkBg),
          `${preset.id}/${category} dark`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("primary accents hold >= 3:1 against their card surface", () => {
    for (const preset of THEME_PRESETS) {
      expect(
        contrastRatio(preset.primary, canvasColors.card),
        `${preset.id} light primary`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(deriveDarkAccent(preset.primary), darkCanvasColors.card),
        `${preset.id} dark primary`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("muted text meets AA on both light surfaces", () => {
    expect(contrastRatio(canvasColors.muted, canvasColors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(canvasColors.muted, canvasColors.card)).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(darkCanvasColors.muted, darkCanvasColors.bg),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
