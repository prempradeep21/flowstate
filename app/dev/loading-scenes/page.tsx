"use client";

import { useState } from "react";
import { CanvasSwitchOverlay } from "@/components/CanvasSwitchOverlay";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { SCENES } from "@/components/canvas-loading/scenes";
import { DesignSystemThemeToggle } from "@/app/dev/design-system/DesignSystemThemeToggle";

export default function LoadingScenesPage() {
  const [overlayScene, setOverlayScene] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-canvas-bg p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-canvas-title font-medium text-canvas-ink">
            Canvas loading scenes
          </h1>
          <p className="mt-1 text-canvas-body text-canvas-muted">
            All scenes loop side by side. Open one as the full overlay to check
            the real composition, heading, and tip rotation.
          </p>
        </div>
        <DesignSystemThemeToggle />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {SCENES.map(({ name, Scene }, i) => (
          <div key={name}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-canvas-compact text-canvas-muted">
                {i + 1} · {name}
              </span>
              <button
                type="button"
                onClick={() => setOverlayScene(i)}
                className="rounded-full border border-canvas-border bg-canvas-card px-3 py-1 text-canvas-compact text-canvas-muted transition-colors hover:text-canvas-ink"
              >
                Full overlay
              </button>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-canvas-lg border border-canvas-border bg-canvas-bg">
              <div className="absolute inset-0">
                <GridBackground
                  animate={false}
                  viewport={{ x: 0, y: 0, scale: 1 }}
                />
              </div>
              <Scene reducedMotion={false} />
            </div>
          </div>
        ))}
      </div>

      {overlayScene != null && (
        <div className="fixed inset-0 z-50">
          <CanvasSwitchOverlay
            visible
            canvasTitle="Japan trip"
            forceSceneIndex={overlayScene}
          />
          <button
            type="button"
            onClick={() => setOverlayScene(null)}
            className="absolute right-6 top-6 z-[70] rounded-full border border-canvas-border bg-canvas-card px-4 py-1.5 text-canvas-compact text-canvas-ink shadow-artifact"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
