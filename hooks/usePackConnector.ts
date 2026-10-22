"use client";

import { useArtifactStyle } from "@/components/ArtifactStyleScope";
import type {
  ArtifactStyleConnectorTokens,
  ArtifactStylePreset,
} from "@/lib/design/style/types";
import type { CanvasTheme } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

/**
 * Pack connector stroke widths (world px, fixed — never zoom-responsive).
 * Only used when a pack hands the renderers `connector` tokens; packs without
 * them keep CONNECTOR_STROKE_PX and their thread colours.
 */
export const PACK_CONNECTOR_STROKE_PX = 1.5;
export const PACK_CONNECTOR_ACTIVE_STROKE_PX = 2;
/** Plug-link / drag-preview dash, world px. */
export const PACK_CONNECTOR_DASH = [6, 5] as const;

/** The active pack's connector tokens for a theme mode, or null. */
export function packConnectorTokens(
  pack: ArtifactStylePreset,
  mode: CanvasTheme,
): ArtifactStyleConnectorTokens | null {
  return (mode === "dark" ? pack.dark : pack.light).connector ?? null;
}

/**
 * Connector tokens for the enclosing ArtifactStyleScope + canvas theme.
 * Null when the pack doesn't recolour connectors (vanilla / brut / glass /
 * bento) — callers then render exactly as before.
 */
export function usePackConnector(): ArtifactStyleConnectorTokens | null {
  const { pack } = useArtifactStyle();
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  return packConnectorTokens(pack, canvasTheme);
}
