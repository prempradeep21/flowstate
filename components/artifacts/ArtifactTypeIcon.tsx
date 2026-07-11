"use client";

import {
  AppWindow,
  AudioLines,
  BarChart3,
  Box,
  Calendar,
  Code,
  GitCommitHorizontal,
  Globe,
  Image,
  LayoutGrid,
  MapPin,
  PersonStanding,
  SquareCheckBig,
  SquarePlay,
  StickyNote,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { ICON_STROKE_WIDTH } from "@/components/ui/Icon";
import type { ArtifactKind } from "@/lib/artifactTypes";
import type { GoogleDriveFileKind } from "@/lib/google/parseDriveUrl";

/**
 * Artifact kind -> icon. Backed by lucide-react for consistency with the
 * rest of the product; Google Workspace files keep their branded marks and
 * repo keeps the GitHub mark.
 */
const KIND_ICONS: Partial<Record<ArtifactKind | "video", LucideIcon>> = {
  video: SquarePlay,
  table: Table2,
  images: Image,
  "3d": Box,
  custom: LayoutGrid,
  code: Code,
  map: MapPin,
  streetview: PersonStanding,
  todo: SquareCheckBig,
  calendar: Calendar,
  website: Globe,
  embed: AppWindow,
  timeline: GitCommitHorizontal,
  chart: BarChart3,
  audio: AudioLines,
  stickynote: StickyNote,
};

function GoogleWorkspaceKindIcon({
  fileKind,
  className,
}: {
  fileKind: GoogleDriveFileKind;
  className: string;
}) {
  if (fileKind === "spreadsheet") {
    return (
      <svg viewBox="0 0 16 16" className={className} aria-hidden>
        <path fill="#188038" d="M3.5 1.5h6l3 3v10h-9V1.5z" />
        <path fill="#fff" fillOpacity=".35" d="M9.5 1.5v3h3" />
        <rect x="5" y="6.5" width="6" height="0.9" rx=".4" fill="#fff" />
        <rect x="5" y="8.3" width="6" height="0.9" rx=".4" fill="#fff" />
        <rect x="5" y="10.1" width="4" height="0.9" rx=".4" fill="#fff" />
        <path
          d="M5 6.5h6M5 8.3h6M5 10.1h4"
          stroke="#fff"
          strokeWidth=".35"
          opacity=".45"
        />
      </svg>
    );
  }
  if (fileKind === "presentation") {
    return (
      <svg viewBox="0 0 16 16" className={className} aria-hidden>
        <path fill="#F4B400" d="M3.5 1.5h6l3 3v10h-9V1.5z" />
        <path fill="#fff" fillOpacity=".35" d="M9.5 1.5v3h3" />
        <rect x="4.5" y="7" width="7" height="4.5" rx=".75" fill="#fff" />
      </svg>
    );
  }
  if (fileKind === "file") {
    return (
      <svg viewBox="0 0 16 16" className={className} aria-hidden>
        <path fill="#5F6368" d="M3.5 1.5h6l3 3v10h-9V1.5z" />
        <path fill="#fff" fillOpacity=".25" d="M9.5 1.5v3h3" />
        <path
          d="M5.5 8h5M5.5 10h3"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path fill="#4285F4" d="M3.5 1.5h6l3 3v10h-9V1.5z" />
      <path fill="#fff" fillOpacity=".35" d="M9.5 1.5v3h3" />
      <rect x="5" y="7" width="6" height="1" rx=".5" fill="#fff" />
      <rect x="5" y="9.2" width="6" height="1" rx=".5" fill="#fff" />
      <rect x="5" y="11.4" width="4" height="1" rx=".5" fill="#fff" />
    </svg>
  );
}

function GitHubMarkIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none">
      <path
        d="M8 1.2c-3.8 0-6.8 3-6.8 6.8 0 3 1.9 5.5 4.6 6.4.3.1.5-.1.5-.4v-1.4c-1.9.4-2.3-.9-2.3-.9-.3-.8-.8-1-0.8-1-.6-.4.1-.4.1-.4.7 0 1 .7 1 .7.6 1 1.6.7 2 .5.1-.4.2-.7.4-.9-1.5-.2-3.1-.8-3.1-3.4 0-.8.3-1.4.7-1.8-.1-.2-.3-.9.1-1.9 0 0 .6-.2 1.9.7.6-.2 1.2-.3 1.8-.3.6 0 1.2.1 1.8.3 1.3-.9 1.9-.7 1.9-.7.4 1 .2 1.7.1 1.9.4.4.7 1 .7 1.8 0 2.6-1.6 3.2-3.1 3.4.2.2.4.6.4 1.2v1.8c0 .3.2.5.5.4 2.7-.9 4.6-3.4 4.6-6.4 0-3.8-3-6.8-6.8-6.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ArtifactTypeIcon({
  kind,
  className = "h-4 w-4",
  googleFileKind,
}: {
  kind: ArtifactKind | "video";
  className?: string;
  /** When kind is google-doc, picks Docs / Sheets / Slides icon. */
  googleFileKind?: GoogleDriveFileKind;
}) {
  if (kind === "google-doc") {
    return (
      <GoogleWorkspaceKindIcon
        fileKind={googleFileKind ?? "document"}
        className={className}
      />
    );
  }
  if (kind === "repo") {
    return <GitHubMarkIcon className={className} />;
  }
  const IconComponent = KIND_ICONS[kind];
  if (!IconComponent) return null;
  return (
    <IconComponent
      aria-hidden
      className={className}
      strokeWidth={ICON_STROKE_WIDTH}
    />
  );
}
