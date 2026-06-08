"use client";

import type { ComponentType } from "react";
import { BACKGROUND_COMPONENTS } from "@/components/canvasBackgrounds/registry";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useCanvasStore } from "@/lib/store";

function ViewportSyncedBackground({
  Component,
}: {
  Component: ComponentType<BackgroundRenderProps>;
}) {
  const viewport = useCanvasStore((s) => s.viewport);
  return <Component animate={true} viewport={viewport} />;
}

export function CanvasBackgroundLayer() {
  const style = useCanvasStore((s) => s.canvasBackgroundStyle);
  const Component =
    BACKGROUND_COMPONENTS[style] ?? BACKGROUND_COMPONENTS.grid;

  if (style === "grid") {
    return <ViewportSyncedBackground Component={Component} />;
  }

  return <Component animate={true} />;
}
