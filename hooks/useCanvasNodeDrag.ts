"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  beginNodeDrag,
  cancelNodeDrag,
  endNodeDrag,
  queueNodeDragDelta,
  type CanvasNodeKind,
  type GestureNodeRef,
} from "@/lib/gesture/gestureLayer";
import { getFamilyCardIds } from "@/lib/chatThreads";
import { useCanvasStore } from "@/lib/store";

/** Expand the current selection into gesture node refs for imperative drag. */
export function selectionGestureRefs(): GestureNodeRef[] {
  const st = useCanvasStore.getState();
  const refs: GestureNodeRef[] = [];
  for (const rootId of st.selectedFamilyRootIds) {
    for (const cardId of getFamilyCardIds(st, rootId)) {
      refs.push({ kind: "card", id: cardId });
    }
  }
  for (const item of st.canvasSelection) {
    refs.push({ kind: item.kind as CanvasNodeKind, id: item.id });
  }
  return refs;
}

/**
 * Card + all descendants via connections (matches store.moveSubtree's BFS)
 * so the whole chain follows the pointer during an imperative drag.
 */
export function subtreeGestureRefs(rootCardId: string): GestureNodeRef[] {
  const st = useCanvasStore.getState();
  const subtree = new Set<string>();
  const queue: string[] = [rootCardId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (subtree.has(id)) continue;
    subtree.add(id);
    for (const conn of st.connections) {
      if (conn.from === id && !subtree.has(conn.to)) queue.push(conn.to);
    }
  }
  return [...subtree].map((id) => ({ kind: "card" as const, id }));
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  didMove: boolean;
  recordedUndo: boolean;
  copyOnDrag: boolean;
  targetId: string;
  moveSelection: boolean;
}

export interface CanvasNodeDragOptions {
  kind: CanvasNodeKind;
  nodeId: string;
  /** Commit a single-node move at gesture end (store delta action). */
  commitMove: (targetId: string, dxWorld: number, dyWorld: number) => void;
  /** Movement needed before the drag engages (all node kinds use 0 today). */
  thresholdPx?: number;
  /** Nodes to transform during a single-node drag (default: just this node).
   *  Cards pass their connection subtree to match moveSubtree semantics. */
  resolveRefs?: (targetId: string) => GestureNodeRef[];
  /** First real movement (threshold crossed) — sounds, spawn-meta clearing. */
  onDragStart?: (targetId: string) => void;
  /** Alt-drag duplicate — create the copy, return its id (or null to skip). */
  makeCopy?: (nodeId: string) => string | null;
  /** Record undo once per gesture (defaults to store.recordUndo). */
  recordUndo?: () => void;
  onDrop?: (didMove: boolean) => void;
}

/**
 * Shared imperative drag behavior for canvas nodes.
 *
 * Pointermove NEVER writes the store: deltas accumulate in the gesture layer
 * (one DOM transform per frame), and the move is committed once on pointerup
 * via the node's own delta action. Multi-selection drags commit through
 * moveSelectedCanvasItems with the same total delta.
 *
 * The caller's pointerdown decides selection semantics first, then calls
 * `start(e, { moveSelection, targetId })`.
 */
export function useCanvasNodeDrag(options: CanvasNodeDragOptions) {
  const dragStateRef = useRef<DragState | null>(null);

  const start = (
    e: ReactPointerEvent<HTMLElement>,
    opts: { moveSelection: boolean; copyOnDrag?: boolean },
  ) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Synthetic/foreign pointer ids can't be captured — drag still works
      // via bubbling move/up events.
    }
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      didMove: false,
      recordedUndo: false,
      copyOnDrag: opts.copyOnDrag ?? false,
      targetId: options.nodeId,
      moveSelection: opts.moveSelection,
    };
  };

  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;

    const screenDx = e.clientX - ds.lastX;
    const screenDy = e.clientY - ds.lastY;
    if (!ds.didMove) {
      const threshold = options.thresholdPx ?? 0;
      const dist = Math.hypot(e.clientX - ds.startX, e.clientY - ds.startY);
      if (dist < threshold) return;

      // Threshold crossed — set up the gesture once.
      if (!ds.recordedUndo) {
        (options.recordUndo ?? useCanvasStore.getState().recordUndo)();
        ds.recordedUndo = true;
      }
      if (ds.copyOnDrag && options.makeCopy) {
        const copyId = options.makeCopy(options.nodeId);
        if (copyId) ds.targetId = copyId;
      }
      options.onDragStart?.(ds.targetId);
      beginNodeDrag(
        ds.moveSelection
          ? selectionGestureRefs()
          : (options.resolveRefs?.(ds.targetId) ?? [
              { kind: options.kind, id: ds.targetId },
            ]),
      );
      ds.didMove = true;
    }

    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    const vpScale = useCanvasStore.getState().viewport.scale;
    queueNodeDragDelta(screenDx / vpScale, screenDy / vpScale);
  };

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (ds.didMove) {
      const st = useCanvasStore.getState();
      endNodeDrag((dx, dy) => {
        if (ds.moveSelection) {
          st.moveSelectedCanvasItems(dx, dy);
        } else {
          options.commitMove(ds.targetId, dx, dy);
        }
      });
    }
    options.onDrop?.(ds.didMove);
  };

  /** Escape / unmount — revert without committing. */
  const cancel = () => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    cancelNodeDrag();
  };

  return { start, move, end, cancel, dragStateRef };
}
