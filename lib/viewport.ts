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
