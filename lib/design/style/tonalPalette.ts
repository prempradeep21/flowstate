import { mixHex } from "@/lib/design/theme/color";
import type { ArtifactStyleChartPalette } from "@/lib/design/style/types";

/**
 * Derived palettes for the all-solid packs.
 *
 * When a card is one saturated colour, anything drawn inside it has to come
 * out of that colour's own family — a fixed series list (or the pack's
 * timeline ramp) fights the card the moment its hue is remapped. Everything
 * here is built from the card's two tones: `fill` (the card) and `onFill`
 * (the ink the pack already chose for contrast against it).
 */

/** Relative luminance — the same weighting the contrast maths uses. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(parseInt(h.slice(0, 2), 16)) +
    0.7152 * channel(parseInt(h.slice(2, 4), 16)) +
    0.0722 * channel(parseInt(h.slice(4, 6), 16))
  );
}

/**
 * The counter-pole to `onFill`: if the ink is light, this is a deep shade of
 * the card; if the ink is dark, it is a pale wash of it. Two poles plus their
 * mixes give a ramp that stays inside one hue and still separates cleanly.
 */
function counterPole(fill: string, onFill: string): string {
  return luminance(onFill) > luminance(fill)
    ? mixHex(fill, "#000000", 0.5)
    : mixHex(fill, "#FFFFFF", 0.62);
}

/**
 * Alternating light / dark steps from the card's own two poles. Adjacent
 * entries always sit on opposite sides of the card tone, so a series (or two
 * neighbouring timeline events) never reads as the same block of colour.
 */
export function tonalRamp(fill: string, onFill: string, steps: number): string[] {
  const other = counterPole(fill, onFill);
  const mixes = [0, 0, 0.34, 0.34, 0.58, 0.58, 0.2, 0.2];
  const out: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const base = i % 2 === 0 ? onFill : other;
    const t = mixes[i % mixes.length] ?? 0.45;
    out.push(t === 0 ? base : mixHex(base, fill, t));
  }
  return out;
}

/** Four-step event ramp for timeline axes, event dots and calendar chips. */
export function tonalEventPalette(fill: string, onFill: string): string[] {
  return tonalRamp(fill, onFill, 4);
}

/** Chart series + furniture, all resolved against the card the chart sits on. */
export function tonalChartPalette(
  fill: string,
  onFill: string,
): ArtifactStyleChartPalette {
  return {
    series: tonalRamp(fill, onFill, 8),
    ink: onFill,
    muted: mixHex(onFill, fill, 0.3),
    grid: mixHex(fill, onFill, 0.2),
    bg: fill,
  };
}
