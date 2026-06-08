"use client";

import { AmbientGradientBackground } from "@/components/canvasBackgrounds/AmbientGradientBackground";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import type { BackgroundOption, BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import type { CanvasBackgroundStyle, CanvasTheme } from "@/lib/store";
import type { ComponentType } from "react";

export interface ThemeOption {
  id: CanvasTheme;
  label: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "light",
    label: "Light",
    description: "Warm paper canvas",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Warm near-black canvas",
  },
];

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
