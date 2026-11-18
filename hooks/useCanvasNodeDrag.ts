"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
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
  /** Element holding pointer capture, so release works from any listener. */
  captureEl: HTMLElement | null;
  /** Removes the window listeners that keep this drag alive. */
  detach: () => void;
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
  /** First real movement (threshold crossed) — spawn-meta clearing. */
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
/** The fields a drag reads, from a React or a native pointer event. */
type DragPointer = Pick<PointerEvent, "pointerId" | "clientX" | "clientY"> & {
  buttons?: number;
  isTrusted?: boolean;
  nativeEvent?: { isTrusted?: boolean };
};

/**
 * A real pointer reporting no buttons down: the release happened somewhere we
 * never heard about (element unmounted, capture lost). Synthetic events from
 * scripts and tests often leave `buttons` at 0, so only trust real input.
 */
function isReleasedPointer(e: DragPointer): boolean {
  const trusted = e.nativeEvent?.isTrusted ?? e.isTrusted ?? false;
  return trusted && e.buttons === 0;
}

export function useCanvasNodeDrag(options: CanvasNodeDragOptions) {
  const dragStateRef = useRef<DragState | null>(null);
  // Window listeners outlive the render that attached them; read the latest
  // options through a ref.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /**
   * Close the drag exactly once, whichever path gets here first: the
   * element's pointerup, the window's, a released-button move, blur, Escape
   * or unmount. `commit` false reverts instead of committing.
   */
  const finish = (ds: DragState, commit: boolean) => {
    if (dragStateRef.current !== ds) return;
    dragStateRef.current = null;
    ds.detach();
    try {
      ds.captureEl?.releasePointerCapture(ds.pointerId);
    } catch {
      // ignore
    }
    if (!ds.didMove) {
      if (commit) optionsRef.current.onDrop?.(false);
      return;
    }
    if (!commit) {
      cancelNodeDrag();
      return;
    }
    const st = useCanvasStore.getState();
    endNodeDrag((dx, dy) => {
      if (ds.moveSelection) {
        st.moveSelectedCanvasItems(dx, dy);
      } else {
        optionsRef.current.commitMove(ds.targetId, dx, dy);
      }
    });
    optionsRef.current.onDrop?.(true);
  };

  const start = (
    e: ReactPointerEvent<HTMLElement>,
    opts: { moveSelection: boolean; copyOnDrag?: boolean },
  ) => {
    // A press can only begin while no drag of ours is open; one left over
    // from a lost release is closed (committed) first.
    if (dragStateRef.current) finish(dragStateRef.current, true);

    const captureEl = e.currentTarget as HTMLElement;
    try {
      captureEl.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic/foreign pointer ids can't be captured — drag still works
      // via bubbling move/up events.
    }

    // Window listeners keep the drag alive and closable even if the element
    // that started it unmounts mid-press (a chapter's drag area disappears
    // the moment its selection clears). Element handlers still run first;
    // a repeat of the same event is a zero-delta no-op.
    const onWindowMove = (ev: PointerEvent) => move(ev);
    const onWindowUp = (ev: PointerEvent) => end(ev);
    const onWindowCancel = (ev: PointerEvent) => {
      const cur = dragStateRef.current;
      if (cur && cur.pointerId === ev.pointerId) finish(cur, true);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") cancel();
    };
    // Switching windows mid-drag keeps the move made so far; a press that
    // never moved just closes, rather than counting as a click.
    const onBlur = () => {
      const cur = dragStateRef.current;
      if (cur) finish(cur, cur.didMove);
    };
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowCancel);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    const detach = () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowCancel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
    };

    dragStateRef.current = {
      captureEl,
      detach,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      didMove: false,
      recordedUndo: false,
      copyOnDrag: opts.copyOnDrag ?? false,
      targetId: optionsRef.current.nodeId,
      moveSelection: opts.moveSelection,
    };
  };

  const move = (e: DragPointer) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    // The button came up where we couldn't see it: this is the drop, not a
    // hover that should keep dragging.
    if (isReleasedPointer(e)) {
      finish(ds, true);
      return;
    }
    const o = optionsRef.current;

    const screenDx = e.clientX - ds.lastX;
    const screenDy = e.clientY - ds.lastY;
    if (screenDx === 0 && screenDy === 0 && ds.didMove) return;
    if (!ds.didMove) {
      const threshold = o.thresholdPx ?? 0;
      const dist = Math.hypot(e.clientX - ds.startX, e.clientY - ds.startY);
      if (dist < threshold) return;
      if (dist === 0) return;

      // Threshold crossed — set up the gesture once.
      if (!ds.recordedUndo) {
        (o.recordUndo ?? useCanvasStore.getState().recordUndo)();
        ds.recordedUndo = true;
      }
      if (ds.copyOnDrag && o.makeCopy) {
        const copyId = o.makeCopy(o.nodeId);
        if (copyId) ds.targetId = copyId;
      }
      o.onDragStart?.(ds.targetId);
      beginNodeDrag(
        ds.moveSelection
          ? selectionGestureRefs()
          : (o.resolveRefs?.(ds.targetId) ?? [
              { kind: o.kind, id: ds.targetId },
            ]),
      );
      ds.didMove = true;
    }

    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    const vpScale = useCanvasStore.getState().viewport.scale;
    queueNodeDragDelta(screenDx / vpScale, screenDy / vpScale);
  };

  const end = (e: DragPointer) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    finish(ds, true);
  };

  /** Escape / unmount — revert without committing. */
  const cancel = () => {
    const ds = dragStateRef.current;
    if (ds) finish(ds, false);
  };

  // Unmounting mid-drag reverts: the component that owned it is gone.
  useEffect(
    () => () => {
      const ds = dragStateRef.current;
      if (ds) finish(ds, false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { start, move, end, cancel, dragStateRef };
}
