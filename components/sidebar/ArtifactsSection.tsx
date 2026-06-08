"use client";



import { AnimatePresence } from "framer-motion";

import { useMemo } from "react";

import { ArtifactSidebarTile } from "@/components/sidebar/ArtifactSidebarTile";

import { MotionSidebarTile } from "@/components/sidebar/MotionSidebarTile";

import { resolveSidebarTileLayout } from "@/lib/artifactSidebarLayout";

import { buildFlatArtifactList } from "@/lib/artifactRegistry";

import { useCanvasStore } from "@/lib/store";



export function ArtifactsSection({

  staggerActive = false,

}: {

  staggerActive?: boolean;

}) {

  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);



  const tiles = useMemo(() => {

    const items = buildFlatArtifactList(Object.values(sessionArtifacts));

    let mapCount = 0;



    return items.map((item, index) => {

      let mapIndex: number | undefined;

      if (item.kind === "map") {

        mapCount += 1;

        mapIndex = mapCount;

      }

      return {

        item,

        index,

        layout: resolveSidebarTileLayout(item.kind, { mapIndex }),

      };

    });

  }, [sessionArtifacts]);



  if (tiles.length === 0) {

    return (

      <section className="px-3 py-6">

        <p className="text-center text-canvas-body text-canvas-muted/80">

          No artifacts yet

        </p>

      </section>

    );

  }



  return (

    <section className="px-3 py-3">

      <div className="grid grid-cols-2 gap-3">

        <AnimatePresence mode="popLayout" initial={false}>

          {tiles.map(({ item, index, layout }) => (

            <MotionSidebarTile

              key={item.artifactId}

              staggerIndex={index}

              staggerActive={staggerActive}

              span={layout.span}

            >

              <ArtifactSidebarTile item={item} layout={layout} />

            </MotionSidebarTile>

          ))}

        </AnimatePresence>

      </div>

    </section>

  );

}

