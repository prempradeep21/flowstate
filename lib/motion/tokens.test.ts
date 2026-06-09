import { describe, expect, it } from "vitest";
import { canvasLoadDelays, durations, easings, landingDelays, scales } from "./tokens";
import { dropVariants, popUpVariants, contentSizeTransition } from "./variants";

describe("motion tokens", () => {
  it("exports duration tiers", () => {
    expect(durations.standard).toBe(320);
    expect(durations.panel).toBe(380);
    expect(durations.slow).toBe(480);
  });

  it("exports easing curves as 4-tuples", () => {
    expect(easings.easeMedium).toHaveLength(4);
    expect(easings.easeHeavy).toHaveLength(4);
  });

  it("landing delays finish under stagger cap", () => {
    const lastTipStart = landingDelays.tipBase + landingDelays.tipStagger * 2;
    const lastEnd = lastTipStart + landingDelays.duration;
    expect(lastEnd).toBeLessThan(1000);
  });

  it("canvas load reveal completes in exactly 3 seconds", () => {
    expect(canvasLoadDelays.totalMs).toBe(3000);
    expect(
      canvasLoadDelays.totalMs - canvasLoadDelays.slideDuration,
    ).toBe(2380);
  });
});

describe("motion variants", () => {
  it("spawn variants use compositor-friendly props only", () => {
    expect(dropVariants.initial).toHaveProperty("opacity");
    expect(dropVariants.initial).toHaveProperty("y");
    expect(popUpVariants.initial).toHaveProperty("scale");
    expect(scales.scalePopStart).toBeLessThan(1);
  });

  it("exports content size transition for UI chrome layout", () => {
    expect(contentSizeTransition.duration).toBe(0.32);
  });
});
