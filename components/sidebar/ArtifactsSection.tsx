"use client";

import { useMemo } from "react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { buildArtifactRegistry } from "@/lib/artifactRegistry";
import type { ArtifactKind } from "@/lib/artifactTypes";
import {
  setSidebarDragData,
  type SidebarArtifactCategory,
} from "@/lib/sidebarDnD";
import { focusCanvasArtifact } from "@/lib/canvasArtifacts";
import { useCanvasStore } from "@/lib/store";

function categoryToKind(
  category: SidebarArtifactCategory,
): ArtifactKind {
  if (category === "image") return "images";
  return category;
}

function DraggableArtifactRow({
  artifactId,
  versionId,
  title,
  category,
}: {
  artifactId: string;
  versionId: string;
  title: string;
  category: SidebarArtifactCategory;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        setSidebarDragData(e.dataTransfer, {
          kind: "artifact",
          artifactId,
          versionId,
          category,
        });
      }}
      onClick={() => {
        focusCanvasArtifact(artifactId);
      }}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[18px] text-canvas-ink transition-colors hover:bg-canvas-bg"
    >
      <ArtifactTypeIcon
        kind={categoryToKind(category)}
        className="h-[21px] w-[21px] shrink-0 text-canvas-muted"
      />
      <span className="min-w-0 flex-1 truncate">{title}</span>
    </button>
  );
}

export function ArtifactsSection() {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const createBlankTodoArtifact = useCanvasStore((s) => s.createBlankTodoArtifact);
  const groups = useMemo(
    () => buildArtifactRegistry(Object.values(sessionArtifacts)),
    [sessionArtifacts],
  );

  return (
    <section className="border-b border-canvas-border px-3 py-3">
      <h3 className="mb-2 text-[16.5px] font-medium uppercase tracking-wider text-canvas-muted">
        Artifacts
      </h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.category}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[16.5px] font-medium text-canvas-muted/90">
                {group.label}
              </span>
              {group.category === "todo" && (
                <button
                  type="button"
                  onClick={() => createBlankTodoArtifact()}
                  className="rounded-md px-2 py-0.5 text-[13px] font-medium text-canvas-accent transition-colors hover:bg-canvas-artifactIconBg"
                >
                  + New
                </button>
              )}
            </div>
            {group.items.length === 0 ? (
              <p className="px-2 py-1 text-[16.5px] text-canvas-muted/80">
                {group.category === "todo" ? "None yet — create one" : "None yet"}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={`${item.artifactId}-${item.versionId}`}>
                    <DraggableArtifactRow {...item} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
