import { describe, expect, it } from "vitest";
import {
  fitBoundsToThumbnail,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
} from "@/lib/canvasSnapshotThumbnail/captureCanvasThumbnail";

describe("fitBoundsToThumbnail", () => {
  it("centres wide content and keeps it inside the margins", () => {
    const bounds = { x: -500, y: 200, w: 20000, h: 3000 };
    const fit = fitBoundsToThumbnail(bounds);
    const left = bounds.x * fit.scale + fit.tx;
    const right = (bounds.x + bounds.w) * fit.scale + fit.tx;
    const top = bounds.y * fit.scale + fit.ty;
    const bottom = (bounds.y + bounds.h) * fit.scale + fit.ty;
    expect(left).toBeGreaterThan(0);
    expect(right).toBeLessThan(THUMBNAIL_WIDTH);
    expect(left).toBeCloseTo(THUMBNAIL_WIDTH - right, 5);
    expect(top).toBeCloseTo(THUMBNAIL_HEIGHT - bottom, 5);
  });

  it("never zooms small canvases past 100%", () => {
    const fit = fitBoundsToThumbnail({ x: 0, y: 0, w: 300, h: 200 });
    expect(fit.scale).toBe(1);
    expect(fit.tx).toBeCloseTo((THUMBNAIL_WIDTH - 300) / 2, 5);
  });
});
