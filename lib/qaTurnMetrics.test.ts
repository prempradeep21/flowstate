import { describe, expect, it } from "vitest";
import {
  formatElapsedMs,
  formatTurnTokenCount,
  formatTurnUsageLine,
  turnMetricsOnSubmit,
} from "@/lib/qaTurnMetrics";

describe("qaTurnMetrics", () => {
  it("turnMetricsOnSubmit resets timing and usage", () => {
    const before = Date.now();
    const metrics = turnMetricsOnSubmit();
    expect(metrics.turnUsage).toEqual({ inputTokens: 0, outputTokens: 0 });
    expect(metrics.askStartedAt).toBeGreaterThanOrEqual(before);
  });

  it("formatElapsedMs shows seconds then minutes", () => {
    expect(formatElapsedMs(450)).toBe("0s");
    expect(formatElapsedMs(1500)).toBe("2s");
    expect(formatElapsedMs(6500)).toBe("7s");
    expect(formatElapsedMs(65_000)).toBe("1:05");
  });

  it("formatTurnUsageLine mirrors session usage style", () => {
    expect(formatTurnUsageLine(undefined)).toBe("↑ 0 ↓ 0 tokens");
    expect(formatTurnUsageLine({ inputTokens: 1200, outputTokens: 45 })).toBe(
      "↑ 1.2k ↓ 45 tokens",
    );
  });

  it("formatTurnTokenCount abbreviates thousands", () => {
    expect(formatTurnTokenCount(999)).toBe("999");
    expect(formatTurnTokenCount(1500)).toBe("1.5k");
  });
});
