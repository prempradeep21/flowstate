"use client";

import { useEffect, useRef } from "react";
import { CanvasLanding } from "@/components/CanvasLanding";
import { useCanvasStore } from "@/lib/store";

export function CanvasLandingOverlay({ cardId }: { cardId: string }) {
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
      className="absolute left-0 top-0 z-40 origin-top-left will-change-transform"
    >
      <CanvasLanding cardId={cardId} />
    </div>
  );
}
