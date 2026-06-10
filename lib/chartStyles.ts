import type { ChartStyleOption, ChartType, UIChartType } from "@/lib/chartTypes";

export const CHART_STYLE_OPTIONS: ChartStyleOption[] = [
  {
    id: "echarts-bar-vertical",
    label: "Vertical bars",
    engine: "echarts",
    chartType: "bar",
    echartsVariant: "vertical",
  },
  {
    id: "echarts-bar-horizontal",
    label: "Horizontal bars",
    engine: "echarts",
    chartType: "bar",
    echartsVariant: "horizontal",
  },
  {
    id: "visx-bar-rounded",
    label: "Rounded bars (visx)",
    engine: "visx",
    chartType: "bar",
  },
  {
    id: "visx-line-curve",
    label: "Smooth curve (visx)",
    engine: "visx",
    chartType: "line",
    visxCurve: "monotone",
  },
  {
    id: "echarts-line-smooth",
    label: "Smooth line",
    engine: "echarts",
    chartType: "line",
    echartsVariant: "smooth",
  },
  {
    id: "echarts-line-straight",
    label: "Straight line",
    engine: "echarts",
    chartType: "line",
    echartsVariant: "straight",
  },
  {
    id: "visx-area-closed",
    label: "Smooth area (visx)",
    engine: "visx",
    chartType: "area",
    visxCurve: "monotone",
  },
  {
    id: "echarts-area-filled",
    label: "Filled area",
    engine: "echarts",
    chartType: "area",
    echartsVariant: "filled",
  },
  {
    id: "echarts-area-stacked",
    label: "Stacked area",
    engine: "echarts",
    chartType: "area",
    echartsVariant: "stacked",
  },
  {
    id: "visx-stream-silhouette",
    label: "Stream silhouette (visx)",
    engine: "visx",
    chartType: "stream",
    visxCurve: "monotone",
    streamOffset: "silhouette",
  },
  {
    id: "visx-stream-wiggle",
    label: "Stream wiggle (visx)",
    engine: "visx",
    chartType: "stream",
    visxCurve: "monotone",
    streamOffset: "wiggle",
  },
  {
    id: "echarts-pie",
    label: "Pie",
    engine: "echarts",
    chartType: "pie",
    echartsVariant: "pie",
  },
  {
    id: "echarts-pie-donut",
    label: "Donut",
    engine: "echarts",
    chartType: "pie",
    echartsVariant: "donut",
  },
  {
    id: "visx-pie",
    label: "Pie arcs (visx)",
    engine: "visx",
    chartType: "pie",
  },
  {
    id: "echarts-gauge-arc",
    label: "Gauge arc",
    engine: "echarts",
    chartType: "gauge",
    echartsVariant: "arc",
  },
  {
    id: "echarts-gauge-bar",
    label: "Progress bar",
    engine: "echarts",
    chartType: "gauge",
    echartsVariant: "bar",
  },
];

const DEFAULT_STYLE_BY_TYPE: Record<ChartType, string> = {
  bar: "echarts-bar-vertical",
  line: "visx-line-curve",
  area: "visx-area-closed",
  pie: "echarts-pie",
  gauge: "echarts-gauge-arc",
};

export const UI_CHART_TYPE_LABELS: Record<UIChartType, string> = {
  bar: "Bar",
  line: "Line",
  area: "Area",
  stream: "Stream",
  pie: "Pie",
  gauge: "Gauge",
};

export const UI_CHART_TYPES: UIChartType[] = [
  "bar",
  "line",
  "area",
  "stream",
  "pie",
  "gauge",
];

export function getDefaultStyleForChartType(chartType: ChartType): string {
  return DEFAULT_STYLE_BY_TYPE[chartType];
}

export function getStyleById(id: string): ChartStyleOption | undefined {
  return CHART_STYLE_OPTIONS.find((s) => s.id === id);
}

export function getStylesForUIChartType(
  uiType: UIChartType,
): ChartStyleOption[] {
  return CHART_STYLE_OPTIONS.filter((s) => s.chartType === uiType);
}

export function getDefaultStyleForUIType(uiType: UIChartType): string {
  if (uiType === "stream") return "visx-stream-silhouette";
  return getDefaultStyleForChartType(uiType as ChartType);
}

export function chartTypeToUIType(chartType: ChartType): UIChartType {
  return chartType;
}

export function isChartTypeCompatible(
  uiType: UIChartType,
  data: {
    chartType: ChartType;
    series?: { name: string; data: number[] }[];
    slices?: { name: string; value: number }[];
    gaugeValue?: number;
    gaugeMax?: number;
  },
): boolean {
  if (uiType === "gauge") {
    return data.gaugeMax != null && data.gaugeMax > 0;
  }
  if (uiType === "pie") {
    return (data.slices?.length ?? 0) > 0;
  }
  if (uiType === "stream") {
    return (data.series?.length ?? 0) >= 2;
  }
  if (uiType === "bar" || uiType === "line" || uiType === "area") {
    return (data.series?.length ?? 0) > 0;
  }
  return false;
}
