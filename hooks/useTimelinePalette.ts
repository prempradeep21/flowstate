"use client";

import { useMemo } from "react";
import { useArtifactStyle } from "@/components/ArtifactStyleScope";
import { useCategoryTones } from "@/hooks/useCategoryTones";
import { tonalEventPalette } from "@/lib/design/style/tonalPalette";
import { TIMELINE_EVENT_COLORS } from "@/lib/timelineLayout";
import { useCanvasStore } from "@/lib/store";

/**
 * Timeline / calendar event palette for the enclosing style pack. On a solid
 * pack the events belong to the card they sit on, so the ramp is derived from
 * that card's own tone (planning is the category behind both kinds) and
 * follows any runtime remap of it. Colour-led packs author their own four-step
 * ramp per mode; every other pack keeps the factory warm/cool alternating set.
 */
export function useTimelinePalette(): readonly string[] {
  const { pack } = useArtifactStyle();
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const tones = useCategoryTones("planning");
  const tokens = canvasTheme === "dark" ? pack.dark : pack.light;
  return useMemo(
    () =>
      tones
        ? tonalEventPalette(tones.fill, tones.onFill)
        : (tokens.timeline ?? TIMELINE_EVENT_COLORS),
    [tones, tokens.timeline],
  );
}
