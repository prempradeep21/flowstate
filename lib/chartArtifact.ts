import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { ChartArtifactData, ChartSeriesItem, ChartSlice, ChartType } from "@/lib/chartTypes";

export type {
  ChartArtifactData,
  ChartSeriesItem,
  ChartSlice,
  ChartType,
  UIChartType,
} from "@/lib/chartTypes";

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function normalizeSeries(raw: unknown): ChartSeriesItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ChartSeriesItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "Series";
    if (!name) continue;
    const dataRaw = o.data;
    if (!Array.isArray(dataRaw)) continue;
    const data = dataRaw
      .map(coerceNumber)
      .filter((n): n is number => n !== null);
    if (data.length === 0) continue;
    out.push({ name, data });
  }
  return out;
}

function normalizeSlices(raw: unknown): ChartSlice[] {
  if (!Array.isArray(raw)) return [];
  const out: ChartSlice[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const value = coerceNumber(o.value);
    if (!name || value === null || value < 0) continue;
    out.push({ name, value });
  }
  return out;
}

function normalizeCategories(raw: unknown, series: ChartSeriesItem[]): string[] {
  if (Array.isArray(raw)) {
    const cats = raw
      .map((c) => (typeof c === "string" ? c.trim() : String(c ?? "")))
      .filter(Boolean);
    if (cats.length > 0) return cats;
  }
  const maxLen = series.reduce((m, s) => Math.max(m, s.data.length), 0);
  return Array.from({ length: maxLen }, (_, i) => String(i + 1));
}

export function normalizeChartArtifactData(raw: unknown): ChartArtifactData {
  const o =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const chartType: ChartType =
    o.chartType === "bar" ||
    o.chartType === "area" ||
    o.chartType === "line" ||
    o.chartType === "pie" ||
    o.chartType === "gauge"
      ? o.chartType
      : "line";

  if (chartType === "gauge") {
    const gaugeValue = coerceNumber(o.gaugeValue) ?? 0;
    const gaugeMax = coerceNumber(o.gaugeMax) ?? 100;
    return {
      chartType: "gauge",
      gaugeValue: Math.max(0, gaugeValue),
      gaugeMax: gaugeMax > 0 ? gaugeMax : 100,
      gaugeLabel:
        typeof o.gaugeLabel === "string" ? o.gaugeLabel.trim() : undefined,
      unit: typeof o.unit === "string" ? o.unit.trim() : undefined,
      source: typeof o.source === "string" ? o.source.trim() : undefined,
    };
  }

  if (chartType === "pie") {
    const slices = normalizeSlices(o.slices ?? o.series);
    return {
      chartType: "pie",
      slices,
      unit: typeof o.unit === "string" ? o.unit.trim() : undefined,
      source: typeof o.source === "string" ? o.source.trim() : undefined,
    };
  }

  const series = normalizeSeries(o.series);
  const categories = normalizeCategories(o.categories, series);

  return {
    chartType,
    categories,
    series,
    unit: typeof o.unit === "string" ? o.unit.trim() : undefined,
    source: typeof o.source === "string" ? o.source.trim() : undefined,
    stacked: o.stacked === true,
    smooth: o.smooth !== false,
  };
}

export function chartDataHasSeries(data: ChartArtifactData): boolean {
  if (data.chartType === "gauge") {
    return data.gaugeMax != null && data.gaugeMax > 0;
  }
  if (data.chartType === "pie") {
    return (data.slices?.length ?? 0) > 0;
  }
  return (data.series?.length ?? 0) > 0;
}

export function normalizeChartPayload(
  payload: Extract<ArtifactPayload, { type: "chart" }>,
): Extract<ArtifactPayload, { type: "chart" }> {
  return {
    ...payload,
    data: normalizeChartArtifactData(payload.data),
  };
}

export function validateChartEmit(data: ChartArtifactData): string | null {
  if (!chartDataHasSeries(data)) {
    return "emit_artifact chart requires populated series, slices, or gauge values.";
  }
  if (
    data.chartType !== "pie" &&
    data.chartType !== "gauge" &&
    data.series?.some((s) => s.data.length === 0)
  ) {
    return "emit_artifact chart series must include numeric data arrays.";
  }
  return null;
}
