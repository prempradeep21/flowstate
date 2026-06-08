"use client";

import { AmbientGradientBackground } from "@/components/canvasBackgrounds/AmbientGradientBackground";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import type { BackgroundOption, BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import type { CanvasBackgroundStyle } from "@/lib/store";
import type { ComponentType } from "react";

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: "grid",
    label: "Dot grid",
    description: "Classic dotted canvas grid",
  },
  {
    id: "ambient-gradient",
    label: "Ambient",
    description: "Soft diffused color gradients",
  },
];

export const BACKGROUND_COMPONENTS: Record<
  CanvasBackgroundStyle,
  ComponentType<BackgroundRenderProps>
> = {
  grid: GridBackground,
  "ambient-gradient": AmbientGradientBackground,
};
