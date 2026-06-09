"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

export type NodeResizeCorner = "nw" | "ne" | "sw" | "se";

export const NODE_RESIZE_CORNERS: NodeResizeCorner[] = [
  "nw",
  "ne",
  "sw",
  "se",
];

/** Direction signs for a corner drag: east/south positive. */
export function cornerResizeSigns(corner: NodeResizeCorner): {
  sx: 1 | -1;
  sy: 1 | -1;
} {
  return {
    sx: corner === "ne" || corner === "se" ? 1 : -1,
    sy: corner === "sw" || corner === "se" ? 1 : -1,
  };
}

const CORNER_POSITION_CLASS: Record<NodeResizeCorner, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
};

interface NodeCornerResizeHandlesProps {
  /** Accessible label prefix, e.g. "Resize artifact". */
  ariaLabel: string;
  /**
   * Visibility classes from the host node (Tailwind group-hover variants must
   * be written literally at the call site), e.g.
   * "opacity-0 group-hover/asset:opacity-100".
   */
  visibilityClass?: string;
  /** Stacking class — artifacts sit above chrome zones and need z-[60]. */
  zClass?: string;
  onCornerPointerDown: (
    corner: NodeResizeCorner,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
}

/** Four corner resize grips shared by canvas nodes. */
export function NodeCornerResizeHandles({
  ariaLabel,
  visibilityClass = "opacity-0",
  zClass = "z-40",
  onCornerPointerDown,
}: NodeCornerResizeHandlesProps) {
  return (
    <>
      {NODE_RESIZE_CORNERS.map((corner) => (
        <button
          key={corner}
          type="button"
          data-no-drag
          data-resize-handle
          aria-label={`${ariaLabel} (${corner})`}
          onPointerDown={(e) => onCornerPointerDown(corner, e)}
          className={`absolute h-3 w-3 rounded-canvas-xs border border-canvas-ink/35 bg-canvas-card shadow-sm transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30 ${zClass} ${visibilityClass} ${CORNER_POSITION_CLASS[corner]}`}
        />
      ))}
    </>
  );
}
