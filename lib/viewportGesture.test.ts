// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyViewportPan,
  applyViewportZoom,
  cancelViewportGesture,
  isViewportGestureActive,
  onGestureSettleHydrate,
  registerViewportElement,
  shouldApplyStoreViewport,
  VIEWPORT_MAX_SCALE,
} from "@/lib/viewportGesture";
import { useCanvasStore } from "@/lib/store";

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

  it("paces the idle drain across frames", () => {
    const calls: number[] = [];
    for (let i = 0; i < 6; i++) {
      onGestureSettleHydrate(() => calls.push(i));
    }
    flushRafFrame();
    expect(calls).toEqual([0, 1, 2, 3]);
    flushRafFrame();
    expect(calls).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("mid-pan hydrates one near-screen node per frame; the rest wait for settle", () => {
    applyViewportPan(10, 5);
    expect(isViewportGestureActive()).toBe(true);
    const calls: string[] = [];
    onGestureSettleHydrate(() => calls.push("band"), () => 400);
    onGestureSettleHydrate(() => calls.push("onscreen"), () => 0);
    onGestureSettleHydrate(() => calls.push("near"), () => 120);
    flushRafFrame();
    expect(calls).toEqual(["onscreen"]);
    applyViewportPan(10, 5); // still panning
    flushRafFrame();
    expect(calls).toEqual(["onscreen", "near"]);
    flushRafFrame(); // only the far band node is left — it waits
    expect(calls).toEqual(["onscreen", "near"]);

    vi.advanceTimersByTime(260); // settle
    expect(isViewportGestureActive()).toBe(false);
    flushRafFrame();
    expect(calls).toEqual(["onscreen", "near", "band"]);
  });

  it("mid-zoom hydrates only on-screen nodes, every third frame", () => {
    applyViewportZoom(1.1, 0, 0);
    const calls: string[] = [];
    onGestureSettleHydrate(() => calls.push("a"), () => 0);
    onGestureSettleHydrate(() => calls.push("b"), () => 0);
    onGestureSettleHydrate(() => calls.push("near"), () => 60);
    flushRafFrame();
    expect(calls).toEqual(["a"]);
    flushRafFrame();
    flushRafFrame();
    expect(calls).toEqual(["a"]);
    flushRafFrame();
    expect(calls).toEqual(["a", "b"]);
    for (let i = 0; i < 6; i++) flushRafFrame();
    expect(calls).toEqual(["a", "b"]); // "near" is off screen — waits
  });

  it("hydrates nearest-first by priority", () => {
    const calls: string[] = [];
    onGestureSettleHydrate(() => calls.push("far"), () => 900);
    onGestureSettleHydrate(() => calls.push("unranked"));
    onGestureSettleHydrate(() => calls.push("onscreen"), () => 0);
    onGestureSettleHydrate(() => calls.push("near"), () => 120);
    flushRafFrame();
    expect(calls).toEqual(["onscreen", "near", "far", "unranked"]);
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

describe("rubber-band snap-back", () => {
  it("lands the painted transform exactly on the clamped viewport", () => {
    useCanvasStore.setState({ viewport: { x: 0, y: 0, scale: 2.5 } });
    const el = { style: { transform: "" } } as unknown as HTMLElement;
    const unregister = registerViewportElement(el);
    // Mirror CanvasViewport's store subscription (value-equal writes skip).
    const unsubscribe = useCanvasStore.subscribe((state, prev) => {
      const v = state.viewport;
      const pv = prev.viewport;
      if (v.x === pv.x && v.y === pv.y && v.scale === pv.scale) return;
      if (!shouldApplyStoreViewport(v)) return;
      el.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.scale})`;
    });

    // Pinch well past MAX: the visual overshoots, commits stay clamped.
    for (let i = 0; i < 60; i++) {
      applyViewportZoom(1.05, 400, 300);
      flushRafFrame();
    }
    expect(el.style.transform).not.toMatch(/scale\(3\)$/);

    vi.advanceTimersByTime(120); // idle → snap-back starts
    for (let i = 0; i < 60; i++) flushRafFrame();

    const { x, y, scale } = useCanvasStore.getState().viewport;
    expect(scale).toBe(VIEWPORT_MAX_SCALE);
    expect(el.style.transform).toBe(
      `translate(${x}px, ${y}px) scale(${scale})`,
    );
    expect(isViewportGestureActive()).toBe(true); // attr not yet cleared

    unsubscribe();
    unregister();
  });
});
