import { describe, expect, it } from "vitest";
import {
  EDGE_INSET,
  buildJumpArc,
  clampToFoothold,
  jumpEndpoints,
  neighborIndex,
  petTransform,
  runStep,
  sampleJumpArc,
  sortFootholds,
} from "@/lib/pet/stickmanEngine";
import type { Foothold } from "@/lib/pet/types";

const hold = (id: string, left: number, right: number, surfaceY: number): Foothold => ({
  id,
  left,
  right,
  surfaceY,
});

describe("clampToFoothold", () => {
  const f = hold("a", 100, 300, 50);

  it("keeps x inside the inset surface", () => {
    expect(clampToFoothold(0, f)).toBe(100 + EDGE_INSET);
    expect(clampToFoothold(1000, f)).toBe(300 - EDGE_INSET);
    expect(clampToFoothold(200, f)).toBe(200);
  });

  it("collapses degenerate surfaces to their center", () => {
    const tiny = hold("t", 100, 110, 50);
    expect(clampToFoothold(0, tiny)).toBe(105);
  });
});

describe("sortFootholds / neighborIndex", () => {
  it("sorts by horizontal center and bounds neighbors at the ends", () => {
    const sorted = sortFootholds([
      hold("mid", 400, 600, 50),
      hold("left", 0, 200, 80),
      hold("right", 800, 1000, 30),
    ]);
    expect(sorted.map((f) => f.id)).toEqual(["left", "mid", "right"]);
    expect(neighborIndex(0, -1, 3)).toBe(-1); // can't leave the left end
    expect(neighborIndex(2, 1, 3)).toBe(-1); // can't leave the right end
    expect(neighborIndex(1, 1, 3)).toBe(2);
    expect(neighborIndex(1, -1, 3)).toBe(0);
  });
});

describe("jumpEndpoints", () => {
  const left = hold("l", 0, 200, 80);
  const right = hold("r", 300, 500, 40);

  it("takes off from the near edge and lands on the near edge", () => {
    const { takeoff, landing } = jumpEndpoints(left, right);
    expect(takeoff).toEqual({ x: 200 - EDGE_INSET, y: 80 });
    expect(landing).toEqual({ x: 300 + EDGE_INSET, y: 40 });
  });

  it("mirrors when jumping leftwards", () => {
    const { takeoff, landing } = jumpEndpoints(right, left);
    expect(takeoff).toEqual({ x: 300 + EDGE_INSET, y: 40 });
    expect(landing).toEqual({ x: 200 - EDGE_INSET, y: 80 });
  });
});

describe("buildJumpArc / sampleJumpArc", () => {
  it("starts and ends exactly at the endpoints", () => {
    const arc = buildJumpArc({ x: 100, y: 200 }, { x: 400, y: 120 });
    expect(sampleJumpArc(arc, 0)).toEqual({ x: 100, y: 200 });
    expect(sampleJumpArc(arc, 1)).toEqual({ x: 400, y: 120 });
  });

  it("peaks mid-flight above both endpoints", () => {
    const arc = buildJumpArc({ x: 0, y: 100 }, { x: 200, y: 100 });
    const mid = sampleJumpArc(arc, 0.5);
    expect(mid.y).toBeLessThan(100 - 20); // clearly airborne
    expect(mid.x).toBe(100);
  });

  it("clears an upward height gap (jumping onto a taller platform)", () => {
    const from = { x: 0, y: 300 };
    const to = { x: 150, y: 150 }; // landing 150px higher
    const arc = buildJumpArc(from, to);
    // Everywhere along the arc must stay at or above the straight line —
    // in screen coords, "above" is smaller y.
    for (let t = 0.1; t < 1; t += 0.1) {
      const p = sampleJumpArc(arc, t);
      const lineY = from.y + (to.y - from.y) * t;
      expect(p.y).toBeLessThanOrEqual(lineY);
    }
    // And the apex actually rises above the higher landing surface.
    expect(sampleJumpArc(arc, 0.5).y).toBeLessThan(to.y);
  });

  it("clamps flight duration to readable bounds", () => {
    const short = buildJumpArc({ x: 0, y: 0 }, { x: 10, y: 0 });
    const long = buildJumpArc({ x: 0, y: 0 }, { x: 5000, y: 0 });
    expect(short.duration).toBeGreaterThanOrEqual(320);
    expect(long.duration).toBeLessThanOrEqual(900);
  });
});

describe("runStep", () => {
  it("moves toward the target without overshooting", () => {
    const step = runStep(0, 100, 160, 100); // 16px max this frame
    expect(step).toEqual({ x: 16, done: false });
  });

  it("snaps to the target and reports done on arrival", () => {
    const step = runStep(95, 100, 160, 100);
    expect(step).toEqual({ x: 100, done: true });
  });

  it("runs leftwards too", () => {
    const step = runStep(100, 0, 160, 100);
    expect(step).toEqual({ x: 84, done: false });
  });
});

describe("petTransform", () => {
  it("anchors bottom-center of a size-tall, size/2-wide box", () => {
    expect(petTransform({ x: 100, y: 200 }, 48)).toBe(
      "translate3d(88px, 152px, 0)",
    );
  });
});
