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
  kind: ArtifactKind | "video";
  className?: string;
}) {
  switch (kind) {
    case "video":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
          <path d="M6.5 6.2l3.4 1.8-3.4 1.8z" fill="currentColor" stroke="none" />
        </svg>
      );
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
    case "map":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <path d="M8 1.5l4.5 2v7L8 13l-4.5-2.5v-7L8 1.5z" />
          <circle cx="8" cy="7" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "todo":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
          <path d="M5 8l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8h12M8 2a10 10 0 0 1 3 6 10 10 0 0 1-3 6 10 10 0 0 1-3-6 10 10 0 0 1 3-6z" />
        </svg>
      );
    default:
      return null;
  }
}
