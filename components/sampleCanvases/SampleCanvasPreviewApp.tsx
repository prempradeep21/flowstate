"use client";

import { useEffect, useRef, useState } from "react";
import { usePersistenceReady } from "@/components/AuthProvider";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { ThemeApplier } from "@/components/ThemeApplier";
import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import {
  getSampleCanvas,
  SAMPLE_CANVAS_REGISTRY,
} from "@/lib/sampleCanvases/registry";
import {
  beginSampleCanvasPreviewSession,
  endSampleCanvasPreviewSession,
} from "@/lib/sampleCanvases/sampleCanvasPreviewSession";
import { useCanvasStore } from "@/lib/store";

interface SampleCanvasPreviewAppProps {
  /**
   * Dev-only escape hatch for headless preview tooling — puts the store on
   * `window.__canvasStore` so it can pan the viewport past node culling. Never
   * set this on a route reachable in production.
   */
  exposeStoreForTooling?: boolean;
}

/**
 * Renders a registry sample canvas on the real canvas without saving it.
 *
 * Persistence lives in AuthProvider and runs on every route, so this hydrates
 * inside a preview session: the signed-in viewer's own canvas is stashed first,
 * autosave is suppressed while the preview is open, and the real canvas is
 * hydrated back on unmount. Nothing here writes to Supabase.
 */
export function SampleCanvasPreviewApp({
  exposeStoreForTooling = false,
}: SampleCanvasPreviewAppProps) {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const persistenceReady = usePersistenceReady();
  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const sessionStartedRef = useRef(false);
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!persistenceReady) return;
    const slug = new URLSearchParams(window.location.search).get("slug");
    const def =
      (slug ? getSampleCanvas(slug) : undefined) ?? SAMPLE_CANVAS_REGISTRY[0];
    if (!def) return;

    // Stash the viewer's real canvas and mute autosave before touching the store.
    if (!sessionStartedRef.current) {
      beginSampleCanvasPreviewSession(
        useCanvasStore.getState().getCanvasSnapshotSource(),
      );
      sessionStartedRef.current = true;
    }

    resetViewportBootstrap();
    hydrateFromSnapshot(def.buildSnapshot(), {
      applyViewport: true,
      canvasReveal: false,
    });
    markViewportRestoredFromSnapshot();
    setTitle(def.title);

    if (exposeStoreForTooling) {
      (window as unknown as Record<string, unknown>).__canvasStore =
        useCanvasStore;
    }
  }, [persistenceReady, hydrateFromSnapshot, exposeStoreForTooling]);

  useEffect(() => {
    return () => {
      if (!sessionStartedRef.current) return;
      const restore = endSampleCanvasPreviewSession();
      sessionStartedRef.current = false;
      if (restore) {
        resetViewportBootstrap();
        useCanvasStore
          .getState()
          .hydrateFromSnapshot(buildCanvasSnapshot(restore), {
            applyViewport: true,
            canvasReveal: false,
          });
      }
    };
  }, []);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
        <div className="pointer-events-auto rounded-canvas border border-canvas-border/80 bg-canvas-card/95 px-4 py-2 shadow-card backdrop-blur-md">
          <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            Sample canvas preview · not saved to your account
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
