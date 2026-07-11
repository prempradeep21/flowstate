import { describe, expect, it } from "vitest";
import { chooseNextAction, nextDecisionDelay } from "@/lib/pet/brain";

/** Deterministic RNG stepping through a fixed sequence. */
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("chooseNextAction bounds", () => {
  it("never jumps left from the leftmost foothold", () => {
    for (let roll = 0; roll < 1; roll += 0.01) {
      const action = chooseNextAction(
        { footholdIndex: 0, footholdCount: 5 },
        () => roll,
      );
      if (action.kind === "jump") expect(action.direction).toBe(1);
    }
  });

  it("never jumps right from the rightmost foothold", () => {
    for (let roll = 0; roll < 1; roll += 0.01) {
      const action = chooseNextAction(
        { footholdIndex: 4, footholdCount: 5 },
        () => roll,
      );
      if (action.kind === "jump") expect(action.direction).toBe(-1);
    }
  });

  it("proposes no jumps at all with a single foothold", () => {
    for (let roll = 0; roll < 1; roll += 0.01) {
      const action = chooseNextAction(
        { footholdIndex: 0, footholdCount: 1 },
        () => roll,
      );
      expect(action.kind).not.toBe("jump");
    }
  });
});

describe("chooseNextAction variety", () => {
  it("reaches every action kind from a middle foothold", () => {
    const seen = new Set<string>();
    for (let roll = 0; roll < 1; roll += 0.005) {
      seen.add(
        chooseNextAction({ footholdIndex: 2, footholdCount: 5 }, () => roll)
          .kind,
      );
    }
    expect([...seen].sort()).toEqual([
      "dance",
      "idle",
      "jump",
      "rest",
      "wander",
    ]);
  });

  it("damps immediate dance repeats", () => {
    let danceFresh = 0;
    let danceRepeat = 0;
    for (let roll = 0; roll < 1; roll += 0.001) {
      const fresh = chooseNextAction(
        { footholdIndex: 2, footholdCount: 5 },
        () => roll,
      );
      const repeat = chooseNextAction(
        { footholdIndex: 2, footholdCount: 5, lastKind: "dance" },
        () => roll,
      );
      if (fresh.kind === "dance") danceFresh++;
      if (repeat.kind === "dance") danceRepeat++;
    }
    expect(danceRepeat).toBeLessThan(danceFresh);
  });
});

describe("nextDecisionDelay", () => {
  it("stays inside the 600–2000ms window", () => {
    expect(nextDecisionDelay(seqRng([0]))).toBe(600);
    expect(nextDecisionDelay(seqRng([1]))).toBe(2000);
    const mid = nextDecisionDelay(seqRng([0.5]));
    expect(mid).toBeGreaterThan(600);
    expect(mid).toBeLessThan(2000);
  });
});
