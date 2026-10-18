"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CanvasLoadingOutline } from "@/components/canvas-loading/CanvasLoadingOutline";
import { readCanvasLayoutOutline } from "@/lib/canvasLayoutOutline";

/**
 * Stand-in while the canvas workspace bundle itself downloads (first open
 * after a reload): the opening canvas's cached layout when this device has
 * one, otherwise the bare canvas background.
 */
export function CanvasWorkspaceLoading() {
  const { activeCanvasId, switchingCanvasId, switchingCanvasTitle, canvases } =
    useAuth();
  const canvasId = switchingCanvasId ?? activeCanvasId;
  const outline = useMemo(
    () => (canvasId ? readCanvasLayoutOutline(canvasId) : null),
    [canvasId],
  );
  const title =
    switchingCanvasTitle ??
    canvases.find((c) => c.id === canvasId)?.title ??
    null;

  return (
    <div className="relative h-full w-full bg-canvas-bg">
      {outline && <CanvasLoadingOutline outline={outline} canvasTitle={title} />}
    </div>
  );
}
