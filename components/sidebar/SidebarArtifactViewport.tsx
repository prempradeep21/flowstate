"use client";

import type { ReactNode } from "react";

export const SIDEBAR_PREVIEW_SCALE = 0.75;

/**
 * Clips a top-left window over canvas-fidelity artifact content.
 * Inner layer is absolutely positioned so scale() does not expand the tile layout box.
 * Content renders at explicit canvas body dimensions before scaling.
 */
export function SidebarArtifactViewport({
  children,
  contentWidth,
  contentHeight,
}: {
  children: ReactNode;
  contentWidth: number;
  contentHeight: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ transform: `scale(${SIDEBAR_PREVIEW_SCALE})` }}
      >
        <div
          className="flex shrink-0 flex-col overflow-hidden"
          style={{ width: contentWidth, height: contentHeight }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
