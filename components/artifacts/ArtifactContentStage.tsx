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
      className={`overflow-hidden rounded-canvas bg-canvas-artifactStage ${
        fill ? "flex h-full min-h-0 flex-col" : ""
      } ${className}`}
      style={minHeight && !fill ? { minHeight } : undefined}
    >
      {children}
    </div>
  );
}
