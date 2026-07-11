import { describe, expect, it } from "vitest";
import {
  buildTimelineSegments,
  computeVisibleLabels,
  estimateLabelWidth,
  eventTextColor,
  segmentColorAt,
  type LabelCandidate,
} from "@/lib/timelineLayout";

function candidate(
  partial: Partial<LabelCandidate> & { index: number; x: number },
): LabelCandidate {
  return {
    side: "above",
    width: 120,
    highlight: false,
    centerBias: Math.abs(partial.x - 500),
    ...partial,
  };
}

describe("computeVisibleLabels", () => {
  it("always shows at least one label when events are on screen", () => {
    // Three events piled on top of each other (extreme zoom-out).
    const candidates = [0, 1, 2].map((index) =>
      candidate({ index, x: 500, side: index % 2 === 0 ? "above" : "below", width: 200 }),
    );
    const shown = computeVisibleLabels(candidates);
    expect(shown.size).toBeGreaterThanOrEqual(1);
  });

  it("reveals more labels as events spread apart (zoom in)", () => {
    const widths = 120;
    const tight = [0, 1, 2, 3].map((index) =>
      candidate({ index, x: 500 + index * 40, side: "above", width: widths }),
    );
    const spread = [0, 1, 2, 3].map((index) =>
      candidate({ index, x: 200 + index * 300, side: "above", width: widths }),
    );
    expect(computeVisibleLabels(spread).size).toBeGreaterThan(
      computeVisibleLabels(tight).size,
    );
  });

  it("treats above and below as independent lanes", () => {
    // Same x, but opposite sides — both should fit.
    const candidates = [
      candidate({ index: 0, x: 500, side: "above", width: 200 }),
      candidate({ index: 1, x: 500, side: "below", width: 200 }),
    ];
    expect(computeVisibleLabels(candidates).size).toBe(2);
  });

  it("prioritises highlighted events for the scarce slot", () => {
    const candidates = [
      candidate({ index: 0, x: 490, side: "above", width: 200, highlight: false }),
      candidate({ index: 1, x: 510, side: "above", width: 200, highlight: true }),
    ];
    const shown = computeVisibleLabels(candidates);
    expect(shown.has(1)).toBe(true);
    expect(shown.size).toBe(1);
  });
});

describe("buildTimelineSegments", () => {
  it("returns a single accent-banded segment when empty (never empty white)", () => {
    const segs = buildTimelineSegments([], 800);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ x1: 0, x2: 800, band: true });
  });

  it("uses one solid colour per phase with an accent lead-in and banded lead-out", () => {
    const segs = buildTimelineSegments(
      [
        { x: 200, color: "#111111" },
        { x: 400, color: "#222222" },
      ],
      800,
    );
    // lead-in + 1 between + lead-out
    expect(segs).toHaveLength(3);
    expect(segs[0]).toMatchObject({ x2: 200, band: true }); // accent lead-in, banded
    expect(segs[1]).toMatchObject({ x1: 200, x2: 400, color: "#111111", band: true });
    expect(segs[2]).toMatchObject({ x1: 400, color: "#222222", band: true });
    // spans at least the full viewport
    expect(segs[segs.length - 1]!.x2).toBeGreaterThanOrEqual(800);
  });

  it("extends beyond the viewport to cover off-screen events", () => {
    const segs = buildTimelineSegments([{ x: -300, color: "#333" }], 800);
    expect(segs[0]!.x1).toBeLessThanOrEqual(-300);
  });
});

describe("segmentColorAt", () => {
  it("returns the colour of the section containing x", () => {
    const segs = buildTimelineSegments(
      [
        { x: 200, color: "#aaaaaa" },
        { x: 400, color: "#bbbbbb" },
      ],
      800,
    );
    expect(segmentColorAt(300, segs)).toBe("#aaaaaa");
    expect(segmentColorAt(500, segs)).toBe("#bbbbbb");
  });
});

describe("eventTextColor", () => {
  it("returns dark text on light pills and white on dark pills", () => {
    // gold (index 2) is light → dark text; coral (index 0) is darker → white text.
    expect(eventTextColor(2)).toBe("#2A2826");
    expect(eventTextColor(0)).toBe("#FFFFFF");
  });
});

describe("estimateLabelWidth", () => {
  it("grows with label length and clamps to sane bounds", () => {
    expect(estimateLabelWidth("Hi")).toBeLessThan(estimateLabelWidth("A longer label"));
    expect(estimateLabelWidth("")).toBeGreaterThanOrEqual(64);
    expect(estimateLabelWidth("x".repeat(500))).toBeLessThanOrEqual(680);
  });
});
