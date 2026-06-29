import { isInsideInteractiveCanvasNode } from "@/lib/canvasNodeInteraction";

export {
  isMacTrackpadWheel,
  isZoomWheel,
  resolveCanvasWheelAction,
} from "@/lib/canvasViewportInput";

/** WheelEvent.deltaMode values (mirrors DOM; avoids Node test env dependency). */
const DOM_DELTA_PIXEL = 0;
const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;

/** Scroll regions that consume wheel only inside an activated canvas node. */
const WHEEL_SCROLL_REGION_SELECTOR = [
  "[data-card-answer]",
  "[data-canvas-scroll]",
  ".leaflet-container",
].join(", ");

function isVerticallyScrollable(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el);
  if (
    overflowY !== "auto" &&
    overflowY !== "scroll" &&
    overflowY !== "overlay"
  ) {
    return false;
  }
  return el.scrollHeight > el.clientHeight + 1;
}

/**
 * True when a wheel event on the canvas should change the viewport.
 * Scrollable content inside nodes only blocks pan/zoom after the node is clicked/selected.
 */
export function shouldCanvasWheelViewport(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;

  if (!isInsideInteractiveCanvasNode(target)) return true;

  if (target.closest(WHEEL_SCROLL_REGION_SELECTOR)) return false;

  const container = target.closest("[data-canvas-container]");
  if (!container) return true;

  let el: HTMLElement | null = target;
  while (el && el !== container) {
    if (isVerticallyScrollable(el)) return false;
    el = el.parentElement;
  }

  return true;
}

/** @deprecated Use shouldCanvasWheelViewport */
export const shouldCanvasWheelZoom = shouldCanvasWheelViewport;

function normalizeWheelDelta(delta: number, deltaMode: number): number {
  if (deltaMode === DOM_DELTA_LINE) {
    return delta * 16;
  }
  if (deltaMode === DOM_DELTA_PAGE) {
    return delta * (typeof window !== "undefined" ? window.innerHeight : 800);
  }
  return delta;
}

/** Normalize wheel delta to pixel units across deltaMode variants. */
export function wheelDeltaY(e: Pick<WheelEvent, "deltaY" | "deltaMode">): number {
  return normalizeWheelDelta(e.deltaY, e.deltaMode);
}

/** Normalize wheel deltas on both axes to pixel units. */
export function wheelDeltaXY(
  e: Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode">,
): { dx: number; dy: number } {
  return {
    dx: normalizeWheelDelta(e.deltaX, e.deltaMode),
    dy: normalizeWheelDelta(e.deltaY, e.deltaMode),
  };
}

/** Pan delta for macOS trackpad scroll — content follows finger (Figma-style). */
export function wheelTrackpadPanDelta(
  e: Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode">,
): { dx: number; dy: number } {
  const { dx, dy } = wheelDeltaXY(e);
  return { dx: 0 - dx, dy: 0 - dy };
}
