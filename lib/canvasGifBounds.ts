import type { CanvasGifNode } from "@/lib/store";

export const DEFAULT_GIF_WIDTH = 240;
export const MIN_GIF_WIDTH = 64;
export const MAX_GIF_WIDTH = 480;

export function clampGifWidth(width: number): number {
  return Math.min(MAX_GIF_WIDTH, Math.max(MIN_GIF_WIDTH, width));
}

export function getCanvasGifBounds(
  node: Pick<CanvasGifNode, "size" | "aspectRatio">,
): { w: number; h: number } {
  const aspect =
    node.aspectRatio && node.aspectRatio > 0 ? node.aspectRatio : 1;
  const w = clampGifWidth(node.size?.w ?? DEFAULT_GIF_WIDTH);
  return { w, h: w / aspect };
}

export function resizeGifMaintainingAspect(
  aspectRatio: number,
  nextWidth: number,
): { w: number; h: number } {
  const aspect = aspectRatio > 0 ? aspectRatio : 1;
  const w = clampGifWidth(nextWidth);
  return { w, h: w / aspect };
}
