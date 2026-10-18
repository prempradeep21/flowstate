"use client";

import { useState } from "react";
import { CanvasLoadingOutline } from "@/components/canvas-loading/CanvasLoadingOutline";
import {
  buildCanvasLayoutOutline,
  type CanvasLayoutOutline,
} from "@/lib/canvasLayoutOutline";
import { useCanvasStore } from "@/lib/store";

/**
 * Dev-only: lays the canvas's loading outline (what a reload or switch shows
 * while the data is fetched) over the live canvas, to check the skeletons
 * sit exactly where the real nodes land.
 */
export function OutlinePreviewToggle() {
  const [outline, setOutline] = useState<CanvasLayoutOutline | null>(null);

  return (
    <>
      {outline && (
        <div className="fixed inset-0 z-[55]">
          <CanvasLoadingOutline outline={outline} canvasTitle="Sample canvas" />
        </div>
      )}
      <button
        type="button"
        data-testid="outline-preview-toggle"
        onClick={() =>
          setOutline((current) =>
            current
              ? null
              : buildCanvasLayoutOutline(useCanvasStore.getState()),
          )
        }
        className="fixed bottom-24 right-4 z-[70] rounded-full border border-canvas-border bg-canvas-card px-4 py-1.5 text-canvas-compact text-canvas-ink shadow-artifact"
      >
        {outline ? "Hide loading outline" : "Show loading outline"}
      </button>
    </>
  );
}
