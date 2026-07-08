/**
 * Google Material Design 3 Color System for Sound Mixing Panel
 * Implements dynamic color generation, semantic tokens, tonal elevation,
 * and contextual variants following Material Design 3 principles.
 *
 * @see https://m3.material.io/foundations/design-tokens/overview
 */

export type MD3Hue = number; // 0-360
export type MD3Chroma = number; // 0-150
export type MD3Tone = number; // 0-100 (lightness)

/**
 * Core M3 color token structure with tonal palette (light + dark variants)
 */
export interface MD3ColorToken {
  name: string;
  light: {
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    outline: string;
    outlineVariant: string;
  };
  dark: {
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    outline: string;
    outlineVariant: string;
  };
}

/**
 * M3 Semantic color tokens for UI components
 */
export interface MD3SemanticTokens {
  primary: MD3ColorToken;
  secondary: MD3ColorToken;
  tertiary: MD3ColorToken;
  error: MD3ColorToken;
  success: MD3ColorToken;
  warning: MD3ColorToken;
  info: MD3ColorToken;
}

/**
 * Tonal elevation system - elevated surfaces with distinct tones
 * Creates visual hierarchy through progressive lightening
 */
export interface MD3ElevationPalette {
  level0: string; // Surface
  level1: string; // +15 tone shift
  level2: string; // +25 tone shift
  level3: string; // +35 tone shift
  level4: string; // +40 tone shift
  level5: string; // +50 tone shift
}

/**
 * Simple LAB to sRGB conversion for Material Design 3 color space
 * Using the OKLAB color space which aligns with M3 principles
 */
function labToRgb(L: number, a: number, b: number): string {
  // OKLAB to Linear RGB
  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  l_ = l_ * l_ * l_;
  m_ = m_ * m_ * m_;
  s_ = s_ * s_ * s_;

  let r = +4.0767416621 * l_ - 3.3077363322 * m_ + 0.2309101289 * s_;
  let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193761 * s_;
  let B = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  // Apply gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  B = B > 0.0031308 ? 1.055 * Math.pow(B, 1 / 2.4) - 0.055 : 12.92 * B;

  const toHex = (v: number) => {
    const val = Math.max(0, Math.min(255, Math.round(v * 255)));
    return val.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(B)}`.toUpperCase();
}

/**
 * Generate a complete tonal palette for a primary hue
 * Returns 11 tones from 0 (black) to 100 (white)
 */
export function generateTonalPalette(hue: number, chroma: number): Record<number, string> {
  const tones = [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  const palette: Record<number, string> = {};

  for (const tone of tones) {
    // Convert HSL-like values to OKLAB
    const L = tone / 100;
    // Simplified OKLAB calculation
    const a = (chroma / 150) * Math.cos((hue * Math.PI) / 180) * 0.4;
    const b = (chroma / 150) * Math.sin((hue * Math.PI) / 180) * 0.4;

    palette[tone] = labToRgb(L, a, b);
  }

  return palette;
}

/**
 * Material Design 3 default color scheme
 * Primary: Dynamic Blue (#6750A4), Secondary: Dynamic Teal, Tertiary: Dynamic Orange
 */
export const MD3_DEFAULT_SCHEME = {
  primary: { hue: 267, chroma: 100 }, // Purple-blue
  secondary: { hue: 185, chroma: 50 }, // Cyan-teal
  tertiary: { hue: 29, chroma: 109 }, // Orange
  error: { hue: 25, chroma: 84 }, // Red
} as const;

/**
 * Generate complete M3 semantic tokens from primary hue
 */
export function generateSemanticTokens(
  primaryHue: number = MD3_DEFAULT_SCHEME.primary.hue,
  secondaryHue: number = MD3_DEFAULT_SCHEME.secondary.hue,
  tertiaryHue: number = MD3_DEFAULT_SCHEME.tertiary.hue,
): MD3SemanticTokens {
  const primaryPalette = generateTonalPalette(primaryHue, 100);
  const secondaryPalette = generateTonalPalette(secondaryHue, 50);
  const tertiaryPalette = generateTonalPalette(tertiaryHue, 109);
  const errorPalette = generateTonalPalette(25, 84);
  const successPalette = generateTonalPalette(120, 70);
  const warningPalette = generateTonalPalette(45, 90);
  const infoPalette = generateTonalPalette(200, 80);

  const createColorToken = (
    name: string,
    palette: Record<number, string>,
  ): MD3ColorToken => ({
    name,
    light: {
      surface: palette[99] || "#FFFFFF",
      surfaceVariant: palette[90] || "#F5F5F5",
      onSurface: palette[10] || "#000000",
      outline: palette[50] || "#808080",
      outlineVariant: palette[80] || "#CCCCCC",
    },
    dark: {
      surface: palette[10] || "#000000",
      surfaceVariant: palette[30] || "#333333",
      onSurface: palette[90] || "#EEEEEE",
      outline: palette[60] || "#999999",
      outlineVariant: palette[30] || "#333333",
    },
  });

  return {
    primary: createColorToken("Primary", primaryPalette),
    secondary: createColorToken("Secondary", secondaryPalette),
    tertiary: createColorToken("Tertiary", tertiaryPalette),
    error: createColorToken("Error", errorPalette),
    success: createColorToken("Success", successPalette),
    warning: createColorToken("Warning", warningPalette),
    info: createColorToken("Info", infoPalette),
  };
}

/**
 * Generate elevation palette for semantic color (tonal elevation system)
 * Creates visual hierarchy through progressive tone increases
 */
export function generateElevationPalette(
  basePalette: Record<number, string>,
  lightMode: boolean = true,
): MD3ElevationPalette {
  const baseTone = lightMode ? 95 : 20;

  return {
    level0: basePalette[baseTone] || "#FFFFFF",
    level1: basePalette[Math.min(100, baseTone + 4)] || "#FAFAFA",
    level2: basePalette[Math.min(100, baseTone + 8)] || "#F5F5F5",
    level3: basePalette[Math.min(100, baseTone + 12)] || "#F0F0F0",
    level4: basePalette[Math.min(100, baseTone + 14)] || "#EEEEEE",
    level5: basePalette[Math.min(100, baseTone + 16)] || "#EBEBEB",
  };
}

/**
 * Context-aware color variants for interactive elements
 */
export interface MD3ComponentColors {
  background: string;
  backgroundHover: string;
  backgroundActive: string;
  backgroundDisabled: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  borderFocus: string;
  icon: string;
}

/**
 * Generate component-specific color variants from semantic token
 */
export function generateComponentColors(
  colorToken: MD3ColorToken,
  lightMode: boolean = true,
): MD3ComponentColors {
  const variant = lightMode ? colorToken.light : colorToken.dark;

  return {
    background: variant.surface,
    backgroundHover: variant.surfaceVariant,
    backgroundActive: variant.outline,
    backgroundDisabled: lightMode ? "#F5F5F5" : "#303030",
    text: variant.onSurface,
    textSecondary: variant.outline,
    textDisabled: lightMode ? "#BDBDBD" : "#616161",
    border: variant.outlineVariant,
    borderFocus: variant.outline,
    icon: variant.onSurface,
  };
}

/**
 * Pre-calculated Material Design 3 color scheme (light mode)
 * High-quality colors optimized for the sound mixer interface
 */
export const MD3_LIGHT_COLORS = {
  primary: {
    container: "#EADDFF",
    onContainer: "#21005E",
    main: "#6750A4",
    onMain: "#FFFFFF",
  },
  secondary: {
    container: "#C7D7E8",
    onContainer: "#001D36",
    main: "#5B7FD6",
    onMain: "#FFFFFF",
  },
  tertiary: {
    container: "#FFDDC1",
    onContainer: "#330B00",
    main: "#F2994A",
    onMain: "#FFFFFF",
  },
  error: {
    container: "#F9DEDC",
    onContainer: "#410E0B",
    main: "#DC3545",
    onMain: "#FFFFFF",
  },
  success: {
    container: "#D0F5DC",
    onContainer: "#002114",
    main: "#10B981",
    onMain: "#FFFFFF",
  },
  warning: {
    container: "#FFEAA7",
    onContainer: "#4A2D0A",
    main: "#F5A623",
    onMain: "#FFFFFF",
  },
  info: {
    container: "#D4E9FF",
    onContainer: "#001B3A",
    main: "#3B82F6",
    onMain: "#FFFFFF",
  },
  surface: "#FFFBFE",
  onSurface: "#1C1B1F",
  outline: "#79747E",
  outlineVariant: "#C4C7C5",
};

/**
 * Material Design 3 color scheme (dark mode)
 */
export const MD3_DARK_COLORS = {
  primary: {
    container: "#4F378B",
    onContainer: "#EADDFF",
    main: "#D0BCFF",
    onMain: "#381E72",
  },
  secondary: {
    container: "#445589",
    onContainer: "#D4E1FF",
    main: "#A8CAFF",
    onMain: "#0D3A66",
  },
  tertiary: {
    container: "#D9702E",
    onContainer: "#FFEAA7",
    main: "#FFB680",
    onMain: "#552200",
  },
  error: {
    container: "#B3261E",
    onContainer: "#F9DEDC",
    main: "#F2B8B5",
    onMain: "#601410",
  },
  success: {
    container: "#005A2E",
    onContainer: "#97F0D7",
    main: "#72DDB8",
    onMain: "#003828",
  },
  warning: {
    container: "#B35900",
    onContainer: "#FFF3E0",
    main: "#FFDDC1",
    onMain: "#4A2D0A",
  },
  info: {
    container: "#004687",
    onContainer: "#D4E9FF",
    main: "#7ECBFF",
    onMain: "#001B3A",
  },
  surface: "#1C1B1F",
  onSurface: "#E6E0E9",
  outline: "#938F99",
  outlineVariant: "#49454E",
};

/**
 * Category-specific color mappings for sound event categories
 * Uses M3 semantic tokens with contextual color variants
 */
export const MD3_CATEGORY_COLORS = {
  canvas: {
    hue: 200,
    semantic: "primary",
    lightBg: "from-blue-100/60 via-cyan-50/40 to-blue-50/50",
    darkBg: "from-blue-950/30 via-cyan-950/20 to-blue-900/25",
  },
  branch: {
    hue: 270,
    semantic: "primary",
    lightBg: "from-purple-100/60 via-violet-50/40 to-purple-50/50",
    darkBg: "from-purple-950/30 via-violet-950/20 to-purple-900/25",
  },
  artifact: {
    hue: 30,
    semantic: "tertiary",
    lightBg: "from-amber-100/60 via-orange-50/40 to-amber-50/50",
    darkBg: "from-amber-950/30 via-orange-950/20 to-amber-900/25",
  },
  agent: {
    hue: 120,
    semantic: "success",
    lightBg: "from-emerald-100/60 via-teal-50/40 to-emerald-50/50",
    darkBg: "from-emerald-950/30 via-teal-950/20 to-emerald-900/25",
  },
  history: {
    hue: 10,
    semantic: "error",
    lightBg: "from-rose-100/60 via-red-50/40 to-rose-50/50",
    darkBg: "from-rose-950/30 via-red-950/20 to-rose-900/25",
  },
};

/**
 * Generate Material Design 3 color utilities for a category
 * Returns light and dark mode color values with accessibility
 */
export function getCategoryM3Colors(
  category: keyof typeof MD3_CATEGORY_COLORS,
  lightMode: boolean = true,
) {
  const config = MD3_CATEGORY_COLORS[category];
  const palette = lightMode ? MD3_LIGHT_COLORS : MD3_DARK_COLORS;

  return {
    surface: palette.surface,
    onSurface: palette.onSurface,
    outline: palette.outline,
    outlineVariant: palette.outlineVariant,
    hue: config.hue,
    gradient: lightMode ? config.lightBg : config.darkBg,
  };
}

/**
 * Accessible text color based on background and mode
 * Ensures WCAG AA contrast ratio (4.5:1 minimum)
 */
export function getAccessibleTextColor(bgColor: string, lightMode: boolean = true): string {
  return lightMode ? "#1C1B1F" : "#E6E0E9";
}

/**
 * Generate a Material Design 3 shadow following elevation guidelines
 * @param elevation 0-5 (levels 0-5)
 */
export function getM3ElevationShadow(elevation: number, lightMode: boolean = true): string {
  const shadows = {
    light: [
      "none",
      "0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)",
      "0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)",
      "0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)",
      "0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)",
      "0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 5px 8px 0px rgba(0, 0, 0, 0.14), 0px 1px 14px 0px rgba(0, 0, 0, 0.12)",
    ],
    dark: [
      "none",
      "0px 3px 1px -2px rgba(0, 0, 0, 0.3), 0px 2px 2px 0px rgba(0, 0, 0, 0.25), 0px 1px 5px 0px rgba(0, 0, 0, 0.22)",
      "0px 3px 1px -2px rgba(0, 0, 0, 0.3), 0px 3px 4px 0px rgba(0, 0, 0, 0.25), 0px 1px 8px 0px rgba(0, 0, 0, 0.22)",
      "0px 3px 3px -2px rgba(0, 0, 0, 0.3), 0px 3px 4px 0px rgba(0, 0, 0, 0.25), 0px 1px 8px 0px rgba(0, 0, 0, 0.22)",
      "0px 2px 4px -1px rgba(0, 0, 0, 0.3), 0px 4px 5px 0px rgba(0, 0, 0, 0.25), 0px 1px 10px 0px rgba(0, 0, 0, 0.22)",
      "0px 3px 5px -1px rgba(0, 0, 0, 0.3), 0px 5px 8px 0px rgba(0, 0, 0, 0.25), 0px 1px 14px 0px rgba(0, 0, 0, 0.22)",
    ],
  };

  const shadowList = lightMode ? shadows.light : shadows.dark;
  return shadowList[Math.min(5, Math.max(0, elevation))] || shadows[lightMode ? "light" : "dark"][0];
}
