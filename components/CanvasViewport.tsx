"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import {
  registerViewportElement,
  shouldApplyStoreViewport,
} from "@/lib/viewportGesture";
import { useCanvasStore } from "@/lib/store";

/**
 * Applies viewport transform imperatively so pan/zoom does not re-render children.
 *
 * Deliberately NO will-change: transform. It pins Chrome's raster scale at
 * device resolution regardless of zoom, so zoomed out the whole world was
 * rasterized at full res (~1GB of tiles for a 20k-px canvas at 10%): tile
 * memory ran out and missing tiles drew as blank patches that flickered and
 * persisted at rest. Without it Chrome rasters at the painted scale and keeps
 * the old tiling as a fallback while re-rastering (measured: 0 missing tiles,
 * pans and zoom-in at parity).
 */
export function CanvasViewport({ children }: PropsWithChildren) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Wheel/pinch handlers paint this element synchronously in the input
    // event (zero added latency) via lib/viewportGesture.
    registerViewportElement(el);

    const applyTransform = () => {
      const { x, y, scale } = useCanvasStore.getState().viewport;
      el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };

    applyTransform();
    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      const v = state.viewport;
      const pv = prevState.viewport;
      if (v.x === pv.x && v.y === pv.y && v.scale === pv.scale) return;
      // While a gesture owns the visual, its per-frame store commits echo a
      // transform that is already painted — applying them would drag the
      // canvas a frame backwards. External writes (focus tween, hydrate)
      // make the gesture yield and apply normally.
      if (!shouldApplyStoreViewport(v)) return;
      applyTransform();
    });

    // --vp-scale: the settled scale as a CSS custom property on the canvas
    // container. Canvas content is NOT zoom-compensated; only the selection
    // box's corner radius reads it.
    const container =
      el.closest<HTMLElement>("[data-canvas-container]") ?? el;
    const applySettledScale = (scale: number) => {
      container.style.setProperty("--vp-scale", String(scale));
    };
    applySettledScale(useCanvasStore.getState().viewportSettledScale);
    const unsubSettled = useCanvasStore.subscribe((state, prevState) => {
      if (state.viewportSettledScale !== prevState.viewportSettledScale) {
        applySettledScale(state.viewportSettledScale);
      }
    });

    return () => {
      registerViewportElement(null);
      unsubscribe();
      unsubSettled();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      data-canvas-viewport
      className="absolute left-0 top-0 origin-top-left"
    >
      {children}
    </div>
  );
}
