"use client";

import { useMemo } from "react";
import { useArtifactStyle } from "@/components/ArtifactStyleScope";
import { useCategoryTones } from "@/hooks/useCategoryTones";
import { tonalChartPalette } from "@/lib/design/style/tonalPalette";
import type { ArtifactStyleChartPalette } from "@/lib/design/style/types";
import { useCanvasStore } from "@/lib/store";

/**
 * Chart palette override handed to the JS renderers (they draw to canvas/SVG
 * and cannot read the scoped CSS variables). On a solid pack the chart sits on
 * a saturated card, so series, ink, grid and background all come out of that
 * card's own tone rather than the pack's fixed series list.
 */
export function useArtifactChartPalette(): ArtifactStyleChartPalette | undefined {
  const { pack } = useArtifactStyle();
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const tones = useCategoryTones("viz");
  const packPalette = (canvasTheme === "dark" ? pack.dark : pack.light).chart;
  return useMemo(
    () => (tones ? tonalChartPalette(tones.fill, tones.onFill) : packPalette),
    [tones, packPalette],
  );
}
