/** Regions where wheel should scroll content, not zoom the canvas. */
const WHEEL_SCROLL_REGION_SELECTOR = [
  "[data-card-answer]",
  "[data-canvas-artifact]",
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
 * True when a wheel event on the canvas should change viewport zoom.
 * Returns false over Q&A answers, canvas artifacts, and other scrollable panels.
 */
export function shouldCanvasWheelZoom(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;

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
