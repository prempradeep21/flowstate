"use client";

import {
  CANVAS_STATIC_BACKGROUND_IMAGES,
  getCanvasBackgroundImageById,
  getCanvasBackgroundImageIndex,
} from "@/lib/canvasBackgroundImages";
import { useCanvasStore } from "@/lib/store";

const navBtn =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink";

export function CanvasBackgroundImageCarousel() {
  const imageId = useCanvasStore((s) => s.canvasBackgroundImageId);
  const cycleCanvasBackgroundImage = useCanvasStore(
    (s) => s.cycleCanvasBackgroundImage,
  );

  const currentIndex = getCanvasBackgroundImageIndex(imageId);
  const current =
    getCanvasBackgroundImageById(imageId) ??
    CANVAS_STATIC_BACKGROUND_IMAGES[0]!;

  return (
    <div
      className="mt-2 flex items-center justify-between gap-2"
      role="group"
      aria-label="Photo background"
    >
      <button
        type="button"
        className={navBtn}
        aria-label="Previous photo"
        onClick={() => cycleCanvasBackgroundImage(-1)}
      >
        ‹
      </button>
      <span className="min-w-0 flex-1 truncate text-center text-canvas-compact text-canvas-ink">
        {current.label} ({currentIndex + 1} of{" "}
        {CANVAS_STATIC_BACKGROUND_IMAGES.length})
      </span>
      <button
        type="button"
        className={navBtn}
        aria-label="Next photo"
        onClick={() => cycleCanvasBackgroundImage(1)}
      >
        ›
      </button>
    </div>
  );
}
