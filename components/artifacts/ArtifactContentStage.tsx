"use client";

import type { ReactNode } from "react";
export function ArtifactContentStage({
  children,
  className = "",
  minHeight,
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={`artifact-content-stage overflow-hidden rounded-canvas-sm bg-canvas-artifactStage ${
        fill ? "flex min-h-0 w-full flex-1 flex-col" : ""
      } ${className}`}
      style={minHeight && !fill ? { minHeight } : undefined}
    >
      {children}
    </div>
  );
}
