import { getCurrentUser } from "@/lib/auth/currentUser.server";
import { enforcementMode } from "@/lib/billing/enforcement";
import { getCreditSnapshot } from "@/lib/billing/entitlement.server";
import { resolveBillingOwner } from "@/lib/billing/owner";
import { PLANS } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

/**
 * The credit meter's data source. Deliberately degrades rather than 401s:
 * a signed-out visitor gets `{ signedIn: false }` and the UI simply hides the
 * meter, matching the graceful-degradation convention everywhere else.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ signedIn: false, snapshot: null, plans: PLANS });
  }

  const { ownerId } = resolveBillingOwner(user.id);
  const snapshot = await getCreditSnapshot(ownerId);

  return Response.json({
    signedIn: true,
    snapshot,
    plans: PLANS,
    // "off" tells the client not to render the meter at all, so nothing about
    // limits is shown to users until you decide to show it.
    enforcement: enforcementMode(),
  });
}
