import type { EChartsOption } from "echarts";
import type { ChartArtifactData } from "@/lib/chartTypes";
import type { ChartStyleOption } from "@/lib/chartTypes";
import {
  baseEChartsTextStyle,
  getChartPalette,
  withAlpha,
} from "@/lib/echartsTheme";

export function buildEChartsOption(
  data: ChartArtifactData,
  style: ChartStyleOption,
  isDark: boolean,
): EChartsOption {
  const palette = getChartPalette(isDark);
  const textStyle = baseEChartsTextStyle(palette);

  const base: EChartsOption = {
    backgroundColor: "transparent",
    textStyle,
    animation: true,
    grid: {
      left: 48,
      right: 24,
      top: 36,
      bottom: 40,
      containLabel: true,
    },
    tooltip: {
      trigger: style.chartType === "pie" ? "item" : "axis",
      backgroundColor: isDark ? "#211F1C" : "#FFFFFF",
      borderColor: palette.border,
      textStyle: { color: palette.ink, fontSize: 12 },
    },
  };

  if (style.chartType === "gauge") {
    return buildGaugeOption(data, style, palette, base);
  }

  if (style.chartType === "pie") {
    return buildPieOption(data, style, palette, base);
  }

  const categories = data.categories ?? [];
  const series = data.series ?? [];

  if (style.chartType === "bar") {
    const horizontal = style.echartsVariant === "horizontal";
    return {
      ...base,
      legend: series.length > 1 ? { bottom: 0, textStyle } : undefined,
      xAxis: horizontal
        ? { type: "value", axisLine: { lineStyle: { color: palette.muted } }, splitLine: { lineStyle: { color: withAlpha(palette.muted, 0.2) } } }
        : { type: "category", data: categories, axisLine: { lineStyle: { color: palette.muted } }, axisLabel: { color: palette.muted } },
      yAxis: horizontal
        ? { type: "category", data: categories, axisLine: { lineStyle: { color: palette.muted } }, axisLabel: { color: palette.muted } }
        : { type: "value", name: data.unit, axisLine: { show: false }, splitLine: { lineStyle: { color: withAlpha(palette.muted, 0.2) } }, axisLabel: { color: palette.muted } },
      series: series.map((s, i) => ({
        name: s.name,
        type: "bar",
        data: s.data,
        itemStyle: { color: palette.series[i % palette.series.length], borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
      })),
    };
  }

  if (style.chartType === "line") {
    const smooth = style.echartsVariant === "smooth";
    return {
      ...base,
      legend: series.length > 1 ? { bottom: 0, textStyle } : undefined,
      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: palette.muted } },
        axisLabel: { color: palette.muted },
      },
      yAxis: {
        type: "value",
        name: data.unit,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: withAlpha(palette.muted, 0.2) } },
        axisLabel: { color: palette.muted },
      },
      series: series.map((s, i) => ({
        name: s.name,
        type: "line",
        data: s.data,
        smooth,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: palette.series[i % palette.series.length] },
        itemStyle: { color: palette.series[i % palette.series.length] },
      })),
    };
  }

  if (style.chartType === "area") {
    const stacked = style.echartsVariant === "stacked";
    return {
      ...base,
      legend: series.length > 1 ? { bottom: 0, textStyle } : undefined,
      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: palette.muted } },
        axisLabel: { color: palette.muted },
      },
      yAxis: {
        type: "value",
        name: data.unit,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: withAlpha(palette.muted, 0.2) } },
        axisLabel: { color: palette.muted },
      },
      series: series.map((s, i) => ({
        name: s.name,
        type: "line",
        data: s.data,
        smooth: data.smooth !== false,
        stack: stacked ? "total" : undefined,
        areaStyle: {
          color: withAlpha(palette.series[i % palette.series.length], 0.18),
        },
        lineStyle: { width: 2, color: palette.series[i % palette.series.length] },
        itemStyle: { color: palette.series[i % palette.series.length] },
        symbol: "none",
      })),
    };
  }

  return base;
}

function buildPieOption(
  data: ChartArtifactData,
  style: ChartStyleOption,
  palette: ReturnType<typeof getChartPalette>,
  base: EChartsOption,
): EChartsOption {
  const slices = data.slices ?? [];
  const donut = style.echartsVariant === "donut";
  return {
    ...base,
    legend: { orient: "horizontal", bottom: 0, textStyle: base.textStyle },
    series: [
      {
        type: "pie",
        radius: donut ? ["42%", "68%"] : "68%",
        center: ["50%", "46%"],
        data: slices.map((s) => ({ name: s.name, value: s.value })),
        itemStyle: {
          borderColor: palette.border,
          borderWidth: 1,
        },
        label: { color: palette.ink, fontSize: 11 },
        color: palette.series,
      },
    ],
  };
}

function buildGaugeOption(
  data: ChartArtifactData,
  style: ChartStyleOption,
  palette: ReturnType<typeof getChartPalette>,
  base: EChartsOption,
): EChartsOption {
  const value = data.gaugeValue ?? 0;
  const max = data.gaugeMax ?? 100;
  const pct = Math.min(100, Math.round((value / max) * 100));

  if (style.echartsVariant === "bar") {
    return {
      ...base,
      grid: { left: 48, right: 24, top: 48, bottom: 48 },
      xAxis: { type: "value", max, show: false },
      yAxis: { type: "category", data: [data.gaugeLabel ?? "Progress"], show: false },
      series: [
        {
          type: "bar",
          data: [value],
          barWidth: 24,
          itemStyle: { color: palette.accent, borderRadius: 6 },
          label: {
            show: true,
            position: "right",
            formatter: `${value}${data.unit ? ` ${data.unit}` : ""} / ${max}`,
            color: palette.ink,
          },
        },
      ],
    };
  }

  return {
    ...base,
    series: [
      {
        type: "gauge",
        min: 0,
        max: 100,
        progress: {
          show: true,
          width: 10,
          itemStyle: { color: palette.accent },
        },
        axisLine: {
          lineStyle: {
            width: 10,
            color: [[1, withAlpha(palette.muted, 0.25)]],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: palette.muted, fontSize: 10 },
        pointer: { show: false },
        anchor: { show: false },
        title: {
          show: true,
          offsetCenter: [0, "72%"],
          color: palette.muted,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          formatter: `{value}%`,
          color: palette.ink,
          fontSize: 22,
          offsetCenter: [0, "8%"],
        },
        data: [
          {
            value: pct,
            name: data.gaugeLabel ?? data.unit ?? "",
          },
        ],
      },
    ],
  };
}
