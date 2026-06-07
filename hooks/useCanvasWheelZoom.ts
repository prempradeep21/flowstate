"use client";

import { RefObject, useEffect } from "react";
import { shouldCanvasWheelZoom } from "@/lib/canvasWheel";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { useCanvasStore } from "@/lib/store";

/**
 * Native wheel listener with rAF-coalesced zoom updates and preventDefault
 * so the browser does not fight the canvas transform during fast zoom.
 */
export function useCanvasWheelZoom(
  containerRef: RefObject<HTMLElement | null>,
): void {
  const zoomAt = useCanvasStore((s) => s.zoomAt);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let pendingFactor = 1;
    let pivotX = 0;
    let pivotY = 0;
    let rafId = 0;

    const flush = () => {
      rafId = 0;
      if (pendingFactor === 1) return;
      zoomAt(pendingFactor, pivotX, pivotY);
      pendingFactor = 1;
    };

    const onWheel = (e: WheelEvent) => {
      if (!shouldCanvasWheelZoom(e.target)) return;

      e.preventDefault();

      const rect = el.getBoundingClientRect();
      pivotX = e.clientX - rect.left;
      pivotY = e.clientY - rect.top;
      const intensity = e.ctrlKey || e.metaKey ? 0.0125 : 0.0015;
      pendingFactor *= Math.exp(-e.deltaY * intensity);
      markUserViewportInteraction();

      if (!rafId) {
        rafId = requestAnimationFrame(flush);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [containerRef, zoomAt]);
}
