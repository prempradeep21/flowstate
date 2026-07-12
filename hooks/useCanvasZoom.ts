"use client";

import { useCallback } from "react";
import { applyViewportZoom } from "@/lib/viewportGesture";

/**
 * Zoom input hook — each event applies IMMEDIATELY around its own pivot via
 * lib/viewportGesture (paints in the event's frame). The previous version
 * queued factors to the next rAF and merged them around a single last pivot,
 * which added a frame of latency, amplified per-frame zoom steps, and made
 * the anchor point drift during fast pinches. Store commits are coalesced
 * per frame inside the module.
 */
export function useCanvasZoom(): (
  factor: number,
  pivotX: number,
  pivotY: number,
) => void {
  return useCallback(
    (factor: number, pivotX: number, pivotY: number) => {
      applyViewportZoom(factor, pivotX, pivotY);
    },
    [],
  );
}
