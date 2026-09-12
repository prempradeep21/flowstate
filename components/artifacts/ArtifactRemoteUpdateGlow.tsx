"use client";

import type { CSSProperties } from "react";

interface ArtifactRemoteUpdateGlowProps {
  /** Artifact category colour — the glow breathes in this hue. */
  accentColour?: string;
}

/**
 * Breathing glow behind an output artefact while another chat builds its next
 * version. A calm pulse in the artifact's category colour — replaces the old
 * rotating conic stroke, which read as a loading spinner rather than "updating".
 */
export function ArtifactRemoteUpdateGlow({
  accentColour,
}: ArtifactRemoteUpdateGlowProps) {
  const glowColour = accentColour ?? "rgb(var(--canvas-accent))";

  return (
    <div
      className="artifact-remote-update-glow pointer-events-none absolute inset-0 -z-10 rounded-canvas"
      aria-hidden
      style={
        {
          "--artifact-update-glow": glowColour,
        } as CSSProperties
      }
    />
  );
}
