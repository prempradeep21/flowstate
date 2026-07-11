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

  const selectClass =
    "h-6 min-w-0 rounded-canvas-md border border-canvas-border bg-canvas-card py-0.5 pl-2 pr-6 text-canvas-caption normal-case tracking-normal text-canvas-ink outline-none transition-colors focus-visible:border-canvas-accent/50 focus-visible:ring-1 focus-visible:ring-canvas-accent/30";

  return (
    <div className="flex h-full min-w-0 flex-1 items-center gap-2 overflow-hidden">
      <label className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide text-canvas-muted">
        Chart
        <select
          value={chartType}
          onChange={(e) => onChartTypeChange(e.target.value as UIChartType)}
          className={`${selectClass} min-w-[4.25rem]`}
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
      <label className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide text-canvas-muted">
        Style
        <select
          value={styleId}
          onChange={(e) => onStyleChange(e.target.value)}
          className={`${selectClass} min-w-[6.5rem]`}
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
