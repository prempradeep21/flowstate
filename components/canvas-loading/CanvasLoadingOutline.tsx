"use client";

import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import {
  ArtifactBodySkeleton,
  SkeletonBar,
} from "@/components/artifacts/ArtifactLoadingSkeleton";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { artifactCategoryStyle } from "@/lib/design/theme/artifactCategories";
import type {
  CanvasLayoutOutline,
  OutlineNode,
} from "@/lib/canvasLayoutOutline";

/**
 * The canvas's last known layout, drawn as skeletons while its data loads:
 * every node in its real spot and size, with its title, so the swap to the
 * real canvas is the content filling in rather than a screen appearing.
 */

function OutlineTitle({ text }: { text?: string }) {
  return text ? (
    <span className="truncate text-[22px] font-medium text-canvas-ink/70">
      {text}
    </span>
  ) : (
    <SkeletonBar className="h-5 w-2/5" />
  );
}

function OutlineNodeView({ node }: { node: OutlineNode }) {
  const frame = {
    left: node.x,
    top: node.y,
    width: node.w,
    height: node.h,
  };

  if (node.k === "label") {
    return (
      <div
        className="absolute overflow-hidden font-medium leading-tight text-canvas-ink/50"
        style={{ ...frame, fontSize: node.f ?? 32 }}
      >
        {node.t}
      </div>
    );
  }

  if (node.k === "card") {
    return (
      <div
        data-outline-card=""
        className="absolute flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card"
        style={frame}
      >
        <div data-outline-accent className="h-2 w-full shrink-0 bg-canvas-accent/60" />
        <div className="px-6 pt-4">
          <OutlineTitle text={node.t} />
        </div>
        <div className="flex flex-col gap-3 px-6 pt-5">
          {[92, 78, 86, 54].map((w, i) => (
            <SkeletonBar key={i} className="h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (node.k === "artifact") {
    return (
      <div
        data-outline-card=""
        className="absolute flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card"
        style={frame}
      >
        <div className="flex shrink-0 items-center gap-3 px-4 py-3.5">
          {node.a ? (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-canvas-ink"
              style={artifactCategoryStyle(node.a)}
            >
              <ArtifactTypeIcon kind={node.a} className="h-[22px] w-[22px]" />
            </span>
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-full bg-canvas-muted/20" />
          )}
          <OutlineTitle text={node.t} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <ArtifactBodySkeleton kind={node.a} />
        </div>
      </div>
    );
  }

  // Assets, GIFs, 3D and skills: a titled block is enough to place them.
  return (
    <div
      data-outline-card=""
        className="absolute flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card"
      style={frame}
    >
      {node.t && (
        <div className="shrink-0 px-4 py-3">
          <OutlineTitle text={node.t} />
        </div>
      )}
      <SkeletonBar className="min-h-0 flex-1 rounded-none" />
    </div>
  );
}

export function CanvasLoadingOutline({
  outline,
  canvasTitle,
}: {
  outline: CanvasLayoutOutline;
  canvasTitle?: string | null;
}) {
  const { x, y, scale } = outline.viewport;

  return (
    <div
      // Follows the canvas style pack while it is mounted (5.8).
      data-canvas-portal=""
      data-canvas-loading=""
      className="pointer-events-none absolute inset-0 z-[60] overflow-hidden bg-canvas-bg"
      aria-live="polite"
      aria-busy
      role="status"
    >
      <div className="absolute inset-0">
        <GridBackground animate={false} viewport={outline.viewport} />
      </div>

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
        aria-hidden
      >
        {outline.nodes.map((node, i) => (
          <OutlineNodeView key={i} node={node} />
        ))}
      </div>

      <div className="absolute inset-x-0 top-4 flex justify-center">
        <div data-loading-pill className="flex items-center gap-2 rounded-full border border-canvas-border bg-canvas-card/95 px-4 py-1.5 text-canvas-body text-canvas-muted shadow-card">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-canvas-accent" />
          {canvasTitle ? `Opening ${canvasTitle}…` : "Opening canvas…"}
        </div>
      </div>
    </div>
  );
}
