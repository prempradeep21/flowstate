import type { CanvasAsset, CanvasAssetNode } from "@/lib/store";

export const DEFAULT_ASSET_IMAGE_WIDTH = 360;
export const DEFAULT_ASSET_ICON_WIDTH = 220;
export const DEFAULT_ASSET_ICON_HEIGHT = 120;
export const MIN_ASSET_IMAGE_WIDTH = 96;
export const MAX_ASSET_IMAGE_WIDTH = 720;
export const MIN_ASSET_ICON_WIDTH = 160;
export const MAX_ASSET_ICON_WIDTH = 320;

export function clampAssetImageWidth(width: number): number {
  return Math.min(MAX_ASSET_IMAGE_WIDTH, Math.max(MIN_ASSET_IMAGE_WIDTH, width));
}

export function getCanvasAssetBounds(
  node: Pick<CanvasAssetNode, "size">,
  asset?: CanvasAsset | null,
): { w: number; h: number } {
  if (asset?.kind === "image") {
    const aspect = asset.aspectRatio && asset.aspectRatio > 0 ? asset.aspectRatio : 1;
    const w = clampAssetImageWidth(node.size?.w ?? DEFAULT_ASSET_IMAGE_WIDTH);
    return { w, h: w / aspect };
  }

  return {
    w: Math.min(
      MAX_ASSET_ICON_WIDTH,
      Math.max(MIN_ASSET_ICON_WIDTH, node.size?.w ?? DEFAULT_ASSET_ICON_WIDTH),
    ),
    h: node.size?.h ?? DEFAULT_ASSET_ICON_HEIGHT,
  };
}

export function resizeAssetMaintainingAspect(
  asset: CanvasAsset | undefined,
  nextWidth: number,
): { w: number; h: number } {
  if (asset?.kind === "image") {
    const aspect = asset.aspectRatio && asset.aspectRatio > 0 ? asset.aspectRatio : 1;
    const w = clampAssetImageWidth(nextWidth);
    return { w, h: w / aspect };
  }
  const w = Math.min(MAX_ASSET_ICON_WIDTH, Math.max(MIN_ASSET_ICON_WIDTH, nextWidth));
  return { w, h: DEFAULT_ASSET_ICON_HEIGHT };
}
