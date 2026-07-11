"use client";

import type { CSSProperties } from "react";

interface ArtifactRemoteUpdateStrokeProps {
  accentColour?: string;
}

/**
 * Subtle animated border for output artefacts while another chat builds the next version.
 */
export function ArtifactRemoteUpdateStroke({
  accentColour,
}: ArtifactRemoteUpdateStrokeProps) {
  const strokeColour = accentColour ?? "rgb(var(--canvas-accent))";

  return (
    <div
      className="artifact-remote-update-stroke pointer-events-none absolute inset-0 z-[45] overflow-hidden rounded-canvas"
      aria-hidden
    >
      <div
        className="artifact-remote-update-stroke__ring absolute inset-0 rounded-canvas"
        style={
          {
            "--artifact-update-stroke": strokeColour,
          } as CSSProperties
        }
      />
      <div
        className="artifact-remote-update-stroke__glow absolute inset-0 rounded-canvas"
        style={
          {
            "--artifact-update-stroke": strokeColour,
          } as CSSProperties
        }
      />
    </div>
  );
}
