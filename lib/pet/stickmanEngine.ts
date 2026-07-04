/**
 * Canvas Pet — framework-agnostic motion math for the stickman.
 *
 * Pure functions only: no React, no DOM, no timers. The playground hook
 * (useStickmanEngine) owns the rAF loop and applies the numbers returned
 * here as a `translate3d` transform. Keeping the math pure makes it unit
 * testable and reusable when the pet later moves onto the real canvas.
 */

import type { Foothold, JumpArc, PetPoint } from "@/lib/pet/types";

/** How far in from a foothold edge the feet stop before jumping, px. */
export const EDGE_INSET = 10;

/** Baseline run speed at speed multiplier 1, px/s. */
export const BASE_RUN_SPEED = 160;

/** Flight-time bounds so short hops stay snappy and long leaps stay readable. */
const MIN_JUMP_MS = 320;
const MAX_JUMP_MS = 900;

/** Clamp a foot x so it stays on the foothold's walkable surface. */
export function clampToFoothold(x: number, foothold: Foothold): number {
  const lo = foothold.left + EDGE_INSET;
  const hi = foothold.right - EDGE_INSET;
  // Degenerate (very narrow) surfaces collapse to their center.
  if (lo >= hi) return (foothold.left + foothold.right) / 2;
  return Math.min(hi, Math.max(lo, x));
}

/** Sort footholds left→right by horizontal center. */
export function sortFootholds(footholds: Foothold[]): Foothold[] {
  return [...footholds].sort(
    (a, b) => (a.left + a.right) / 2 - (b.left + b.right) / 2,
  );
}

/** Index of the neighbouring foothold in `direction`, or -1 at the ends. */
export function neighborIndex(
  index: number,
  direction: -1 | 1,
  count: number,
): number {
  const next = index + direction;
  return next >= 0 && next < count ? next : -1;
}

/**
 * The take-off point on `from` nearest to `to`, and the landing point on
 * `to` nearest to `from` — both inset from the edge so the feet land safely.
 */
export function jumpEndpoints(
  from: Foothold,
  to: Foothold,
): { takeoff: PetPoint; landing: PetPoint } {
  const goingRight = (to.left + to.right) / 2 > (from.left + from.right) / 2;
  const takeoffX = clampToFoothold(
    goingRight ? from.right - EDGE_INSET : from.left + EDGE_INSET,
    from,
  );
  const landingX = clampToFoothold(
    goingRight ? to.left + EDGE_INSET : to.right - EDGE_INSET,
    to,
  );
  return {
    takeoff: { x: takeoffX, y: from.surfaceY },
    landing: { x: landingX, y: to.surfaceY },
  };
}

/**
 * Build a jump arc between two foot points.
 *
 * Apex scales with horizontal distance and always clears an upward height
 * gap; duration scales with total distance within readable bounds.
 */
export function buildJumpArc(from: PetPoint, to: PetPoint): JumpArc {
  const dx = Math.abs(to.x - from.x);
  const rise = Math.max(0, from.y - to.y); // landing higher than takeoff
  // Enough hump to look springy on flat jumps, plus clearance when climbing.
  const apex = Math.max(24, dx * 0.22) + rise * 0.6;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const duration = Math.min(
    MAX_JUMP_MS,
    Math.max(MIN_JUMP_MS, 260 + distance * 0.9),
  );
  return { from, to, apex, duration };
}

/**
 * Sample the arc at t ∈ [0,1]: linear x, linear y plus a parabolic hump
 * of `-4·apex·t·(1−t)` (peaks at t = 0.5, zero at both ends).
 */
export function sampleJumpArc(arc: JumpArc, t: number): PetPoint {
  const k = Math.min(1, Math.max(0, t));
  const x = arc.from.x + (arc.to.x - arc.from.x) * k;
  const baseY = arc.from.y + (arc.to.y - arc.from.y) * k;
  return { x, y: baseY - 4 * arc.apex * k * (1 - k) };
}

/**
 * Advance a run toward `targetX` by `dt` ms at `speed` px/s.
 * Never overshoots; reports arrival.
 */
export function runStep(
  x: number,
  targetX: number,
  speed: number,
  dt: number,
): { x: number; done: boolean } {
  const maxMove = (speed * dt) / 1000;
  const delta = targetX - x;
  if (Math.abs(delta) <= maxMove) return { x: targetX, done: true };
  return { x: x + Math.sign(delta) * maxMove, done: false };
}

/**
 * CSS transform anchoring the figure's bottom-center to the foot point.
 * The rendered figure box is `size` tall and `size / 2` wide.
 */
export function petTransform(point: PetPoint, size: number): string {
  return `translate3d(${point.x - size / 4}px, ${point.y - size}px, 0)`;
}
