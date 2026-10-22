"use client";

import { useEffect, useRef } from "react";
import { BACKGROUND_COMPONENTS } from "@/components/canvasBackgrounds/registry";
import { StaticImageBackground } from "@/components/canvasBackgrounds/StaticImageBackground";
import { dotGridPaint } from "@/components/canvasBackgrounds/viewportSync";
import {
  isViewportGestureOwned,
  subscribeViewportPaint,
} from "@/lib/viewportGesture";
import { CANVAS_BG } from "@/lib/design/tokens";
import { useCanvasStore } from "@/lib/store";

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
      const paint = dotGridPaint(v);
      el.style.backgroundImage = paint.backgroundImage;
      el.style.backgroundSize = paint.backgroundSize;
      el.style.backgroundPosition = paint.backgroundPosition;
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
    <>
      {/* A style pack's own field (Frost's radial light), screen-fixed under
          the dots. Hidden unless a pack's stylesheet turns it on (8.1). */}
      <div
        data-canvas-field
        className="pointer-events-none absolute inset-0 z-0 hidden size-full"
        aria-hidden
      />
      <div
        ref={elRef}
        data-canvas-background-layer
        data-canvas-background-style="grid"
        className="pointer-events-none absolute inset-0 z-0 size-full"
        aria-hidden
        style={{ backgroundColor: CANVAS_BG }}
      />
    </>
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
      <div
        data-canvas-background-layer
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <StaticImageBackground />
      </div>
    );
  }

  // The marker lets dashboard-thumbnail capture find and re-render the
  // backdrop (lib/canvasSnapshotThumbnail/captureCanvasThumbnail).
  return (
    <div data-canvas-background-layer className="pointer-events-none absolute inset-0 z-0">
      <Component animate={true} />
    </div>
  );
}
