"use client";

import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import { SidebarTileMount } from "@/components/sidebar/SidebarTileMount";
import { focusCanvasArtifact } from "@/lib/canvasArtifacts";
import type { SidebarTileLayout } from "@/lib/artifactSidebarLayout";
import { sidebarTileStyle } from "@/lib/artifactSidebarLayout";
import type { FlatArtifactListItem } from "@/lib/artifactRegistry";
import { setSidebarDragData } from "@/lib/sidebarDnD";

export function ArtifactSidebarTile({
  item,
  layout,
}: {
  item: FlatArtifactListItem;
  layout: SidebarTileLayout;
}) {
  const aspectClass = layout.aspectClass ?? "";

  return (
    <button
      type="button"
      draggable
      aria-label={item.title}
      onDragStart={(e) => {
        setSidebarDragData(e.dataTransfer, {
          kind: "artifact",
          artifactId: item.artifactId,
          versionId: item.versionId,
          category: item.category,
        });
      }}
      onClick={() => focusCanvasArtifact(item.artifactId)}
      className={[
        "group/tile block h-full w-full overflow-hidden rounded-canvas bg-canvas-artifactStage text-left transition-colors hover:ring-2 hover:ring-canvas-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent",
        aspectClass,
      ]
        .filter(Boolean)
        .join(" ")}
      style={sidebarTileStyle(layout)}
    >
      <div className="pointer-events-none h-full min-h-0 w-full">
        <SidebarTileMount>
          <ArtifactContent payload={item.payload} layout="sidebar" />
        </SidebarTileMount>
      </div>
    </button>
  );
}
