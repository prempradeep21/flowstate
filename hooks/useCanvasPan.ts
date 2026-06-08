"use client";

import { useCallback, useEffect, useRef } from "react";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { cancelViewportTween } from "@/lib/motion/animateViewport";
import { useCanvasStore } from "@/lib/store";

/**
 * rAF-coalesced pan updates — mirrors useCanvasWheelZoom so space+drag
 * produces at most one store update per animation frame.
 */
export function useCanvasPan(): (dx: number, dy: number) => void {
  const panBy = useCanvasStore((s) => s.panBy);
  const pendingRef = useRef({ dx: 0, dy: 0 });
  const rafRef = useRef(0);

  const flush = useCallback(() => {
    rafRef.current = 0;
    const { dx, dy } = pendingRef.current;
    pendingRef.current = { dx: 0, dy: 0 };
    if (dx === 0 && dy === 0) return;
    panBy(dx, dy);
  }, [panBy]);

  const queuePan = useCallback(
    (dx: number, dy: number) => {
      pendingRef.current.dx += dx;
      pendingRef.current.dy += dy;
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

  return queuePan;
}
