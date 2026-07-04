"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import { SidebarArtifactViewport } from "@/components/sidebar/SidebarArtifactViewport";
import { SidebarTileMount } from "@/components/sidebar/SidebarTileMount";
import { buildFlatArtifactList, type FlatArtifactListItem } from "@/lib/artifactRegistry";
import {
  resolveSidebarTileLayout,
  sidebarTileStyle,
} from "@/lib/artifactSidebarLayout";
import { getSidebarPreviewContentSize } from "@/lib/canvasNodeBounds";
import { useCanvasStore } from "@/lib/store";

function ArtifactGridTile({
  item,
  selected,
  onSelect,
}: {
  item: FlatArtifactListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const layout = resolveSidebarTileLayout(item.kind);
  const fixedHeight = layout.maxHeight ?? layout.minHeight;
  const previewSize = getSidebarPreviewContentSize(item.kind, item.payload);

  return (
    <div
      className={`flex flex-col gap-1.5 ${layout.span === 2 ? "col-span-2" : ""}`}
    >
      <p
        className="truncate px-0.5 text-canvas-body-sm font-medium leading-snug text-canvas-ink"
        title={item.title}
      >
        {item.title}
      </p>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        aria-label={item.title}
        onClick={onSelect}
        className={[
          "relative block w-full overflow-hidden rounded-canvas border bg-canvas-card text-left shadow-card transition-colors focus-visible:outline-none",
          selected
            ? "border-transparent ring-2 ring-canvas-accent"
            : "border-canvas-border hover:ring-2 hover:ring-canvas-accent/30 focus-visible:ring-2 focus-visible:ring-canvas-accent",
          layout.aspectClass ?? "",
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

/**
 * Chronological grid of every artifact (newest first). The current artifact
 * is highlighted; picking one and confirming loads it plus the latest chat
 * associated with it.
 */
export function FocusAllArtifactsGrid({ onClose }: { onClose: () => void }) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const focusArtifactId = useCanvasStore((s) => s.focusArtifactId);
  const focusSelectArtifact = useCanvasStore((s) => s.focusSelectArtifact);
  const [selectedId, setSelectedId] = useState<string | null>(focusArtifactId);

  const items = useMemo(
    () =>
      buildFlatArtifactList(
        useCanvasStore.getState().listSessionArtifacts(),
      ),
    // Rebuild whenever the artifact record changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionArtifacts],
  );

  const confirm = () => {
    if (selectedId && sessionArtifacts[selectedId]) {
      focusSelectArtifact(selectedId);
    }
    onClose();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        confirm();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="listbox"
        aria-label="All artifacts"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {items.length === 0 ? (
          <p className="px-2 py-4 text-canvas-body-sm text-canvas-muted">
            No artifacts yet. Artifacts you create in chats will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ArtifactGridTile
                key={item.artifactId}
                item={item}
                selected={item.artifactId === selectedId}
                onSelect={() => setSelectedId(item.artifactId)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-canvas-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-canvas px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!selectedId}
          onClick={confirm}
          className="rounded-canvas bg-canvas-ink px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-card shadow-card transition-colors hover:bg-canvas-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Okay
        </button>
      </div>
    </div>
  );
}
