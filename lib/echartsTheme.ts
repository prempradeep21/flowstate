import { canvasColors as light, darkCanvasColors as dark } from "@/lib/design/tokens";
import type { ArtifactStyleChartPalette } from "@/lib/design/style/types";

export interface ChartPalette {
  ink: string;
  muted: string;
  accent: string;
  border: string;
  /** Axis / grid line color (may carry alpha). */
  grid: string;
  /** Tooltip + raster-export background. */
  bg: string;
  series: string[];
}

/**
 * Chart palette for the active mode. Color-led style packs hand in their own
 * palette (the JS seam — ECharts/visx render to canvas/SVG and cannot read the
 * scoped CSS variables); everything else keeps the factory series.
 */
export function getChartPalette(
  isDark: boolean,
  override?: ArtifactStyleChartPalette,
): ChartPalette {
  const c = isDark ? dark : light;
  if (override) {
    return {
      ink: override.ink,
      muted: override.muted,
      accent: override.series[0] ?? c.accent,
      border: override.grid,
      grid: override.grid,
      bg: override.bg,
      series: override.series,
    };
  }
  return {
    ink: c.ink,
    muted: c.muted,
    accent: c.accent,
    border: c.border,
    grid: withAlpha(c.muted, 0.2),
    bg: isDark ? "#211F1C" : "#FFFFFF",
    series: [
      c.accent,
      "#FF8FA3",
      "#6FCF97",
      "#F2C94C",
      "#BB6BD9",
      "#56CCF2",
      "#F2994A",
    ],
  };
}

/** Flat fill with opacity — no gradients. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function baseEChartsTextStyle(palette: ChartPalette) {
  return {
    color: palette.ink,
    fontFamily: "var(--font-figtree), system-ui, sans-serif",
    fontSize: 12,
  };
}
