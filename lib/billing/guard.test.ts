import { afterEach, describe, expect, it, vi } from "vitest";
import { guardCredits } from "@/lib/billing/guard.server";
import type { CreditSnapshot } from "@/lib/billing/types";

const snapshot = (over: Partial<CreditSnapshot> = {}): CreditSnapshot => ({
  planId: "free",
  status: "active",
  used: 10,
  limit: 500,
  remaining: 490,
  periodStart: "2026-09-01T00:00:00.000Z",
  periodEnd: "2026-10-01T00:00:00.000Z",
  upgradeAvailable: true,
  ...over,
});

vi.mock("@/lib/billing/entitlement.server", () => ({
  getCreditSnapshot: vi.fn(),
}));
const { getCreditSnapshot } = await import("@/lib/billing/entitlement.server");
const mocked = vi.mocked(getCreditSnapshot);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("guardCredits", () => {
  it("does no work at all when enforcement is off", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "off");
    const res = await guardCredits({ ownerId: "u1", surface: "chat" });
    expect(res.ok).toBe(true);
    expect(mocked).not.toHaveBeenCalled();
  });

  it("allows signed-out callers without consulting anything", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "on");
    const res = await guardCredits({ ownerId: null, surface: "chat" });
    expect(res.ok).toBe(true);
    expect(mocked).not.toHaveBeenCalled();
  });

  it("reports a would-be denial in shadow mode but still allows", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "shadow");
    mocked.mockResolvedValue(snapshot({ used: 600, limit: 500 }));
    const res = await guardCredits({ ownerId: "u1", surface: "chat" });
    expect(res.ok).toBe(true);
    expect(res.ok && res.wouldDeny).toBe(true);
  });

  it("denies with 402 when enforcement is on and the limit is exceeded", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "on");
    mocked.mockResolvedValue(snapshot({ used: 600, limit: 500 }));
    const res = await guardCredits({ ownerId: "u1", surface: "chat" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("credit_limit_reached");
      expect(res.response.status).toBe(402);
    }
  });

  it("honours the staged rollout allowlist", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "on");
    vi.stubEnv("BILLING_ENFORCEMENT_EMAILS", "me@example.com");
    mocked.mockResolvedValue(snapshot({ used: 600, limit: 500 }));

    const outside = await guardCredits({
      ownerId: "u1", email: "someone@else.com", surface: "chat",
    });
    expect(outside.ok).toBe(true); // shadowed, not denied

    const inside = await guardCredits({
      ownerId: "u1", email: "me@example.com", surface: "chat",
    });
    expect(inside.ok).toBe(false);
  });

  it("counts the estimate against the limit, not just what is already spent", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "on");
    mocked.mockResolvedValue(snapshot({ used: 495, limit: 500 }));
    const res = await guardCredits({ ownerId: "u1", surface: "chat", estimate: 20 });
    expect(res.ok).toBe(false);
  });

  it("blocks an inactive subscription with a distinct code", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "on");
    mocked.mockResolvedValue(snapshot({ status: "canceled", used: 0 }));
    const res = await guardCredits({ ownerId: "u1", surface: "chat" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("subscription_inactive");
  });

  it("FAILS OPEN when the snapshot lookup throws", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "on");
    mocked.mockRejectedValue(new Error("database on fire"));
    const res = await guardCredits({ ownerId: "u1", surface: "chat" });
    expect(res.ok).toBe(true);
  });

  it("FAILS OPEN when there is no entitlement row", async () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "on");
    mocked.mockResolvedValue(null);
    const res = await guardCredits({ ownerId: "u1", surface: "chat" });
    expect(res.ok).toBe(true);
  });
});
