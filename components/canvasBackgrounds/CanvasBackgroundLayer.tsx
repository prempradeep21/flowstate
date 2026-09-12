"use client";

import { useEffect, useRef } from "react";
import { BACKGROUND_COMPONENTS } from "@/components/canvasBackgrounds/registry";
import { StaticImageBackground } from "@/components/canvasBackgrounds/StaticImageBackground";
import {
  patternDotRadius,
  patternOffset,
  patternTileSize,
} from "@/components/canvasBackgrounds/viewportSync";
import {
  isViewportGestureOwned,
  subscribeViewportPaint,
} from "@/lib/viewportGesture";
import { CANVAS_BG } from "@/lib/design/tokens";
import { useCanvasStore } from "@/lib/store";

const GRID_BASE_SPACING = 22;
const GRID_BASE_DOT_RADIUS = 0.5;
const GRID_DOT_COLOR = "rgb(var(--canvas-dot) / 0.28)";

/**
 * Grid dots synced to the viewport IMPERATIVELY — the previous version
 * subscribed React state to the live viewport, re-rendering + repainting the
 * full-viewport gradient through React on every pan/zoom frame. Styles are
 * now written straight to the element from (a) gesture paints, in the same
 * frame as the canvas transform, and (b) store writes when idle.
 */
function ViewportSyncedGridBackground() {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const apply = (v: { x: number; y: number; scale: number }) => {
      const tileSize = patternTileSize(GRID_BASE_SPACING, v.scale);
      const offset = patternOffset(v, tileSize);
      const dotRadius = patternDotRadius(GRID_BASE_DOT_RADIUS, v.scale);
      el.style.backgroundImage = `radial-gradient(circle, ${GRID_DOT_COLOR} ${dotRadius}px, transparent ${dotRadius}px)`;
      el.style.backgroundSize = `${tileSize}px ${tileSize}px`;
      el.style.backgroundPosition = `${offset.x}px ${offset.y}px`;
    };

    apply(useCanvasStore.getState().viewport);
    const unsubStore = useCanvasStore.subscribe((state, prev) => {
      // While a gesture owns the viewport, the paint listener already applied
      // this frame's value — the store echo would be a redundant style write.
      if (isViewportGestureOwned()) return;
      if (state.viewport !== prev.viewport) apply(state.viewport);
    });
    const unsubPaint = subscribeViewportPaint(apply);
    return () => {
      unsubStore();
      unsubPaint();
    };
  }, []);

  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute inset-0 z-0 size-full"
      aria-hidden
      style={{ backgroundColor: CANVAS_BG }}
    />
  );
}

export function CanvasBackgroundLayer() {
  const style = useCanvasStore((s) => s.canvasBackgroundStyle);
  const Component =
    BACKGROUND_COMPONENTS[style] ?? BACKGROUND_COMPONENTS.grid;

  if (style === "grid") {
    return <ViewportSyncedGridBackground />;
  }

  if (style === "static-image") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <StaticImageBackground />
      </div>
    );
  }

  return <Component animate={true} />;
}
