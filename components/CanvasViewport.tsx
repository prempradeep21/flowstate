"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import { useCanvasStore } from "@/lib/store";

/** Applies viewport transform imperatively so pan/zoom does not re-render children. */
export function CanvasViewport({ children }: PropsWithChildren) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const applyTransform = () => {
      const { x, y, scale } = useCanvasStore.getState().viewport;
      el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };

    applyTransform();
    return useCanvasStore.subscribe((state, prevState) => {
      const v = state.viewport;
      const pv = prevState.viewport;
      if (v.x === pv.x && v.y === pv.y && v.scale === pv.scale) return;
      applyTransform();
    });
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
