import type { ChartType } from "@/lib/chartTypes";

export interface ChartFetchParams {
  topic: string;
  chartType: ChartType;
  timeRange?: string;
  unit?: string;
}

export interface ChartFetchResult {
  success: boolean;
  categories?: string[];
  series?: { name: string; data: number[] }[];
  slices?: { name: string; value: number }[];
  gaugeValue?: number;
  gaugeMax?: number;
  source?: string;
  notes?: string;
  /** Raw research when structured parse is not possible */
  research?: string;
  error?: string;
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

export async function fetchChartData(
  params: ChartFetchParams,
): Promise<ChartFetchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error:
        "TAVILY_API_KEY is not configured. Use numbers from the user message or your knowledge, then call emit_artifact with type chart.",
      notes: "Set TAVILY_API_KEY for automatic server-side research.",
    };
  }

  const query = [
    params.topic,
    params.timeRange ? `(${params.timeRange})` : "",
    params.unit ? `in ${params.unit}` : "",
    "statistics data numbers",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 6,
        include_answer: true,
      }),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Tavily search failed (${res.status}). Try user-provided numbers or model knowledge.`,
      };
    }

    const body = (await res.json()) as {
      answer?: string;
      results?: TavilyResult[];
    };

    const snippets = (body.results ?? [])
      .map((r) => `${r.title ?? ""}\n${r.content ?? ""}\n${r.url ?? ""}`)
      .join("\n\n");
    const research = [body.answer, snippets].filter(Boolean).join("\n\n---\n\n");
    const sources = (body.results ?? [])
      .map((r) => r.url)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");

    const parsed = tryParseChartNumbers(research, params.chartType);

    if (parsed) {
      return {
        success: true,
        ...parsed,
        source: sources || "Tavily search",
        notes: "Parsed from web research — verify independently.",
      };
    }

    return {
      success: false,
      research,
      source: sources || "Tavily search",
      notes:
        "Could not auto-parse numeric series. Read the research below and populate emit_artifact chart data manually.",
    };
  } catch (err) {
    return {
      success: false,
      error: `Chart data fetch error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Best-effort extraction of year/value or label/value pairs from text. */
function tryParseChartNumbers(
  text: string,
  chartType: ChartType,
): Omit<ChartFetchResult, "success" | "source" | "notes"> | null {
  const yearPairs: { label: string; value: number }[] = [];
  const yearRe = /\b((?:19|20)\d{2})\b[^0-9\n]{0,24}([\d,.]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = yearRe.exec(text)) !== null) {
    const label = m[1];
    const num = parseFloat(m[2].replace(/,/g, ""));
    if (label && Number.isFinite(num)) {
      yearPairs.push({ label, value: num });
    }
  }

  if (chartType === "pie") {
    const sliceRe = /([A-Za-z][A-Za-z0-9\s]{1,30}?)[\s:–-]+(\d+(?:\.\d+)?)\s*%/g;
    const slices: { name: string; value: number }[] = [];
    while ((m = sliceRe.exec(text)) !== null) {
      slices.push({ name: m[1].trim(), value: parseFloat(m[2]) });
    }
    if (slices.length >= 2) return { slices };
  }

  if (
    (chartType === "line" || chartType === "area") &&
    yearPairs.length >= 3
  ) {
    const seen = new Set<string>();
    const unique = yearPairs.filter((p) => {
      if (seen.has(p.label)) return false;
      seen.add(p.label);
      return true;
    });
    unique.sort((a, b) => a.label.localeCompare(b.label));
    return {
      categories: unique.map((p) => p.label),
      series: [{ name: "Value", data: unique.map((p) => p.value) }],
    };
  }

  if (chartType === "bar") {
    const barRe = /([A-Za-z][A-Za-z0-9\s]{1,24}?)[\s:–-]+([\d,.]+)/g;
    const bars: { name: string; value: number }[] = [];
    while ((m = barRe.exec(text)) !== null) {
      const val = parseFloat(m[2].replace(/,/g, ""));
      if (Number.isFinite(val)) bars.push({ name: m[1].trim(), value: val });
    }
    if (bars.length >= 2) {
      return {
        categories: bars.map((b) => b.name),
        series: [{ name: "Value", data: bars.map((b) => b.value) }],
      };
    }
  }

  return null;
}
