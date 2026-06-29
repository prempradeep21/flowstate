import { getAdminAllowedEmails } from "@/lib/adminAccess";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type {
  LikelyRegion,
  UsageAnalysisAccount,
  UsageAnalysisCanvas,
  UsageAnalysisSnapshot,
  UsageAnalysisSnapshotRow,
} from "@/lib/admin/usageAnalysisTypes";
import {
  USAGE_ANALYSIS_LIMITATIONS,
  USAGE_ANALYSIS_TIMEZONE,
} from "@/lib/admin/usageAnalysisTypes";

type CanvasRow = {
  id: string;
  owner_id: string;
  title: string;
  updated_at: string;
  state: {
    cards?: Record<
      string,
      {
        turnUsage?: { inputTokens?: number; outputTokens?: number };
      }
    >;
  } | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
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

function extractCardUsage(canvas: CanvasRow): {
  inputTokens: number;
  outputTokens: number;
  cardsWithUsage: number;
} {
  const cards = canvas.state?.cards ?? {};
  let inputTokens = 0;
  let outputTokens = 0;
  let cardsWithUsage = 0;

  for (const card of Object.values(cards)) {
    if (!card?.turnUsage) continue;
    const input = card.turnUsage.inputTokens ?? 0;
    const output = card.turnUsage.outputTokens ?? 0;
    if (input === 0 && output === 0) continue;
    inputTokens += input;
    outputTokens += output;
    cardsWithUsage += 1;
  }

  return { inputTokens, outputTokens, cardsWithUsage };
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
}): string[] {
  const insights: string[] = [];
  const { accounts, topCanvases, summary } = input;

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
  ] = await Promise.all([
    supabase
      .from("canvases")
      .select("id, owner_id, title, updated_at, state"),
    supabase.from("profiles").select("id, display_name"),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (canvasError) throw new Error(canvasError.message);
  if (profileError) throw new Error(profileError.message);
  if (authError) throw new Error(authError.message);

  const canvasRows = (canvases ?? []) as CanvasRow[];
  const profileMap = new Map(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p.display_name]),
  );
  const users = (authData?.users ?? []) as AuthUserRow[];
  const userById = new Map(users.map((u) => [u.id, u]));

  const accountAgg = new Map<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      canvasesWithUsage: Set<string>;
    }
  >();
  const topCanvases: UsageAnalysisCanvas[] = [];

  for (const canvas of canvasRows) {
    const usage = extractCardUsage(canvas);
    if (usage.inputTokens === 0 && usage.outputTokens === 0) continue;

    const totalTokens = usage.inputTokens + usage.outputTokens;
    const user = userById.get(canvas.owner_id);
    const email = user?.email ?? "unknown@user";

    topCanvases.push({
      email,
      title: canvas.title,
      totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cardsWithUsage: usage.cardsWithUsage,
      updatedAt: canvas.updated_at,
    });

    const prev = accountAgg.get(canvas.owner_id) ?? {
      inputTokens: 0,
      outputTokens: 0,
      canvasesWithUsage: new Set<string>(),
    };
    prev.inputTokens += usage.inputTokens;
    prev.outputTokens += usage.outputTokens;
    prev.canvasesWithUsage.add(canvas.id);
    accountAgg.set(canvas.owner_id, prev);
  }

  topCanvases.sort((a, b) => b.totalTokens - a.totalTokens);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const accounts: UsageAnalysisAccount[] = users
    .map((user) => {
      const agg = accountAgg.get(user.id);
      const inputTokens = agg?.inputTokens ?? 0;
      const outputTokens = agg?.outputTokens ?? 0;
      const totalTokens = inputTokens + outputTokens;
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;

      const email = user.email ?? "unknown@user";
      const metaName =
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;

      return {
        email,
        displayName: profileMap.get(user.id) ?? metaName,
        inputTokens,
        outputTokens,
        totalTokens,
        sharePct: 0,
        canvasesWithUsage: agg?.canvasesWithUsage.size ?? 0,
        lastSignInAt: user.last_sign_in_at ?? null,
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

  const summary: UsageAnalysisSnapshot["summary"] = {
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
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
    insights: buildInsights({ accounts, topCanvases, summary }),
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
