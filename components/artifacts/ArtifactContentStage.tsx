"use client";

import type { ReactNode } from "react";

export function ArtifactContentStage({
  children,
  className = "",
  minHeight,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-artifact-stage bg-canvas-artifactStage ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      {children}
    </div>
  );
}
