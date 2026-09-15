import type { BillingOwner } from "@/lib/billing/types";

/**
 * Resolves the billing subject for a request. The ONLY place this mapping
 * exists — no call site may derive it independently.
 *
 * Today one user is one billing owner. When organisations become the billing
 * subject, this function and the RLS predicates in the billing migration are
 * the entire change; every call site keeps passing an opaque ownerId.
 */
export function resolveBillingOwner(userId: string): BillingOwner {
  return { ownerId: userId, ownerType: "user" };
}
