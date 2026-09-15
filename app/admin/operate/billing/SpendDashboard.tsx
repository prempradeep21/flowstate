import type { SpendAnalysis } from "@/lib/admin/spendAnalysis.server";

const usd = (n: number) =>
  n >= 1
    ? `$${n.toFixed(2)}`
    : `$${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
const credits = (n: number) =>
  n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(1);

function Tile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card">
      <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
        {label}
      </p>
      <p
        className={`mt-2 text-canvas-heading font-semibold ${
          tone === "warning" ? "text-canvas-danger" : "text-canvas-ink"
        }`}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-canvas-body-sm text-canvas-muted">{sub}</p>
      ) : null}
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card">
      <h2 className="text-canvas-body font-semibold text-canvas-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-canvas-body-sm text-canvas-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Horizontal share bar — avoids pulling a chart library onto a page this simple. */
function ShareBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-canvas-xs bg-canvas-border">
      <div
        className="h-full rounded-canvas-xs bg-canvas-accent"
        style={{ width: `${Math.max(1, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function SpendDashboard({ data }: { data: SpendAnalysis }) {
  const { summary, bySurface, byOwner, byDay, windowDays, configured } = data;

  if (!configured) {
    return (
      <p className="text-canvas-body-sm text-canvas-muted">
        SUPABASE_SERVICE_ROLE_KEY is not configured, so spend cannot be read.
      </p>
    );
  }

  if (summary.events === 0) {
    return (
      <div className="rounded-canvas border border-canvas-border bg-canvas-card p-6 shadow-card">
        <p className="text-canvas-body text-canvas-ink">
          No spend recorded yet.
        </p>
        <p className="mt-2 max-w-xl text-canvas-body-sm text-canvas-muted">
          Every AI call now writes a row to <code>usage_ledger</code>. This page
          fills as the app is used. Note that billing writes are disabled
          outside production unless <code>BILLING_WRITE_ENABLED=true</code> is
          set, so local traffic will not appear here by default.
        </p>
      </div>
    );
  }

  const projectedMonthly = (summary.totalCostUsd / windowDays) * 30;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label={`Spend (${windowDays}d)`}
          value={usd(summary.totalCostUsd)}
          sub={`≈ ${usd(projectedMonthly)}/month at this rate`}
        />
        <Tile
          label="Cost per user"
          value={usd(summary.costPerOwnerUsd)}
          sub={`${summary.distinctOwners} attributed ${summary.distinctOwners === 1 ? "user" : "users"}`}
        />
        <Tile
          label="Typical request"
          value={`${credits(summary.medianCreditsPerEvent)} cr`}
          sub={`p95 ${credits(summary.p95CreditsPerEvent)} cr — sets the tier sizing`}
        />
        <Tile
          label="Unattributed"
          value={`${summary.guestEvents}`}
          sub={
            summary.guestEvents > 0
              ? "signed-out requests, no owner"
              : "every request has an owner"
          }
          tone={summary.guestEvents > 0 ? "warning" : "default"}
        />
      </div>

      {summary.unmappedModelEvents > 0 ? (
        <div className="rounded-canvas border border-canvas-danger/40 bg-canvas-card p-4 shadow-card">
          <p className="text-canvas-body-sm font-semibold text-canvas-danger">
            {summary.unmappedModelEvents} request
            {summary.unmappedModelEvents === 1 ? "" : "s"} used a model with no
            rate card
          </p>
          <p className="mt-1 text-canvas-body-sm text-canvas-muted">
            Priced at the deliberately-expensive fallback, so these are
            overcharged rather than free. Add them to <code>MODEL_RATES</code>{" "}
            in lib/billing/pricing.ts:{" "}
            {summary.unmappedModels.join(", ") || "(unnamed)"}
          </p>
        </div>
      ) : null}

      <Card
        title="Where the money goes"
        description="Cost by surface. The largest line is where any optimisation should start."
      >
        <ul className="flex flex-col gap-3">
          {bySurface.map((s) => (
            <li key={s.surface}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-canvas-body-sm font-medium text-canvas-ink">
                  {s.surface}
                </span>
                <span className="text-canvas-body-sm tabular-nums text-canvas-muted">
                  {usd(s.costUsd)} · {s.sharePct.toFixed(0)}% · {s.events} req
                </span>
              </div>
              <div className="mt-1.5">
                <ShareBar pct={s.sharePct} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Cost per user"
        description="What each account actually costs. This is the number that sizes the free tier."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-canvas-body-sm">
            <thead>
              <tr className="border-b border-canvas-border text-left text-canvas-micro uppercase tracking-wider text-canvas-muted">
                <th className="pb-2 pr-4 font-semibold">Account</th>
                <th className="pb-2 pr-4 text-right font-semibold">Requests</th>
                <th className="pb-2 pr-4 text-right font-semibold">Credits</th>
                <th className="pb-2 pr-4 text-right font-semibold">Cost</th>
                <th className="pb-2 text-right font-semibold">Last active</th>
              </tr>
            </thead>
            <tbody>
              {byOwner.slice(0, 50).map((o) => (
                <tr
                  key={o.ownerId ?? "guest"}
                  className="border-b border-canvas-border/50 last:border-0"
                >
                  <td className="py-2 pr-4 text-canvas-ink">
                    {o.email ??
                      (o.ownerId ? o.ownerId.slice(0, 8) : "Signed out")}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-canvas-muted">
                    {o.events}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-canvas-muted">
                    {credits(o.credits)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-canvas-ink">
                    {usd(o.costUsd)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-canvas-muted">
                    {o.lastActiveAt ? o.lastActiveAt.slice(0, 10) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Daily spend" description={`Last ${windowDays} days.`}>
        <ul className="flex flex-col gap-2">
          {byDay.map((d) => {
            const max = Math.max(...byDay.map((x) => x.costUsd), 0.000001);
            return (
              <li key={d.day} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-canvas-body-sm tabular-nums text-canvas-muted">
                  {d.day}
                </span>
                <span className="flex-1">
                  <ShareBar pct={(d.costUsd / max) * 100} />
                </span>
                <span className="w-24 shrink-0 text-right text-canvas-body-sm tabular-nums text-canvas-ink">
                  {usd(d.costUsd)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
