import type { Viewport } from "@/lib/store";

export const COMPOSER_PROXIMITY_PX = 80;
export const RECEIVE_PLUG_HIT_RADIUS_PX = 18;
export const PLUG_DRAG_THRESHOLD_PX = 5;

export interface WorldRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ComposerTarget {
  cardId: string;
  rect: WorldRect;
  distance: number;
}

export interface ReceivePlugHit {
  cardId: string;
  side: "left" | "right";
}

export function screenToWorld(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: Viewport,
): { x: number; y: number } {
  const sx = clientX - containerRect.left;
  const sy = clientY - containerRect.top;
  return {
    x: (sx - viewport.x) / viewport.scale,
    y: (sy - viewport.y) / viewport.scale,
  };
}

export function worldRectFromClientRect(
  rect: DOMRect,
  containerRect: DOMRect,
  viewport: Viewport,
): WorldRect {
  const topLeft = screenToWorld(rect.left, rect.top, containerRect, viewport);
  const bottomRight = screenToWorld(
    rect.right,
    rect.bottom,
    containerRect,
    viewport,
  );
  return {
    x: topLeft.x,
    y: topLeft.y,
    w: bottomRight.x - topLeft.x,
    h: bottomRight.y - topLeft.y,
  };
}

function rectDistance(world: { x: number; y: number }, rect: WorldRect): number {
  const cx = Math.max(rect.x, Math.min(world.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(world.y, rect.y + rect.h));
  return Math.hypot(world.x - cx, world.y - cy);
}

export function findNearestComposerTarget(
  world: { x: number; y: number },
  container: HTMLElement,
  viewport: Viewport,
  thresholdPx = COMPOSER_PROXIMITY_PX,
): ComposerTarget | null {
  const containerRect = container.getBoundingClientRect();
  const composers = container.querySelectorAll<HTMLElement>(
    "[data-composer][data-card-id]",
  );

  let best: ComposerTarget | null = null;

  for (const el of composers) {
    const cardId = el.dataset.cardId;
    if (!cardId) continue;
    const rect = worldRectFromClientRect(
      el.getBoundingClientRect(),
      containerRect,
      viewport,
    );
    const distance = rectDistance(world, rect);
    if (distance > thresholdPx) continue;
    if (!best || distance < best.distance) {
      best = { cardId, rect, distance };
    }
  }

  return best;
}

export function receivePlugWorldPosition(
  rect: WorldRect,
  side: "left" | "right",
): { x: number; y: number } {
  return {
    x: side === "left" ? rect.x : rect.x + rect.w,
    y: rect.y + rect.h / 2,
  };
}

export function hitReceivePlug(
  world: { x: number; y: number },
  target: ComposerTarget,
): ReceivePlugHit | null {
  for (const side of ["left", "right"] as const) {
    const plug = receivePlugWorldPosition(target.rect, side);
    const dist = Math.hypot(world.x - plug.x, world.y - plug.y);
    if (dist <= RECEIVE_PLUG_HIT_RADIUS_PX) {
      return { cardId: target.cardId, side };
    }
  }
  return null;
}

export function expandRect(rect: WorldRect, px: number): WorldRect {
  return {
    x: rect.x - px,
    y: rect.y - px,
    w: rect.w + px * 2,
    h: rect.h + px * 2,
  };
}

export function pointInRect(
  world: { x: number; y: number },
  rect: WorldRect,
): boolean {
  return (
    world.x >= rect.x &&
    world.x <= rect.x + rect.w &&
    world.y >= rect.y &&
    world.y <= rect.y + rect.h
  );
}
