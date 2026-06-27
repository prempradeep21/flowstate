"use client";

import { RefObject, useEffect } from "react";
import { useCanvasPan } from "@/hooks/useCanvasPan";
import {
  resolveCanvasWheelAction,
  shouldCanvasWheelViewport,
  wheelDeltaXY,
  wheelDeltaY,
} from "@/lib/canvasWheel";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { cancelViewportTween } from "@/lib/motion/animateViewport";
import { useCanvasStore } from "@/lib/store";

/**
 * Native wheel listener with per-event zoom updates and preventDefault
 * so the browser does not fight the canvas transform during fast zoom.
 *
 * On macOS trackpads, two-finger scroll pans; pinch (ctrlKey wheel) zooms.
 * Other platforms and Mac mouse wheels keep scroll-to-zoom behavior.
 *
 * Viewport transform is applied imperatively (CanvasViewport subscribe),
 * so zoom applies each wheel tick synchronously instead of rAF-coalescing —
 * coalescing dropped rapid consecutive scrolls when events landed across
 * frame boundaries faster than rAF could drain them.
 */
export function useCanvasWheelZoom(
  containerRef: RefObject<HTMLElement | null>,
): void {
  const queuePan = useCanvasPan();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!shouldCanvasWheelViewport(e.target)) return;

      e.preventDefault();

      if (resolveCanvasWheelAction(e) === "pan") {
        const { dx, dy } = wheelDeltaXY(e);
        queuePan(dx, dy);
        return;
      }

      const rect = el.getBoundingClientRect();
      const pivotX = e.clientX - rect.left;
      const pivotY = e.clientY - rect.top;
      const intensity = e.ctrlKey || e.metaKey ? 0.0125 : 0.0015;
      const factor = Math.exp(-wheelDeltaY(e) * intensity);

      markUserViewportInteraction();
      cancelViewportTween();
      useCanvasStore.getState().zoomAt(factor, pivotX, pivotY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [containerRef, queuePan]);
}
