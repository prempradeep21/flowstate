/**
 * Canvas Pet — free-will brain.
 *
 * Picks the stickman's next action with weighted randomness. Pure: takes an
 * injectable RNG so decisions are testable. Bounded: it never proposes a
 * jump off the end platforms, and it avoids repeating dance/rest twice in
 * a row so the pet keeps drifting around instead of looping one habit.
 */

import type { BrainAction } from "@/lib/pet/types";

export interface BrainContext {
  /** Index of the foothold the pet stands on (sorted left→right). */
  footholdIndex: number;
  /** Total number of footholds. */
  footholdCount: number;
  /** The previous action kind, to damp repeats. */
  lastKind?: BrainAction["kind"];
}

/** Delay before the brain acts again, ms — a small human-feeling pause. */
export function nextDecisionDelay(rng: () => number = Math.random): number {
  return 600 + rng() * 1400;
}

const WEIGHTS: Record<BrainAction["kind"], number> = {
  jump: 4,
  wander: 3,
  dance: 1.5,
  rest: 1.5,
  idle: 2,
};

export function chooseNextAction(
  ctx: BrainContext,
  rng: () => number = Math.random,
): BrainAction {
  const canLeft = ctx.footholdIndex > 0;
  const canRight = ctx.footholdIndex < ctx.footholdCount - 1;

  const candidates: { action: BrainAction; weight: number }[] = [];

  if (canLeft) {
    candidates.push({
      action: { kind: "jump", direction: -1 },
      weight: WEIGHTS.jump / (canRight ? 2 : 1),
    });
  }
  if (canRight) {
    candidates.push({
      action: { kind: "jump", direction: 1 },
      weight: WEIGHTS.jump / (canLeft ? 2 : 1),
    });
  }
  candidates.push({ action: { kind: "wander" }, weight: WEIGHTS.wander });
  candidates.push({
    action: { kind: "dance" },
    weight: ctx.lastKind === "dance" ? 0.2 : WEIGHTS.dance,
  });
  candidates.push({
    action: { kind: "rest" },
    weight: ctx.lastKind === "rest" ? 0.2 : WEIGHTS.rest,
  });
  candidates.push({ action: { kind: "idle" }, weight: WEIGHTS.idle });

  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) return c.action;
  }
  return candidates[candidates.length - 1].action;
}
