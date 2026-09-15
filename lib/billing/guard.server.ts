import { enforcementMode, isEnforcedFor } from "@/lib/billing/enforcement";
import { getCreditSnapshot } from "@/lib/billing/entitlement.server";
import type { CreditSnapshot, Surface } from "@/lib/billing/types";

export interface CreditGuardAllowed {
  ok: true;
  snapshot: CreditSnapshot | null;
  /** True when enforcement WOULD have denied this. Shadow mode only. */
  wouldDeny: boolean;
}

export interface CreditGuardDenied {
  ok: false;
  code: "credit_limit_reached" | "subscription_inactive";
  snapshot: CreditSnapshot;
  response: Response;
}

export type CreditGuard = CreditGuardAllowed | CreditGuardDenied;

export interface GuardArgs {
  ownerId: string | null;
  email?: string | null;
  surface: Surface;
  /** Estimated credits for this request. Used only for the limit comparison. */
  estimate?: number;
}

const ALLOW: CreditGuardAllowed = {
  ok: true,
  snapshot: null,
  wouldDeny: false,
};

/**
 * Decides whether a request may proceed.
 *
 * FAILS OPEN, always. Any error, any missing configuration, enforcement off,
 * or a signed-out caller all return `ok: true`. Billing infrastructure must
 * never be the reason the product stops working.
 *
 * Modes:
 *   off    — returns immediately, does no work at all
 *   shadow — computes the decision, reports `wouldDeny`, still allows
 *   on     — denies with 402, but only for accounts in the rollout allowlist
 */
export async function guardCredits(args: GuardArgs): Promise<CreditGuard> {
  const mode = enforcementMode();
  if (mode === "off" || !args.ownerId) return ALLOW;

  try {
    const snapshot = await getCreditSnapshot(args.ownerId);
    if (!snapshot) return ALLOW;

    const estimate = args.estimate ?? 0;
    const inactive =
      snapshot.status === "canceled" || snapshot.status === "paused";
    const overLimit = snapshot.used + estimate > snapshot.limit;
    const wouldDeny = inactive || overLimit;

    if (!wouldDeny) return { ok: true, snapshot, wouldDeny: false };

    // Shadow mode, or an account outside the staged rollout: record the
    // would-be denial and let the request through untouched.
    if (mode === "shadow" || !isEnforcedFor(args.email)) {
      console.info(
        `[billing/shadow] would deny ${args.surface} for ${args.ownerId}: ` +
          `used ${snapshot.used}/${snapshot.limit} (${snapshot.planId}, ${snapshot.status})`,
      );
      return { ok: true, snapshot, wouldDeny: true };
    }

    const code = inactive ? "subscription_inactive" : "credit_limit_reached";
    return {
      ok: false,
      code,
      snapshot,
      response: Response.json(
        {
          error:
            code === "credit_limit_reached"
              ? "You're out of credits."
              : "Your subscription is not active.",
          code,
          billing: {
            planId: snapshot.planId,
            creditsUsed: snapshot.used,
            creditsLimit: snapshot.limit,
            creditsRemaining: snapshot.remaining,
            periodEnd: snapshot.periodEnd,
            upgradeAvailable: snapshot.upgradeAvailable,
          },
        },
        { status: 402 },
      ),
    };
  } catch (err) {
    console.error("[billing/guard] failed open", err);
    return ALLOW;
  }
}
