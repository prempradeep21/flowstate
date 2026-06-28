import { describe, expect, it } from "vitest";
import {
  buildDesignTokenCss,
  buildDesignTokenExport,
  buildTailwindTokenMap,
} from "@/lib/design/exportTokens";

describe("buildDesignTokenExport", () => {
  it("exports light/dark colors and css variable maps", () => {
    const tokens = buildDesignTokenExport();
    expect(tokens.version).toBe("1.0.0");
    expect(tokens.colors.light.accent).toBe("#6B4EFF");
    expect(tokens.colors.dark.accent).toBe("#8E78FF");
    expect(tokens.cssVariables.light["--canvas-bg"]).toBe("250 250 248");
    expect(tokens.threadAccentPalette.length).toBeGreaterThan(0);
  });

  it("generates css with light and dark selectors", () => {
    const css = buildDesignTokenCss();
    expect(css).toContain(":root {");
    expect(css).toContain('html[data-theme="dark"]');
    expect(css).toContain("--canvas-accent:");
  });

  it("generates tailwind token map entries", () => {
    const map = buildTailwindTokenMap();
    expect(map["colors.canvas-accent"]).toContain("--canvas-accent");
    expect(map["borderRadius.canvas"]).toBe("12px");
  });
});
