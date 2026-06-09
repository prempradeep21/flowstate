"use client";

import { AmbientGradientBackground } from "@/components/canvasBackgrounds/AmbientGradientBackground";
import { GradientGridBackground } from "@/components/canvasBackgrounds/GradientGridBackground";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { NeatGradientBackground } from "@/components/canvasBackgrounds/NeatGradientBackground";
import { NetworkBackground } from "@/components/canvasBackgrounds/NetworkBackground";
import { RisingSunBackground } from "@/components/canvasBackgrounds/RisingSunBackground";
import { SkyBackground } from "@/components/canvasBackgrounds/SkyBackground";
import type { BackgroundOption, BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { isBackgroundAllowedForTheme } from "@/lib/canvasBackgroundTheme";
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
  {
    id: "sky",
    label: "Sky",
    description: "Slow-moving clouds over a deep sky",
  },
  {
    id: "network",
    label: "Network",
    description: "Linked particles drifting on a dark canvas",
  },
  {
    id: "rising-sun",
    label: "Rising Sun",
    description: "Warm animated sunrise from Unicorn Studio",
  },
  {
    id: "gradient-grid",
    label: "Gradient grid",
    description: "Line grid with a soft purple glow",
  },
  {
    id: "neat-gradient",
    label: "Neat gradient",
    description: "Animated deep blue gradient from FireCMS Neat",
  },
];

export const BACKGROUND_COMPONENTS: Record<
  CanvasBackgroundStyle,
  ComponentType<BackgroundRenderProps>
> = {
  grid: GridBackground,
  "ambient-gradient": AmbientGradientBackground,
  sky: SkyBackground,
  network: NetworkBackground,
  "rising-sun": RisingSunBackground,
  "gradient-grid": GradientGridBackground,
  "neat-gradient": NeatGradientBackground,
};

export function getBackgroundOptionsForTheme(
  theme: CanvasTheme,
): BackgroundOption[] {
  return BACKGROUND_OPTIONS.filter((option) =>
    isBackgroundAllowedForTheme(option.id, theme),
  );
}
