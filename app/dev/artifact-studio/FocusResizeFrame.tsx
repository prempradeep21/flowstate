"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  NodeCornerResizeHandles,
  cornerResizeSigns,
  type NodeResizeCorner,
} from "@/components/canvas/NodeCornerResizeHandles";
import { ARTIFACT_NODE_POINTER_EXEMPT } from "@/lib/artifactCanvasChrome";
import type { ArtifactKind } from "@/lib/artifactTypes";
import { clampArtifactSizeForKind } from "@/lib/canvasNodeBounds";

export type Size = { w: number; h: number };
export type Offset = { x: number; y: number };

/**
 * Flowstate's artifact grip visibility (ARTIFACT_CANVAS_CHROME_OPACITY), on
 * this frame's own group so it can't collide with the `group/artifact` rules
 * the Current family draws inside: hidden at rest, in over 200ms on hover or
 * selection, out over 500ms.
 */
const GRIP_VISIBILITY =
  "opacity-0 transition-opacity duration-500 ease-out group-hover/resize:opacity-100 group-hover/resize:duration-200 group-data-[chrome-hover]/resize:opacity-100 group-data-[chrome-hover]/resize:duration-200";

/**
 * The focus view's artifact as a canvas node: press to select (shift / ctrl /
 * cmd toggles), and — artifacts only, never Q&A cards — four corner grips that
 * resize it exactly as CanvasArtifactNode does. The grips live inside the
 * scaled stage, so like the canvas they are 12 world px and scale with zoom.
 */
export function FocusResizeFrame({
  kind,
  resizable,
  chromeVisible,
  offset,
  onSelect,
  onHover,
  onResizeStart,
  onResize,
  onResizeEnd,
  children,
}: {
  kind: ArtifactKind | undefined;
  resizable: boolean;
  /** Hovered or selected — the canvas's `data-chrome-hover`. */
  chromeVisible: boolean;
  offset: Offset;
  onSelect: (how: "select" | "toggle") => void;
  onHover: (on: boolean) => void;
  /** Called with the stage zoom to hold for the gesture. */
  onResizeStart: (scale: number) => void;
  onResize: (size: Size, offset: Offset) => void;
  onResizeEnd: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const resize = useRef<{
    pointerId: number;
    corner: NodeResizeCorner;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startOffset: Offset;
    scale: number;
  } | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(ARTIFACT_NODE_POINTER_EXEMPT)) return;
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      onSelect("toggle");
      return;
    }
    onSelect("select");
    e.preventDefault();
  };

  const handleGripPointerDown = (corner: NodeResizeCorner, e: ReactPointerEvent<HTMLButtonElement>) => {
    const root = ref.current;
    if (e.button !== 0 || !root) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect("select");
    root.setPointerCapture(e.pointerId);
    // Layout size is untouched by the stage's scale transform; the drawn
    // width over it is the zoom the gesture divides screen deltas by.
    const scale = root.getBoundingClientRect().width / root.offsetWidth || 1;
    resize.current = {
      pointerId: e.pointerId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startW: root.offsetWidth,
      startH: root.offsetHeight,
      startOffset: offset,
      scale,
    };
    onResizeStart(scale);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resize.current;
    if (!rs || rs.pointerId !== e.pointerId) return;
    const { sx, sy } = cornerResizeSigns(rs.corner);
    const next = clampArtifactSizeForKind(
      kind,
      rs.startW + (sx * (e.clientX - rs.startX)) / rs.scale,
      rs.startH + (sy * (e.clientY - rs.startY)) / rs.scale,
    );
    // The stage centres the artifact, so half of any growth lands on each
    // side; shifting by that half keeps the corner opposite the grip anchored.
    onResize(next, {
      x: rs.startOffset.x + (sx * (next.w - rs.startW)) / 2,
      y: rs.startOffset.y + (sy * (next.h - rs.startH)) / 2,
    });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resize.current;
    if (!rs || rs.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    resize.current = null;
    onResizeEnd();
  };

  return (
    <div
      ref={ref}
      data-focus-artifact
      {...(chromeVisible ? { "data-chrome-hover": "" } : {})}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className="group/resize relative flex h-full w-full flex-1 flex-col"
    >
      {children}
      {resizable ? (
        <NodeCornerResizeHandles
          ariaLabel="Resize artifact"
          zClass="z-[60]"
          visibilityClass={GRIP_VISIBILITY}
          onCornerPointerDown={handleGripPointerDown}
        />
      ) : null}
    </div>
  );
}
