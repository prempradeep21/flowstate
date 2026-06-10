import type { CanvasAsset, CanvasAssetNode } from "@/lib/store";

import {
  CANVAS_ASSET_ICON_SIZE_PX,
  CANVAS_ASSET_TITLE_MAX_WIDTH_PX,
} from "@/lib/design/canvasInsets";
import { canvasSpacing } from "@/lib/design/tokens";

/** Icon row width: title column + gap + icon + horizontal compact inset. */
const ASSET_ICON_NODE_DEFAULT_WIDTH =
  CANVAS_ASSET_TITLE_MAX_WIDTH_PX +
  canvasSpacing.compact +
  CANVAS_ASSET_ICON_SIZE_PX +
  canvasSpacing.section * 2;

/** Two-line title + kind label beside the icon — no extra vertical centering slack. */
const ASSET_ICON_NODE_TEXT_BLOCK_HEIGHT_PX = 56;
const ASSET_ICON_NODE_DEFAULT_HEIGHT =
  canvasSpacing.compact * 2 +
  Math.max(CANVAS_ASSET_ICON_SIZE_PX, ASSET_ICON_NODE_TEXT_BLOCK_HEIGHT_PX);

export const DEFAULT_ASSET_IMAGE_WIDTH = 360;
export const DEFAULT_ASSET_ICON_WIDTH = ASSET_ICON_NODE_DEFAULT_WIDTH;
export const DEFAULT_ASSET_ICON_HEIGHT = ASSET_ICON_NODE_DEFAULT_HEIGHT;
export const MIN_ASSET_IMAGE_WIDTH = 96;
export const MAX_ASSET_IMAGE_WIDTH = 720;
export const MIN_ASSET_ICON_WIDTH = 200;
export const MAX_ASSET_ICON_WIDTH = 400;

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
