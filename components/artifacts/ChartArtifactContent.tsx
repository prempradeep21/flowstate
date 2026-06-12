"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { useArtifactExportOptional } from "@/components/artifacts/ArtifactExportContext";
import { EChartsRenderer } from "@/components/artifacts/charts/EChartsRenderer";
import {
  ChartToolbar,
  pickStyleForType,
} from "@/components/artifacts/charts/ChartToolbar";
import { VisxRenderer } from "@/components/artifacts/charts/VisxRenderer";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  chartTypeToUIType,
  getDefaultStyleForChartType,
  getStyleById,
  isChartTypeCompatible,
  UI_CHART_TYPES,
} from "@/lib/chartStyles";
import type { UIChartType } from "@/lib/chartTypes";
import type { ChartExportHandle } from "@/lib/artifactExport/types";
import { useCanvasStore } from "@/lib/store";

export function ChartArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "chart" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const data = payload.data;
  const initialUiType = chartTypeToUIType(data.chartType);

  const [uiChartType, setUiChartType] = useState<UIChartType>(initialUiType);
  const [styleId, setStyleId] = useState(
    getDefaultStyleForChartType(data.chartType),
  );

  const compatibleTypes = useMemo(
    () => UI_CHART_TYPES.filter((t) => isChartTypeCompatible(t, data)),
    [data],
  );

  const style = getStyleById(styleId);
  const chartHeight = sidebar ? 160 : fill ? 280 : 240;

  const handleTypeChange = (next: UIChartType) => {
    setUiChartType(next);
    setStyleId(pickStyleForType(next, styleId));
  };

  const exportCtx = useArtifactExportOptional();
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);

  useEffect(() => {
    if (!exportCtx || !style) return;
    exportCtx.setChartMeta({
      styleId,
      uiChartType,
      isDark: canvasTheme === "dark",
    });
    return () => {
      exportCtx.setChartMeta(null);
    };
  }, [canvasTheme, exportCtx, style, styleId, uiChartType]);

  const bindChartRef = (handle: ChartExportHandle | null) => {
    exportCtx?.setChartHandle(handle);
  };

  if (!style) {
    return (
      <div className="p-4 text-sm text-canvas-muted">Unknown chart style.</div>
    );
  }

  const engineStyle = { ...style, chartType: uiChartType };

  return (
    <ArtifactContentStage
      fill={fill}
      artifactId={artifactId}
      showControls={!sidebar}
      className={fill ? "flex min-h-0 flex-col" : ""}
      controls={
        <ChartToolbar
          chartType={uiChartType}
          styleId={styleId}
          compatibleTypes={compatibleTypes}
          onChartTypeChange={handleTypeChange}
          onStyleChange={setStyleId}
        />
      }
    >
      <div className={`flex flex-col ${fill ? "h-full min-h-0" : ""}`}>
        <div className="relative min-h-0 flex-1 px-1 py-2">
          {style.engine === "echarts" ? (
            <EChartsRenderer
              ref={bindChartRef}
              data={data}
              style={engineStyle}
              height={chartHeight}
            />
          ) : (
            <VisxRenderer data={data} style={engineStyle} height={chartHeight} />
          )}
          {data.source ? (
            <p className="px-3 pb-1 text-[10px] text-canvas-muted">
              {data.source}
            </p>
          ) : null}
        </div>
        {payload.description ? (
          <p className="border-t border-canvas-border px-3 py-2 text-xs text-canvas-muted">
            {payload.description}
          </p>
        ) : null}
      </div>
    </ArtifactContentStage>
  );
}
