// Billing kill-switches. Every one of these defaults to the SAFE value, so an
// unset environment behaves exactly as the product did before billing existed.

/**
 * Whether billing rows may be written at all.
 *
 * This exists because `lib/supabase/localReadOnly.ts` protects only the
 * BROWSER client. API routes use the service-role client and are completely
 * unaffected by it — so a dev server on localhost pointed at the production
 * Supabase project writes real rows. Harmless for telemetry; with enforcement
 * on it would burn real users' credits from a laptop.
 *
 * Writes are therefore allowed only when running on Vercel (any environment)
 * or when NODE_ENV is production, unless explicitly overridden.
 */
export function isBillingWriteEnabled(): boolean {
  const override = process.env.BILLING_WRITE_ENABLED;
  if (override === "true") return true;
  if (override === "false") return false;
  return (
    Boolean(process.env.VERCEL_ENV) || process.env.NODE_ENV === "production"
  );
}

/**
 * "off"    — no checks, no denials. Billing is invisible. (default)
 * "shadow" — compute the decision and log would-be denials, but always allow.
 * "on"     — actually deny when out of credits.
 */
export type EnforcementMode = "off" | "shadow" | "on";

export function enforcementMode(): EnforcementMode {
  const raw = process.env.BILLING_ENFORCEMENT?.trim().toLowerCase();
  return raw === "on" || raw === "shadow" ? raw : "off";
}

/**
 * Staged rollout allowlist. When BILLING_ENFORCEMENT_EMAILS is set, only those
 * accounts are actually denied; everyone else is treated as shadow mode. Lets
 * enforcement be proven on your own account before it reaches a single user.
 */
export function isEnforcedFor(email: string | null | undefined): boolean {
  if (enforcementMode() !== "on") return false;
  const raw = process.env.BILLING_ENFORCEMENT_EMAILS?.trim();
  if (!raw) return true; // no allowlist => everyone
  if (!email) return false;
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
