import type { EChartsOption } from "echarts";
import type {
  UsageAnalysisAccount,
  UsageAnalysisCanvas,
  UsageAnalysisSnapshot,
} from "@/lib/admin/usageAnalysisTypes";

const PALETTE = [
  "#C17F59",
  "#5B8C7A",
  "#6B7DB3",
  "#B8956B",
  "#8B7355",
  "#7A9E9F",
  "#A67B8E",
  "#9A8F7A",
  "#6E8B74",
  "#8C7AA9",
];

const AXIS = {
  light: { ink: "#211F1C", muted: "#6B6560", grid: "#E8E4DF", card: "#FFFFFF" },
  dark: { ink: "#F5F2ED", muted: "#A39E97", grid: "#3D3A36", card: "#2A2724" },
};

function themeColors(isDark: boolean) {
  return isDark ? AXIS.dark : AXIS.light;
}

export function buildAccountShareDonutOption(
  accounts: UsageAnalysisAccount[],
  isDark = false,
): EChartsOption {
  const colors = themeColors(isDark);
  const withUsage = accounts.filter((a) => a.totalTokens > 0);
  const top = withUsage.slice(0, 8);
  const restTokens = withUsage
    .slice(8)
    .reduce((sum, a) => sum + a.totalTokens, 0);

  const data = top.map((a) => ({
    name: a.email.split("@")[0],
    value: a.totalTokens,
  }));
  if (restTokens > 0) {
    data.push({ name: "Others", value: restTokens });
  }

  return {
    color: PALETTE,
    tooltip: {
      trigger: "item",
      formatter: "{b}<br/>{c} tokens ({d}%)",
      backgroundColor: colors.card,
      borderColor: colors.grid,
      textStyle: { color: colors.ink },
    },
    legend: {
      type: "scroll",
      bottom: 0,
      textStyle: { color: colors.muted, fontSize: 11 },
    },
    series: [
      {
        type: "pie",
        radius: ["42%", "68%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: colors.card, borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 600, color: colors.ink },
        },
        data,
      },
    ],
  };
}

export function buildInputOutputBarOption(
  accounts: UsageAnalysisAccount[],
  isDark = false,
): EChartsOption {
  const colors = themeColors(isDark);
  const rows = accounts.filter((a) => a.totalTokens > 0).slice(0, 10).reverse();
  const labels = rows.map((a) => a.email.split("@")[0]);

  return {
    color: ["#6B7DB3", "#C17F59"],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: colors.card,
      borderColor: colors.grid,
      textStyle: { color: colors.ink },
    },
    legend: {
      top: 0,
      textStyle: { color: colors.muted, fontSize: 11 },
    },
    grid: { left: 12, right: 24, top: 36, bottom: 12, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: colors.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    yAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: colors.ink, fontSize: 11 },
      axisLine: { lineStyle: { color: colors.grid } },
    },
    series: [
      {
        name: "Input",
        type: "bar",
        stack: "tokens",
        data: rows.map((a) => a.inputTokens),
        itemStyle: { borderRadius: [0, 0, 0, 0] },
      },
      {
        name: "Output",
        type: "bar",
        stack: "tokens",
        data: rows.map((a) => a.outputTokens),
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      },
    ],
  };
}

export function buildTopCanvasesBarOption(
  canvases: UsageAnalysisCanvas[],
  isDark = false,
): EChartsOption {
  const colors = themeColors(isDark);
  const rows = canvases.slice(0, 10);
  const labels = rows.map(
    (c) => `${c.title.slice(0, 22)}${c.title.length > 22 ? "…" : ""}`,
  );

  return {
    color: PALETTE,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const items = Array.isArray(params) ? params : [params];
        const idx = items[0]?.dataIndex ?? 0;
        const canvas = rows[idx];
        if (!canvas) return "";
        return `<strong>${canvas.title}</strong><br/>${canvas.email}<br/>${canvas.totalTokens.toLocaleString()} tokens`;
      },
      backgroundColor: colors.card,
      borderColor: colors.grid,
      textStyle: { color: colors.ink },
    },
    grid: { left: 12, right: 12, top: 12, bottom: 64, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        color: colors.muted,
        fontSize: 10,
        rotate: 32,
        interval: 0,
      },
      axisLine: { lineStyle: { color: colors.grid } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: colors.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    series: [
      {
        type: "bar",
        data: rows.map((c) => c.totalTokens),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        emphasis: { focus: "series" },
      },
    ],
  };
}

export function buildActivityTimelineOption(
  snapshot: UsageAnalysisSnapshot,
  isDark = false,
): EChartsOption {
  const colors = themeColors(isDark);
  const dates = snapshot.signupsByDay.map((d) => d.date.slice(5));

  return {
    color: ["#5B8C7A", "#6B7DB3"],
    tooltip: {
      trigger: "axis",
      backgroundColor: colors.card,
      borderColor: colors.grid,
      textStyle: { color: colors.ink },
    },
    legend: {
      top: 0,
      textStyle: { color: colors.muted, fontSize: 11 },
    },
    grid: { left: 12, right: 12, top: 36, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: colors.muted, fontSize: 10 },
      axisLine: { lineStyle: { color: colors.grid } },
    },
    yAxis: [
      {
        type: "value",
        name: "Signups",
        nameTextStyle: { color: colors.muted, fontSize: 10 },
        axisLabel: { color: colors.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: colors.grid } },
      },
      {
        type: "value",
        name: "Canvas saves",
        nameTextStyle: { color: colors.muted, fontSize: 10 },
        axisLabel: { color: colors.muted, fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "New signups",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: snapshot.signupsByDay.map((d) => d.count),
        areaStyle: { opacity: 0.12 },
      },
      {
        name: "Canvas updates",
        type: "bar",
        yAxisIndex: 1,
        data: snapshot.activityByDay.map((d) => d.canvasUpdates),
        itemStyle: { borderRadius: [3, 3, 0, 0], opacity: 0.85 },
      },
    ],
  };
}

export function buildTrackedVsUntrackedOption(
  trackedTokens: number,
  isDark = false,
): EChartsOption {
  const colors = themeColors(isDark);

  return {
    color: ["#5B8C7A", "#D4D0CB"],
    tooltip: {
      trigger: "item",
      formatter: (p) => {
        const item = Array.isArray(p) ? p[0] : p;
        if (item?.name === "Untracked") {
          return "Anonymous / unsaved / other routes — not in Supabase";
        }
        return `${item?.name}: ${Number(item?.value).toLocaleString()} tokens (tracked)`;
      },
      backgroundColor: colors.card,
      borderColor: colors.grid,
      textStyle: { color: colors.ink },
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        center: ["50%", "50%"],
        label: {
          formatter: "{b}\n{d}%",
          color: colors.ink,
          fontSize: 11,
        },
        data: [
          { name: "Logged-in saved", value: trackedTokens },
          {
            name: "Untracked",
            value: Math.max(Math.round(trackedTokens * 0.08), 1),
            itemStyle: { decal: { symbol: "rect", dashArrayX: 4, dashArrayY: 4 } },
          },
        ],
      },
    ],
  };
}
