import type { ChartArtifactData } from "@/lib/chartTypes";
import { buildEChartsOption } from "@/lib/echartsOptions";
import type { ChartExportMeta } from "@/lib/artifactExport/types";
import { getStyleById } from "@/lib/chartStyles";

export function chartToJson(data: ChartArtifactData): string {
  return JSON.stringify(data, null, 2);
}

export function chartToCsv(data: ChartArtifactData): string {
  if (data.slices && data.slices.length > 0) {
    const lines = ["name,value", ...data.slices.map((s) => `${csvEscape(s.name)},${s.value}`)];
    return lines.join("\n");
  }
  const categories = data.categories ?? [];
  const series = data.series ?? [];
  if (series.length === 0) return "";
  const header = ["category", ...series.map((s) => csvEscape(s.name))].join(",");
  const lines = categories.map((cat, i) => {
    const values = series.map((s) => String(s.data[i] ?? ""));
    return [csvEscape(cat), ...values].join(",");
  });
  return [header, ...lines].join("\n");
}

export function chartToHtml(
  data: ChartArtifactData,
  meta: ChartExportMeta | null,
): string {
  const style = meta ? getStyleById(meta.styleId) : null;
  const engineStyle = style
    ? { ...style, chartType: meta!.uiChartType }
    : { id: "default", label: "Default", engine: "echarts" as const, chartType: data.chartType };
  const option = buildEChartsOption(data, engineStyle, meta?.isDark ?? false);
  const optionJson = JSON.stringify(option, null, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Chart</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@6/dist/echarts.min.js"></script>
<style>
  html, body { margin: 0; height: 100%; }
  #chart { width: 100%; height: 100vh; }
</style>
</head>
<body>
<div id="chart"></div>
<script>
  const chart = echarts.init(document.getElementById("chart"));
  chart.setOption(${optionJson});
  window.addEventListener("resize", () => chart.resize());
</script>
</body>
</html>`;
}

export function chartToReact(
  data: ChartArtifactData,
  meta: ChartExportMeta | null,
): string {
  const style = meta ? getStyleById(meta.styleId) : null;
  const engineStyle = style
    ? { ...style, chartType: meta!.uiChartType }
    : { id: "default", label: "Default", engine: "echarts" as const, chartType: data.chartType };
  const option = buildEChartsOption(data, engineStyle, meta?.isDark ?? false);
  return `import React from "react";
import ReactECharts from "echarts-for-react";

const option = ${JSON.stringify(option, null, 2)};

export default function ChartView() {
  return (
    <ReactECharts
      option={option}
      style={{ height: 400, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
