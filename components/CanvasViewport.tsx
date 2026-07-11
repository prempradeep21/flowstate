"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import {
  registerViewportElement,
  shouldApplyStoreViewport,
} from "@/lib/viewportGesture";
import { useCanvasStore } from "@/lib/store";

/** Applies viewport transform imperatively so pan/zoom does not re-render children. */
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

    return () => {
      registerViewportElement(null);
      unsubscribe();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      data-canvas-viewport
      className="absolute left-0 top-0 origin-top-left will-change-transform"
    >
      {children}
    </div>
  );
}
