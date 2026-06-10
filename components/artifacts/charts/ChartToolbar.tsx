"use client";

import type { UIChartType } from "@/lib/chartTypes";
import {
  getDefaultStyleForUIType,
  getStylesForUIChartType,
  UI_CHART_TYPE_LABELS,
  UI_CHART_TYPES,
} from "@/lib/chartStyles";

export function ChartToolbar({
  chartType,
  styleId,
  compatibleTypes,
  onChartTypeChange,
  onStyleChange,
}: {
  chartType: UIChartType;
  styleId: string;
  compatibleTypes: UIChartType[];
  onChartTypeChange: (type: UIChartType) => void;
  onStyleChange: (styleId: string) => void;
}) {
  const styles = getStylesForUIChartType(chartType);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-canvas-border px-3 py-2">
      <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-canvas-muted">
        Chart
        <select
          value={chartType}
          onChange={(e) => onChartTypeChange(e.target.value as UIChartType)}
          className="rounded border border-canvas-border bg-canvas-card px-2 py-1 text-[11px] normal-case tracking-normal text-canvas-ink focus:outline-none focus:ring-1 focus:ring-canvas-accent"
        >
          {UI_CHART_TYPES.map((t) => (
            <option
              key={t}
              value={t}
              disabled={!compatibleTypes.includes(t)}
            >
              {UI_CHART_TYPE_LABELS[t]}
              {!compatibleTypes.includes(t) ? " (needs data)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-canvas-muted">
        Style
        <select
          value={styleId}
          onChange={(e) => onStyleChange(e.target.value)}
          className="rounded border border-canvas-border bg-canvas-card px-2 py-1 text-[11px] normal-case tracking-normal text-canvas-ink focus:outline-none focus:ring-1 focus:ring-canvas-accent"
        >
          {styles.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function pickStyleForType(
  uiType: UIChartType,
  currentStyleId: string,
): string {
  const styles = getStylesForUIChartType(uiType);
  if (styles.some((s) => s.id === currentStyleId)) return currentStyleId;
  return getDefaultStyleForUIType(uiType);
}
