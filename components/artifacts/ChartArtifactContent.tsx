"use client";

import { useEffect, useMemo, useState } from "react";
import { ParentSize } from "@visx/responsive";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { useArtifactMenuDisplayExtras } from "@/components/artifacts/ArtifactMenuControlsContext";
import { useArtifactExportOptional } from "@/components/artifacts/ArtifactExportContext";
import { EChartsRenderer } from "@/components/artifacts/charts/EChartsRenderer";
import { pickStyleForType } from "@/components/artifacts/charts/ChartToolbar";
import { ArtifactMenuChartControls } from "@/components/artifacts/menu/ArtifactMenuControlRows";
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

const FIXED_CHART_HEIGHT = 240;
const SIDEBAR_CHART_HEIGHT = 160;
const FILL_CHART_MIN_HEIGHT = 120;

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
  const fixedChartHeight = sidebar ? SIDEBAR_CHART_HEIGHT : FIXED_CHART_HEIGHT;
  const responsiveHeight = fill && !sidebar;

  const handleTypeChange = (next: UIChartType) => {
    setUiChartType(next);
    setStyleId(pickStyleForType(next, styleId));
  };

  useArtifactMenuDisplayExtras(
    !sidebar,
    () => (
      <ArtifactMenuChartControls
        chartType={uiChartType}
        styleId={styleId}
        compatibleTypes={compatibleTypes}
        onChartTypeChange={handleTypeChange}
        onStyleChange={setStyleId}
      />
    ),
    [compatibleTypes, styleId, uiChartType],
  );

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

  const chartRenderer = (height: number) =>
    style.engine === "echarts" ? (
      <EChartsRenderer
        ref={bindChartRef}
        data={data}
        style={engineStyle}
        height={height}
      />
    ) : (
      <VisxRenderer data={data} style={engineStyle} height={height} />
    );

  return (
    <ArtifactContentStage
      fill={fill}
      artifactId={artifactId}
      className={fill ? "flex min-h-0 flex-col" : ""}
    >
      <div className={`flex flex-col ${fill ? "h-full min-h-0" : ""}`}>
        <div
          className={`relative px-1 py-2 ${
            responsiveHeight ? "min-h-0 flex-1" : ""
          }`}
        >
          {responsiveHeight ? (
            <div className="absolute inset-0 min-h-[120px]">
              <ParentSize>
                {({ width, height }) =>
                  width > 0 && height >= FILL_CHART_MIN_HEIGHT
                    ? chartRenderer(Math.max(FILL_CHART_MIN_HEIGHT, height))
                    : null
                }
              </ParentSize>
            </div>
          ) : (
            chartRenderer(fixedChartHeight)
          )}
        </div>
        {data.source ? (
          <p className="shrink-0 px-3 pb-1 text-[10px] text-canvas-muted">
            {data.source}
          </p>
        ) : null}
        {payload.description ? (
          <p className="shrink-0 border-t border-canvas-border px-3 py-2 text-xs text-canvas-muted">
            {payload.description}
          </p>
        ) : null}
      </div>
    </ArtifactContentStage>
  );
}
