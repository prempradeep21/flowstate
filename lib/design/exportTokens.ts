import {
  canvasColors,
  canvasFloatingChrome,
  canvasFontSize,
  canvasRadii,
  canvasSpacing,
  darkCanvasColors,
  darkThemeVars,
  lightThemeVars,
  THREAD_ACCENT_PALETTE,
} from "@/lib/design/tokens";

export interface DesignTokenExport {
  version: string;
  colors: {
    light: typeof canvasColors;
    dark: typeof darkCanvasColors;
  };
  radii: typeof canvasRadii;
  typography: typeof canvasFontSize;
  spacing: typeof canvasSpacing;
  floatingChrome: typeof canvasFloatingChrome;
  threadAccentPalette: readonly string[];
  cssVariables: {
    light: typeof lightThemeVars;
    dark: typeof darkThemeVars;
  };
}

export function buildDesignTokenExport(): DesignTokenExport {
  return {
    version: "1.0.0",
    colors: {
      light: canvasColors,
      dark: darkCanvasColors,
    },
    radii: canvasRadii,
    typography: canvasFontSize,
    spacing: canvasSpacing,
    floatingChrome: canvasFloatingChrome,
    threadAccentPalette: THREAD_ACCENT_PALETTE,
    cssVariables: {
      light: lightThemeVars,
      dark: darkThemeVars,
    },
  };
}

function cssBlock(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/** Standalone CSS variables file for external consumers. */
export function buildDesignTokenCss(): string {
  const header = `/* Flowstate design tokens — generated from lib/design/tokens.ts */\n`;
  return (
    header +
    cssBlock(":root", lightThemeVars) +
    "\n\n" +
    cssBlock('html[data-theme="dark"]', darkThemeVars)
  );
}

/** Tailwind `canvas-*` utility map for external Tailwind configs. */
export function buildTailwindTokenMap(): Record<string, string> {
  const colors = Object.fromEntries(
    Object.keys(canvasColors).map((key) => {
      const cssVar = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return [`canvas-${cssVar}`, `rgb(var(--canvas-${cssVar}) / <alpha-value>)`];
    }),
  );

  const fontSize = Object.fromEntries(
    Object.entries(canvasFontSize).map(([key, value]) => [
      `canvas-${key}`,
      value,
    ]),
  );

  const borderRadius = Object.fromEntries(
    Object.entries(canvasRadii).map(([key, value]) => [
      key === "canvas" ? "canvas" : `canvas-${key}`,
      value,
    ]),
  );

  return {
    ...Object.fromEntries(
      Object.entries(colors).map(([k, v]) => [`colors.${k}`, v]),
    ),
    ...Object.fromEntries(
      Object.entries(fontSize).map(([k, v]) => [`fontSize.${k}`, JSON.stringify(v)]),
    ),
    ...Object.fromEntries(
      Object.entries(borderRadius).map(([k, v]) => [`borderRadius.${k}`, v]),
    ),
  };
}
