"use client";

import { useState } from "react";
import { ArtifactCanvasSizeReportProvider } from "@/components/artifacts/ArtifactCanvasSizeReportContext";
import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import { ArtifactExportProvider } from "@/components/artifacts/ArtifactExportContext";
import { ArtifactMenuControlsProvider } from "@/components/artifacts/ArtifactMenuControlsContext";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import {
  ARTIFACT_CANVAS_CASING_DEFAULT,
  ARTIFACT_CANVAS_CASING_SELECTED,
  ARTIFACT_CANVAS_CONTAINER_FILL,
  ARTIFACT_CANVAS_PADDING_CHROME,
  ARTIFACT_CANVAS_SURFACE_FILL,
  artifactKindUsesCanvasContainerFill,
  artifactKindUsesCanvasPaddingChrome,
  artifactKindUsesCanvasSurfaceFill,
} from "@/lib/artifactCanvasChrome";
import { CANVAS_CONTENT_INERT_CLASS } from "@/lib/canvasNodeInteraction";
import { artifactCategoryStyle } from "@/lib/design/theme/artifactCategories";
import type { ArtifactRenderContext, ArtifactStyleFamily } from "./types";

/**
 * Today's artifact — the exact markup CanvasArtifactNode draws on the canvas
 * (casing, container fill, data attributes the stylesheets key on) around the
 * real ArtifactShell. Only the absolute world positioning is dropped.
 */
function CurrentArtifact({ ctx }: { ctx: ArtifactRenderContext }) {
  const { item, interactive, chromeState } = ctx;
  const [versionId, setVersionId] = useState(item.artifact.latestVersionId);
  const usesContainerFill = artifactKindUsesCanvasContainerFill(item.kind);
  const usesPaddingChrome = artifactKindUsesCanvasPaddingChrome(item.kind);
  const selected = chromeState === "selected";

  return (
    <div
      data-canvas-artifact
      data-artifact-kind={item.kind}
      data-artifact-category={item.category}
      {...(chromeState !== "rest" ? { "data-chrome-hover": "" } : {})}
      {...(selected ? { "data-selected": "" } : {})}
      {...(!usesContainerFill ? { "data-naked-artifact": "" } : {})}
      className="canvas-artifact-node-shell group/artifact relative h-full w-full overflow-visible"
    >
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-canvas transition-shadow ${
          usesContainerFill ? ARTIFACT_CANVAS_CONTAINER_FILL : ""
        } ${usesPaddingChrome ? ARTIFACT_CANVAS_PADDING_CHROME : ""} ${
          selected ? ARTIFACT_CANVAS_CASING_SELECTED : ARTIFACT_CANVAS_CASING_DEFAULT
        }`}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <ArtifactShell
            layout="canvas"
            sessionArtifact={item.artifact}
            versionId={versionId}
            onVersionChange={setVersionId}
            menuVariant="canvas"
            contentInteractive={interactive}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The current body on its own — what ArtifactShell renders under its header.
 * Placeholder families reuse it so every artifact keeps its full data while
 * frame, header and icon are being redesigned around it.
 */
export function CurrentBody({ ctx }: { ctx: ArtifactRenderContext }) {
  const { item, interactive } = ctx;
  return (
    <ArtifactExportProvider>
      <ArtifactMenuControlsProvider
        artifactId={item.artifact.id}
        showFontControls={false}
        menuControlsEnabled={false}
      >
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-visible rounded-canvas-nest-1 ${
            artifactKindUsesCanvasSurfaceFill(item.kind) ? ARTIFACT_CANVAS_SURFACE_FILL : ""
          } ${!interactive ? CANVAS_CONTENT_INERT_CLASS : ""}`}
        >
          <ArtifactCanvasSizeReportProvider>
            <ArtifactContent
              layout="canvas"
              payload={item.payload}
              artifactId={item.artifact.id}
              versionId={item.artifact.latestVersionId}
              todoContext={{
                artifactId: item.artifact.id,
                versionId: item.artifact.latestVersionId,
                latestVersionId: item.artifact.latestVersionId,
                isEditing: false,
              }}
              catalogPreview
              canvasContentInteractive={interactive}
            />
          </ArtifactCanvasSizeReportProvider>
        </div>
      </ArtifactMenuControlsProvider>
    </ArtifactExportProvider>
  );
}

/** The current icon treatment: kind glyph in its category-tinted circle. */
export function CurrentIcon({ ctx }: { ctx: ArtifactRenderContext }) {
  const kind = ctx.item.variant === "video" ? "video" : ctx.item.kind;
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={artifactCategoryStyle(kind)}
    >
      <ArtifactTypeIcon kind={kind} className="h-4 w-4" />
    </span>
  );
}

export const CURRENT_STYLE: ArtifactStyleFamily = {
  id: "current",
  name: "Current",
  status: "live",
  summary: "What ships today — the canvas artifact node, unchanged.",
  // The real node chrome: font-display is the primary, font-sans the secondary.
  fonts: { primary: "denton", secondary: "figtree" },
  render: CurrentArtifact,
  // Slots exist so other families can borrow pieces of today's look; Current
  // itself renders wholesale through `render`.
  slots: {
    Frame: ({ header, body }) => (
      <div className="flex h-full flex-col overflow-hidden rounded-canvas bg-canvas-card">
        {header}
        {body}
      </div>
    ),
    Header: ({ ctx, icon }) => (
      <div className="flex h-11 shrink-0 items-center gap-2.5 px-4">
        {icon}
        <span className="truncate font-display text-canvas-body-sm font-medium text-canvas-ink">
          {ctx.item.artifact.title}
        </span>
      </div>
    ),
    Icon: CurrentIcon,
    Body: CurrentBody,
  },
};
