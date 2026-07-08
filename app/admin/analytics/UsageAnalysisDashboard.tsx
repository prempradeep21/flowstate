"use client";

import ReactECharts from "echarts-for-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  UsageAnalysisAccount,
  UsageAnalysisSnapshot,
} from "@/lib/admin/usageAnalysisTypes";
import {
  buildAccountShareDonutOption,
  buildActivityTimelineOption,
  buildInputOutputBarOption,
  buildTopCanvasesBarOption,
  buildTrackedVsUntrackedOption,
} from "@/lib/admin/usageChartOptions";
import type { QaTurnFailureRow } from "@/lib/admin/qaTurnEventsTypes";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";

type SortKey =
  | "email"
  | "totalTokens"
  | "sharePct"
  | "canvasesWithUsage"
  | "likelyRegion";

function fmt(n: number | undefined | null): string {
  // Older snapshots predate cache fields — coerce missing values to 0 so the
  // dashboard never crashes on `undefined.toLocaleString()`.
  const v = Number.isFinite(Number(n)) ? Number(n) : 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Older snapshots stored sign-in time under `lastSignInAt`. */
function accountLastActive(
  account: UsageAnalysisAccount & { lastSignInAt?: string | null },
): string | null {
  return account.lastActiveAt ?? account.lastSignInAt ?? null;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {fmt(display)}
      {suffix}
    </>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="usage-kpi-card relative overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80"
        style={{ background: accent ?? "linear-gradient(90deg, #C17F59, #6B7DB3)" }}
      />
      <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-medium tabular-nums text-canvas-ink">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-canvas-body-sm text-canvas-muted">{sub}</p>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`usage-chart-card rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-shadow hover:shadow-lg ${className}`}
    >
      <h3 className="font-display text-lg font-medium text-canvas-ink">{title}</h3>
      {description ? (
        <p className="mt-0.5 text-canvas-body-sm text-canvas-muted">{description}</p>
      ) : null}
      <div className="mt-3 min-h-[280px]">{children}</div>
    </div>
  );
}

function exportAccountsCsv(accounts: UsageAnalysisAccount[]) {
  const header =
    "email,display_name,input_tokens,output_tokens,cache_read_tokens,cache_write_tokens,total_tokens,share_pct,canvases_with_usage,likely_region,last_active,signup_at";
  const rows = accounts.map((a) =>
    [
      a.email,
      a.displayName ?? "",
      a.inputTokens,
      a.outputTokens,
      a.cacheReadTokens ?? 0,
      a.cacheCreationTokens ?? 0,
      a.totalTokens,
      a.sharePct,
      a.canvasesWithUsage,
      a.likelyRegion,
      accountLastActive(a) ?? "",
      a.signupAt,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `usage-analysis-accounts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function UsageAnalysisDashboard() {
  const [snapshot, setSnapshot] = useState<UsageAnalysisSnapshot | null>(null);
  const [computedAtLabel, setComputedAtLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalTokens");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [qaFailures, setQaFailures] = useState<QaTurnFailureRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const [usageRes, failuresRes] = await Promise.all([
        fetch("/api/admin/usage-analysis"),
        fetch("/api/admin/qa-turn-failures"),
      ]);
      const data = (await usageRes.json()) as {
        snapshot?: UsageAnalysisSnapshot | null;
        computedAtLabel?: string | null;
        message?: string;
        error?: string;
      };
      if (!usageRes.ok) throw new Error(data.error ?? `HTTP ${usageRes.status}`);
      setSnapshot(data.snapshot ?? null);
      setComputedAtLabel(data.computedAtLabel ?? null);
      setMessage(data.message ?? null);

      if (failuresRes.ok) {
        const failuresData = (await failuresRes.json()) as {
          failures?: QaTurnFailureRow[];
        };
        setQaFailures(failuresData.failures ?? []);
      } else {
        setQaFailures([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load usage data");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSnapshot = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/usage-analysis", { method: "POST" });
      const data = (await res.json()) as {
        snapshot?: UsageAnalysisSnapshot;
        computedAtLabel?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSnapshot(data.snapshot ?? null);
      setComputedAtLabel(data.computedAtLabel ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh snapshot");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAccounts = useMemo(() => {
    if (!snapshot) return [];
    let rows = [...snapshot.accounts];
    if (selectedEmail) {
      rows = rows.filter((a) => a.email === selectedEmail);
    } else if (emailFilter.trim()) {
      const q = emailFilter.trim().toLowerCase();
      rows = rows.filter(
        (a) =>
          a.email.toLowerCase().includes(q) ||
          (a.displayName?.toLowerCase().includes(q) ?? false),
      );
    }
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc
        ? Number(av) - Number(bv)
        : Number(bv) - Number(av);
    });
    return rows;
  }, [emailFilter, selectedEmail, snapshot, sortAsc, sortKey]);

  const donutOption = useMemo(
    () =>
      snapshot
        ? buildAccountShareDonutOption(snapshot.accounts)
        : null,
    [snapshot],
  );

  const ioBarOption = useMemo(
    () =>
      snapshot ? buildInputOutputBarOption(snapshot.accounts) : null,
    [snapshot],
  );

  const canvasBarOption = useMemo(
    () =>
      snapshot ? buildTopCanvasesBarOption(snapshot.topCanvases) : null,
    [snapshot],
  );

  const timelineOption = useMemo(
    () => (snapshot ? buildActivityTimelineOption(snapshot) : null),
    [snapshot],
  );

  const trackedOption = useMemo(
    () =>
      snapshot
        ? buildTrackedVsUntrackedOption(snapshot.summary.totalTokens)
        : null,
    [snapshot],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const onDonutClick = (params: { name?: string }) => {
    if (!snapshot || !params.name || params.name === "Others") {
      setSelectedEmail(null);
      return;
    }
    const match = snapshot.accounts.find(
      (a) => a.email.split("@")[0] === params.name,
    );
    setSelectedEmail(match?.email ?? null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-canvas-body-sm text-canvas-muted">Loading usage analysis…</p>
      </div>
    );
  }

  return (
    <div className="usage-dashboard space-y-8 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-canvas-border pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-canvas-accent/30 bg-canvas-accent/10 px-2.5 py-0.5 text-canvas-micro font-medium text-canvas-accent">
            <AdminActionIcon name="usage" className="h-3.5 w-3.5" />
            Snapshot · nightly 12:00 AM IST
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-canvas-micro font-medium text-amber-800 dark:text-amber-200">
            Saved canvas data only
          </span>
          {computedAtLabel ? (
            <span className="text-canvas-body-sm text-canvas-muted">
              Last updated{" "}
              <strong className="font-medium text-canvas-ink">
                {computedAtLabel} IST
              </strong>
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:opacity-50"
          >
            <AdminActionIcon name="refresh" />
            Reload
          </button>
          <button
            type="button"
            onClick={() => void refreshSnapshot()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-3 py-2 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <AdminActionIcon name="sparkles" className="text-canvas-card" />
            {refreshing ? "Computing…" : "Refresh snapshot"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-canvas border border-red-500/30 bg-red-500/10 px-4 py-3 text-canvas-body-sm text-red-800 dark:text-red-200">
          <p>{error}</p>
          {error.includes("SUPABASE_SERVICE_ROLE_KEY") ? (
            <p className="mt-2 text-canvas-body-sm">
              Add the service role key from{" "}
              <strong>Supabase → Project Settings → API → service_role</strong>{" "}
              to <code className="text-canvas-accent">.env.local</code>, then restart{" "}
              <code className="text-canvas-accent">npm run dev</code>.
            </p>
          ) : null}
        </div>
      ) : null}

      {!snapshot ? (
        <div className="rounded-canvas border border-canvas-border bg-canvas-card p-8 text-center shadow-card">
          <p className="font-display text-xl text-canvas-ink">No snapshot yet</p>
          <p className="mt-2 text-canvas-body-sm text-canvas-muted">
            {message ??
              "Generate the first report to populate charts and tables."}
          </p>
          <button
            type="button"
            onClick={() => void refreshSnapshot()}
            disabled={refreshing}
            className="mt-4 rounded-canvas bg-canvas-ink px-4 py-2 text-canvas-body-sm font-medium text-canvas-card"
          >
            {refreshing ? "Computing…" : "Generate first snapshot"}
          </button>
        </div>
      ) : (
        <>
          <section className="usage-hero-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total tracked tokens"
              value={<AnimatedNumber value={snapshot.summary.totalTokens} />}
              sub={`↑ ${fmt(snapshot.summary.totalInputTokens)} in · ↓ ${fmt(snapshot.summary.totalOutputTokens)} out · ⚡ ${fmt(snapshot.summary.totalCacheReadTokens)} cache-read · ✎ ${fmt(snapshot.summary.totalCacheCreationTokens)} cache-write`}
              accent="linear-gradient(90deg, #6B7DB3, #5B8C7A)"
            />
            <KpiCard
              label="Accounts with usage"
              value={
                <>
                  {snapshot.summary.usersWithUsage}
                  <span className="text-xl text-canvas-muted">
                    {" "}
                    / {snapshot.summary.totalUsers}
                  </span>
                </>
              }
              sub={`${snapshot.summary.canvasesWithUsage} canvases with turnUsage`}
              accent="linear-gradient(90deg, #C17F59, #B8956B)"
            />
            <KpiCard
              label="Top consumer share"
              value={
                <>
                  <AnimatedNumber
                    value={Math.round(snapshot.summary.topAccountSharePct)}
                    suffix="%"
                  />
                </>
              }
              sub={
                snapshot.summary.topAccountEmail?.split("@")[0] ?? "—"
              }
              accent="linear-gradient(90deg, #8C7AA9, #6B7DB3)"
            />
            <KpiCard
              label="Untracked gap"
              value="Unknown"
              sub="Anonymous / unsaved usage not in Supabase"
              accent="linear-gradient(90deg, #9A8F7A, #D4D0CB)"
            />
          </section>

          <section className="rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-medium text-canvas-ink">
                Prompt caching
              </h3>
              <span className="rounded-full border border-canvas-accent/30 bg-canvas-accent/10 px-2.5 py-0.5 text-canvas-micro font-medium text-canvas-accent">
                Reads bill at 10% · writes at 125% of input
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                  Uncached input
                </p>
                <p className="mt-1 font-display text-2xl font-medium tabular-nums text-canvas-ink">
                  {fmt(snapshot.summary.totalInputTokens)}
                </p>
                <p className="text-canvas-micro text-canvas-muted">
                  full-price input tokens
                </p>
              </div>
              <div>
                <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                  Cache reads
                </p>
                <p className="mt-1 font-display text-2xl font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                  {fmt(snapshot.summary.totalCacheReadTokens)}
                </p>
                <p className="text-canvas-micro text-canvas-muted">
                  prefix re-read at 0.1×
                </p>
              </div>
              <div>
                <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                  Cache writes
                </p>
                <p className="mt-1 font-display text-2xl font-medium tabular-nums text-canvas-ink">
                  {fmt(snapshot.summary.totalCacheCreationTokens)}
                </p>
                <p className="text-canvas-micro text-canvas-muted">
                  one-time prefix writes
                </p>
              </div>
              <div>
                <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                  Est. input savings
                </p>
                <p className="mt-1 font-display text-2xl font-medium tabular-nums text-canvas-ink">
                  {snapshot.summary.cacheSavingsPct > 0
                    ? `${snapshot.summary.cacheSavingsPct}%`
                    : "—"}
                </p>
                <p className="text-canvas-micro text-canvas-muted">
                  {(snapshot.summary.totalCacheReadTokens ?? 0) +
                    (snapshot.summary.totalCacheCreationTokens ?? 0) ===
                  0
                    ? "no cache activity recorded yet"
                    : "vs. paying full price"}
                </p>
              </div>
            </div>
          </section>

          {snapshot.insights.length > 0 ? (
            <section className="grid gap-3 md:grid-cols-3">
              {snapshot.insights.slice(0, 3).map((insight, i) => (
                <div
                  key={insight}
                  className="usage-insight-card rounded-canvas border border-canvas-border bg-gradient-to-br from-canvas-card to-canvas-bg p-4 shadow-card"
                  style={{ animationDelay: `${240 + i * 60}ms` }}
                >
                  <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-accent">
                    Insight {i + 1}
                  </p>
                  <p className="mt-2 text-canvas-body-sm leading-relaxed text-canvas-ink">
                    {insight}
                  </p>
                </div>
              ))}
            </section>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Token share by account"
              description="Click a slice to filter the account table"
            >
              {donutOption ? (
                <ReactECharts
                  option={donutOption}
                  style={{ height: 300, width: "100%" }}
                  opts={{ renderer: "canvas" }}
                  onEvents={{ click: onDonutClick }}
                />
              ) : null}
            </ChartCard>
            <ChartCard
              title="Input vs output tokens"
              description="Top 10 accounts by total usage"
            >
              {ioBarOption ? (
                <ReactECharts
                  option={ioBarOption}
                  style={{ height: 300, width: "100%" }}
                  opts={{ renderer: "canvas" }}
                />
              ) : null}
            </ChartCard>
            <ChartCard
              title="Top canvases"
              description="Heaviest saved canvases by cumulative turnUsage"
            >
              {canvasBarOption ? (
                <ReactECharts
                  option={canvasBarOption}
                  style={{ height: 300, width: "100%" }}
                  opts={{ renderer: "canvas" }}
                />
              ) : null}
            </ChartCard>
            <ChartCard
              title="Signups & canvas activity"
              description="Last 30 days — proxy signals, not token volume"
            >
              {timelineOption ? (
                <ReactECharts
                  option={timelineOption}
                  style={{ height: 300, width: "100%" }}
                  opts={{ renderer: "canvas" }}
                />
              ) : null}
            </ChartCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              title="Logged-in vs untracked"
              description="Illustrative — untracked slice is not measured"
              className="lg:col-span-1"
            >
              {trackedOption ? (
                <ReactECharts
                  option={trackedOption}
                  style={{ height: 260, width: "100%" }}
                  opts={{ renderer: "canvas" }}
                />
              ) : null}
            </ChartCard>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-medium text-canvas-ink">
                    Account breakdown
                  </h3>
                  {selectedEmail ? (
                    <button
                      type="button"
                      onClick={() => setSelectedEmail(null)}
                      className="mt-1 text-canvas-body-sm text-canvas-accent hover:underline"
                    >
                      Clear filter: {selectedEmail}
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="search"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    placeholder="Filter by email…"
                    className="rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm text-canvas-ink outline-none focus:border-canvas-accent"
                  />
                  <button
                    type="button"
                    onClick={() => exportAccountsCsv(snapshot.accounts)}
                    className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink hover:bg-canvas-bg"
                  >
                    <AdminActionIcon name="export" />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
                <table className="min-w-full text-left text-canvas-body-sm">
                  <thead className="sticky top-0 bg-canvas-card/95 text-canvas-micro uppercase tracking-wider text-canvas-muted backdrop-blur">
                    <tr className="border-b border-canvas-border">
                      {(
                        [
                          ["email", "Account"],
                          ["totalTokens", "Total"],
                          ["sharePct", "Share"],
                          ["canvasesWithUsage", "Canvases"],
                          ["likelyRegion", "Region"],
                        ] as const
                      ).map(([key, label]) => (
                        <th key={key} className="px-3 py-3 font-semibold">
                          <button
                            type="button"
                            onClick={() => toggleSort(key)}
                            className="inline-flex items-center gap-1 hover:text-canvas-ink"
                          >
                            {label}
                            {sortKey === key ? (
                              <AdminActionIcon
                                name={sortAsc ? "chevron-up" : "chevron-down"}
                                className="h-3.5 w-3.5"
                              />
                            ) : null}
                          </button>
                        </th>
                      ))}
                      <th className="px-3 py-3 font-semibold">Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr
                        key={account.email}
                        className={`border-b border-canvas-border/60 transition-colors hover:bg-canvas-bg/80 ${
                          account.totalTokens === 0 ? "opacity-60" : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium text-canvas-ink">
                            {account.email.split("@")[0]}
                          </div>
                          <div className="text-canvas-micro text-canvas-muted">
                            {account.email}
                          </div>
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {account.totalTokens.toLocaleString()}
                          <div className="text-canvas-micro text-canvas-muted">
                            ↑{account.inputTokens.toLocaleString()} ↓
                            {account.outputTokens.toLocaleString()}
                          </div>
                          {account.cacheReadTokens > 0 ||
                          account.cacheCreationTokens > 0 ? (
                            <div className="text-canvas-micro text-emerald-700 dark:text-emerald-300">
                              ⚡{fmt(account.cacheReadTokens)} ✎
                              {fmt(account.cacheCreationTokens)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {account.sharePct}%
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {account.canvasesWithUsage}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-canvas-micro font-medium ${
                              account.likelyRegion === "India"
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                                : account.likelyRegion === "US"
                                  ? "bg-blue-500/15 text-blue-800 dark:text-blue-200"
                                  : "bg-canvas-bg text-canvas-muted"
                            }`}
                          >
                            {account.likelyRegion}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-canvas-muted">
                          {formatWhen(accountLastActive(account))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-display text-lg font-medium text-canvas-ink">
              Top canvases
            </h3>
            <div className="mt-3 overflow-x-auto rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
              <table className="min-w-full text-left text-canvas-body-sm">
                <thead className="bg-canvas-card text-canvas-micro uppercase tracking-wider text-canvas-muted">
                  <tr className="border-b border-canvas-border">
                    <th className="px-3 py-3 font-semibold">Owner</th>
                    <th className="px-3 py-3 font-semibold">Canvas</th>
                    <th className="px-3 py-3 font-semibold">Tokens</th>
                    <th className="px-3 py-3 font-semibold">Cards</th>
                    <th className="px-3 py-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.topCanvases.map((canvas) => (
                    <tr
                      key={`${canvas.email}-${canvas.title}-${canvas.updatedAt}`}
                      className="border-b border-canvas-border/60 hover:bg-canvas-bg/80"
                    >
                      <td className="px-3 py-3 text-canvas-muted">
                        {canvas.email.split("@")[0]}
                      </td>
                      <td className="px-3 py-3 font-medium text-canvas-ink">
                        {canvas.title}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {canvas.totalTokens.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {canvas.cardsWithUsage}
                      </td>
                      <td className="px-3 py-3 text-canvas-muted">
                        {formatWhen(canvas.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {qaFailures.length > 0 ? (
            <section>
              <h3 className="font-display text-lg font-medium text-canvas-ink">
                Recent Q&amp;A failures
              </h3>
              <p className="mt-1 text-canvas-body-sm text-canvas-muted">
                Last 7 days from <code className="text-canvas-accent">qa_turn_events</code>{" "}
                (live chat telemetry).
              </p>
              <div className="mt-3 overflow-x-auto rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
                <table className="min-w-full text-left text-canvas-body-sm">
                  <thead className="bg-canvas-card text-canvas-micro uppercase tracking-wider text-canvas-muted">
                    <tr className="border-b border-canvas-border">
                      <th className="px-3 py-3 font-semibold">When</th>
                      <th className="px-3 py-3 font-semibold">Outcome</th>
                      <th className="px-3 py-3 font-semibold">Question</th>
                      <th className="px-3 py-3 font-semibold">Tokens in</th>
                      <th className="px-3 py-3 font-semibold">Searches</th>
                      <th className="px-3 py-3 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qaFailures.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-canvas-border/60 hover:bg-canvas-bg/80"
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-canvas-muted">
                          {formatWhen(row.created_at)}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-canvas-micro font-medium text-red-700 dark:text-red-300">
                            {row.outcome}
                          </span>
                        </td>
                        <td className="max-w-md px-3 py-3 text-canvas-ink">
                          <span className="line-clamp-2" title={row.question ?? undefined}>
                            {row.question ?? "—"}
                          </span>
                          {row.error_message ? (
                            <span className="mt-1 block text-canvas-micro text-canvas-muted line-clamp-1">
                              {row.error_message}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {(row.input_tokens ?? 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {row.web_search_blocks ?? 0}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-canvas-muted">
                          {row.duration_ms != null
                            ? `${Math.round(row.duration_ms / 1000)}s`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <footer className="rounded-canvas border border-canvas-border bg-canvas-card/60 p-4 text-canvas-body-sm text-canvas-muted">
            <p className="font-medium text-canvas-ink">Methodology</p>
            <p className="mt-1">
              Data source: <code className="text-canvas-accent">canvases.state.cards.*.turnUsage</code>{" "}
              (<code className="text-canvas-accent">inputTokens</code>,{" "}
              <code className="text-canvas-accent">outputTokens</code>,{" "}
              <code className="text-canvas-accent">cacheReadTokens</code>,{" "}
              <code className="text-canvas-accent">cacheCreationTokens</code>){" "}
              aggregated nightly at midnight IST into{" "}
              <code className="text-canvas-accent">usage_analysis_snapshots</code>.
              Uncached input bills at full price, cache reads at ~10%, cache
              writes at ~125%.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {snapshot.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </footer>
        </>
      )}
    </div>
  );
}
