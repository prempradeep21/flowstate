import { beforeEach, describe, expect, it } from "vitest";
import { WheelMomentumFilter } from "@/lib/wheelMomentum";

/** Feed a trace of {dx, dy, dt} events; returns the filtered outputs. */
function run(
  filter: WheelMomentumFilter,
  events: Array<{ dx: number; dy: number; dt: number }>,
): Array<{ dx: number; dy: number }> {
  let t = 1000;
  return events.map((e) => {
    t += e.dt;
    return filter.filter(e.dx, e.dy, t);
  });
}

describe("WheelMomentumFilter", () => {
  let filter: WheelMomentumFilter;
  beforeEach(() => {
    filter = new WheelMomentumFilter();
  });

  it("passes a slow constant-rate scroll through untouched", () => {
    const events = Array.from({ length: 20 }, () => ({
      dx: 0,
      dy: -2,
      dt: 16,
    }));
    const out = run(filter, events);
    for (const [i, o] of out.entries()) {
      expect(o, `event ${i}`).toEqual({ dx: 0, dy: -2 });
    }
    expect(filter.isSuppressing()).toBe(false);
  });

  it("passes a jittery human scroll through untouched", () => {
    // Human deltas fluctuate up and down — the monotone-decay run never forms.
    const mags = [20, 24, 19, 26, 22, 28, 21, 25, 23, 27];
    const out = run(
      filter,
      mags.map((m) => ({ dx: 0, dy: -m, dt: 16 })),
    );
    out.forEach((o, i) => expect(o.dy, `event ${i}`).toBe(-mags[i]));
    expect(filter.isSuppressing()).toBe(false);
  });

  it("suppresses a macOS momentum tail (~3% decay/event) to a dead stop", () => {
    // Flick, then a synthetic momentum tail decaying 3%/event from 40px.
    const tail: Array<{ dx: number; dy: number; dt: number }> = [];
    let mag = 40;
    for (let i = 0; i < 30; i++) {
      tail.push({ dx: 0, dy: -mag, dt: 16 });
      mag *= 0.97;
    }
    const out = run(filter, tail);

    // Detection engages once cumulative decay crosses the threshold…
    const suppressedFrom = out.findIndex((o, i) => o.dy !== tail[i].dy * 1);
    expect(suppressedFrom).toBeGreaterThanOrEqual(5);
    expect(suppressedFrom).toBeLessThanOrEqual(12);
    // …and fully zeroes within a handful of further events.
    const zeroFrom = out.findIndex((o) => o.dy === 0);
    expect(zeroFrom).toBeGreaterThan(suppressedFrom);
    expect(zeroFrom - suppressedFrom).toBeLessThanOrEqual(7);
    // Everything after stays zero (tail never resumes).
    for (let i = zeroFrom; i < out.length; i++) {
      expect(out[i].dy).toBe(0);
    }
    expect(filter.isSuppressing()).toBe(true);
  });

  it("re-engages 1:1 the moment real fingers return (magnitude growth)", () => {
    let mag = 40;
    const tail = Array.from({ length: 12 }, () => {
      const e = { dx: 0, dy: -mag, dt: 16 };
      mag *= 0.97;
      return e;
    });
    run(filter, tail);
    expect(filter.isSuppressing()).toBe(true);

    // New touch: sudden growth resets to passthrough instantly.
    const resumed = filter.filter(0, -50, 5000);
    expect(resumed).toEqual({ dx: 0, dy: -50 });
    expect(filter.isSuppressing()).toBe(false);
  });

  it("re-engages after a pause even in the same direction", () => {
    let mag = 40;
    const tail = Array.from({ length: 12 }, () => {
      const e = { dx: 0, dy: -mag, dt: 16 };
      mag *= 0.97;
      return e;
    });
    run(filter, tail);
    expect(filter.isSuppressing()).toBe(true);

    // >80ms gap = the tail is over; the next event is a fresh scroll.
    const later = filter.filter(0, -10, 1000 + 12 * 16 + 200);
    expect(later).toEqual({ dx: 0, dy: -10 });
    expect(filter.isSuppressing()).toBe(false);
  });

  it("never triggers on slow decaying scrolls below the flick floor", () => {
    // Decays perfectly but starts under 12px — deliberate gentle scroll.
    let mag = 8;
    const events = Array.from({ length: 15 }, () => {
      const e = { dx: 0, dy: -mag, dt: 16 };
      mag *= 0.95;
      return e;
    });
    const out = run(filter, events);
    out.forEach((o, i) => expect(o.dy, `event ${i}`).toBe(events[i].dy));
    expect(filter.isSuppressing()).toBe(false);
  });

  it("attenuates at most the tail of a genuine deceleration (failure mode)", () => {
    // A human decelerating smoothly CAN look like momentum — the accepted
    // failure mode is halving the last few events, never full gating of
    // fresh input afterwards.
    let mag = 30;
    const events = Array.from({ length: 10 }, () => {
      const e = { dx: 0, dy: -mag, dt: 16 };
      mag *= 0.9;
      return e;
    });
    const out = run(filter, events);
    // Early events untouched.
    expect(out[0]).toEqual({ dx: 0, dy: events[0].dy });
    expect(out[1]).toEqual({ dx: 0, dy: events[1].dy });
    // A following fresh scroll passes 1:1 (growth reset).
    const fresh = filter.filter(0, -40, 5000);
    expect(fresh).toEqual({ dx: 0, dy: -40 });
  });

  it("resets the run on direction change", () => {
    let mag = 40;
    const down = Array.from({ length: 4 }, () => {
      const e = { dx: 0, dy: -mag, dt: 16 };
      mag *= 0.97;
      return e;
    });
    run(filter, down);
    // Direction flip right before detection could complete.
    const flipped = filter.filter(0, 35, 1000 + 5 * 16);
    expect(flipped).toEqual({ dx: 0, dy: 35 });
    expect(filter.isSuppressing()).toBe(false);
  });
});
