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

/**
 * Artifact kinds whose live content embeds a cross-origin iframe (Street
 * View / Google embeds). Mounting those inside the scaled, motion-measured
 * sidebar tiles can hang the main thread (layout-projection feedback with
 * the iframe) and nests their interactive buttons inside the tile button —
 * so these kinds render a static placeholder in the sidebar instead.
 */
const IFRAME_PREVIEW_KINDS = new Set(["streetview"]);

function StaticTilePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-canvas-artifactStage p-3 text-center">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-canvas-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
      <p className="line-clamp-2 text-canvas-caption text-canvas-muted">{label}</p>
    </div>
  );
}

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
  const staticPreview = IFRAME_PREVIEW_KINDS.has(item.kind);

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="truncate px-0.5 font-medium leading-snug text-canvas-ink"
        style={{ fontSize: "13.2px" }}
        title={item.title}
      >
        {item.title}
      </p>
      {/* div-with-button-role (not <button>): tile previews render real
          artifact content which can itself contain buttons (street view's
          "Click to interact", map controls) — nesting those inside a native
          <button> is invalid HTML and makes React 19 flag hydration errors. */}
      <div
        role="button"
        tabIndex={0}
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            focusCanvasArtifact(item.artifactId);
          }
        }}
        className={[
          "group/tile relative block w-full cursor-pointer overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card text-left shadow-card transition-colors hover:ring-2 hover:ring-canvas-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent",
          aspectClass,
        ]
          .filter(Boolean)
          .join(" ")}
        style={sidebarTileStyle(layout)}
      >
        <SidebarTileMount fixedHeight={fixedHeight}>
          {staticPreview ? (
            <StaticTilePlaceholder label={item.title} />
          ) : (
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
          )}
        </SidebarTileMount>
      </div>
    </div>
  );
}
