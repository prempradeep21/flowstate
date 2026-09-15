import { isUnknownModel } from "@/lib/billing/pricing";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/serviceRole";

// Reads the live usage_ledger. This is the successor to
// lib/admin/usageAnalysis.server.ts, which reconstructs cost nightly by
// scraping canvases.state and therefore cannot see unsaved or signed-out
// sessions. Expect the two to disagree; this one is the accurate figure.

export interface SpendBySurface {
  surface: string;
  events: number;
  credits: number;
  costUsd: number;
  sharePct: number;
}

export interface SpendByOwner {
  ownerId: string | null;
  email: string | null;
  events: number;
  credits: number;
  costUsd: number;
  lastActiveAt: string | null;
}

export interface SpendByDay {
  day: string;
  credits: number;
  costUsd: number;
  events: number;
}

export interface SpendSummary {
  totalCostUsd: number;
  totalCredits: number;
  events: number;
  distinctOwners: number;
  guestEvents: number;
  /** Median and p95 credits per event — what a "typical" request costs. */
  medianCreditsPerEvent: number;
  p95CreditsPerEvent: number;
  /** Rows whose model fell through to UNKNOWN_MODEL_RATE. Should be zero. */
  unmappedModelEvents: number;
  unmappedModels: string[];
  /** Mean cost per attributed owner — the number that sizes the free tier. */
  costPerOwnerUsd: number;
}

export interface SpendAnalysis {
  summary: SpendSummary;
  bySurface: SpendBySurface[];
  byOwner: SpendByOwner[];
  byDay: SpendByDay[];
  windowDays: number;
  configured: boolean;
}

const EMPTY: SpendAnalysis = {
  summary: {
    totalCostUsd: 0,
    totalCredits: 0,
    events: 0,
    distinctOwners: 0,
    guestEvents: 0,
    medianCreditsPerEvent: 0,
    p95CreditsPerEvent: 0,
    unmappedModelEvents: 0,
    unmappedModels: [],
    costPerOwnerUsd: 0,
  },
  bySurface: [],
  byOwner: [],
  byDay: [],
  windowDays: 30,
  configured: false,
};

interface LedgerRow {
  owner_id: string | null;
  surface: string;
  model: string | null;
  credits: number | string | null;
  cost_usd: number | string | null;
  created_at: string;
}

const num = (v: number | string | null | undefined): number => {
  // Postgres numeric arrives as a string via PostgREST; never trust the type.
  const n = typeof v === "string" ? Number.parseFloat(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export async function loadSpendAnalysis(
  windowDays = 30,
): Promise<SpendAnalysis> {
  if (!isServiceRoleConfigured()) return EMPTY;

  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("usage_ledger")
    .select("owner_id, surface, model, credits, cost_usd, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50_000);

  if (error) throw error;
  const rows = (data ?? []) as LedgerRow[];

  if (rows.length === 0) {
    return { ...EMPTY, configured: true, windowDays };
  }

  const surfaces = new Map<string, SpendBySurface>();
  const owners = new Map<string, SpendByOwner>();
  const days = new Map<string, SpendByDay>();
  const creditsPerEvent: number[] = [];
  const unmapped = new Set<string>();

  let totalCostUsd = 0;
  let totalCredits = 0;
  let guestEvents = 0;
  let unmappedModelEvents = 0;

  for (const row of rows) {
    const credits = num(row.credits);
    const cost = num(row.cost_usd);
    totalCostUsd += cost;
    totalCredits += credits;
    creditsPerEvent.push(credits);

    if (!row.owner_id) guestEvents += 1;

    if (isUnknownModel(row.model)) {
      unmappedModelEvents += 1;
      if (row.model) unmapped.add(row.model);
    }

    const s = surfaces.get(row.surface) ?? {
      surface: row.surface,
      events: 0,
      credits: 0,
      costUsd: 0,
      sharePct: 0,
    };
    s.events += 1;
    s.credits += credits;
    s.costUsd += cost;
    surfaces.set(row.surface, s);

    const key = row.owner_id ?? "__guest__";
    const o = owners.get(key) ?? {
      ownerId: row.owner_id,
      email: null,
      events: 0,
      credits: 0,
      costUsd: 0,
      lastActiveAt: null,
    };
    o.events += 1;
    o.credits += credits;
    o.costUsd += cost;
    if (!o.lastActiveAt || row.created_at > o.lastActiveAt) {
      o.lastActiveAt = row.created_at;
    }
    owners.set(key, o);

    const day = row.created_at.slice(0, 10);
    const d = days.get(day) ?? { day, credits: 0, costUsd: 0, events: 0 };
    d.credits += credits;
    d.costUsd += cost;
    d.events += 1;
    days.set(day, d);
  }

  // Attach emails. auth.users is not exposed via PostgREST, so go through the
  // admin API — the same approach usageAnalysis.server.ts already uses.
  const ownerIds = [...owners.values()]
    .map((o) => o.ownerId)
    .filter((id): id is string => Boolean(id));
  if (ownerIds.length > 0) {
    try {
      const { data: userList } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const emailById = new Map(
        (userList?.users ?? []).map((u) => [u.id, u.email ?? null]),
      );
      for (const o of owners.values()) {
        if (o.ownerId) o.email = emailById.get(o.ownerId) ?? null;
      }
    } catch {
      // emails are cosmetic — never fail the dashboard over them
    }
  }

  const bySurface = [...surfaces.values()]
    .map((s) => ({
      ...s,
      sharePct: totalCostUsd > 0 ? (s.costUsd / totalCostUsd) * 100 : 0,
    }))
    .sort((a, b) => b.costUsd - a.costUsd);

  const byOwner = [...owners.values()].sort((a, b) => b.costUsd - a.costUsd);
  const byDay = [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
  const sortedCredits = [...creditsPerEvent].sort((a, b) => a - b);
  const attributedOwners = byOwner.filter((o) => o.ownerId).length;

  return {
    configured: true,
    windowDays,
    summary: {
      totalCostUsd,
      totalCredits,
      events: rows.length,
      distinctOwners: attributedOwners,
      guestEvents,
      medianCreditsPerEvent: quantile(sortedCredits, 0.5),
      p95CreditsPerEvent: quantile(sortedCredits, 0.95),
      unmappedModelEvents,
      unmappedModels: [...unmapped],
      costPerOwnerUsd:
        attributedOwners > 0 ? totalCostUsd / attributedOwners : 0,
    },
    bySurface,
    byOwner,
    byDay,
  };
}
