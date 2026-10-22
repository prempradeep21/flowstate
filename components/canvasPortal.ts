"use client";

import { useArtifactStyle } from "@/components/ArtifactStyleScope";
import { FROST_FONT_CLASSES } from "@/components/frost/frostFonts";

/**
 * Class names a canvas-attached portal root (tagged `data-canvas-portal`)
 * needs to wear the active style pack: today, Frost's font pair, which the
 * style scope defines on its own subtree and a portal to <body> leaves
 * behind. Empty for every other pack. Call from inside the style scope.
 */
export function useCanvasPortalClassName(): string {
  const { pack } = useArtifactStyle();
  return pack.bodyFamily === "frost" ? FROST_FONT_CLASSES : "";
}

/**
 * `data-canvas-portal` for a portal root that only sometimes belongs to the
 * canvas (e.g. a popup shared with the side panel): set only when rendered
 * inside a non-default style scope, so the panel copy stays on brand.
 */
export function useCanvasPortalAttr(): { "data-canvas-portal"?: "" } {
  const { resolved } = useArtifactStyle();
  return resolved.isDefault ? {} : { "data-canvas-portal": "" };
}
