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
    case "streetview":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <circle cx="8" cy="5.5" r="2.5" />
          <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
          <path d="M11 6.5h3.5v3.5H11z" rx="0.5" />
        </svg>
      );
    case "todo":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
          <path d="M5 8l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2" y="3" width="12" height="11" rx="1.5" />
          <path d="M2 6.5h12" />
          <path d="M5 2v2M11 2v2" strokeLinecap="round" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8h12M8 2a10 10 0 0 1 3 6 10 10 0 0 1-3 6 10 10 0 0 1-3-6 10 10 0 0 1 3-6z" />
        </svg>
      );
    case "repo":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <path
            d="M8 1.2c-3.8 0-6.8 3-6.8 6.8 0 3 1.9 5.5 4.6 6.4.3.1.5-.1.5-.4v-1.4c-1.9.4-2.3-.9-2.3-.9-.3-.8-.8-1-0.8-1-.6-.4.1-.4.1-.4.7 0 1 .7 1 .7.6 1 1.6.7 2 .5.1-.4.2-.7.4-.9-1.5-.2-3.1-.8-3.1-3.4 0-.8.3-1.4.7-1.8-.1-.2-.3-.9.1-1.9 0 0 .6-.2 1.9.7.6-.2 1.2-.3 1.8-.3.6 0 1.2.1 1.8.3 1.3-.9 1.9-.7 1.9-.7.4 1 .2 1.7.1 1.9.4.4.7 1 .7 1.8 0 2.6-1.6 3.2-3.1 3.4.2.2.4.6.4 1.2v1.8c0 .3.2.5.5.4 2.7-.9 4.6-3.4 4.6-6.4 0-3.8-3-6.8-6.8-6.8z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "embed":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <rect x="2" y="3" width="12" height="10" rx="1" />
          <path d="M5 6.5h6M5 9.5h4" strokeLinecap="round" />
        </svg>
      );
    case "timeline":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <path d="M1.5 8h13" strokeLinecap="round" />
          <circle cx="4" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <path d="M4 5.5V3M8 11V13M12 6V4" strokeLinecap="round" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden {...stroke}>
          <path d="M2 13V3" strokeLinecap="round" />
          <rect x="4" y="8" width="2.5" height="5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="7.5" y="5" width="2.5" height="8" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="11" y="7" width="2.5" height="6" rx="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
