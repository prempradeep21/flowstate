"use client";

import { useArtifactStyle } from "@/components/ArtifactStyleScope";
import { TIMELINE_EVENT_COLORS } from "@/lib/timelineLayout";
import { useCanvasStore } from "@/lib/store";

/**
 * Timeline / calendar event palette for the enclosing style pack. Color-led
 * packs author their own four-step ramp per mode; every other pack (and the
 * vanilla default) keeps the factory warm/cool alternating set.
 */
export function useTimelinePalette(): readonly string[] {
  const { pack } = useArtifactStyle();
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const tokens = canvasTheme === "dark" ? pack.dark : pack.light;
  return tokens.timeline ?? TIMELINE_EVENT_COLORS;
}
