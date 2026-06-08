"use client";

import { RefObject, useEffect } from "react";
import { shouldCanvasWheelZoom } from "@/lib/canvasWheel";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { cancelViewportTween } from "@/lib/motion/animateViewport";
import { useCanvasStore } from "@/lib/store";

/** Normalize wheel delta to pixel units across deltaMode variants. */
function wheelDeltaPixels(e: WheelEvent): number {
  let delta = e.deltaY;
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta *= 16;
  } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= window.innerHeight;
  }
  return delta;
}

/**
 * Native wheel listener with per-event zoom updates and preventDefault
 * so the browser does not fight the canvas transform during fast zoom.
 *
 * Viewport transform is applied imperatively (CanvasViewport subscribe),
 * so we apply each wheel tick synchronously instead of rAF-coalescing —
 * coalescing dropped rapid consecutive scrolls when events landed across
 * frame boundaries faster than rAF could drain them.
 */
export function useCanvasWheelZoom(
  containerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!shouldCanvasWheelZoom(e.target)) return;

      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const pivotX = e.clientX - rect.left;
      const pivotY = e.clientY - rect.top;
      const intensity = e.ctrlKey || e.metaKey ? 0.0125 : 0.0015;
      const factor = Math.exp(-wheelDeltaPixels(e) * intensity);

      markUserViewportInteraction();
      cancelViewportTween();
      useCanvasStore.getState().zoomAt(factor, pivotX, pivotY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [containerRef]);
}
