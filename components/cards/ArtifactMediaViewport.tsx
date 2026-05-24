"use client";

import type { ReactNode } from "react";

/** Shared 4:3 artifact stage — matches 3D card viewport dimensions. */
export function ArtifactMediaViewport({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}
