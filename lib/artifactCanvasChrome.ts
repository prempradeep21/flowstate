import type { ArtifactKind } from "@/lib/artifactTypes";

/** Shared Tailwind classes for canvas artifact chrome (casing, header, plugs). */

/**
 * Always-on solid inner surface so naked artifacts stand against any theme or
 * background. Input/media artifacts (images, websites, embeds — social posts,
 * YouTube) are deliberately borderless with no inner fill of their own; street
 * view stays naked too (its circular shape is the magic) and repo skips the
 * fill because its hub-and-spoke widgets self-fill.
 */
const CANVAS_SURFACE_FILL_KINDS = new Set<ArtifactKind>([
  "table",
  "code",
  "calendar",
  "todo",
  "chart",
  "custom",
  "timeline",
  "3d",
  "map",
  "audio",
]);

export function artifactKindUsesCanvasSurfaceFill(kind: ArtifactKind): boolean {
  return CANVAS_SURFACE_FILL_KINDS.has(kind);
}

/** Kinds whose canvas body is self-contained — no outer container gradient fill. */
const NAKED_CANVAS_ARTIFACT_KINDS = new Set<ArtifactKind>([
  "stickynote",
  "streetview",
  "images",
  "website",
  "google-doc",
  "embed",
]);

export function artifactKindUsesCanvasContainerFill(kind: ArtifactKind): boolean {
  return !NAKED_CANVAS_ARTIFACT_KINDS.has(kind);
}

export function artifactKindUsesCanvasPaddingChrome(kind: ArtifactKind): boolean {
  // Repo hub-and-spoke sizes its own stage; padding would desync collapsed bounds from the hub.
  return kind !== "stickynote" && kind !== "repo";
}

/** Vertical chrome overhead of a canvas artifact node: 16px padding ×2 + 56px header band + 22px header gap. */
export const ARTIFACT_CANVAS_CHROME_HEIGHT_PX = 110;

const CHROME_VISIBLE =
  "group-data-[chrome-hover]/artifact:opacity-100 group-data-[chrome-hover]/artifact:duration-200 group-data-[chrome-reveal]/artifact:opacity-100";

export const ARTIFACT_CANVAS_CHROME_OPACITY = `opacity-0 transition-opacity duration-500 ease-out ${CHROME_VISIBLE}`;

export const ARTIFACT_CANVAS_CONTAINER_FILL = "artifact-canvas-container-fill";

export const ARTIFACT_CANVAS_SURFACE_FILL = "artifact-canvas-surface-fill";

export const ARTIFACT_CANVAS_PADDING_CHROME = "artifact-canvas-padding-chrome";

const CASING_TRANSITION =
  "transition-[border-color,box-shadow] duration-500 ease-out group-data-[chrome-hover]/artifact:duration-200 group-data-[chrome-reveal]/artifact:duration-200";

const CASING_VISIBLE =
  "group-data-[chrome-hover]/artifact:border-canvas-border group-data-[chrome-hover]/artifact:shadow-card group-data-[chrome-reveal]/artifact:border-canvas-border group-data-[chrome-reveal]/artifact:shadow-card";

export const ARTIFACT_CANVAS_CASING_DEFAULT = `${CASING_TRANSITION} border ${CASING_VISIBLE} border-transparent shadow-none`;

const CASING_SELECTED_VISIBLE =
  "group-data-[chrome-hover]/artifact:border-canvas-ink group-data-[chrome-hover]/artifact:ring-2 group-data-[chrome-hover]/artifact:ring-canvas-ink/25 group-data-[chrome-hover]/artifact:shadow-card group-data-[chrome-reveal]/artifact:border-canvas-ink group-data-[chrome-reveal]/artifact:ring-2 group-data-[chrome-reveal]/artifact:ring-canvas-ink/25 group-data-[chrome-reveal]/artifact:shadow-card";

export const ARTIFACT_CANVAS_CASING_SELECTED = `${CASING_TRANSITION} border ${CASING_SELECTED_VISIBLE} border-transparent ring-2 ring-transparent shadow-none`;

export const ARTIFACT_CANVAS_CHROME_POINTER =
  "pointer-events-none group-data-[chrome-hover]/artifact:pointer-events-auto group-data-[chrome-reveal]/artifact:pointer-events-auto";
