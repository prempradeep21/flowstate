import type { CSSProperties } from "react";
import type {
  ArtifactCategoryId,
  ArtifactCategoryKind,
} from "@/lib/design/theme/types";

/**
 * Artifact kind -> category mapping. Categories drive the themable header
 * icon-circle fill (see --artifact-cat-* variables in globals.css and
 * lib/design/theme/resolveTheme.ts).
 */
const KIND_TO_CATEGORY: Record<ArtifactCategoryKind, ArtifactCategoryId> = {
  table: "data",
  chart: "viz",
  map: "geo",
  streetview: "geo",
  images: "media",
  video: "media",
  audio: "media",
  "3d": "media",
  website: "docs",
  "google-doc": "docs",
  embed: "docs",
  stickynote: "docs",
  code: "dev",
  repo: "dev",
  custom: "dev",
  todo: "planning",
  calendar: "planning",
  timeline: "planning",
};

export const ARTIFACT_CATEGORY_META: Record<
  ArtifactCategoryId,
  { label: string; kinds: ArtifactCategoryKind[] }
> = {
  data: { label: "Data & tables", kinds: ["table"] },
  viz: { label: "Visualization", kinds: ["chart"] },
  geo: { label: "Maps & places", kinds: ["map", "streetview"] },
  media: { label: "Media", kinds: ["images", "video", "audio", "3d"] },
  docs: {
    label: "Documents & web",
    kinds: ["website", "google-doc", "embed", "stickynote"],
  },
  dev: { label: "Code & dev", kinds: ["code", "repo", "custom"] },
  planning: { label: "Planning", kinds: ["todo", "calendar", "timeline"] },
};

export function artifactCategoryOf(
  kind: ArtifactCategoryKind,
): ArtifactCategoryId {
  return KIND_TO_CATEGORY[kind] ?? "docs";
}

/**
 * Inline style for the artifact header icon circle: themable category fill
 * plus icon tint. Values resolve through CSS variables so they follow the
 * active theme preset and light/dark mode.
 */
export function artifactCategoryStyle(
  kind: ArtifactCategoryKind,
): CSSProperties {
  const category = artifactCategoryOf(kind);
  return {
    backgroundColor: `rgb(var(--artifact-cat-${category}-bg))`,
    color: `rgb(var(--artifact-cat-${category}-fg))`,
  };
}
