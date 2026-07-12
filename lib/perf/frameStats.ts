/**
 * Frame-timing + input-latency instrumentation for the canvas perf work.
 *
 * Collects, per session:
 *  - rAF frame deltas (ring buffer) → avg / p95 / p99 / % over 16.7ms
 *  - long tasks (>50ms) via PerformanceObserver("longtask")
 *  - input-to-paint latency via PerformanceObserver("event") durations
 *  - React commits (counted by PerfHUD's profiler hook or manual increments)
 *
 * Zero overhead when no session is running. Exposed on window as
 * `__flowstatePerf` so the Playwright benchmark driver can start/stop
 * sessions and read results without bundling extra code.
 */

export interface PerfSessionStats {
  label: string;
  sampleCount: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  framesOver16ms: number;
  pctOver16: number;
  /**
   * Estimated display refresh interval (ms) — lower-quartile frame delta.
   * A 60Hz display idles at ~16.7ms, ProMotion at ~8.3ms, so budgets must be
   * judged RELATIVE to this, not against absolute ms.
   */
  refreshIntervalMs: number;
  /** Frames that took >1.5× the refresh interval (at least one vsync missed). */
  droppedFrames: number;
  droppedPct: number;
  longTasks: number;
  longTaskTotalMs: number;
  /** p95 of input event duration (processingStart→next paint), ms. */
  inputLatencyP95: number;
  inputEventCount: number;
  reactCommits: number;
  /** Total React render time inside those commits (Profiler actualDuration). */
  reactCommitMs: number;
  durationMs: number;
  capturedAt: string;
}

interface ActiveSession {
  label: string;
  startedAt: number;
  samples: number[];
  longTasks: number;
  longTaskTotalMs: number;
  inputDurations: number[];
  reactCommits: number;
  reactCommitMs: number;
  rafId: number;
  lastFrameAt: number;
  longTaskObserver: PerformanceObserver | null;
  eventObserver: PerformanceObserver | null;
}

let active: ActiveSession | null = null;

/** True while a perf session is sampling (PerfHUD uses this). */
export function isPerfSessionActive(): boolean {
  return active !== null;
}

/** Incremented by the React commit counter (see useReactCommitCounter). */
export function notePerfReactCommit(
  _id?: string,
  _phase?: string,
  actualDuration?: number,
): void {
  if (!active) return;
  active.reactCommits += 1;
  if (typeof actualDuration === "number") {
    active.reactCommitMs += actualDuration;
  }
}

export function startPerfSession(label = "canvas"): void {
  if (typeof window === "undefined") return;
  stopPerfSession();

  const session: ActiveSession = {
    label,
    startedAt: performance.now(),
    samples: [],
    longTasks: 0,
    longTaskTotalMs: 0,
    inputDurations: [],
    reactCommits: 0,
    reactCommitMs: 0,
    rafId: 0,
    lastFrameAt: performance.now(),
    longTaskObserver: null,
    eventObserver: null,
  };

  const loop = (now: number) => {
    if (active !== session) return;
    session.samples.push(now - session.lastFrameAt);
    session.lastFrameAt = now;
    session.rafId = requestAnimationFrame(loop);
  };
  session.rafId = requestAnimationFrame((now) => {
    // First frame only sets the baseline — the delta to session start is
    // dominated by whatever triggered the session, not a real frame.
    session.lastFrameAt = now;
    session.rafId = requestAnimationFrame(loop);
  });

  try {
    session.longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        session.longTasks += 1;
        session.longTaskTotalMs += entry.duration;
      }
    });
    session.longTaskObserver.observe({ entryTypes: ["longtask"] });
  } catch {
    // longtask unsupported (Safari) — stats report 0.
  }

  try {
    session.eventObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const name = entry.name;
        if (
          name === "pointermove" ||
          name === "wheel" ||
          name === "pointerdown" ||
          name === "pointerup"
        ) {
          session.inputDurations.push(entry.duration);
        }
      }
    });
    // durationThreshold 16 is the spec minimum for the "event" type.
    session.eventObserver.observe({
      type: "event",
      buffered: false,
      // @ts-expect-error durationThreshold is valid for event timing
      durationThreshold: 16,
    });
  } catch {
    // Event timing unsupported — inputLatency reports 0.
  }

  active = session;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.floor(sorted.length * p),
  );
  return sorted[idx];
}

export function stopPerfSession(): PerfSessionStats | null {
  const session = active;
  if (!session) return null;
  active = null;

  cancelAnimationFrame(session.rafId);
  session.longTaskObserver?.disconnect();
  session.eventObserver?.disconnect();

  const samples = [...session.samples].sort((a, b) => a - b);
  const avg =
    samples.length > 0
      ? samples.reduce((s, v) => s + v, 0) / samples.length
      : 0;
  const over16 = samples.filter((s) => s > 16.7).length;
  const inputs = [...session.inputDurations].sort((a, b) => a - b);
  // Lower-quartile delta ≈ vsync interval when most frames are on time.
  const refresh = Math.min(
    33.4,
    Math.max(4, percentile(samples, 0.25) || 16.7),
  );
  const dropped = samples.filter((s) => s > refresh * 1.5).length;

  return {
    label: session.label,
    sampleCount: samples.length,
    avgMs: Number(avg.toFixed(2)),
    p95Ms: Number(percentile(samples, 0.95).toFixed(2)),
    p99Ms: Number(percentile(samples, 0.99).toFixed(2)),
    framesOver16ms: over16,
    pctOver16:
      samples.length > 0
        ? Number(((over16 / samples.length) * 100).toFixed(1))
        : 0,
    refreshIntervalMs: Number(refresh.toFixed(2)),
    droppedFrames: dropped,
    droppedPct:
      samples.length > 0
        ? Number(((dropped / samples.length) * 100).toFixed(1))
        : 0,
    longTasks: session.longTasks,
    longTaskTotalMs: Number(session.longTaskTotalMs.toFixed(0)),
    inputLatencyP95: Number(percentile(inputs, 0.95).toFixed(1)),
    inputEventCount: inputs.length,
    reactCommits: session.reactCommits,
    reactCommitMs: Number(session.reactCommitMs.toFixed(1)),
    durationMs: Number((performance.now() - session.startedAt).toFixed(0)),
    capturedAt: new Date().toISOString(),
  };
}

/** Rolling frame sampler for the always-on HUD (independent of sessions). */
export interface HudFrameSnapshot {
  fps: number;
  avgMs: number;
  worstMs: number;
  samples: number[];
}

export function createHudSampler(windowSize = 60): {
  start: (onSnapshot: (snap: HudFrameSnapshot) => void) => void;
  stop: () => void;
} {
  let rafId = 0;
  let last = 0;
  let ring: number[] = [];
  let running = false;

  return {
    start(onSnapshot) {
      running = true;
      last = performance.now();
      let sinceEmit = 0;
      const loop = (now: number) => {
        if (!running) return;
        const delta = now - last;
        last = now;
        ring.push(delta);
        if (ring.length > windowSize) ring.shift();
        sinceEmit += delta;
        if (sinceEmit >= 250 && ring.length > 0) {
          sinceEmit = 0;
          const avg = ring.reduce((s, v) => s + v, 0) / ring.length;
          onSnapshot({
            fps: Math.round(1000 / Math.max(avg, 0.001)),
            avgMs: Number(avg.toFixed(1)),
            worstMs: Number(Math.max(...ring).toFixed(1)),
            samples: [...ring],
          });
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
      ring = [];
    },
  };
}

declare global {
  interface Window {
    __flowstatePerf?: {
      start: (label?: string) => void;
      stop: () => PerfSessionStats | null;
      isActive: () => boolean;
    };
  }
}

/** Install the window bridge the Playwright benchmark driver uses. */
export function installPerfBridge(): void {
  if (typeof window === "undefined") return;
  window.__flowstatePerf = {
    start: startPerfSession,
    stop: stopPerfSession,
    isActive: isPerfSessionActive,
  };
}
