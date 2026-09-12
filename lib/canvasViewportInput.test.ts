import { describe, expect, it } from "vitest";
import {
  gestureZoomFactor,
  wheelZoomDelta,
  wheelZoomFactor,
} from "@/lib/canvasViewportInput";

const PIXEL = 0;
const LINE = 1;

describe("wheelZoomDelta", () => {
  it("passes through small trackpad pinch deltas unchanged", () => {
    expect(
      wheelZoomDelta({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: 2,
        deltaMode: PIXEL,
      }),
    ).toBe(2);
  });

  it("passes through large plain mouse-wheel deltas unchanged", () => {
    expect(
      wheelZoomDelta({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: 100,
        deltaMode: PIXEL,
      }),
    ).toBe(100);
  });

  it("clamps large deltas only for pinch/modifier path", () => {
    expect(
      wheelZoomDelta({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: 100,
        deltaMode: PIXEL,
      }),
    ).toBe(10);
  });

  it("clamps negative large modifier deltas to -10", () => {
    expect(
      wheelZoomDelta({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: -100,
        deltaMode: PIXEL,
      }),
    ).toBe(-10);
  });

  it("passes fast continuous pinch deltas through unclamped", () => {
    // Fractional pixel-mode deltas = trackpad pinch (continuous). Fast
    // pinches emit 30–120px/event; clamping them was a velocity ceiling.
    for (const dy of [80.5, 120.25, -96.75]) {
      expect(
        wheelZoomDelta({
          ctrlKey: true,
          metaKey: false,
          altKey: false,
          shiftKey: false,
          deltaX: 0,
          deltaY: dy,
          deltaMode: PIXEL,
        }),
      ).toBe(dy);
    }
  });

  it("guards continuous pinch deltas against garbage input at ±240", () => {
    expect(
      wheelZoomDelta({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: 500.5,
        deltaMode: PIXEL,
      }),
    ).toBe(240);
    expect(
      wheelZoomDelta({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: -500.5,
        deltaMode: PIXEL,
      }),
    ).toBe(-240);
  });

  it("normalizes line-mode plain wheel deltas without clamping", () => {
    expect(
      wheelZoomDelta({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: 2,
        deltaMode: LINE,
      }),
    ).toBe(32);
  });

  it("uses deltaY when shiftKey swaps horizontal scroll into deltaY", () => {
    const withoutShift = wheelZoomDelta({
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      deltaX: 0,
      deltaY: 32,
      deltaMode: PIXEL,
    });
    const withShift = wheelZoomDelta({
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: true,
      deltaX: 0,
      deltaY: 32,
      deltaMode: PIXEL,
    });
    expect(withShift).toBe(withoutShift);
  });
});

describe("wheelZoomFactor", () => {
  it("matches pre-fix plain mouse wheel sensitivity", () => {
    const event = {
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      deltaX: 0,
      deltaY: 100,
      deltaMode: PIXEL,
    };
    expect(wheelZoomFactor(event)).toBeCloseTo(Math.exp(-100 * 0.0015));
  });

  it("uses higher sensitivity for modifier/pinch wheels", () => {
    const pinch = wheelZoomFactor({
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      deltaX: 0,
      deltaY: 4,
      deltaMode: PIXEL,
    });
    const plain = wheelZoomFactor({
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      deltaX: 0,
      deltaY: 4,
      deltaMode: PIXEL,
    });
    expect(pinch).toBeLessThan(plain);
  });
});

describe("gestureZoomFactor", () => {
  it("returns incremental scale between gesturechange events", () => {
    expect(gestureZoomFactor(1, 1.2)).toBeCloseTo(1.2);
    expect(gestureZoomFactor(1.2, 1.5)).toBeCloseTo(1.25);
  });

  it("returns 1 for invalid scales", () => {
    expect(gestureZoomFactor(0, 1.2)).toBe(1);
    expect(gestureZoomFactor(1, 0)).toBe(1);
  });
});
