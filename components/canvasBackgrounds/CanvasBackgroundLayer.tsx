"use client";

import { BACKGROUND_COMPONENTS } from "@/components/canvasBackgrounds/registry";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useCanvasStore } from "@/lib/store";

export function CanvasBackgroundLayer() {
  const style = useCanvasStore((s) => s.canvasBackgroundStyle);
  const viewport = useCanvasStore((s) => s.viewport);
  const Component = BACKGROUND_COMPONENTS[style];

  const syncsViewport = style === "grid" || style === "blueprint";
  const props: BackgroundRenderProps = {
    animate: true,
    ...(syncsViewport ? { viewport } : {}),
  };

  return <Component {...props} />;
}
