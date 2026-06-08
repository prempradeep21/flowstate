import { useCanvasStore } from "@/lib/store";

const VIEWPORT_MARGIN = 80;

export function getCanvasContainerRect(): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector("[data-canvas-container]");
  return el?.getBoundingClientRect() ?? null;
}

/** World bounds → screen rect using current viewport. */
export function worldBoundsToScreen(
  x: number,
  y: number,
  w: number,
  h: number,
): { left: number; top: number; right: number; bottom: number } | null {
  const container = getCanvasContainerRect();
  if (!container) return null;
  const { x: vx, y: vy, scale } = useCanvasStore.getState().viewport;
  const left = container.left + vx + x * scale;
  const top = container.top + vy + y * scale;
  return {
    left,
    top,
    right: left + w * scale,
    bottom: top + h * scale,
  };
}

export function isOffscreen(
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const container = getCanvasContainerRect();
  const screen = worldBoundsToScreen(x, y, w, h);
  if (!container || !screen) return false;

  return (
    screen.right < container.left - VIEWPORT_MARGIN ||
    screen.left > container.right + VIEWPORT_MARGIN ||
    screen.bottom < container.top - VIEWPORT_MARGIN ||
    screen.top > container.bottom + VIEWPORT_MARGIN
  );
}

export function shouldAnimateSpawn(
  x: number,
  y: number,
  w: number,
  h: number,
  reducedMotion: boolean,
): "full" | "opacity" | "none" {
  if (reducedMotion) return "opacity";
  if (isOffscreen(x, y, w, h)) return "opacity";
  return "full";
}

export function applyWillChange(el: HTMLElement | null) {
  if (!el) return;
  el.style.willChange = "transform, opacity";
}

export function clearWillChange(el: HTMLElement | null) {
  if (!el) return;
  el.style.willChange = "";
}

export function hasLandingAnimated(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem("flowstate-landing-animated") === "1";
}

export function markLandingAnimated(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem("flowstate-landing-animated", "1");
}
