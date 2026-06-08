import type { CSSProperties } from "react";
import type { ArtifactKind } from "@/lib/artifactTypes";

export type SidebarTileSpan = 1 | 2;

export interface SidebarTileLayout {
  span: SidebarTileSpan;
  /** Tailwind aspect-ratio class, or null for auto height */
  aspectClass: string | null;
  minHeight?: number;
  maxHeight?: number;
}

const DEFAULT_LAYOUTS: Record<ArtifactKind, SidebarTileLayout> = {
  map: { span: 1, aspectClass: "aspect-square" },
  images: { span: 1, aspectClass: "aspect-square" },
  table: { span: 2, aspectClass: null, minHeight: 160, maxHeight: 200 },
  "3d": { span: 1, aspectClass: "aspect-square" },
  custom: { span: 2, aspectClass: "aspect-square" },
  todo: { span: 2, aspectClass: null, minHeight: 80, maxHeight: 180 },
  code: { span: 2, aspectClass: null, minHeight: 140, maxHeight: 140 },
};

/** Wide map every 3rd map (1-indexed: 3rd, 6th, …). */
const WIDE_MAP_INTERVAL = 3;

export function resolveSidebarTileLayout(
  kind: ArtifactKind,
  context?: { mapIndex?: number },
): SidebarTileLayout {
  if (kind === "map" && context?.mapIndex != null) {
    const isWide =
      context.mapIndex > 0 && context.mapIndex % WIDE_MAP_INTERVAL === 0;
    if (isWide) {
      return { span: 2, aspectClass: "aspect-[21/9]" };
    }
  }
  return DEFAULT_LAYOUTS[kind];
}

export function sidebarTileStyle(layout: SidebarTileLayout): CSSProperties {
  const style: CSSProperties = {};
  if (layout.minHeight != null) style.minHeight = layout.minHeight;
  if (layout.maxHeight != null) style.maxHeight = layout.maxHeight;
  return style;
}
