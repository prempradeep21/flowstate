import { curveBasis, curveLinear, curveMonotoneX } from "@visx/curve";
import type { ChartArtifactData } from "@/lib/chartTypes";
import type { ChartStyleOption } from "@/lib/chartTypes";

export function getVisxCurve(style: ChartStyleOption) {
  switch (style.visxCurve) {
    case "basis":
      return curveBasis;
    case "linear":
      return curveLinear;
    case "monotone":
    default:
      return curveMonotoneX;
  }
}

export function getStreamOffset(
  style: ChartStyleOption,
): "silhouette" | "wiggle" | "expand" | "none" {
  return style.streamOffset ?? "silhouette";
}

/** Build stacked stream rows: { category, key1, key2, ... } */
export function buildStreamRows(data: ChartArtifactData): Record<string, string | number>[] {
  const categories = data.categories ?? [];
  const series = data.series ?? [];
  return categories.map((cat, i) => {
    const row: Record<string, string | number> = { category: cat };
    for (const s of series) {
      row[s.name] = s.data[i] ?? 0;
    }
    return row;
  });
}

export function getSeriesKeys(data: ChartArtifactData): string[] {
  return (data.series ?? []).map((s) => s.name);
}

export function getMaxY(data: ChartArtifactData): number {
  const series = data.series ?? [];
  let max = 0;
  for (const s of series) {
    for (const v of s.data) max = Math.max(max, v);
  }
  return max > 0 ? max * 1.1 : 1;
}
