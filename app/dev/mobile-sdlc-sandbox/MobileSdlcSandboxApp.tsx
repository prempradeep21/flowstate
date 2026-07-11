"use client";

import { useRef } from "react";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { ThemeApplier } from "@/components/ThemeApplier";
import { useMobileSdlcSandboxCanvas } from "./useMobileSdlcSandboxCanvas";

export function MobileSdlcSandboxApp() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { resetToTemplate, fitAllZones } = useMobileSdlcSandboxCanvas(
    canvasContainerRef,
  );

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
        <div className="pointer-events-auto w-full max-w-[min(1400px,calc(100vw-2rem))] rounded-canvas border border-canvas-border/80 bg-canvas-card/95 px-4 py-3 shadow-card backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                Sandbox
              </p>
              <h1 className="font-display text-xl font-medium sm:text-2xl">
                Mobile SDLC
              </h1>
              <p className="m-0 mt-1 text-canvas-micro text-canvas-muted">
                PRD → Ship · inputs only · isolated workspace
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={fitAllZones}
                className="rounded-full border border-canvas-border/80 bg-canvas-card px-4 py-2 text-sm font-medium text-canvas-ink transition-colors hover:border-canvas-accent/30 hover:bg-canvas-bg"
              >
                Fit all zones
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset to the seed template? Your sandbox edits in localStorage will be cleared.",
                    )
                  ) {
                    resetToTemplate();
                  }
                }}
                className="rounded-full border border-canvas-border/80 bg-canvas-card px-4 py-2 text-sm font-medium text-canvas-ink transition-colors hover:border-red-400/40 hover:text-red-700"
              >
                Reset template
              </button>
            </div>
          </div>
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
