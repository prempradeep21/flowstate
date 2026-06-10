"use client";

import {
  PointerEvent as ReactPointerEvent,
  useRef,
} from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import {
  cornerResizeSigns,
  NodeCornerResizeHandles,
  type NodeResizeCorner,
} from "@/components/canvas/NodeCornerResizeHandles";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { Plug } from "@/components/plugs/Plug";
import {
  getCanvasAssetBounds,
  resizeAssetMaintainingAspect,
} from "@/lib/canvasAssetBounds";
import { isCanvasItemSelected } from "@/lib/canvasSelection";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasAssetNode as CanvasAssetNodeType,
} from "@/lib/store";
import {
  CANVAS_ASSET_ICON_SIZE_PX,
  CANVAS_ASSET_TITLE_MAX_WIDTH_PX,
} from "@/lib/design/canvasInsets";
import { canvasSpacing } from "@/lib/design/tokens";
import { isGodViewMode } from "@/lib/zoomDisplay";

const DRAG_THRESHOLD_PX = 4;
const INTERACTIVE =
  "button, a, [data-no-drag], [data-plug], [data-resize-handle]";

function AssetKindIcon({ kind }: { kind: "document" | "code" }) {
  if (kind === "code") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path d="M11 9 6 14l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 9l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m15 7-2 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M8 4.5h8l4 4V23a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 8 23V4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M16 4.5v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M11 14h6M11 18h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CanvasAssetNode({ node }: { node: CanvasAssetNodeType }) {
  const assets = useCanvasStore((s) => s.canvasAssets);
  const scale = useCanvasStore((s) => s.viewportSettledScale);
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasAssetId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "asset", node.id),
  );
  const moveCanvasAsset = useCanvasStore((s) => s.moveCanvasAsset);
  const selectCanvasAsset = useCanvasStore((s) => s.selectCanvasAsset);
  const setCanvasAssetSize = useCanvasStore((s) => s.setCanvasAssetSize);
  const removeCanvasAssetNode = useCanvasStore((s) => s.removeCanvasAssetNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const asset = assets[node.assetId];
  const { w: width, h: height } = getCanvasAssetBounds(node, asset);
  const godView = isGodViewMode(scale);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    didMove: boolean;
    recordedUndo: boolean;
    /** Alt held at drag start — first move duplicates and drags the copy. */
    copyOnDrag: boolean;
    /** Node actually being dragged (the duplicate when alt-dragging). */
    targetId: string;
    /** Whole multi-selection moves together when this node is part of it. */
    moveSelection: boolean;
  } | null>(null);
  const resizeStateRef = useRef<{
    pointerId: number;
    corner: NodeResizeCorner;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startPosX: number;
    startPosY: number;
    didMove: boolean;
    recordedUndo: boolean;
  } | null>(null);

  if (!asset) return null;

  const assetPlugWorld = (side: "left" | "right") => {
    const anchor = plugAnchorAt(
      node.position.x,
      node.position.y,
      width,
      height,
      side,
    );
    return { x: anchor.px, y: anchor.py };
  };

  const handleAssetPlugPointerDown =
    (side: "left" | "right") => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      startPlugDrag({
        kind: "asset",
        assetNodeId: node.id,
        assetId: node.assetId,
        fromSide: side,
        pointerWorld: assetPlugWorld(side),
        didDrag: false,
        receiveTargetCardId: null,
        hoveredReceiveSide: null,
      });
    };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE)) return;
    e.stopPropagation();
    e.preventDefault();
    const st = useCanvasStore.getState();
    const inMultiSelection =
      isCanvasItemSelected(st.canvasSelection, "asset", node.id) &&
      st.selectedFamilyRootIds.length + st.canvasSelection.length > 1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      st.toggleCanvasSelectionItem({ kind: "asset", id: node.id });
      return;
    }
    if (!inMultiSelection) selectCanvasAsset(node.id);
    if (canvasReadOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      didMove: false,
      recordedUndo: false,
      copyOnDrag: e.altKey,
      targetId: node.id,
      moveSelection: inMultiSelection && !e.altKey,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resizeStateRef.current;
    if (rs && rs.pointerId === e.pointerId) {
      const screenDx = e.clientX - rs.startX;
      const screenDy = e.clientY - rs.startY;
      if (!rs.didMove && Math.hypot(screenDx, screenDy) < DRAG_THRESHOLD_PX)
        return;
      if (!rs.recordedUndo) {
        recordUndo();
        rs.recordedUndo = true;
      }
      rs.didMove = true;
      const vpScale = useCanvasStore.getState().viewport.scale;
      const { sx, sy } = cornerResizeSigns(rs.corner);
      const next = resizeAssetMaintainingAspect(
        asset,
        rs.startW + (sx * screenDx) / vpScale,
      );
      setCanvasAssetSize(node.id, next);
      // Keep the corner opposite the grip anchored in place.
      const targetX =
        sx === -1 ? rs.startPosX + (rs.startW - next.w) : rs.startPosX;
      const targetY =
        sy === -1 ? rs.startPosY + (rs.startH - next.h) : rs.startPosY;
      moveCanvasAsset(
        node.id,
        targetX - node.position.x,
        targetY - node.position.y,
      );
      return;
    }

    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    const screenDx = e.clientX - ds.lastX;
    const screenDy = e.clientY - ds.lastY;
    const dist = Math.hypot(screenDx, screenDy);
    if (!ds.didMove && dist < DRAG_THRESHOLD_PX) return;
    if (!ds.recordedUndo) {
      recordUndo();
      ds.recordedUndo = true;
    }
    if (!ds.didMove && ds.copyOnDrag) {
      const copyId = useCanvasStore.getState().duplicateCanvasAssetNode(node.id);
      if (copyId) ds.targetId = copyId;
    }
    ds.didMove = true;
    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    const st = useCanvasStore.getState();
    const vpScale = st.viewport.scale;
    if (ds.moveSelection) {
      st.moveSelectedCanvasItems(screenDx / vpScale, screenDy / vpScale);
    } else {
      moveCanvasAsset(ds.targetId, screenDx / vpScale, screenDy / vpScale);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    resizeStateRef.current = null;
    dragStateRef.current = null;
  };

  const handleResizePointerDown = (
    corner: NodeResizeCorner,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (e.button !== 0 || canvasReadOnly) return;
    e.stopPropagation();
    e.preventDefault();
    selectCanvasAsset(node.id);
    nodeRef.current?.setPointerCapture(e.pointerId);
    resizeStateRef.current = {
      pointerId: e.pointerId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startW: width,
      startH: height,
      startPosX: node.position.x,
      startPosY: node.position.y,
      didMove: false,
      recordedUndo: false,
    };
  };

  return (
    <MotionCanvasNode
      targetId={node.id}
      targetKind="artifact"
      bounds={{ x: node.position.x, y: node.position.y, w: width, h: height }}
    >
      <div
        ref={nodeRef}
        data-canvas-asset
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`group/asset absolute rounded-canvas border transition-shadow ${
          asset.kind === "image"
            ? isSelected
              ? "border-canvas-ink bg-transparent shadow-none"
              : "border-transparent bg-transparent shadow-none hover:border-canvas-border/60"
            : isSelected
              ? "border-canvas-ink bg-canvas-card shadow-cardHover"
              : "border-canvas-border bg-canvas-card shadow-card hover:shadow-cardHover"
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width,
          height,
        }}
      >
        <Plug
          side="left"
          accentColour="#7C9EFF"
          visible={!godView}
          ariaLabel="Attach asset to question from left"
          onPointerDown={handleAssetPlugPointerDown("left")}
        />
        <Plug
          side="right"
          accentColour="#7C9EFF"
          visible={!godView}
          ariaLabel="Attach asset to question from right"
          onPointerDown={handleAssetPlugPointerDown("right")}
        />

        <CanvasSharpContent worldWidth={width} className="h-full w-full">
          {asset.kind === "image" ? (
            // No backdrop fill — transparent PNGs float directly on the canvas.
            <div className="h-full w-full overflow-hidden rounded-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.publicUrl}
                alt={asset.name}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div
              className="flex h-full w-full items-center rounded-canvas"
              style={{
                gap: canvasSpacing.compact,
                padding: canvasSpacing.compact,
                paddingLeft: canvasSpacing.section,
                paddingRight: canvasSpacing.section,
              }}
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-canvas bg-canvas-bg text-canvas-muted"
                style={{
                  width: CANVAS_ASSET_ICON_SIZE_PX,
                  height: CANVAS_ASSET_ICON_SIZE_PX,
                }}
              >
                <AssetKindIcon kind={asset.kind} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="line-clamp-2 block break-words text-canvas-body font-medium leading-snug text-canvas-ink"
                  style={{ maxWidth: CANVAS_ASSET_TITLE_MAX_WIDTH_PX }}
                >
                  {asset.name}
                </span>
                <span className="block text-canvas-caption uppercase tracking-wide text-canvas-muted">
                  {asset.kind}
                </span>
              </span>
            </div>
          )}
        </CanvasSharpContent>

        {!canvasReadOnly && (
          <button
            type="button"
            data-no-drag
            aria-label={`Remove ${asset.name} from canvas`}
            onClick={() => {
              recordUndo();
              removeCanvasAssetNode(node.id);
            }}
            className="absolute right-2 top-2 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-[12px] text-canvas-muted opacity-0 shadow-sm transition-opacity hover:text-canvas-ink group-hover/asset:opacity-100"
          >
            x
          </button>
        )}
        {!canvasReadOnly && (
          <NodeCornerResizeHandles
            ariaLabel="Resize asset"
            visibilityClass="opacity-0 group-hover/asset:opacity-100"
            onCornerPointerDown={handleResizePointerDown}
          />
        )}
      </div>
    </MotionCanvasNode>
  );
}
