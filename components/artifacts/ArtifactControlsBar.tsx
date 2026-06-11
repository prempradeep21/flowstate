"use client";

import type { ReactNode } from "react";
import { ArtifactFontScaleControls } from "@/components/artifacts/ArtifactFontScaleControls";

export function ArtifactControlsBar({
  children,
  fontScale,
  onFontScaleChange,
  showFontControls = true,
}: {
  children?: ReactNode;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
  showFontControls?: boolean;
}) {
  return (
    <div
      className="artifact-controls-bar flex h-12 shrink-0 items-center gap-3 border-b border-canvas-border px-3"
      data-no-drag
    >
      {children ? (
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
