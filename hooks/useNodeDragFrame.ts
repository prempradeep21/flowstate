"use client";

import { useEffect, useState } from "react";
import {
  getNodeDragFrame,
  subscribeToNodeDrag,
  type CanvasNodeKind,
  type NodeDragFrame,
} from "@/lib/gesture/gestureLayer";

/**
 * The live node-drag frame (null when idle). A drag moves nodes by DOM
 * transform and only writes the store on release, so SVG overlays anchored to
 * node positions — the plug link layers — read this to follow the drag
 * instead of snapping over on drop. Re-renders once per drag frame, so only
 * mount it in layers that have something to draw.
 */
export function useNodeDragFrame(): NodeDragFrame | null {
  const [frame, setFrame] = useState<NodeDragFrame | null>(getNodeDragFrame);
  useEffect(() => subscribeToNodeDrag(setFrame), []);
  return frame;
}

const NO_OFFSET = { dx: 0, dy: 0 } as const;

/** World-space offset for one node: the drag delta if it's being dragged. */
export function nodeDragOffset(
  frame: NodeDragFrame | null,
  kind: CanvasNodeKind,
  id: string,
): { dx: number; dy: number } {
  if (!frame) return NO_OFFSET;
  return frame.nodes.some((n) => n.kind === kind && n.id === id)
    ? { dx: frame.dx, dy: frame.dy }
    : NO_OFFSET;
}

/** `position` shifted by its node's live drag offset. */
export function withNodeDragOffset(
  frame: NodeDragFrame | null,
  kind: CanvasNodeKind,
  id: string,
  position: { x: number; y: number },
): { x: number; y: number } {
  const { dx, dy } = nodeDragOffset(frame, kind, id);
  return dx === 0 && dy === 0
    ? position
    : { x: position.x + dx, y: position.y + dy };
}
