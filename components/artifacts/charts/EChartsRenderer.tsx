"use client";

import ReactECharts from "echarts-for-react";
import { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from "react";
import type { ChartArtifactData } from "@/lib/chartTypes";
import type { ChartStyleOption } from "@/lib/chartTypes";
import type { ChartExportHandle } from "@/lib/artifactExport/types";
import { useArtifactChartPalette } from "@/hooks/useArtifactChartPalette";
import { buildEChartsOption } from "@/lib/echartsOptions";
import { getChartPalette } from "@/lib/echartsTheme";
import { useCanvasStore } from "@/lib/store";

export const EChartsRenderer = forwardRef<
  ChartExportHandle,
  {
    data: ChartArtifactData;
    style: ChartStyleOption;
    height: number;
  }
>(function EChartsRenderer({ data, style, height }, ref) {
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const isDark = canvasTheme === "dark";
  const packPalette = useArtifactChartPalette();
  const chartRef = useRef<ReactECharts>(null);

  const option = useMemo(
    () => buildEChartsOption(data, style, isDark, packPalette),
    [data, style, isDark, packPalette],
  );

  useImperativeHandle(ref, () => ({
    getPngDataUrl: async (pixelRatio = 3) => {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) return null;
      try {
        return instance.getDataURL({
          type: "png",
          pixelRatio,
          backgroundColor: getChartPalette(isDark, packPalette).bg,
        });
      } catch {
        return null;
      }
    },
  }));

  useEffect(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;
    const timer = window.setTimeout(() => instance.resize(), 0);
    return () => window.clearTimeout(timer);
  }, [height, option]);

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height, width: "100%", background: "transparent" }}
      opts={{ renderer: "canvas" }}
      notMerge
    />
  );
});
