import { createHash } from "node:crypto";
import { isBillingWriteEnabled } from "@/lib/billing/enforcement";
import { GUEST_CREDITS } from "@/lib/billing/plans";
import type { Surface } from "@/lib/billing/types";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/serviceRole";

/**
 * Anti-abuse ceiling for a shared address, set at ~3x the per-visitor
 * allowance so an office or mobile carrier NAT is not locked out by its first
 * few visitors. This is the ONE place a rolling time window survives: it is an
 * abuse ceiling, not a user's entitlement, and making it permanent would ban a
 * whole building forever.
 */
export const GUEST_IP_CREDITS = GUEST_CREDITS * 3;
const IP_WINDOW_HOURS = 24;

/** `guests` enables the wall independently of BILLING_ENFORCEMENT, because the
 *  guest wall and signed-in limits ship at different times. */
export function isGuestWallEnabled(): boolean {
  return process.env.GUEST_ENFORCEMENT?.trim().toLowerCase() === "on";
}

/** sha256(ip + salt). The raw IP is never stored, matching visitor_events. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.GUEST_IP_SALT?.trim();
  if (!salt) return null; // no salt configured => skip the IP backstop entirely
  return createHash("sha256").update(`${ip}${salt}`).digest("hex");
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIpFrom(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip");
}

export interface GuestUsage {
  creditsUsed: number;
  requests: number;
}

export type GuestGuard =
  | { ok: true; usage: GuestUsage | null }
  | { ok: false; usage: GuestUsage; response: Response };

const ALLOW: GuestGuard = { ok: true, usage: null };

const num = (v: number | string | null | undefined): number => {
  const n = typeof v === "string" ? Number.parseFloat(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Decides whether a signed-out visitor may make another AI request.
 *
 * FAILS OPEN on every error path — a broken counter table must never become an
 * outage for anonymous visitors, who are the top of the funnel.
 *
 * Only applies to guests: callers pass this nothing when a user is signed in.
 */
export async function guardGuestCredits(args: {
  visitorId: string | null;
  ipHash: string | null;
  surface: Surface;
}): Promise<GuestGuard> {
  if (!isGuestWallEnabled()) return ALLOW;
  if (!args.visitorId || !isServiceRoleConfigured()) return ALLOW;

  try {
    const supabase = createServiceRoleClient();

    const { data } = await supabase
      .from("guest_credit_counters")
      .select("credits_used, requests")
      .eq("visitor_id", args.visitorId)
      .maybeSingle();

    const usage: GuestUsage = {
      creditsUsed: num(
        (data as { credits_used?: number | string } | null)?.credits_used,
      ),
      requests: Math.trunc(
        num((data as { requests?: number | string } | null)?.requests),
      ),
    };

    let overLimit = usage.creditsUsed >= GUEST_CREDITS;

    // IP backstop — only when a salt is configured, and only within the window.
    if (!overLimit && args.ipHash) {
      const since = new Date(
        Date.now() - IP_WINDOW_HOURS * 3_600_000,
      ).toISOString();
      const { data: rows } = await supabase
        .from("guest_credit_counters")
        .select("credits_used")
        .eq("ip_hash", args.ipHash)
        .gte("window_start", since)
        .limit(500);
      const ipTotal = (rows ?? []).reduce(
        (sum, r) =>
          sum + num((r as { credits_used: number | string }).credits_used),
        0,
      );
      overLimit = ipTotal >= GUEST_IP_CREDITS;
    }

    if (!overLimit) return { ok: true, usage };

    return {
      ok: false,
      usage,
      response: Response.json(
        {
          error: "Sign in to keep going.",
          code: "guest_limit_reached",
          billing: {
            creditsUsed: usage.creditsUsed,
            creditsLimit: GUEST_CREDITS,
            questionsAsked: usage.requests,
            signInRequired: true,
          },
        },
        { status: 402 },
      ),
    };
  } catch (err) {
    console.error("[billing/guest] failed open", err);
    return ALLOW;
  }
}

/**
 * Adds actual spend to a guest's lifetime counter. Called after the request
 * completes, from the same place the ledger row is written, so the counter can
 * never drift from what was really consumed.
 *
 * The visitor_id row is a LIFETIME total — the guest allowance never refills,
 * per the no-daily-limits rule. Only window_start (the IP path) is time-based.
 */
export async function addGuestUsage(args: {
  visitorId: string | null;
  ipHash: string | null;
  credits: number;
}): Promise<void> {
  if (!args.visitorId || args.credits <= 0) return;
  if (!isBillingWriteEnabled() || !isServiceRoleConfigured()) return;

  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("guest_credit_counters")
      .select("credits_used, requests")
      .eq("visitor_id", args.visitorId)
      .maybeSingle();

    const prev = data as {
      credits_used?: number | string;
      requests?: number | string;
    } | null;

    await supabase.from("guest_credit_counters").upsert(
      {
        visitor_id: args.visitorId,
        ip_hash: args.ipHash,
        credits_used: num(prev?.credits_used) + args.credits,
        requests: Math.trunc(num(prev?.requests)) + 1,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "visitor_id" },
    );
  } catch (err) {
    console.error("[billing/guest] counter update failed", err);
  }
}
