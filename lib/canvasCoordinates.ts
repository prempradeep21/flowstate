/** Convert client pointer position to canvas world coordinates. */
export function clientToWorld(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: { x: number; y: number; scale: number },
): { worldX: number; worldY: number } {
  const localX = clientX - containerRect.left;
  const localY = clientY - containerRect.top;
  return {
    worldX: (localX - viewport.x) / viewport.scale,
    worldY: (localY - viewport.y) / viewport.scale,
  };
}

/** Convert canvas world coordinates to screen pixels within the container. */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: { x: number; y: number; scale: number },
): { screenX: number; screenY: number } {
  return {
    screenX: worldX * viewport.scale + viewport.x,
    screenY: worldY * viewport.scale + viewport.y,
  };
}
