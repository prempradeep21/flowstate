import { describe, expect, it } from "vitest";
import {
  USD_PER_CREDIT,
  costUsdFor,
  creditsFor,
  isUnknownModel,
  rateForModel,
} from "@/lib/billing/pricing";

describe("rateForModel", () => {
  it("resolves dated model ids by longest prefix", () => {
    expect(rateForModel("claude-haiku-4-5-20251001").inputPerMTok).toBe(1);
  });

  it("prefers the longer prefix when several match", () => {
    // "claude-sonnet-5" and "claude-sonnet-4-6" must not collide.
    expect(rateForModel("claude-sonnet-4-6").outputPerMTok).toBe(15);
    expect(rateForModel("claude-sonnet-5").outputPerMTok).toBe(10);
  });

  it("falls back expensively for unmapped ids so they overcharge, not underbill", () => {
    expect(isUnknownModel("some/unreleased-model")).toBe(true);
    expect(rateForModel("some/unreleased-model").inputPerMTok).toBe(5);
  });

  it("treats the retired sonnet-4 id as unknown rather than guessing", () => {
    expect(isUnknownModel("claude-sonnet-4-20250514")).toBe(true);
  });
});

describe("costUsdFor", () => {
  // Real turn recorded 2026-09-15 via /api/chat on claude-sonnet-4-6.
  // Rates: $3/MTok in, $15/MTok out, cache read 0.1x ($0.30), write 1.25x ($3.75).
  const realTurn = {
    model: "claude-sonnet-4-6",
    inputTokens: 25,
    outputTokens: 1209,
    cacheReadTokens: 112242,
    cacheCreationTokens: 4145,
  };

  it("reproduces the measured cost of a real turn", () => {
    //    25 * 3      = 0.000075
    // 112242 * 0.30  = 0.0336726
    //   4145 * 3.75  = 0.01554375
    //   1209 * 15    = 0.018135
    expect(costUsdFor(realTurn)).toBeCloseTo(0.06742635, 8);
  });

  it("shows what the pre-fix code would have recorded", () => {
    // Dropping the two cache fields is exactly the bug Phase 0 fixed.
    const withoutCache = { ...realTurn, cacheReadTokens: 0, cacheCreationTokens: 0 };
    expect(costUsdFor(withoutCache)).toBeCloseTo(0.01821, 8);
    // ...a 3.7x undercount.
    expect(costUsdFor(realTurn) / costUsdFor(withoutCache)).toBeGreaterThan(3.5);
  });

  it("prices cache reads at a tenth of input and writes at 1.25x", () => {
    const base = { model: "claude-sonnet-4-6", inputTokens: 1_000_000 };
    expect(costUsdFor(base)).toBeCloseTo(3, 6);
    expect(costUsdFor({ model: "claude-sonnet-4-6", cacheReadTokens: 1_000_000 })).toBeCloseTo(0.3, 6);
    expect(costUsdFor({ model: "claude-sonnet-4-6", cacheCreationTokens: 1_000_000 })).toBeCloseTo(3.75, 6);
  });

  it("charges hosted web search per search on top of tokens", () => {
    expect(costUsdFor({ model: "claude-sonnet-4-6", webSearches: 3 })).toBeCloseTo(0.03, 6);
  });

  it("returns zero for a turn that consumed nothing (error before first token)", () => {
    expect(costUsdFor({ model: "claude-sonnet-4-6" })).toBe(0);
  });
});

describe("creditsFor", () => {
  it("is cost divided by the credit anchor", () => {
    const facts = { model: "claude-sonnet-4-6", outputTokens: 1000 };
    expect(creditsFor(facts)).toBeCloseTo(costUsdFor(facts) / USD_PER_CREDIT, 6);
  });

  it("prices the measured real turn at ~34 credits", () => {
    expect(
      creditsFor({
        model: "claude-sonnet-4-6",
        inputTokens: 25,
        outputTokens: 1209,
        cacheReadTokens: 112242,
        cacheCreationTokens: 4145,
      }),
    ).toBeCloseTo(33.71, 1);
  });

  it("costs nothing when nothing was consumed, so failed turns are free", () => {
    expect(creditsFor({ model: "claude-sonnet-4-6" })).toBe(0);
  });
});
