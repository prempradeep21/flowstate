import { describe, expect, it } from "vitest";
import {
  PLANS,
  creditsPerDollar,
  getPlan,
  isKnownPlan,
} from "@/lib/billing/plans";
import { USD_PER_CREDIT } from "@/lib/billing/pricing";

describe("plan catalog", () => {
  it("falls back to free for unknown ids rather than throwing", () => {
    expect(getPlan("nonsense").id).toBe("free");
    expect(getPlan(null).id).toBe("free");
    expect(isKnownPlan("nonsense")).toBe(false);
  });

  it("gives better value per dollar as the tier rises", () => {
    // An upgrade that costs more per credit reads as a penalty. This is the
    // one structural property of the ladder worth enforcing in code.
    const paid = PLANS.filter((p) => p.priceUsdMonthly > 0).sort(
      (a, b) => a.priceUsdMonthly - b.priceUsdMonthly,
    );
    for (let i = 1; i < paid.length; i++) {
      expect(creditsPerDollar(paid[i])).toBeGreaterThan(
        creditsPerDollar(paid[i - 1]),
      );
    }
  });

  it("keeps a free user's worst-case cost near $1/month", () => {
    const free = getPlan("free");
    const worstCaseUsd = free.credits * USD_PER_CREDIT;
    expect(worstCaseUsd).toBeLessThanOrEqual(1.5);
  });

  it("never sells a plan below its own worst-case cost", () => {
    for (const plan of PLANS.filter((p) => p.priceUsdMonthly > 0)) {
      expect(plan.priceUsdMonthly).toBeGreaterThan(
        plan.credits * USD_PER_CREDIT,
      );
    }
  });
});
