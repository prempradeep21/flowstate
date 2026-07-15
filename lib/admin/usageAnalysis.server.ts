import { getAdminAllowedEmails } from "@/lib/adminAccess";
import { countryName, worldRegionForCountry } from "@/lib/analytics/visitorSource";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type {
  LikelyRegion,
  UsageAnalysisAccount,
  UsageAnalysisCanvas,
  UsageAnalysisSnapshot,
  UsageAnalysisSnapshotRow,
  VisitorAnalytics,
} from "@/lib/admin/usageAnalysisTypes";
import {
  CACHE_READ_COST_MULTIPLIER,
  CACHE_WRITE_COST_MULTIPLIER,
  USAGE_ANALYSIS_LIMITATIONS,
  USAGE_ANALYSIS_TIMEZONE,
} from "@/lib/admin/usageAnalysisTypes";

type CanvasRow = {
  id: string;
  owner_id: string;
  title: string;
  updated_at: string;
  content_edited_at?: string | null;
  state: {
    cards?: Record<
      string,
      {
        turnUsage?: {
          inputTokens?: number;
          outputTokens?: number;
          cacheReadTokens?: number;
          cacheCreationTokens?: number;
        };
      }
    >;
  } | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  updated_at: string;
};

type AuthUserRow = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: { full_name?: string; name?: string };
};

function inferLikelyRegion(email: string): LikelyRegion {
  const lower = email.trim().toLowerCase();
  if (lower.endsWith(".edu")) return "US";
  if (getAdminAllowedEmails().includes(lower)) return "India";
  if (lower.endsWith("@gmail.com") || lower.endsWith("@googlemail.com")) {
    return "India";
  }
  return "Unknown";
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function maxIso(...values: Array<string | null | undefined>): string | null {
  let max: string | null = null;
  for (const value of values) {
    if (!value) continue;
    if (!max || value > max) max = value;
  }
  return max;
}

function buildLastActivityByOwner(
  canvases: CanvasRow[],
): Map<string, string> {
  const lastActivityByOwner = new Map<string, string>();

  for (const canvas of canvases) {
    const activityAt = maxIso(canvas.updated_at, canvas.content_edited_at);
    if (!activityAt) continue;

    const prev = lastActivityByOwner.get(canvas.owner_id);
    if (!prev || activityAt > prev) {
      lastActivityByOwner.set(canvas.owner_id, activityAt);
    }
  }

  return lastActivityByOwner;
}

function extractCardUsage(canvas: CanvasRow): {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  cardsWithUsage: number;
} {
  const cards = canvas.state?.cards ?? {};
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;
  let cardsWithUsage = 0;

  for (const card of Object.values(cards)) {
    if (!card?.turnUsage) continue;
    const input = card.turnUsage.inputTokens ?? 0;
    const output = card.turnUsage.outputTokens ?? 0;
    const cacheRead = card.turnUsage.cacheReadTokens ?? 0;
    const cacheCreation = card.turnUsage.cacheCreationTokens ?? 0;
    if (input === 0 && output === 0 && cacheRead === 0 && cacheCreation === 0) {
      continue;
    }
    inputTokens += input;
    outputTokens += output;
    cacheReadTokens += cacheRead;
    cacheCreationTokens += cacheCreation;
    cardsWithUsage += 1;
  }

  return {
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
    cardsWithUsage,
  };
}

function buildSignupsByDay(
  users: AuthUserRow[],
  days = 30,
): Array<{ date: string; count: number }> {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    counts.set(dayKey(d.toISOString()), 0);
  }

  for (const user of users) {
    if (!user.created_at) continue;
    const key = dayKey(user.created_at);
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

function buildActivityByDay(
  canvases: CanvasRow[],
  days = 30,
): Array<{ date: string; canvasUpdates: number }> {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    counts.set(dayKey(d.toISOString()), 0);
  }

  for (const canvas of canvases) {
    const key = dayKey(canvas.updated_at);
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].map(([date, canvasUpdates]) => ({
    date,
    canvasUpdates,
  }));
}

function buildInsights(input: {
  accounts: UsageAnalysisAccount[];
  topCanvases: UsageAnalysisCanvas[];
  summary: UsageAnalysisSnapshot["summary"];
  visitors: VisitorAnalytics | null;
}): string[] {
  const insights: string[] = [];
  const { accounts, topCanvases, summary, visitors } = input;

  if (visitors && visitors.uniqueVisitors > 0) {
    const parts: string[] = [
      `${visitors.uniqueVisitors.toLocaleString()} unique logged-out visitor${
        visitors.uniqueVisitors === 1 ? "" : "s"
      } in the last ${visitors.windowDays} days`,
    ];
    if (visitors.topSource) parts.push(`top source ${visitors.topSource.name}`);
    if (visitors.topCountry) parts.push(`most from ${visitors.topCountry.name}`);
    insights.push(`${parts.join(" · ")}.`);
  }

  if (accounts.length >= 2 && summary.topTwoAccountsSharePct >= 50) {
    const topTwo = accounts.slice(0, 2).map((a) => a.email.split("@")[0]);
    insights.push(
      `Two accounts drive ${summary.topTwoAccountsSharePct}% of tracked usage — ${topTwo.join(" + ")}.`,
    );
  }

  const usAccountsWithUsage = accounts.filter(
    (a) => a.likelyRegion === "US" && a.totalTokens > 0,
  );
  if (usAccountsWithUsage.length === 0 && accounts.some((a) => a.likelyRegion === "US")) {
    insights.push(
      "US-linked accounts show activity but zero saved token usage — GA US traffic is likely bots, not LLM consumers.",
    );
  } else if (usAccountsWithUsage.length === 0) {
    insights.push(
      "No tracked token usage from US-linked accounts; non-Indian GA hits are unlikely driving Anthropic cost.",
    );
  }

  if (topCanvases.length >= 4 && summary.topFourCanvasesSharePct >= 40) {
    insights.push(
      `${topCanvases.slice(0, 4).length} canvases account for ${summary.topFourCanvasesSharePct}% of all tracked tokens.`,
    );
  }

  if (summary.usersWithUsage < summary.totalUsers) {
    const idle = summary.totalUsers - summary.usersWithUsage;
    insights.push(
      `${idle} signed-up account${idle === 1 ? "" : "s"} ha${idle === 1 ? "s" : "ve"} no saved turnUsage yet.`,
    );
  }

  insights.push(
    "Anonymous and unsaved session usage is not in this dataset — compare with Anthropic console for true spend.",
  );

  return insights.slice(0, 5);
}

type VisitorEventRow = {
  created_at: string;
  visitor_id: string;
  source: string | null;
  country: string | null;
  world_region: string | null;
};

/**
 * Aggregate anonymous (logged-out) visitor telemetry from `visitor_events` over
 * a trailing window. Unique counts dedupe on the first-party cookie id; source
 * is attributed first-touch (the earliest event per visitor).
 */
export async function computeVisitorAnalytics(
  supabase: ReturnType<typeof createServiceRoleClient>,
  windowDays = 30,
): Promise<VisitorAnalytics | null> {
  const since = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("visitor_events")
    .select("created_at, visitor_id, source, country, world_region")
    .eq("is_authenticated", false)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(100000);

  // A missing table (migration not applied yet) should not break the snapshot.
  if (error) return null;

  const rows = (data ?? []) as VisitorEventRow[];
  if (rows.length === 0) {
    return {
      windowDays,
      uniqueVisitors: 0,
      pageViews: 0,
      uniqueVisitorsToday: 0,
      topCountry: null,
      topSource: null,
      byCountry: [],
      byWorldRegion: [],
      bySource: [],
      byDay: buildEmptyVisitorDays(windowDays),
    };
  }

  // First event per visitor drives first-touch source + geo; later events still
  // count toward page views.
  const firstByVisitor = new Map<string, VisitorEventRow>();
  const dayVisitors = new Map<string, Set<string>>();
  const dayPageViews = new Map<string, number>();
  const todayKey = dayKey(new Date().toISOString());
  const todayVisitors = new Set<string>();

  for (const row of rows) {
    if (!firstByVisitor.has(row.visitor_id)) {
      firstByVisitor.set(row.visitor_id, row);
    }
    const key = dayKey(row.created_at);
    if (!dayVisitors.has(key)) dayVisitors.set(key, new Set());
    dayVisitors.get(key)!.add(row.visitor_id);
    dayPageViews.set(key, (dayPageViews.get(key) ?? 0) + 1);
    if (key === todayKey) todayVisitors.add(row.visitor_id);
  }

  const countryCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();

  for (const first of firstByVisitor.values()) {
    const country = first.country?.toUpperCase() ?? null;
    if (country) countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    const region = first.world_region ?? worldRegionForCountry(country);
    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
    const source = first.source?.trim() || "Direct";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }

  const byCountry = [...countryCounts.entries()]
    .map(([code, count]) => ({ code, name: countryName(code), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const byWorldRegion = [...regionCounts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  const bySource = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byDay = buildEmptyVisitorDays(windowDays).map(({ date }) => ({
    date,
    visitors: dayVisitors.get(date)?.size ?? 0,
    pageViews: dayPageViews.get(date) ?? 0,
  }));

  return {
    windowDays,
    uniqueVisitors: firstByVisitor.size,
    pageViews: rows.length,
    uniqueVisitorsToday: todayVisitors.size,
    topCountry: byCountry[0]
      ? { name: byCountry[0].name, count: byCountry[0].count }
      : null,
    topSource: bySource[0]
      ? { name: bySource[0].source, count: bySource[0].count }
      : null,
    byCountry,
    byWorldRegion,
    bySource,
    byDay,
  };
}

function buildEmptyVisitorDays(
  days: number,
): Array<{ date: string; visitors: number; pageViews: number }> {
  const out: Array<{ date: string; visitors: number; pageViews: number }> = [];
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    out.push({ date: dayKey(d.toISOString()), visitors: 0, pageViews: 0 });
  }
  return out;
}

export async function computeUsageAnalysisSnapshot(): Promise<{
  payload: UsageAnalysisSnapshot;
  stats: { total_tokens: number; user_count: number; duration_ms: number };
}> {
  const started = Date.now();
  const supabase = createServiceRoleClient();

  const [
    { data: canvases, error: canvasError },
    { data: profiles, error: profileError },
    { data: authData, error: authError },
    visitors,
  ] = await Promise.all([
    supabase
      .from("canvases")
      .select("id, owner_id, title, updated_at, content_edited_at, state"),
    supabase.from("profiles").select("id, display_name, updated_at"),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    computeVisitorAnalytics(supabase),
  ]);

  if (canvasError) throw new Error(canvasError.message);
  if (profileError) throw new Error(profileError.message);
  if (authError) throw new Error(authError.message);

  const canvasRows = (canvases ?? []) as CanvasRow[];
  const profileRows = (profiles ?? []) as ProfileRow[];
  const profileMap = new Map(profileRows.map((p) => [p.id, p.display_name]));
  const profileUpdatedAtMap = new Map(
    profileRows.map((p) => [p.id, p.updated_at]),
  );
  const users = (authData?.users ?? []) as AuthUserRow[];
  const userById = new Map(users.map((u) => [u.id, u]));
  const lastActivityByOwner = buildLastActivityByOwner(canvasRows);

  const accountAgg = new Map<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheCreationTokens: number;
      canvasesWithUsage: Set<string>;
    }
  >();
  const topCanvases: UsageAnalysisCanvas[] = [];

  for (const canvas of canvasRows) {
    const usage = extractCardUsage(canvas);
    if (
      usage.inputTokens === 0 &&
      usage.outputTokens === 0 &&
      usage.cacheReadTokens === 0 &&
      usage.cacheCreationTokens === 0
    ) {
      continue;
    }

    const totalTokens = usage.inputTokens + usage.outputTokens;
    const user = userById.get(canvas.owner_id);
    const email = user?.email ?? "unknown@user";

    topCanvases.push({
      email,
      title: canvas.title,
      totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheReadTokens: usage.cacheReadTokens,
      cacheCreationTokens: usage.cacheCreationTokens,
      cardsWithUsage: usage.cardsWithUsage,
      updatedAt: canvas.updated_at,
    });

    const prev = accountAgg.get(canvas.owner_id) ?? {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      canvasesWithUsage: new Set<string>(),
    };
    prev.inputTokens += usage.inputTokens;
    prev.outputTokens += usage.outputTokens;
    prev.cacheReadTokens += usage.cacheReadTokens;
    prev.cacheCreationTokens += usage.cacheCreationTokens;
    prev.canvasesWithUsage.add(canvas.id);
    accountAgg.set(canvas.owner_id, prev);
  }

  topCanvases.sort((a, b) => b.totalTokens - a.totalTokens);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreationTokens = 0;

  const accounts: UsageAnalysisAccount[] = users
    .map((user) => {
      const agg = accountAgg.get(user.id);
      const inputTokens = agg?.inputTokens ?? 0;
      const outputTokens = agg?.outputTokens ?? 0;
      const cacheReadTokens = agg?.cacheReadTokens ?? 0;
      const cacheCreationTokens = agg?.cacheCreationTokens ?? 0;
      const totalTokens = inputTokens + outputTokens;
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalCacheReadTokens += cacheReadTokens;
      totalCacheCreationTokens += cacheCreationTokens;

      const email = user.email ?? "unknown@user";
      const metaName =
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;

      return {
        email,
        displayName: profileMap.get(user.id) ?? metaName,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheCreationTokens,
        totalTokens,
        sharePct: 0,
        canvasesWithUsage: agg?.canvasesWithUsage.size ?? 0,
        lastActiveAt: maxIso(
          lastActivityByOwner.get(user.id),
          profileUpdatedAtMap.get(user.id),
          user.last_sign_in_at,
        ),
        signupAt: user.created_at ?? new Date(0).toISOString(),
        likelyRegion: inferLikelyRegion(email),
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens);

  const totalTokens = totalInputTokens + totalOutputTokens;
  for (const account of accounts) {
    account.sharePct =
      totalTokens > 0
        ? Math.round((account.totalTokens / totalTokens) * 1000) / 10
        : 0;
  }

  const usersWithUsage = accounts.filter((a) => a.totalTokens > 0).length;
  const canvasesWithUsage = topCanvases.length;
  const topAccount = accounts.find((a) => a.totalTokens > 0) ?? null;
  const topTwoShare =
    totalTokens > 0
      ? Math.round(
          ((accounts[0]?.totalTokens ?? 0) + (accounts[1]?.totalTokens ?? 0)) /
            totalTokens *
            1000,
        ) / 10
      : 0;
  const topFourCanvasTokens = topCanvases
    .slice(0, 4)
    .reduce((sum, c) => sum + c.totalTokens, 0);
  const topFourCanvasesSharePct =
    totalTokens > 0
      ? Math.round((topFourCanvasTokens / totalTokens) * 1000) / 10
      : 0;

  // Billing-equivalent savings from caching: cache reads would otherwise be
  // full-price input; instead they bill at ~10% (reads) / ~125% (writes).
  const cachedTokens = totalCacheReadTokens + totalCacheCreationTokens;
  const withoutCaching = totalInputTokens + cachedTokens;
  const withCaching =
    totalInputTokens +
    totalCacheReadTokens * CACHE_READ_COST_MULTIPLIER +
    totalCacheCreationTokens * CACHE_WRITE_COST_MULTIPLIER;
  const cacheSavingsPct =
    withoutCaching > 0
      ? Math.round((1 - withCaching / withoutCaching) * 1000) / 10
      : 0;

  const summary: UsageAnalysisSnapshot["summary"] = {
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCacheReadTokens,
    totalCacheCreationTokens,
    cacheSavingsPct,
    usersWithUsage,
    totalUsers: users.length,
    canvasesWithUsage,
    topAccountEmail: topAccount?.email ?? null,
    topAccountSharePct: topAccount?.sharePct ?? 0,
    topTwoAccountsSharePct: topTwoShare,
    topFourCanvasesSharePct,
  };

  const payload: UsageAnalysisSnapshot = {
    computedAt: new Date().toISOString(),
    timezone: USAGE_ANALYSIS_TIMEZONE,
    summary,
    accounts,
    topCanvases: topCanvases.slice(0, 15),
    signupsByDay: buildSignupsByDay(users),
    activityByDay: buildActivityByDay(canvasRows),
    visitors,
    insights: buildInsights({ accounts, topCanvases, summary, visitors }),
    limitations: [...USAGE_ANALYSIS_LIMITATIONS],
  };

  return {
    payload,
    stats: {
      total_tokens: totalTokens,
      user_count: users.length,
      duration_ms: Date.now() - started,
    },
  };
}

export async function saveUsageAnalysisSnapshot(): Promise<UsageAnalysisSnapshotRow> {
  const { payload, stats } = await computeUsageAnalysisSnapshot();
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("usage_analysis_snapshots")
    .insert({
      timezone: USAGE_ANALYSIS_TIMEZONE,
      payload,
      stats,
    })
    .select("id, computed_at, timezone, payload, stats")
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as UsageAnalysisSnapshotRow;
}

export async function fetchLatestUsageAnalysisSnapshot(): Promise<UsageAnalysisSnapshotRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("usage_analysis_snapshots")
    .select("id, computed_at, timezone, payload, stats")
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as unknown as UsageAnalysisSnapshotRow;
}

export function formatUsageAnalysisTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: USAGE_ANALYSIS_TIMEZONE,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
