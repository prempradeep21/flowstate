// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyViewportPan,
  cancelViewportGesture,
  isViewportGestureActive,
  onGestureSettleHydrate,
} from "@/lib/viewportGesture";

/**
 * Manual rAF queue: drain-by-hand so tests control exactly which frames run.
 * viewportGesture's own commit rAF shares this queue — flushing runs both.
 */
let rafQueue = new Map<number, FrameRequestCallback>();
let rafId = 0;

function flushRafFrame(): void {
  const pending = [...rafQueue.values()];
  rafQueue.clear();
  for (const cb of pending) cb(performance.now());
}

beforeEach(() => {
  rafQueue = new Map();
  rafId = 0;
  // Fake ONLY timeout timers — the default set would also fake rAF and
  // performance, clobbering the manual queue below.
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
  });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafQueue.set(++rafId, cb);
    return rafId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    rafQueue.delete(id);
  });
  // setGesturingAttr does a container lookup; null = no-op in node.
  vi.stubGlobal("document", { querySelector: () => null });
});

afterEach(() => {
  cancelViewportGesture();
  // Drain anything the cancel scheduled so state never leaks across tests.
  flushRafFrame();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("onGestureSettleHydrate", () => {
  it("drains on the next frame when no gesture is active", () => {
    const cb = vi.fn();
    onGestureSettleHydrate(cb);
    expect(cb).not.toHaveBeenCalled();
    flushRafFrame();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("time-slices the drain across frames when callbacks exceed the budget", () => {
    // Each performance.now() call advances 5ms > the 4ms frame budget, so
    // the drain processes exactly one callback per frame.
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 5));

    const calls: number[] = [];
    for (let i = 0; i < 3; i++) {
      onGestureSettleHydrate(() => calls.push(i));
    }
    flushRafFrame();
    expect(calls).toEqual([0]);
    flushRafFrame();
    expect(calls).toEqual([0, 1]);
    flushRafFrame();
    expect(calls).toEqual([0, 1, 2]);
  });

  it("defers hydration while a gesture is active and drains after settle", () => {
    applyViewportPan(10, 5);
    expect(isViewportGestureActive()).toBe(true);

    const cb = vi.fn();
    onGestureSettleHydrate(cb);
    flushRafFrame(); // commit frame — must NOT drain mid-gesture
    expect(cb).not.toHaveBeenCalled();

    // 120ms idle → endGesture; +140ms → attr clears and the drain schedules.
    vi.advanceTimersByTime(120);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(140);
    expect(isViewportGestureActive()).toBe(false);
    flushRafFrame();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("pauses a scheduled drain when a new gesture starts, resumes at next settle", () => {
    const cb = vi.fn();
    onGestureSettleHydrate(cb); // idle → drain scheduled for next frame
    applyViewportPan(3, 3); // gesture starts before the frame runs
    flushRafFrame(); // drain fires but sees an active gesture → pauses
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(260); // settle: idle end + attr clear
    flushRafFrame();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe removes a queued callback (unmount safety)", () => {
    const cb = vi.fn();
    const unsubscribe = onGestureSettleHydrate(cb);
    unsubscribe();
    flushRafFrame();
    expect(cb).not.toHaveBeenCalled();
  });

  it("drains after an aborted gesture (cancelViewportGesture)", () => {
    applyViewportPan(10, 0);
    const cb = vi.fn();
    onGestureSettleHydrate(cb);
    cancelViewportGesture();
    flushRafFrame();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
