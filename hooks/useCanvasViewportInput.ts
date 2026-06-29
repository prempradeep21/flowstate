"use client";

import { RefObject, useEffect, useRef } from "react";
import { useCanvasPan } from "@/hooks/useCanvasPan";
import {
  applyCanvasZoomAtScreen,
  gestureZoomFactor,
  isZoomWheel,
  resolveCanvasWheelAction,
  supportsCanvasGestureZoom,
  wheelZoomFactor,
} from "@/lib/canvasViewportInput";
import {
  shouldCanvasWheelViewport,
  wheelTrackpadPanDelta,
} from "@/lib/canvasWheel";

/** Safari/WebKit pinch — scale is cumulative from gesture start. */
type SafariGestureEvent = Event & {
  scale: number;
  clientX: number;
  clientY: number;
};

/**
 * Unified canvas viewport wheel + gesture input.
 *
 * - Wheel: pan (macOS trackpad scroll) or zoom (pinch, modifiers, mouse wheel)
 * - GestureEvent: Safari/WebKit trackpad pinch (with wheel dedup on Safari 15+)
 *
 * Viewport transform is applied imperatively (CanvasViewport subscribe),
 * so zoom applies each tick synchronously instead of rAF-coalescing.
 */
export function useCanvasViewportInput(
  containerRef: RefObject<HTMLElement | null>,
): void {
  const queuePan = useCanvasPan();
  const gesturePinchActiveRef = useRef(false);
  const lastGestureScaleRef = useRef(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!shouldCanvasWheelViewport(e.target)) return;

      e.preventDefault();

      if (resolveCanvasWheelAction(e) === "pan") {
        const { dx, dy } = wheelTrackpadPanDelta(e);
        queuePan(dx, dy);
        return;
      }

      if (gesturePinchActiveRef.current && isZoomWheel(e)) return;

      applyCanvasZoomAtScreen(el, e.clientX, e.clientY, wheelZoomFactor(e));
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    if (!supportsCanvasGestureZoom()) {
      return () => {
        el.removeEventListener("wheel", onWheel);
      };
    }

    const onGestureStart = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      gesturePinchActiveRef.current = true;
      lastGestureScaleRef.current = 1;
    };

    const onGestureChange = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      if (!gesturePinchActiveRef.current) return;
      if (!shouldCanvasWheelViewport(e.target)) return;

      const ge = e as SafariGestureEvent;
      const factor = gestureZoomFactor(lastGestureScaleRef.current, ge.scale);
      lastGestureScaleRef.current = ge.scale;
      applyCanvasZoomAtScreen(el, ge.clientX, ge.clientY, factor);
    };

    const onGestureEnd = (e: Event) => {
      if (!gesturePinchActiveRef.current) return;
      gesturePinchActiveRef.current = false;
      lastGestureScaleRef.current = 1;
    };

    el.addEventListener("gesturestart", onGestureStart, { passive: false });
    el.addEventListener("gesturechange", onGestureChange, { passive: false });
    el.addEventListener("gestureend", onGestureEnd, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
      el.removeEventListener("gestureend", onGestureEnd);
    };
  }, [containerRef, queuePan]);
}
