"use client";

import { useCallback, useEffect, useRef } from "react";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { cancelViewportTween } from "@/lib/motion/animateViewport";
import { useCanvasStore } from "@/lib/store";

/**
 * rAF-coalesced zoom updates — mirrors useCanvasPan so pinch/wheel zoom
 * produces at most ONE store update per animation frame.
 *
 * Trackpad pinches emit several wheel/gesture events per frame; applying
 * each synchronously (the old path) meant multiple store writes + subscriber
 * cascades per frame — the single worst interaction in the perf baseline
 * (pinch-zoom p99 measured in SECONDS). Factors multiply while pending, and
 * the LAST pivot wins, which matches how a continuous pinch feels.
 */
export function useCanvasZoom(): (
  factor: number,
  pivotX: number,
  pivotY: number,
) => void {
  const pendingRef = useRef({ factor: 1, pivotX: 0, pivotY: 0 });
  const rafRef = useRef(0);

  const flush = useCallback(() => {
    rafRef.current = 0;
    const { factor, pivotX, pivotY } = pendingRef.current;
    pendingRef.current = { factor: 1, pivotX: 0, pivotY: 0 };
    if (factor === 1) return;
    useCanvasStore.getState().zoomAt(factor, pivotX, pivotY);
  }, []);

  const queueZoom = useCallback(
    (factor: number, pivotX: number, pivotY: number) => {
      if (factor === 1) return;
      pendingRef.current.factor *= factor;
      pendingRef.current.pivotX = pivotX;
      pendingRef.current.pivotY = pivotY;
      markUserViewportInteraction();
      cancelViewportTween();
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return queueZoom;
}
