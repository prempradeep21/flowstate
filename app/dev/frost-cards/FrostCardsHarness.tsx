"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { ArtifactStyleScope } from "@/components/ArtifactStyleScope";
import { ThemeApplier } from "@/components/ThemeApplier";
import { getArtifactStylePack } from "@/lib/design/style/stylePacks";
import { useCanvasStore } from "@/lib/store";
import { useArtifactCatalogCanvas } from "../artifact-catalog/useArtifactCatalogCanvas";

export function FrostCardsHarness() {
  const params = useSearchParams();
  const styleId = getArtifactStylePack(params.get("style") ?? "frost").id;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useArtifactCatalogCanvas("flowstate", containerRef);

  useEffect(() => {
    const tooling = window as unknown as Record<string, unknown>;
    tooling.__canvasStore = useCanvasStore;
    setReady(true);
  }, []);

  return (
    <main className="relative h-full w-full overflow-hidden" data-harness-ready={ready || undefined}>
      <ThemeApplier />
      <ArtifactStyleScope styleId={styleId}>
        <div className="relative h-full w-full">
          <Canvas containerRef={containerRef} />
        </div>
      </ArtifactStyleScope>
      <CanvasMinimap containerRef={containerRef} canvasKey="frost-cards" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
        <CanvasBottomToolbar />
      </div>
    </main>
  );
}
