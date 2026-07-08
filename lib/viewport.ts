/** Pan the viewport so a world-space point sits at the container center. */
export function viewportCenteredOnWorldPoint(
  worldX: number,
  worldY: number,
  containerWidth: number,
  containerHeight: number,
  scale: number,
) {
  return {
    x: containerWidth / 2 - worldX * scale,
    y: containerHeight / 2 - worldY * scale,
    scale,
  };
}

export const ARTIFACT_FOCUS_VIEWPORT_PADDING_PX = 120;

/** Frame a world rect with fixed padding from each viewport edge. */
export function viewportFramedOnWorldRect(
  rect: { x: number; y: number; w: number; h: number },
  containerWidth: number,
  containerHeight: number,
  opts?: { minScale?: number; maxScale?: number },
): { x: number; y: number; scale: number } {
  const pad = ARTIFACT_FOCUS_VIEWPORT_PADDING_PX * 2;
  const availW = Math.max(1, containerWidth - pad);
  const availH = Math.max(1, containerHeight - pad);
  const fitScale = Math.min(availW / rect.w, availH / rect.h);
  const minScale = opts?.minScale ?? 0.1;
  const maxScale = opts?.maxScale ?? 3;
  const scale = Math.min(maxScale, Math.max(minScale, fitScale));
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return viewportCenteredOnWorldPoint(
    cx,
    cy,
    containerWidth,
    containerHeight,
    scale,
  );
}
