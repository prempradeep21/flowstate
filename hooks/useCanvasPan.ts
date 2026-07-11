"use client";

import { useCallback } from "react";
import { applyViewportPan } from "@/lib/viewportGesture";

/**
 * Pan input hook — the DOM transform is painted SYNCHRONOUSLY in the input
 * event via lib/viewportGesture (zero added latency; the previous version
 * queued to the next frame's rAF, which made pan feel a frame behind the
 * fingers). Store commits are coalesced per frame inside the module.
 */
export function useCanvasPan(): (dx: number, dy: number) => void {
  return useCallback((dx: number, dy: number) => {
    applyViewportPan(dx, dy);
  }, []);
}
