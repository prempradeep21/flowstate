import { describe, expect, it } from "vitest";
import {
  getCanvasCardBounds,
  getLayoutCardBounds,
} from "@/lib/canvasMeasure";
import { resolveTuning, DEFAULT_CANVAS_TUNING } from "@/lib/canvasTuning";

const tuning = resolveTuning(DEFAULT_CANVAS_TUNING);

describe("getCanvasCardBounds", () => {
  it("uses tuning cardWidth and stored height when DOM is unavailable", () => {
    const card = {
      id: "c1",
      status: "done" as const,
      size: { w: 999, h: 300 },
    };
    expect(getCanvasCardBounds(card, tuning)).toEqual({ w: 420, h: 300 });
    expect(getLayoutCardBounds(card, tuning)).toEqual({ w: 420, h: 300 });
  });

  it("falls back to getCardBounds height when size is unset and DOM unavailable", () => {
    const card = { id: "c2", status: "done" as const };
    const bounds = getCanvasCardBounds(card, tuning);
    expect(bounds.w).toBe(420);
    expect(bounds.h).toBe(240);
  });
});
