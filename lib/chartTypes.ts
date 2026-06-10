export type ChartType = "bar" | "area" | "line" | "pie" | "gauge";

/** Includes stream — UI-only type switched via toolbar. */
export type UIChartType = ChartType | "stream";

export interface ChartSeriesItem {
  name: string;
  data: number[];
}

export interface ChartSlice {
  name: string;
  value: number;
}

export interface ChartArtifactData {
  chartType: ChartType;
  categories?: string[];
  series?: ChartSeriesItem[];
  slices?: ChartSlice[];
  unit?: string;
  source?: string;
  stacked?: boolean;
  smooth?: boolean;
  gaugeValue?: number;
  gaugeMax?: number;
  gaugeLabel?: string;
}

export type ChartEngine = "echarts" | "visx";

export interface ChartStyleOption {
  id: string;
  label: string;
  engine: ChartEngine;
  chartType: UIChartType;
  visxCurve?: "monotone" | "basis" | "linear";
  streamOffset?: "silhouette" | "wiggle" | "expand";
  echartsVariant?: string;
}
