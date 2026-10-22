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

/** Every world layer (the main viewport, and the groups layer under the
 * connector lines) — each one takes the same transform. */
const viewportEls = new Set<HTMLElement>();
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
export function registerViewportElement(el: HTMLElement): () => void {
  viewportEls.add(el);
  return () => {
    viewportEls.delete(el);
  };
}

/**
 * The viewport as currently PAINTED: the gesture's transient value while one
 * owns the transform (the store lags it by a frame), the store otherwise.
 * Culling reads this so nodes mount against what is on screen right now.
 */
export function getLiveViewport(): Readonly<TransientViewport> {
  return transient ?? useCanvasStore.getState().viewport;
}

/** True while an active gesture owns the visual transform. */
export function isViewportGestureOwned(): boolean {
  return transient !== null;
}

/**
 * True from the first input of a viewport gesture until the data-gesturing
 * attribute clears (~260ms after the last input). Deliberately WIDER than
 * ownership: nodes mounting during the post-gesture settle restyle should
 * still treat themselves as gesture-time mounts and hydrate through the
 * metered queue rather than all in one frame.
 */
export function isViewportGestureActive(): boolean {
  return transient !== null || idleTimer !== null || attrTimer !== null;
}

// ---------------------------------------------------------------------------
// Deferred hydration: nodes that mount mid-gesture render a cheap provisional
// stand-in and register here to swap in their full content a few at a time —
// nearest the screen first. The queue keeps draining WHILE the gesture runs
// for nodes on or about to come on screen: culling mounts nodes in a band
// beyond the screen edge, so a pan hydrates them before they scroll into
// view. The old policy held every stand-in until ~260ms after the last
// input, so anything revealed by a pan showed up as an empty titled box and
// only then started loading its images / previews.
// ---------------------------------------------------------------------------

/** Nodes released per frame while the canvas is idle. */
const HYDRATE_IDLE_PER_FRAME = 4;
/**
 * Mid-pan, nodes within this many screen px of the viewport hydrate (one per
 * frame); the rest of the culling band waits for settle. Hydrating the whole
 * band mid-gesture also paid for nodes a back-and-forth pan never brought on
 * screen (~4–7% dropped frames at 300 nodes).
 */
const HYDRATE_PAN_REACH_PX = 160;
/**
 * Mid-zoom every frame already re-rasters the canvas, so hydration is
 * stricter: only nodes actually on screen, one every this many frames.
 */
const HYDRATE_ZOOM_FRAME_INTERVAL = 3;

interface HydrateEntry {
  cb: () => void;
  /** Screen distance or similar — lower hydrates sooner; undefined = last. */
  priority?: () => number;
}

const hydrateQueue: HydrateEntry[] = [];
let hydrateRaf = 0;
/** Zoom-gesture frames left before the next mid-zoom hydration. */
let zoomHydrateWait = 0;

/**
 * Queue a hydration callback; it runs on a later frame, paced and ordered by
 * `priority` (lower first). Callbacks should hand their render to React as a
 * transition so a heavy mount is time-sliced around gesture input. Returns
 * an unsubscribe for unmount safety.
 */
export function onGestureSettleHydrate(
  cb: () => void,
  priority?: () => number,
): () => void {
  const entry: HydrateEntry = { cb, priority };
  hydrateQueue.push(entry);
  scheduleHydrateDrain();
  return () => {
    const i = hydrateQueue.indexOf(entry);
    if (i !== -1) hydrateQueue.splice(i, 1);
  };
}

function scheduleHydrateDrain(): void {
  if (hydrateRaf || hydrateQueue.length === 0) return;
  hydrateRaf = requestAnimationFrame(drainHydrateQueue);
}

/** Order the queue by priority (one layout read); returns the sorted keys. */
function sortHydrateQueue(): number[] {
  const keyed = hydrateQueue.map((e, i) => ({
    e,
    i,
    k: e.priority ? e.priority() : Number.POSITIVE_INFINITY,
  }));
  keyed.sort((a, b) => a.k - b.k || a.i - b.i);
  for (let i = 0; i < keyed.length; i++) hydrateQueue[i] = keyed[i].e;
  return keyed.map((x) => x.k);
}

function drainHydrateQueue(): void {
  hydrateRaf = 0;
  if (!isViewportGestureActive()) {
    zoomHydrateWait = 0;
    sortHydrateQueue();
    for (let n = 0; n < HYDRATE_IDLE_PER_FRAME && hydrateQueue.length; n++) {
      hydrateQueue.shift()!.cb();
    }
  } else if (gestureMode === "zoom") {
    if (zoomHydrateWait > 0) {
      zoomHydrateWait--;
    } else if (sortHydrateQueue()[0] <= 0) {
      hydrateQueue.shift()!.cb();
      zoomHydrateWait = HYDRATE_ZOOM_FRAME_INTERVAL - 1;
    }
  } else if (sortHydrateQueue()[0] <= HYDRATE_PAN_REACH_PX) {
    hydrateQueue.shift()!.cb();
  }
  scheduleHydrateDrain();
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

/** True while the active (or settling) viewport gesture has zoomed. */
export function isViewportZoomGesture(): boolean {
  return isViewportGestureActive() && gestureMode === "zoom";
}

/**
 * Gesture mode carried in the data-gesturing attribute value:
 * - "pan"  — viewport pan only; transitions suppressed, shadows kept (pans
 *   composite the existing raster, shadows cost nothing per frame).
 * - "zoom" — the gesture has zoomed at least once; shadows are also
 *   flattened via CSS (every zoom frame re-rasters, blurred shadows are the
 *   dominant raster cost). A pan that turns into a pinch upgrades and stays.
 * Node drags (lib/gesture/gestureLayer.ts) use "drag" on the same attribute.
 */
type ViewportGestureMode = "pan" | "zoom";
let gestureMode: ViewportGestureMode = "pan";

function setGesturingAttr(mode: ViewportGestureMode | null): void {
  const container = document.querySelector<HTMLElement>(
    "[data-canvas-container]",
  );
  if (!container) return;
  if (mode) container.setAttribute("data-gesturing", mode);
  // Never clear here if a node drag holds the attr — the drag gestureLayer
  // manages its own lifecycle; we only remove what we set while no drag is
  // active. Node drags and viewport gestures don't overlap in practice
  // (a drag captures the pointer), so a plain remove is safe.
  else container.removeAttribute("data-gesturing");
}

function paint(): void {
  if (!transient) return;
  const transform = `translate(${transient.x}px, ${transient.y}px) scale(${transient.scale})`;
  for (const el of viewportEls) el.style.transform = transform;
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
  // Paint the final value ourselves: after a rubber-band snap-back the store
  // already holds it (overshoot commits send the in-range viewport), so the
  // commit below is a no-op CanvasViewport skips — the visual would stay
  // parked a hair past the limit, off from what hit-testing assumes.
  transient = { ...final };
  paint();
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
    setGesturingAttr(null);
    // Gesture fully settled: make sure anything still queued finishes.
    scheduleHydrateDrain();
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
    gestureMode = "pan";
    setGesturingAttr(gestureMode);
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
  if (gestureMode !== "zoom") {
    gestureMode = "zoom";
    setGesturingAttr(gestureMode);
  }
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
  setGesturingAttr(null);
  // Aborted gestures still settle: provisional nodes must not stay stuck.
  scheduleHydrateDrain();
}
