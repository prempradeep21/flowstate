import { getPlan } from "@/lib/billing/plans";
import type {
  CreditSnapshot,
  Entitlement,
  EntitlementStatus,
  PlanId,
} from "@/lib/billing/types";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/serviceRole";

interface EntitlementRow {
  owner_id: string;
  owner_type: string;
  plan_id: string;
  status: string;
  credits_per_period: number | string;
  bonus_credits: number | string;
  period_start: string;
  period_end: string;
  cancel_at_period_end: boolean;
  pending_plan_id: string | null;
  provider: string;
  provider_subscription_id: string | null;
}

/** Postgres numeric arrives as a string over PostgREST. Never trust the type. */
const num = (v: number | string | null | undefined): number => {
  const n = typeof v === "string" ? Number.parseFloat(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

function toEntitlement(row: EntitlementRow): Entitlement {
  return {
    ownerId: row.owner_id,
    ownerType: row.owner_type === "org" ? "org" : "user",
    planId: row.plan_id as PlanId,
    status: row.status as EntitlementStatus,
    creditsPerPeriod: num(row.credits_per_period),
    bonusCredits: num(row.bonus_credits),
    periodStart: row.period_start,
    periodEnd: row.period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    pendingPlanId: (row.pending_plan_id as PlanId | null) ?? null,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id,
  };
}

const SELECT =
  "owner_id, owner_type, plan_id, status, credits_per_period, bonus_credits, period_start, period_end, cancel_at_period_end, pending_plan_id, provider, provider_subscription_id";

export async function getEntitlement(
  ownerId: string,
): Promise<Entitlement | null> {
  if (!isServiceRoleConfigured()) return null;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select(SELECT)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  return toEntitlement(data as EntitlementRow);
}

/**
 * Returns the owner's entitlement, creating it if missing and refreshing a
 * stale allowance snapshot.
 *
 * The snapshot exists so that lowering a plan's allowance later never
 * retroactively cuts off an existing user. But a row seeded at 0 by the signup
 * trigger has no allowance at all, so it is lazily brought up to the current
 * catalog value the first time we look at it. That keeps the free-tier number
 * living in exactly one place: lib/billing/plans.ts.
 */
export async function ensureEntitlement(
  ownerId: string,
): Promise<Entitlement | null> {
  if (!isServiceRoleConfigured()) return null;
  const supabase = createServiceRoleClient();

  const existing = await getEntitlement(ownerId);
  if (!existing) {
    const plan = getPlan("free");
    const { data, error } = await supabase
      .from("user_entitlements")
      .upsert(
        {
          owner_id: ownerId,
          plan_id: "free",
          credits_per_period: plan.credits,
        },
        { onConflict: "owner_id" },
      )
      .select(SELECT)
      .maybeSingle();
    if (error || !data) return null;
    return toEntitlement(data as EntitlementRow);
  }

  // Only ever raise a zero snapshot to the catalog value. Never silently
  // rewrite a real allowance — that would undo a deliberate manual grant.
  if (existing.creditsPerPeriod === 0) {
    const plan = getPlan(existing.planId);
    if (plan.credits > 0) {
      const { data } = await supabase
        .from("user_entitlements")
        .update({ credits_per_period: plan.credits })
        .eq("owner_id", ownerId)
        .select(SELECT)
        .maybeSingle();
      if (data) return toEntitlement(data as EntitlementRow);
    }
  }

  return existing;
}

/** Credits consumed by this owner in the current period. */
async function creditsUsedInPeriod(
  ownerId: string,
  periodStart: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("usage_ledger")
    .select("credits")
    .eq("owner_id", ownerId)
    .gte("created_at", periodStart)
    .limit(50_000);
  if (error || !data) return 0;
  return data.reduce(
    (sum, r) => sum + num((r as { credits: number | string }).credits),
    0,
  );
}

/**
 * What the UI shows. Derived, never authoritative — enforcement always
 * re-reads under lock rather than trusting a snapshot.
 *
 * Phase 2 computes `used` by summing the ledger, which is correct but O(rows).
 * Phase 3 replaces this with a single usage_counters read once the hold/settle
 * path maintains that rollup.
 */
export async function getCreditSnapshot(
  ownerId: string,
): Promise<CreditSnapshot | null> {
  const ent = await ensureEntitlement(ownerId);
  if (!ent) return null;

  const limit = ent.creditsPerPeriod + ent.bonusCredits;
  const used = await creditsUsedInPeriod(ownerId, ent.periodStart);

  return {
    planId: ent.planId,
    status: ent.status,
    used: Math.round(used * 10_000) / 10_000,
    limit,
    remaining: Math.max(0, limit - used),
    periodStart: ent.periodStart,
    periodEnd: ent.periodEnd,
    upgradeAvailable: ent.planId !== "max",
  };
}
