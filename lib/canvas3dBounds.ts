import type { Canvas3DNode } from "@/lib/store";

export const DEFAULT_3D_WIDTH = 240;
export const MIN_3D_WIDTH = 96;
export const MAX_3D_WIDTH = 480;

export function clamp3DWidth(width: number): number {
  return Math.min(MAX_3D_WIDTH, Math.max(MIN_3D_WIDTH, width));
}

export function getCanvas3DBounds(
  node: Pick<Canvas3DNode, "size">,
): { w: number; h: number } {
  const w = clamp3DWidth(node.size?.w ?? DEFAULT_3D_WIDTH);
  return { w, h: w };
}

export function resize3DMaintainingAspect(width: number): { w: number; h: number } {
  const w = clamp3DWidth(width);
  return { w, h: w };
}
