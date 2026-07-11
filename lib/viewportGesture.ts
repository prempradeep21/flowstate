/**
 * Zero-latency viewport gestures.
 *
 * The previous pipeline queued wheel/pinch input to the NEXT frame's rAF
 * before writing the store, whose subscriber then set the DOM transform —
 * a built-in +1 frame of input lag that made pan feel floaty and zoom feel
 * detached from the fingers.
 *
 * This module inverts the ordering: the input handler mutates a transient
 * viewport and writes `el.style.transform` SYNCHRONOUSLY (paints in the
 * event's own frame), while the store commit — which feeds culling, minimap,
 * connections, persistence — is coalesced to one setViewport per frame.
 * Pivot math runs per-event, so fast pinches zoom around each event's own
 * pivot instead of a single last-pivot-wins point (fixes pivot drift).
 *
 * While a gesture owns the visual, CanvasViewport's store subscription
 * stands down (isViewportGestureOwned). Ownership ends shortly after the
 * last input; the final state is committed and the store becomes the source
 * of truth again.
 */

import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { cancelViewportTween } from "@/lib/motion/animateViewport";
import { useCanvasStore } from "@/lib/store";

/** Mirrors the store's zoom clamp (lib/store.ts MIN_SCALE/MAX_SCALE). */
export const VIEWPORT_MIN_SCALE = 0.1;
export const VIEWPORT_MAX_SCALE = 3;

/** Idle time after the last input before the gesture releases ownership. */
const GESTURE_IDLE_END_MS = 120;
/**
 * data-gesturing clears a bit AFTER the store's 150ms settled-scale commit,
 * so the settle restyle (LOD swaps, border compensation, chrome) lands while
 * CSS transitions are still suppressed — it cuts instead of animating.
 */
const GESTURING_ATTR_CLEAR_MS = 260;

interface TransientViewport {
  x: number;
  y: number;
  scale: number;
}

let viewportEl: HTMLElement | null = null;
let transient: TransientViewport | null = null;
let commitRaf = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let attrTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Synchronous paint listeners — screen-space layers that must track the
 * gesture-owned transform in the SAME frame (grid background dots would
 * otherwise slip a frame behind the canvas). Called with the transient
 * viewport on every gesture paint; idle updates come via the store.
 */
type ViewportPaintListener = (v: Readonly<TransientViewport>) => void;
const paintListeners = new Set<ViewportPaintListener>();

export function subscribeViewportPaint(
  fn: ViewportPaintListener,
): () => void {
  paintListeners.add(fn);
  return () => paintListeners.delete(fn);
}

/** CanvasViewport registers its element so handlers can paint synchronously. */
export function registerViewportElement(el: HTMLElement | null): void {
  viewportEl = el;
}

/** True while an active gesture owns the visual transform. */
export function isViewportGestureOwned(): boolean {
  return transient !== null;
}

/**
 * Called by CanvasViewport's store subscriber for writes arriving while a
 * gesture is active. Our own per-frame commits echo the transient value —
 * skip them (the DOM is already ahead). A DIFFERENT value means an external
 * writer (programmatic focus, hydrate, collab): the gesture yields so the
 * external transform applies.
 */
export function shouldApplyStoreViewport(v: {
  x: number;
  y: number;
  scale: number;
}): boolean {
  if (!transient) return true;
  // Compare against what OUR commits send: the in-range viewport while the
  // visual is rubber-band overshooting, the transient otherwise.
  const source = lastInRange ?? transient;
  if (v.x === source.x && v.y === source.y && v.scale === source.scale) {
    return false; // our own commit echo
  }
  cancelViewportGesture();
  return true;
}

function setGesturingAttr(on: boolean): void {
  const container = document.querySelector<HTMLElement>(
    "[data-canvas-container]",
  );
  if (!container) return;
  if (on) container.setAttribute("data-gesturing", "true");
  // Never clear here if a node drag holds the attr — the drag gestureLayer
  // manages its own lifecycle; we only remove what we set while no drag is
  // active. Node drags and viewport gestures don't overlap in practice
  // (a drag captures the pointer), so a plain remove is safe.
  else container.removeAttribute("data-gesturing");
}

function paint(): void {
  if (!transient) return;
  if (viewportEl) {
    viewportEl.style.transform = `translate(${transient.x}px, ${transient.y}px) scale(${transient.scale})`;
  }
  for (const fn of paintListeners) fn(transient);
}

function commit(): void {
  commitRaf = 0;
  if (!transient) return;
  // While the visual is overshooting a scale limit (rubber-band), commit the
  // last fully in-range viewport — the store never holds out-of-range scale.
  const source = lastInRange ?? transient;
  useCanvasStore.getState().setViewport({
    x: source.x,
    y: source.y,
    scale: source.scale,
  });
}

function releaseOwnership(final: TransientViewport): void {
  // Release BEFORE the final commit so CanvasViewport's store subscription
  // applies it — store is the source of truth again.
  transient = null;
  lastInRange = null;
  useCanvasStore.getState().setViewport({ ...final });
}

function endGesture(): void {
  idleTimer = null;
  if (commitRaf) {
    cancelAnimationFrame(commitRaf);
    commitRaf = 0;
  }
  if (transient) {
    if (lastInRange) {
      // Rubber-band snap-back: ease the visual from the overshoot to the
      // limit, then hand off to the store.
      startSnapback({ ...lastInRange });
    } else {
      releaseOwnership(transient);
    }
  }
  if (attrTimer) clearTimeout(attrTimer);
  attrTimer = setTimeout(() => {
    attrTimer = null;
    setGesturingAttr(false);
  }, GESTURING_ATTR_CLEAR_MS - GESTURE_IDLE_END_MS);
}

function startSnapback(target: TransientViewport): void {
  if (snapbackRaf) cancelAnimationFrame(snapbackRaf);
  const step = () => {
    snapbackRaf = 0;
    const t = transient;
    if (!t) return;
    t.x += (target.x - t.x) * SNAPBACK_LERP;
    t.y += (target.y - t.y) * SNAPBACK_LERP;
    t.scale += (target.scale - t.scale) * SNAPBACK_LERP;
    const done =
      Math.abs(target.scale - t.scale) < 0.0005 &&
      Math.abs(target.x - t.x) < 0.5 &&
      Math.abs(target.y - t.y) < 0.5;
    if (done) {
      releaseOwnership(target);
      return;
    }
    paint();
    snapbackRaf = requestAnimationFrame(step);
  };
  snapbackRaf = requestAnimationFrame(step);
}

function touchGesture(): void {
  markUserViewportInteraction();
  cancelViewportTween();
  // New input interrupts a rubber-band snap-back — the user takes over.
  if (snapbackRaf) {
    cancelAnimationFrame(snapbackRaf);
    snapbackRaf = 0;
  }
  if (!transient) {
    const v = useCanvasStore.getState().viewport;
    transient = { x: v.x, y: v.y, scale: v.scale };
    setGesturingAttr(true);
    if (attrTimer) {
      clearTimeout(attrTimer);
      attrTimer = null;
    }
  }
  if (!commitRaf) commitRaf = requestAnimationFrame(commit);
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(endGesture, GESTURE_IDLE_END_MS);
}

/** Pan by screen-space deltas — paints this frame, commits next rAF. */
export function applyViewportPan(dx: number, dy: number): void {
  if (dx === 0 && dy === 0) return;
  cancelSmoothZoom();
  touchGesture();
  const t = transient!;
  t.x += dx;
  t.y += dy;
  paint();
}

// ---------------------------------------------------------------------------
// Rubber-band: past MIN/MAX the visual overshoots with strong resistance
// (capped ~6%) instead of the old dead-stop wall; commits stay clamped and
// the visual springs back to the limit when the gesture ends.
// ---------------------------------------------------------------------------

const OVERSHOOT_RESISTANCE = 0.18;
const OVERSHOOT_MAX = 1.06;
const SNAPBACK_LERP = 0.35;

/** Last fully in-range viewport — what commits use while overshooting. */
let lastInRange: TransientViewport | null = null;
let snapbackRaf = 0;

function clampScale(scale: number): number {
  return Math.min(VIEWPORT_MAX_SCALE, Math.max(VIEWPORT_MIN_SCALE, scale));
}

function zoomAround(t: TransientViewport, k: number, px: number, py: number) {
  t.x = px - k * (px - t.x);
  t.y = py - k * (py - t.y);
  t.scale = t.scale * k;
}

function applyZoomInternal(
  factor: number,
  pivotX: number,
  pivotY: number,
): void {
  touchGesture();
  const t = transient!;
  const rawNext = t.scale * factor;
  const clamped = clampScale(rawNext);

  if (rawNext === clamped) {
    lastInRange = null;
    zoomAround(t, clamped / t.scale, pivotX, pivotY);
    paint();
    return;
  }

  // Crossing or past a limit: derive the committable in-range viewport by
  // bringing the (possibly already overshooting) visual exactly to the limit
  // around this event's pivot, then push a resisted visual overshoot.
  const base = { ...t };
  zoomAround(base, clamped / base.scale, pivotX, pivotY);
  base.scale = clamped; // guard float rounding
  lastInRange = base;

  const overshoot = Math.min(
    OVERSHOOT_MAX,
    Math.max(1 / OVERSHOOT_MAX, Math.exp(Math.log(rawNext / clamped) * OVERSHOOT_RESISTANCE)),
  );
  const visualScale = clamped * overshoot;
  zoomAround(t, visualScale / t.scale, pivotX, pivotY);
  paint();
}

/**
 * Zoom by a factor around a container-space pivot — paints this frame.
 * Direct path for continuous (pinch) input; cancels any wheel smoothing.
 */
export function applyViewportZoom(
  factor: number,
  pivotX: number,
  pivotY: number,
): void {
  if (factor === 1) return;
  cancelSmoothZoom();
  applyZoomInternal(factor, pivotX, pivotY);
}

// ---------------------------------------------------------------------------
// Smoothed zoom for notched mouse wheels: each notch retargets an exponential
// approach (~100ms settle) instead of an instant ~14% jump — the discrete
// ratchet becomes a glide. Continuous pinch input never routes here.
// ---------------------------------------------------------------------------

let smoothTargetScale: number | null = null;
let smoothPivotX = 0;
let smoothPivotY = 0;
let smoothRaf = 0;

function cancelSmoothZoom(): void {
  smoothTargetScale = null;
  if (smoothRaf) {
    cancelAnimationFrame(smoothRaf);
    smoothRaf = 0;
  }
}

function smoothStep(): void {
  smoothRaf = 0;
  if (smoothTargetScale == null) return;
  const current =
    transient?.scale ?? useCanvasStore.getState().viewport.scale;
  const next = current + (smoothTargetScale - current) * 0.3;
  const done = Math.abs(smoothTargetScale - next) < 0.0008 * smoothTargetScale;
  const stepTo = done ? smoothTargetScale : next;
  if (stepTo !== current) {
    applyZoomInternal(stepTo / current, smoothPivotX, smoothPivotY);
  }
  if (done) {
    smoothTargetScale = null;
  } else {
    smoothRaf = requestAnimationFrame(smoothStep);
  }
}

/** Retarget the smoothed zoom (notched wheel path). */
export function applyViewportZoomSmooth(
  factor: number,
  pivotX: number,
  pivotY: number,
): void {
  if (factor === 1) return;
  const base =
    smoothTargetScale ??
    transient?.scale ??
    useCanvasStore.getState().viewport.scale;
  smoothTargetScale = clampScale(base * factor);
  smoothPivotX = pivotX;
  smoothPivotY = pivotY;
  if (!smoothRaf) smoothRaf = requestAnimationFrame(smoothStep);
}

/** Test/edge hook: abort any active gesture and hand control to the store. */
export function cancelViewportGesture(): void {
  cancelSmoothZoom();
  if (snapbackRaf) {
    cancelAnimationFrame(snapbackRaf);
    snapbackRaf = 0;
  }
  lastInRange = null;
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (commitRaf) {
    cancelAnimationFrame(commitRaf);
    commitRaf = 0;
  }
  transient = null;
  if (attrTimer) clearTimeout(attrTimer);
  attrTimer = null;
  setGesturingAttr(false);
}
