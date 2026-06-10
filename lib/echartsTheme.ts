import { canvasColors as light, darkCanvasColors as dark } from "@/lib/design/tokens";

export interface ChartPalette {
  ink: string;
  muted: string;
  accent: string;
  border: string;
  series: string[];
}

export function getChartPalette(isDark: boolean): ChartPalette {
  const c = isDark ? dark : light;
  return {
    ink: c.ink,
    muted: c.muted,
    accent: c.accent,
    border: c.border,
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
    fontFamily: "system-ui, sans-serif",
    fontSize: 12,
  };
}
