/**
 * Small color math helpers for the theme engine — hex <-> HSL conversion and
 * lightness/saturation adjustments used to derive dark-mode and category
 * variants from a single authored hex per color.
 */

export interface Hsl {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}

export function hexToHsl(hex: string): Hsl {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue: number;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / d + 2) * 60;
  else hue = ((r - g) / d + 4) * 60;
  return { h: hue, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`.toUpperCase();
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Set absolute lightness (and optionally scale saturation) of a hex color. */
export function withLightness(
  hex: string,
  lightness: number,
  saturationScale = 1,
): string {
  const hsl = hexToHsl(hex);
  return hslToHex({
    h: hsl.h,
    s: clamp01(hsl.s * saturationScale),
    l: clamp01(lightness),
  });
}

/** Shift lightness relative to the current value. */
export function shiftLightness(hex: string, delta: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: clamp01(hsl.l + delta) });
}

/**
 * Derive a dark-theme accent from a light-theme accent: lighter and slightly
 * desaturated so it reads on near-black without vibrating (matches how the
 * hand-tuned pair #6B4EFF -> #8E78FF relates).
 */
export function deriveDarkAccent(hex: string): string {
  const hsl = hexToHsl(hex);
  return hslToHex({
    h: hsl.h,
    s: clamp01(hsl.s * 0.95),
    l: clamp01(Math.max(hsl.l + 0.12, 0.62)),
  });
}

/**
 * Derive the four category-fill values (light/dark circle bg + icon fg)
 * from a single authored base hex.
 */
export function deriveCategoryFill(baseHex: string): {
  lightBg: string;
  lightFg: string;
  darkBg: string;
  darkFg: string;
} {
  return {
    lightBg: withLightness(baseHex, 0.93, 0.9),
    lightFg: withLightness(baseHex, 0.38, 0.8),
    darkBg: withLightness(baseHex, 0.2, 0.5),
    darkFg: withLightness(baseHex, 0.76, 0.85),
  };
}
