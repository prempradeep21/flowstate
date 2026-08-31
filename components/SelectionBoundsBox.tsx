"use client";

import { useEffect, useRef } from "react";
import { selectionGestureRefs } from "@/hooks/useCanvasNodeDrag";
import {
  subscribeToNodeDrag,
  type GestureNodeRef,
} from "@/lib/gesture/gestureLayer";
import type { SelectionUnitBounds } from "@/lib/canvasSelection";
import { subscribeViewportPaint } from "@/lib/viewportGesture";
import { useCanvasStore } from "@/lib/store";

/**
 * Screen-space breathing room between the outermost item and the box — enough
 * to clear each member's own 2px accent ring at typical zoom levels.
 */
const BOUNDS_PADDING_PX = 8;

interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** World bounds (plus any in-flight drag delta) → screen rect. */
export function selectionScreenRect(
  bounds: SelectionUnitBounds,
  viewport: { x: number; y: number; scale: number },
  dragDx = 0,
  dragDy = 0,
): ScreenRect {
  return {
    left:
      viewport.x + (bounds.x + dragDx) * viewport.scale - BOUNDS_PADDING_PX,
    top: viewport.y + (bounds.y + dragDy) * viewport.scale - BOUNDS_PADDING_PX,
    width: bounds.w * viewport.scale + BOUNDS_PADDING_PX * 2,
    height: bounds.h * viewport.scale + BOUNDS_PADDING_PX * 2,
  };
}

const refKey = (r: GestureNodeRef) => `${r.kind}:${r.id}`;

/**
 * True when this drag is moving the whole selection, rather than one node that
 * happens to be dragging while a selection exists (alt-drag spawns a copy, and
 * that copy is not a member).
 */
function dragCoversSelection(dragged: readonly GestureNodeRef[]): boolean {
  const selection = selectionGestureRefs();
  if (selection.length === 0 || dragged.length !== selection.length) {
    return false;
  }
  const draggedKeys = new Set(dragged.map(refKey));
  return selection.every((r) => draggedKeys.has(refKey(r)));
}

/**
 * The one box around everything currently selected — the canvas-level answer
 * to "what did I just select?". Members keep their accent outline but drop
 * their own resize grips (see `useCanvasSelectionUnitCount`), so a
 * multi-selection reads as a single object instead of N independent ones.
 *
 * Screen-space and positioned imperatively on viewport writes, gesture paints,
 * and node-drag frames, matching SelectionToolbar: subscribing React to the
 * live viewport would re-render the box every pan/zoom frame, and a
 * world-space box would scale its own stroke with zoom.
 */
export function SelectionBoundsBox({
  bounds,
}: {
  bounds: SelectionUnitBounds;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  // Node drags never write the store until drop, so the box tracks the
  // gesture's running delta to stay glued to the items it surrounds. Kept in
  // refs, not effect locals: an unrelated store write (a streaming card, say)
  // re-derives `bounds` and re-runs the effect, which would otherwise drop the
  // in-flight delta and snap the box back for the rest of the gesture.
  const dragRef = useRef({ dx: 0, dy: 0 });
  /** Resolved once per gesture — the selection cannot change mid-drag. */
  const followingRef = useRef<boolean | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const apply = (v: { x: number; y: number; scale: number }) => {
      const r = selectionScreenRect(
        bounds,
        v,
        dragRef.current.dx,
        dragRef.current.dy,
      );
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
    };

    apply(useCanvasStore.getState().viewport);

    const unsubStore = useCanvasStore.subscribe((state, prev) => {
      if (state.viewport !== prev.viewport) apply(state.viewport);
    });
    const unsubPaint = subscribeViewportPaint(apply);
    const unsubDrag = subscribeToNodeDrag((frame) => {
      if (!frame) {
        // Gesture over. On commit the store already holds the new positions
        // and this render's `bounds` is one beat stale, but React flushes the
        // pointerup re-render before paint. On cancel (Escape) nothing was
        // committed, and clearing the delta is exactly the right answer.
        dragRef.current = { dx: 0, dy: 0 };
        followingRef.current = null;
        apply(useCanvasStore.getState().viewport);
        return;
      }
      if (followingRef.current === null) {
        followingRef.current = dragCoversSelection(frame.nodes);
      }
      if (!followingRef.current) return;
      dragRef.current = { dx: frame.dx, dy: frame.dy };
      apply(useCanvasStore.getState().viewport);
    });

    return () => {
      unsubStore();
      unsubPaint();
      unsubDrag();
    };
  }, [bounds]);

  const initial = selectionScreenRect(
    bounds,
    useCanvasStore.getState().viewport,
    dragRef.current.dx,
    dragRef.current.dy,
  );

  return (
    <div
      ref={elRef}
      aria-hidden
      className="pointer-events-none absolute z-30 rounded-canvas-sm"
      style={{
        left: initial.left,
        top: initial.top,
        width: initial.width,
        height: initial.height,
        // Accent hairline over a translucent halo, so the box holds its edge
        // against both pale artwork and dark canvas backgrounds.
        boxShadow:
          "0 0 0 1px rgb(var(--canvas-accent)), 0 0 0 4px rgb(var(--canvas-accent) / 0.12)",
      }}
    />
  );
}
