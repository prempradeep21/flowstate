"use client";

import { useEffect, useRef, useState } from "react";
import { usePersistenceReady } from "@/components/AuthProvider";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { ThemeApplier } from "@/components/ThemeApplier";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import {
  getSampleCanvas,
  SAMPLE_CANVAS_REGISTRY,
} from "@/lib/sampleCanvases/registry";
import { useCanvasStore } from "@/lib/store";

export function SampleCanvasPreviewApp() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const persistenceReady = usePersistenceReady();
  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!persistenceReady) return;
    const slug = new URLSearchParams(window.location.search).get("slug");
    const def =
      (slug ? getSampleCanvas(slug) : undefined) ?? SAMPLE_CANVAS_REGISTRY[0];
    if (!def) return;

    resetViewportBootstrap();
    hydrateFromSnapshot(def.buildSnapshot(), {
      applyViewport: true,
      canvasReveal: false,
    });
    markViewportRestoredFromSnapshot();
    setTitle(def.title);
    // Dev-only escape hatch for headless preview tooling (route is NODE_ENV-gated).
    (window as unknown as Record<string, unknown>).__canvasStore =
      useCanvasStore;
  }, [persistenceReady, hydrateFromSnapshot]);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
        <div className="pointer-events-auto rounded-canvas border border-canvas-border/80 bg-canvas-card/95 px-4 py-2 shadow-card backdrop-blur-md">
          <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            Sample canvas preview
          </p>
          <h1 className="m-0 font-display text-lg font-medium">
            {title ?? "Loading…"}
          </h1>
        </div>
      </div>

      <div ref={canvasContainerRef} className="relative h-full w-full">
        <Canvas containerRef={canvasContainerRef} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
        <CanvasBottomToolbar />
      </div>
    </main>
  );
}
