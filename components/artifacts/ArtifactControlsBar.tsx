"use client";

import type { ReactNode } from "react";
import { ArtifactFontScaleControls } from "@/components/artifacts/ArtifactFontScaleControls";
import {
  ARTIFACT_CANVAS_CHROME_OPACITY,
  ARTIFACT_CANVAS_CHROME_POINTER,
} from "@/lib/artifactCanvasChrome";

export function ArtifactControlsBar({
  children,
  fontScale,
  onFontScaleChange,
  showFontControls = true,
  canvasChrome = false,
}: {
  children?: ReactNode;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
  showFontControls?: boolean;
  /** Canvas: fade toolbar until hover/reveal like the artifact header. */
  canvasChrome?: boolean;
}) {
  const chromeClass = canvasChrome
    ? `${ARTIFACT_CANVAS_CHROME_OPACITY} ${ARTIFACT_CANVAS_CHROME_POINTER}`
    : "";

  return (
    <div
      className={`artifact-controls-bar flex h-12 shrink-0 items-center gap-3 border-b border-canvas-border px-3 ${chromeClass}`}
      data-no-drag
      data-artifact-export-exclude
    >      {children ? (
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          {children}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      {showFontControls ? (
        <ArtifactFontScaleControls
          scale={fontScale}
          onScaleChange={onFontScaleChange}
        />
      ) : null}
    </div>
  );
}
