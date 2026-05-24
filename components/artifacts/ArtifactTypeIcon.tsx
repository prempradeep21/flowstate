"use client";

import type { ArtifactKind } from "@/lib/artifactTypes";

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.2,
  fill: "none" as const,
};

export function ArtifactTypeIcon({
  kind,
  className = "h-4 w-4",
}: {
  kind: ArtifactKind;
  className?: string;
}) {
  switch (kind) {
    case "table":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2" y="2" width="5" height="5" rx="0.5" />
          <rect x="9" y="2" width="5" height="5" rx="0.5" />
          <rect x="2" y="9" width="5" height="5" rx="0.5" />
          <rect x="9" y="9" width="5" height="5" rx="0.5" />
        </svg>
      );
    case "images":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2" y="3" width="12" height="10" rx="1" />
          <circle cx="5.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          <path d="M14 11l-3-3-4 4-2-2-3 3" />
        </svg>
      );
    case "3d":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <path d="M8 2l5 3v6l-5 3-5-3V5l5-3z" />
          <path d="M8 8l5-3M8 8v6M8 8L3 5" />
        </svg>
      );
    case "custom":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2" y="2" width="5" height="5" rx="0.5" />
          <rect x="9" y="2" width="5" height="5" rx="0.5" />
          <rect x="2" y="9" width="5" height="5" rx="0.5" />
          <rect x="9" y="9" width="5" height="5" rx="0.5" opacity="0.5" />
        </svg>
      );
    case "code":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <path d="M5 4L2 8l3 4M11 4l3 4-3 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
