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

type SortKey =
  | "email"
  | "totalTokens"
  | "sharePct"
  | "canvasesWithUsage"
  | "likelyRegion";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
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
    "email,display_name,input_tokens,output_tokens,total_tokens,share_pct,canvases_with_usage,likely_region,last_sign_in,signup_at";
  const rows = accounts.map((a) =>
    [
      a.email,
      a.displayName ?? "",
      a.inputTokens,
      a.outputTokens,
      a.totalTokens,
      a.sharePct,
      a.canvasesWithUsage,
      a.likelyRegion,
      a.lastSignInAt ?? "",
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/usage-analysis");
      const data = (await res.json()) as {
        snapshot?: UsageAnalysisSnapshot | null;
        computedAtLabel?: string | null;
        message?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSnapshot(data.snapshot ?? null);
      setComputedAtLabel(data.computedAtLabel ?? null);
      setMessage(data.message ?? null);
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
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-canvas-border pb-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-canvas-accent/30 bg-canvas-accent/10 px-2.5 py-0.5 text-canvas-micro font-medium text-canvas-accent">
              Snapshot · refreshes nightly 12:00 AM IST
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-canvas-micro font-medium text-amber-800 dark:text-amber-200">
              Saved canvas data only
            </span>
          </div>
          <p className="text-canvas-body-sm text-canvas-muted">
            Token usage from saved canvases
            {computedAtLabel ? (
              <>
                {" "}
                · last updated{" "}
                <strong className="font-medium text-canvas-ink">
                  {computedAtLabel} IST
                </strong>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || refreshing}
            className="rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:opacity-50"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => void refreshSnapshot()}
            disabled={refreshing}
            className="rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-3 py-2 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {refreshing ? "Computing…" : "Refresh snapshot"}
          </button>
        </div>
      </header>

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
              sub={`↑ ${fmt(snapshot.summary.totalInputTokens)} input · ↓ ${fmt(snapshot.summary.totalOutputTokens)} output`}
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
                    className="rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink hover:bg-canvas-bg"
                  >
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
                            className="hover:text-canvas-ink"
                          >
                            {label}
                            {sortKey === key ? (sortAsc ? " ↑" : " ↓") : ""}
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
                          {formatWhen(account.lastSignInAt)}
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

          <footer className="rounded-canvas border border-canvas-border bg-canvas-card/60 p-4 text-canvas-body-sm text-canvas-muted">
            <p className="font-medium text-canvas-ink">Methodology</p>
            <p className="mt-1">
              Data source: <code className="text-canvas-accent">canvases.state.cards.*.turnUsage</code>{" "}
              aggregated nightly at midnight IST into{" "}
              <code className="text-canvas-accent">usage_analysis_snapshots</code>.
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
