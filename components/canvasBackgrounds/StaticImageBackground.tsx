"use client";

import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import {
  DEFAULT_CANVAS_BACKGROUND_IMAGE_ID,
  getCanvasBackgroundImageById,
} from "@/lib/canvasBackgroundImages";
import { useCanvasStore } from "@/lib/store";

interface StaticImageBackgroundProps extends BackgroundRenderProps {
  imageId?: string;
}

export function StaticImageBackground({
  imageId,
  className = "",
}: StaticImageBackgroundProps) {
  const storeImageId = useCanvasStore((s) => s.canvasBackgroundImageId);
  const resolvedId = imageId ?? storeImageId ?? DEFAULT_CANVAS_BACKGROUND_IMAGE_ID;
  const image =
    getCanvasBackgroundImageById(resolvedId) ??
    getCanvasBackgroundImageById(DEFAULT_CANVAS_BACKGROUND_IMAGE_ID)!;

  return (
    <img
      key={image.id}
      src={image.src}
      alt=""
      aria-hidden
      draggable={false}
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center ${className}`}
    />
  );
}
