import type { PlanId } from "@/lib/billing/types";

// SOURCE OF TRUTH for the plan catalog. Deliberately code, not a DB table:
// the pricing UI needs it in the client bundle, changes should be typed and
// reviewed, and provider price ids belong in env rather than committed rows.
//
// Client-safe: this file must never import anything server-only.
//
// IMPORTANT: a plan's allowance is SNAPSHOT onto user_entitlements at grant
// time. Changing a number here never retroactively alters an existing user's
// allowance — it only affects grants made after the change.

export interface Plan {
  id: PlanId;
  label: string;
  /** Credits granted per billing period. */
  credits: number;
  priceUsdMonthly: number;
  blurb: string;
  features: string[];
  /** Whether it can be self-served. False until a payment provider exists. */
  purchasable: boolean;
}

/**
 * ⚠️ PROVISIONAL. These credit numbers are a hypothesis derived from a small
 * sample, not a measurement. Phase 1 exists to replace them: once the ledger
 * has a fortnight of real traffic, set them from the observed distribution.
 *
 * Sizing intent (the part worth preserving even if the numbers move):
 *   - a free user should cost roughly $1/month in raw upstream spend
 *   - each paid tier must give MORE credits per dollar than the one below it,
 *     or upgrading reads as a penalty
 */
export const PLANS: Plan[] = [
  {
    id: "free",
    label: "Free",
    credits: 500,
    priceUsdMonthly: 0,
    blurb: "Enough to see what a canvas does.",
    features: ["Unlimited canvases", "All artifact types", "Community support"],
    purchasable: true,
  },
  {
    id: "pro",
    label: "Pro",
    credits: 6000,
    priceUsdMonthly: 20,
    blurb: "For real research and day-to-day thinking.",
    features: [
      "12x the Free allowance",
      "Priority support",
      "Early access to new artifacts",
    ],
    purchasable: false, // flips true in Phase 5
  },
  {
    id: "max",
    label: "Max",
    credits: 20000,
    priceUsdMonthly: 60,
    blurb: "For people whose canvases are their job.",
    features: [
      "Best value per credit",
      "Priority support",
      "Early access to new artifacts",
    ],
    purchasable: false, // flips true in Phase 5
  },
];

export const DEFAULT_PLAN_ID: PlanId = "free";

/**
 * Guest allowance. Granted ONCE per visitor and never refilled — consistent
 * with the no-daily-limits rule, and stricter than a daily reset because there
 * is nothing to farm by waiting.
 *
 * CALIBRATED, not guessed: 240 credits is exactly what the measured "Bali
 * planning" canvas cost — 5 questions, $0.48, on claude-sonnet-4-6.
 *
 * It buys a guest roughly 10-15 questions rather than 5, because cost per
 * question scales with canvas maturity and guests always start from an empty
 * canvas: ~11 credits on a cold first question, ~5 on the next few, rising
 * toward ~48 once a canvas carries 113k tokens of cached context.
 */
export const GUEST_CREDITS = 240;

export function getPlan(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function isKnownPlan(id: string | null | undefined): id is PlanId {
  return PLANS.some((p) => p.id === id);
}

/** Credits per dollar. Must increase with tier — see the sizing intent above. */
export function creditsPerDollar(plan: Plan): number {
  return plan.priceUsdMonthly > 0
    ? plan.credits / plan.priceUsdMonthly
    : Infinity;
}
