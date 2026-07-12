"use client";

import { RefObject, useEffect, useRef } from "react";
import { useCanvasPan } from "@/hooks/useCanvasPan";
import { useCanvasZoom } from "@/hooks/useCanvasZoom";
import {
  applyCanvasZoomAtScreen,
  gestureZoomFactor,
  isContinuousZoomInput,
  isZoomWheel,
  resolveCanvasWheelAction,
  supportsCanvasGestureZoom,
  wheelZoomFactor,
} from "@/lib/canvasViewportInput";
import { applyViewportZoomSmooth } from "@/lib/viewportGesture";
import {
  shouldCanvasWheelViewport,
  wheelTrackpadPanDelta,
} from "@/lib/canvasWheel";
import { filterPanWheelDelta } from "@/lib/wheelMomentum";

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
 * Continuous input (trackpad pan/pinch) paints the viewport transform
 * SYNCHRONOUSLY in the event, 1:1 with the fingers. Notched mouse-wheel zoom
 * routes through a short smoothing tween so each notch glides instead of
 * jumping. Store commits stay rAF-coalesced inside lib/viewportGesture.
 */
export function useCanvasViewportInput(
  containerRef: RefObject<HTMLElement | null>,
): void {
  const queuePan = useCanvasPan();
  const queueZoom = useCanvasZoom();
  const gesturePinchActiveRef = useRef(false);
  const lastGestureScaleRef = useRef(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!shouldCanvasWheelViewport(e.target)) return;

      e.preventDefault();

      if (resolveCanvasWheelAction(e) === "pan") {
        // Momentum suppression (Figma-style dead stop): macOS keeps emitting
        // a decaying wheel tail after the fingers lift; the filter detects
        // and attenuates it so the canvas stops when the fingers stop.
        const raw = wheelTrackpadPanDelta(e);
        const { dx, dy } = filterPanWheelDelta(raw.dx, raw.dy, e.timeStamp);
        if (dx !== 0 || dy !== 0) queuePan(dx, dy);
        return;
      }

      if (gesturePinchActiveRef.current && isZoomWheel(e)) return;

      applyCanvasZoomAtScreen(
        el,
        e.clientX,
        e.clientY,
        wheelZoomFactor(e),
        isContinuousZoomInput(e) ? queueZoom : applyViewportZoomSmooth,
      );
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
      applyCanvasZoomAtScreen(el, ge.clientX, ge.clientY, factor, queueZoom);
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
  }, [containerRef, queuePan, queueZoom]);
}
