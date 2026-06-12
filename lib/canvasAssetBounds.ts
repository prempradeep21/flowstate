import type { CanvasAsset, CanvasAssetNode } from "@/lib/store";
import { isPreviewableOfficeKind } from "@/lib/officeAssetKinds";

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
export const DEFAULT_ASSET_PREVIEW_WIDTH = 480;
export const DEFAULT_ASSET_PREVIEW_ASPECT = 4 / 3;
export const DEFAULT_ASSET_ICON_WIDTH = ASSET_ICON_NODE_DEFAULT_WIDTH;
export const DEFAULT_ASSET_ICON_HEIGHT = ASSET_ICON_NODE_DEFAULT_HEIGHT;
export const MIN_ASSET_IMAGE_WIDTH = 96;
export const MAX_ASSET_IMAGE_WIDTH = 720;
export const MIN_ASSET_PREVIEW_WIDTH = 240;
export const MAX_ASSET_PREVIEW_WIDTH = 960;
export const MIN_ASSET_ICON_WIDTH = 200;
export const MAX_ASSET_ICON_WIDTH = 400;

export function clampAssetImageWidth(width: number): number {
  return Math.min(MAX_ASSET_IMAGE_WIDTH, Math.max(MIN_ASSET_IMAGE_WIDTH, width));
}

export function clampAssetPreviewWidth(width: number): number {
  return Math.min(
    MAX_ASSET_PREVIEW_WIDTH,
    Math.max(MIN_ASSET_PREVIEW_WIDTH, width),
  );
}

function previewAspectForAsset(asset?: CanvasAsset | null): number | null {
  if (!asset) return null;
  if (asset.kind === "image") {
    return asset.aspectRatio && asset.aspectRatio > 0 ? asset.aspectRatio : 1;
  }
  if (isPreviewableOfficeKind(asset.kind)) {
    return DEFAULT_ASSET_PREVIEW_ASPECT;
  }
  return null;
}

export function getCanvasAssetBounds(
  node: Pick<CanvasAssetNode, "size">,
  asset?: CanvasAsset | null,
): { w: number; h: number } {
  const aspect = previewAspectForAsset(asset);
  if (aspect) {
    const clamp =
      asset?.kind === "image" ? clampAssetImageWidth : clampAssetPreviewWidth;
    const defaultWidth =
      asset?.kind === "image"
        ? DEFAULT_ASSET_IMAGE_WIDTH
        : DEFAULT_ASSET_PREVIEW_WIDTH;
    const w = clamp(node.size?.w ?? defaultWidth);
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
  const aspect = previewAspectForAsset(asset);
  if (aspect) {
    const clamp =
      asset?.kind === "image" ? clampAssetImageWidth : clampAssetPreviewWidth;
    const w = clamp(nextWidth);
    return { w, h: w / aspect };
  }
  const w = Math.min(MAX_ASSET_ICON_WIDTH, Math.max(MIN_ASSET_ICON_WIDTH, nextWidth));
  return { w, h: DEFAULT_ASSET_ICON_HEIGHT };
}
