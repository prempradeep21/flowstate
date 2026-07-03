"use client";

import type { ComponentType } from "react";
import { BACKGROUND_COMPONENTS } from "@/components/canvasBackgrounds/registry";
import { StaticImageBackground } from "@/components/canvasBackgrounds/StaticImageBackground";
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

  if (style === "static-image") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <StaticImageBackground />
      </div>
    );
  }

  return <Component animate={true} />;
}
