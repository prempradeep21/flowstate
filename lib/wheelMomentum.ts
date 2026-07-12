/**
 * macOS trackpad momentum (inertia) suppression for canvas pan.
 *
 * After the fingers lift, macOS keeps emitting synthetic wheel events — a
 * decaying "momentum tail" that pans the canvas for up to ~2s. Figma-style
 * canvases stop dead on finger lift; that glued feel is the goal.
 *
 * There is NO DOM API exposing the wheel phase, and Electron 33's
 * `webContents.on("input-event")` serializes only `type`/`modifiers`
 * (verified — no `momentumPhase`), so BOTH web and Electron use this
 * heuristic: momentum tails are frame-paced, same-direction, and decay
 * smoothly (~3%/event), while human scrolls jitter. Detection requires all
 * of a flick-scale start, tight event pacing, per-step monotone decay, and
 * cumulative decay — then deltas are ATTENUATED (halved per event), never
 * hard-gated, so a false positive can only soften the last few pixels of a
 * genuine deceleration rather than eat real input.
 */

/**
 * Min samples in a decaying run before we call it momentum. A finger
 * decelerating smoothly mid-scroll can briefly look like a tail; the longer
 * window plus the flick floor keep detection out of ordinary scrolling —
 * a misfire here reads as a scroll "hiccup" and is worse than a bit of
 * surviving inertia.
 */
const DETECT_WINDOW = 6;
/** Momentum events arrive frame-paced; gaps beyond this break the run. */
const DETECT_MAX_GAP_MS = 30;
/** Per-step tolerance: each |d| may exceed the previous by at most 2%. */
const DETECT_STEP_RATIO = 1.02;
/**
 * Cumulative decay across the run. macOS momentum decays ~3%/event, so a
 * genuine tail hits 0.82 within ~7 events; constant-rate slow scrolls
 * (ratio ~1.0) can never reach it regardless of run length.
 */
const DETECT_CUMULATIVE_RATIO = 0.82;
/** Momentum only follows flicks — deliberate scrolls never enter. */
const DETECT_FLICK_FLOOR_PX = 20;
/** While suppressing: a pause this long means real fingers returned. */
const RESET_GAP_MS = 80;
/**
 * While suppressing: ANY meaningful magnitude growth = real input (a
 * genuine tail decays monotonically, never grows), so restore 1:1
 * immediately — this is what makes a rare misfire self-correct within one
 * event instead of eating the user's scroll.
 */
const RESET_GROWTH_RATIO = 1.05;
/** First suppressed event keeps this fraction; ×0.6 each event after. */
const ATTENUATION_START = 0.6;
const ATTENUATION_DECAY = 0.6;
/** Below this the delta is fully dropped. */
const ATTENUATION_FLOOR = 0.05;

interface WheelSample {
  t: number;
  mag: number;
  /** Dominant axis + sign, e.g. "y-", "x+". Momentum never changes it. */
  dir: string;
}

function sampleOf(dx: number, dy: number, t: number): WheelSample {
  const mag = Math.hypot(dx, dy);
  const dir =
    Math.abs(dy) >= Math.abs(dx)
      ? dy < 0
        ? "y-"
        : "y+"
      : dx < 0
        ? "x-"
        : "x+";
  return { t, mag, dir };
}

export class WheelMomentumFilter {
  /** Anchor (first sample) of the current monotone-decaying run. */
  private runStart: WheelSample | null = null;
  private runCount = 0;
  private attenuation = 1;
  private last: WheelSample | null = null;

  /** True while the filter is actively suppressing a momentum tail. */
  isSuppressing(): boolean {
    return this.attenuation < 1;
  }

  reset(): void {
    this.runStart = null;
    this.runCount = 0;
    this.attenuation = 1;
    this.last = null;
  }

  /**
   * Feed one pan-wheel event; returns the deltas to apply (raw, attenuated,
   * or zero). Call for every pan event so pacing/decay tracking stays true.
   */
  filter(
    dx: number,
    dy: number,
    now: number = performance.now(),
  ): { dx: number; dy: number } {
    const s = sampleOf(dx, dy, now);
    if (s.mag === 0) return { dx, dy };

    const prev = this.last;
    this.last = s;

    if (this.attenuation < 1) {
      // Suppressing a tail: continue while it still looks like momentum.
      const continues =
        prev !== null &&
        s.t - prev.t <= RESET_GAP_MS &&
        s.dir === prev.dir &&
        s.mag <= prev.mag * RESET_GROWTH_RATIO;
      if (continues) {
        this.attenuation *= ATTENUATION_DECAY;
        if (this.attenuation < ATTENUATION_FLOOR) {
          return { dx: 0, dy: 0 };
        }
        return { dx: dx * this.attenuation, dy: dy * this.attenuation };
      }
      // Sign flip / growth / pause — real fingers are back: full passthrough.
      this.attenuation = 1;
      this.runStart = s;
      this.runCount = 1;
      return { dx, dy };
    }

    // Passthrough mode: extend or restart the monotone-decaying run. The
    // cumulative check is anchored at the run's FIRST sample, so a genuine
    // tail's decay keeps deepening while a constant-rate scroll (ratio ~1)
    // can extend the run forever without ever reaching the threshold.
    const extendsRun =
      prev !== null &&
      this.runStart !== null &&
      s.t - prev.t <= DETECT_MAX_GAP_MS &&
      s.dir === prev.dir &&
      s.mag <= prev.mag * DETECT_STEP_RATIO;
    if (extendsRun) {
      this.runCount++;
    } else {
      this.runStart = s;
      this.runCount = 1;
    }

    if (
      this.runCount >= DETECT_WINDOW &&
      this.runStart !== null &&
      this.runStart.mag >= DETECT_FLICK_FLOOR_PX &&
      s.mag <= this.runStart.mag * DETECT_CUMULATIVE_RATIO
    ) {
      this.attenuation = ATTENUATION_START;
      return { dx: dx * this.attenuation, dy: dy * this.attenuation };
    }

    return { dx, dy };
  }
}

const globalFilter = new WheelMomentumFilter();

/** Module-level filter for the canvas wheel handler. */
export function filterPanWheelDelta(
  dx: number,
  dy: number,
  now?: number,
): { dx: number; dy: number } {
  return globalFilter.filter(dx, dy, now);
}
