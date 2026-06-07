"use client";

import { AmbientGradientBackground } from "@/components/canvasBackgrounds/AmbientGradientBackground";
import { BlueprintBackground } from "@/components/canvasBackgrounds/BlueprintBackground";
import { CloudsBackground } from "@/components/canvasBackgrounds/CloudsBackground";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { SmokeBackground } from "@/components/canvasBackgrounds/SmokeBackground";
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
  {
    id: "blueprint",
    label: "Blueprint",
    description: "Technical drawing grid",
  },
  {
    id: "clouds",
    label: "Clouds",
    description: "Procedural sky with film grain",
  },
  {
    id: "smoke",
    label: "Smoke",
    description: "WebGL procedural smoke",
  },
];

export const BACKGROUND_COMPONENTS: Record<
  CanvasBackgroundStyle,
  ComponentType<BackgroundRenderProps>
> = {
  grid: GridBackground,
  "ambient-gradient": AmbientGradientBackground,
  blueprint: BlueprintBackground,
  clouds: CloudsBackground,
  smoke: SmokeBackground,
};
