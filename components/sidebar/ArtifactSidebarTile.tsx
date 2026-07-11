"use client";

import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import { SidebarArtifactViewport } from "@/components/sidebar/SidebarArtifactViewport";
import { SidebarTileMount } from "@/components/sidebar/SidebarTileMount";
import { focusCanvasArtifact } from "@/lib/canvasArtifacts";
import { getSidebarPreviewContentSize } from "@/lib/canvasNodeBounds";
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
  const fixedHeight = layout.maxHeight ?? layout.minHeight;
  const previewSize = getSidebarPreviewContentSize(item.kind, item.payload);

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="truncate px-0.5 font-medium leading-snug text-canvas-ink"
        style={{ fontSize: "13.2px" }}
        title={item.title}
      >
        {item.title}
      </p>
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
          "group/tile relative block w-full overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card text-left shadow-card transition-colors hover:ring-2 hover:ring-canvas-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent",
          aspectClass,
        ]
          .filter(Boolean)
          .join(" ")}
        style={sidebarTileStyle(layout)}
      >
        <SidebarTileMount fixedHeight={fixedHeight}>
          <SidebarArtifactViewport
            contentWidth={previewSize.w}
            contentHeight={previewSize.h}
          >
            <ArtifactContent
              payload={item.payload}
              layout="sidebar-preview"
              artifactId={item.artifactId}
              versionId={item.versionId}
              canvasContentInteractive={false}
            />
          </SidebarArtifactViewport>
        </SidebarTileMount>
      </button>
    </div>
  );
}
