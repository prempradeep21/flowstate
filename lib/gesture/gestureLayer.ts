/**
 * Transient node-drag gesture state — deliberately OUTSIDE the zustand store.
 *
 * During a drag the dragged nodes follow the pointer via imperative DOM
 * transforms (one rAF-coalesced style write per frame, zero React work);
 * the store is written ONCE at gesture end with the accumulated world-space
 * delta. This matches how CanvasViewport already treats pan/zoom and is the
 * core of the drag-smoothness fix: the old per-pointermove store writes
 * re-rendered the whole canvas subtree and ran the persistence classifier
 * on every event.
 *
 * Overlays that must track the live drag (connections layer, minimap,
 * group bounds) subscribe via `subscribeToNodeDrag` and read the current
 * world-space delta per frame — again without React.
 */

import {
  decrementLocalEditGuard,
  incrementLocalEditGuard,
} from "@/lib/localEditGuard";
import { applyWillChange, clearWillChange } from "@/lib/motion/performance";

export type CanvasNodeKind =
  | "card"
  | "artifact"
  | "asset"
  | "gif"
  | "3d"
  | "skill"
  | "label";

export interface GestureNodeRef {
  kind: CanvasNodeKind;
  id: string;
}

export interface NodeDragFrame {
  /** Total world-space delta since gesture start. */
  dx: number;
  dy: number;
  nodes: readonly GestureNodeRef[];
}

/** Frame update, or null when the gesture ended (commit or cancel). */
type NodeDragListener = (frame: NodeDragFrame | null) => void;

interface ActiveDrag {
  nodes: GestureNodeRef[];
  els: HTMLElement[];
  totalDx: number;
  totalDy: number;
  pendingDx: number;
  pendingDy: number;
  rafId: number;
}

let active: ActiveDrag | null = null;
const listeners = new Set<NodeDragListener>();

function nodeElement(ref: GestureNodeRef): HTMLElement | null {
  // All node roots already carry stable data attributes (used by hit tests):
  // cards use data-canvas-card, every other kind data-canvas-node-id.
  const selector =
    ref.kind === "card"
      ? `[data-canvas-card="${CSS.escape(ref.id)}"]`
      : `[data-canvas-node-id="${CSS.escape(ref.id)}"]`;
  return document.querySelector<HTMLElement>(selector);
}

// Node drags mark the container with mode "drag" — CSS transition
// suppression matches any [data-gesturing] value, while zoom-only effects
// (shadow flattening) key on "zoom" from lib/viewportGesture and never
// apply here (a dragged card without its shadow would look detached).
function setGesturingAttr(on: boolean): void {
  const container = document.querySelector<HTMLElement>(
    "[data-canvas-container]",
  );
  if (on) container?.setAttribute("data-gesturing", "drag");
  else container?.removeAttribute("data-gesturing");
}

function notify(frame: NodeDragFrame | null): void {
  for (const fn of listeners) fn(frame);
}

export function subscribeToNodeDrag(fn: NodeDragListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isNodeDragActive(): boolean {
  return active !== null;
}

/** Current total world-space delta (0,0 when no drag). For overlay reads. */
export function getNodeDragFrame(): NodeDragFrame | null {
  if (!active) return null;
  return {
    dx: active.totalDx + active.pendingDx,
    dy: active.totalDy + active.pendingDy,
    nodes: active.nodes,
  };
}

/** Nodes being dragged (empty when idle) — lets overlays exclude them. */
export function getDraggedNodeRefs(): readonly GestureNodeRef[] {
  return active?.nodes ?? [];
}

/**
 * Start an imperative drag for the given nodes. Resolves their DOM elements
 * once; missing elements (culled offscreen mid-drag start) are skipped — the
 * end-of-gesture store commit still moves them correctly.
 */
export function beginNodeDrag(nodes: GestureNodeRef[]): void {
  // Re-entrant begin (StrictMode / stray pointerdown): finish previous first.
  if (active) endNodeDrag();

  const els: HTMLElement[] = [];
  for (const ref of nodes) {
    const el = nodeElement(ref);
    if (el) {
      els.push(el);
      applyWillChange(el);
    }
  }

  active = {
    nodes,
    els,
    totalDx: 0,
    totalDy: 0,
    pendingDx: 0,
    pendingDy: 0,
    rafId: 0,
  };
  setGesturingAttr(true);
  // Blocks remote collab snapshots from hydrating mid-drag (they'd fight the
  // imperative transforms and the end-of-gesture commit). Decrement fires
  // "flowstate:local-edits-ended", which lets queued snapshots apply.
  incrementLocalEditGuard();
}

function flush(): void {
  const drag = active;
  if (!drag) return;
  drag.rafId = 0;
  drag.totalDx += drag.pendingDx;
  drag.totalDy += drag.pendingDy;
  drag.pendingDx = 0;
  drag.pendingDy = 0;
  const transform = `translate(${drag.totalDx}px, ${drag.totalDy}px)`;
  for (const el of drag.els) {
    el.style.transform = transform;
  }
  notify({ dx: drag.totalDx, dy: drag.totalDy, nodes: drag.nodes });
}

/** Accumulate a world-space delta; applied at most once per frame. */
export function queueNodeDragDelta(dxWorld: number, dyWorld: number): void {
  const drag = active;
  if (!drag) return;
  drag.pendingDx += dxWorld;
  drag.pendingDy += dyWorld;
  if (!drag.rafId) {
    drag.rafId = requestAnimationFrame(flush);
  }
}

function teardown(drag: ActiveDrag): void {
  if (drag.rafId) cancelAnimationFrame(drag.rafId);
  for (const el of drag.els) {
    el.style.transform = "";
    clearWillChange(el);
  }
  setGesturingAttr(false);
  active = null;
  notify(null);
  decrementLocalEditGuard();
}

/**
 * End the drag and commit the total delta through the given store action
 * (e.g. moveSubtree / moveSelectedCanvasItems / moveCanvasArtifact — all of
 * which take deltas). Transforms are cleared synchronously right after the
 * commit so the store-driven left/top lands in the same paint — no flicker.
 */
export function endNodeDrag(
  commit?: (totalDx: number, totalDy: number) => void,
): void {
  const drag = active;
  if (!drag) return;
  drag.totalDx += drag.pendingDx;
  drag.totalDy += drag.pendingDy;
  drag.pendingDx = 0;
  drag.pendingDy = 0;
  if (commit && (drag.totalDx !== 0 || drag.totalDy !== 0)) {
    commit(drag.totalDx, drag.totalDy);
  }
  teardown(drag);
}

/** Abort without committing (Escape / pointercancel-revert). */
export function cancelNodeDrag(): void {
  const drag = active;
  if (!drag) return;
  teardown(drag);
}

// ---------------------------------------------------------------------------
// Marquee state — shared so the culling hook can defer its expensive
// "selected nodes always render" union until the marquee is released.
// Selecting hundreds of nodes mid-sweep otherwise force-mounts all of them
// per frame (the last big jank source at 300 nodes: marquee p99 ~2.5s).
// ---------------------------------------------------------------------------

let marqueeActiveFlag = false;

export function setMarqueeSelecting(on: boolean): void {
  marqueeActiveFlag = on;
}

export function isMarqueeSelecting(): boolean {
  return marqueeActiveFlag;
}
