import { isMacOS } from "@/lib/canvasPlatform";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { wheelDeltaXY } from "@/lib/canvasWheel";
import { cancelViewportTween } from "@/lib/motion/animateViewport";
import { useCanvasStore } from "@/lib/store";

/** WheelEvent.deltaMode — pixel mode (trackpad scroll / pinch on most browsers). */
const DOM_DELTA_PIXEL = 0;

/** Max wheel delta (px) per tick before zoom exponent — tames mouse-wheel jumps. */
const WHEEL_ZOOM_DELTA_CLAMP = 10;

/** Pinch / modifier+scroll zoom sensitivity. */
const WHEEL_ZOOM_INTENSITY_PINCH = 0.0125;

/** Mouse-wheel zoom sensitivity (non-modifier, non-Mac-trackpad scroll). */
const WHEEL_ZOOM_INTENSITY_WHEEL = 0.0015;

export type WheelZoomInput = Pick<
  WheelEvent,
  "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "deltaX" | "deltaY" | "deltaMode"
>;

export type WheelRoutingInput = Pick<
  WheelEvent,
  "ctrlKey" | "metaKey" | "altKey" | "deltaMode"
>;

/** True when wheel should zoom (pinch, or Alt/Ctrl/Cmd held). */
export function isZoomWheel(e: Pick<WheelEvent, "ctrlKey" | "metaKey" | "altKey">): boolean {
  return e.ctrlKey || e.metaKey || e.altKey;
}

/**
 * True for macOS trackpad two-finger scroll (pixel-mode wheel without zoom modifiers).
 * Pinch zoom and external mouse wheels are excluded.
 */
export function isMacTrackpadWheel(
  e: WheelRoutingInput,
  macOS: boolean = isMacOS(),
): boolean {
  return macOS && !isZoomWheel(e) && e.deltaMode === DOM_DELTA_PIXEL;
}

/** Route a canvas wheel event to pan (Mac trackpad scroll) or zoom. */
export function resolveCanvasWheelAction(
  e: WheelRoutingInput,
  macOS: boolean = isMacOS(),
): "pan" | "zoom" {
  if (isMacTrackpadWheel(e, macOS)) return "pan";
  return "zoom";
}

function clampWheelZoomDelta(delta: number): number {
  return Math.sign(delta) * Math.min(WHEEL_ZOOM_DELTA_CLAMP, Math.abs(delta));
}

/** Effective vertical zoom delta after axis swap and clamp. */
export function wheelZoomDelta(e: WheelZoomInput): number {
  let { dx, dy } = wheelDeltaXY(e);
  if (dx === 0 && e.shiftKey) {
    [dx, dy] = [dy, dx];
  }
  const delta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
  if (isZoomWheel(e)) return clampWheelZoomDelta(delta);
  return delta;
}

/** Exponential zoom factor for a wheel event. */
export function wheelZoomFactor(e: WheelZoomInput): number {
  const intensity = isZoomWheel(e) ? WHEEL_ZOOM_INTENSITY_PINCH : WHEEL_ZOOM_INTENSITY_WHEEL;
  return Math.exp(-wheelZoomDelta(e) * intensity);
}

/** Incremental scale factor from Safari GestureEvent.scale (cumulative from gesture start). */
export function gestureZoomFactor(prevScale: number, currentScale: number): number {
  if (prevScale <= 0 || currentScale <= 0) return 1;
  return currentScale / prevScale;
}

/**
 * Apply zoom around a screen-space pivot on the canvas container.
 *
 * `apply` receives (factor, pivotX, pivotY); pass the rAF-coalescing queue
 * from useCanvasZoom so rapid pinch/wheel ticks collapse to one store write
 * per frame. The direct-store default remains for programmatic callers.
 */
export function applyCanvasZoomAtScreen(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  factor: number,
  apply?: (factor: number, pivotX: number, pivotY: number) => void,
): void {
  if (factor === 1) return;
  const rect = container.getBoundingClientRect();
  const pivotX = clientX - rect.left;
  const pivotY = clientY - rect.top;
  if (apply) {
    // Queue handles interaction marking + tween cancel itself.
    apply(factor, pivotX, pivotY);
    return;
  }
  markUserViewportInteraction();
  cancelViewportTween();
  useCanvasStore.getState().zoomAt(factor, pivotX, pivotY);
}

/** Whether the browser exposes Safari/WebKit GestureEvent for trackpad pinch. */
export function supportsCanvasGestureZoom(): boolean {
  return typeof window !== "undefined" && "GestureEvent" in window;
}
