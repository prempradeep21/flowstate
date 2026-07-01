"use client";

import { AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { ArtifactSidebarTile } from "@/components/sidebar/ArtifactSidebarTile";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";
import { MotionSidebarTile } from "@/components/sidebar/MotionSidebarTile";
import { resolveSidebarTileLayout } from "@/lib/artifactSidebarLayout";
import { buildGroupedArtifactList } from "@/lib/artifactRegistry";
import { useCanvasStore } from "@/lib/store";

export function ArtifactsSection({
  staggerActive = false,
}: {
  staggerActive?: boolean;
}) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);

  const groups = useMemo(
    () => buildGroupedArtifactList(Object.values(sessionArtifacts)),
    [sessionArtifacts],
  );

  const totalTiles = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
  );

  if (totalTiles === 0) {
    return (
      <section className="px-5 py-6">
        <p className="text-center text-canvas-body text-canvas-muted/80">
          No artifacts yet
        </p>
      </section>
    );
  }

  let staggerIndex = 0;

  return (
    <MotionFlowSize as="section" className="px-5 py-4">
      {groups.map((group) => (
        <div key={group.category} className="mb-6 last:mb-0">
          <h3
            className="mb-3 font-semibold leading-snug text-canvas-ink"
            style={{ fontSize: "20.8px" }}
          >
            {group.label}
          </h3>
          <MotionFlowSize className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {group.items.map((item) => {
                let mapIndex: number | undefined;
                if (item.kind === "map") {
                  const mapsBefore = group.items
                    .slice(0, group.items.indexOf(item) + 1)
                    .filter((i) => i.kind === "map").length;
                  mapIndex = mapsBefore;
                }
                const layout = resolveSidebarTileLayout(item.kind, { mapIndex });
                const index = staggerIndex;
                staggerIndex += 1;

                return (
                  <MotionSidebarTile
                    key={item.artifactId}
                    staggerIndex={index}
                    staggerActive={staggerActive}
                    span={layout.span}
                  >
                    <ArtifactSidebarTile item={item} layout={layout} />
                  </MotionSidebarTile>
                );
              })}
            </AnimatePresence>
          </MotionFlowSize>
        </div>
      ))}
    </MotionFlowSize>
  );
}
