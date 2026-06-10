"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import type { ChartArtifactData } from "@/lib/chartTypes";
import type { ChartStyleOption } from "@/lib/chartTypes";
import { buildEChartsOption } from "@/lib/echartsOptions";
import { useCanvasStore } from "@/lib/store";

export function EChartsRenderer({
  data,
  style,
  height,
}: {
  data: ChartArtifactData;
  style: ChartStyleOption;
  height: number;
}) {
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const isDark = canvasTheme === "dark";

  const option = useMemo(
    () => buildEChartsOption(data, style, isDark),
    [data, style, isDark],
  );

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%", background: "transparent" }}
      opts={{ renderer: "canvas" }}
      notMerge
    />
  );
}
