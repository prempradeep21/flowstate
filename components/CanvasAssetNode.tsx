"use client";

import { memo,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { AssetContentPreview } from "@/components/canvas/AssetContentPreview";
import { CanvasAssetHeader } from "@/components/canvas/CanvasAssetHeader";
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
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import { useCanvasSelectionUnitCount } from "@/hooks/useCanvasSelectionUnitCount";
import {
  commitGroupMoveForItem,
  groupRefsForItemDrag,
} from "@/lib/groupMembership";
import { isCanvasItemSelected } from "@/lib/canvasSelection";
import {
  CANVAS_CONTENT_INERT_CLASS,
  CANVAS_NODE_INTERACTIVE_ATTR,
} from "@/lib/canvasNodeInteraction";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasAssetNode as CanvasAssetNodeType,
} from "@/lib/store";
import { useGestureProvisionalMount } from "@/hooks/useGestureProvisionalMount";
import { isGodViewMode } from "@/lib/zoomDisplay";
import { previewRequiresClickToInteract, resolvePreviewKind } from "@/lib/documentPreview";
import { canvasSidePlugWrapperClass } from "@/lib/canvasPlugChrome";

const DRAG_THRESHOLD_PX = 0;
const INTERACTIVE =
  "button, a, [data-no-drag], [data-plug], [data-resize-handle]";

function CanvasAssetNodeInner({ node }: { node: CanvasAssetNodeType }) {
  const assets = useCanvasStore((s) => s.canvasAssets);
  // Crossing-only subscription: re-renders when the god-view boolean flips,
  // not on every settled-scale change (the post-zoom "settle storm").
  const godView = useCanvasStore((s) => isGodViewMode(s.viewportSettledScale));
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasAssetId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "asset", node.id),
  );
  const selectionUnitCount = useCanvasSelectionUnitCount();
  /** One member of a larger selection — the shared bounds box owns the grips. */
  const isSelectionMember = isSelected && selectionUnitCount > 1;
  const moveCanvasAsset = useCanvasStore((s) => s.moveCanvasAsset);
  const selectCanvasAsset = useCanvasStore((s) => s.selectCanvasAsset);
  const setCanvasAssetSize = useCanvasStore((s) => s.setCanvasAssetSize);
  const removeCanvasAssetNode = useCanvasStore((s) => s.removeCanvasAssetNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const [contentInteractive, setContentInteractive] = useState(false);

  const asset = assets[node.assetId];
  // Mounted mid-gesture: cheap stand-in now, hydrate after settle.
  const provisionalMount = useGestureProvisionalMount();
  const { w: width, h: height } = getCanvasAssetBounds(node, asset);
  const previewKind = asset ? resolvePreviewKind(asset) : null;
  const needsClickToInteract = previewKind
    ? previewRequiresClickToInteract(previewKind)
    : false;

  useEffect(() => {
    if (!isSelected) setContentInteractive(false);
  }, [isSelected]);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  // Imperative drag via the shared gesture layer — one store commit on drop.
  const nodeDrag = useCanvasNodeDrag({
    kind: "asset",
    nodeId: node.id,
    commitMove: (targetId, dx, dy) => {
      if (!commitGroupMoveForItem("asset", targetId, dx, dy)) {
        moveCanvasAsset(targetId, dx, dy);
      }
    },
    resolveRefs: (targetId) =>
      groupRefsForItemDrag("asset", targetId) ?? [
        { kind: "asset", id: targetId },
      ],
    makeCopy: (id) => useCanvasStore.getState().duplicateCanvasAssetNode(id),
    onDragStart: (targetId) => clearSpawnMetaIfDragging(targetId),
    recordUndo,
  });
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
    nodeDrag.start(e, {
      moveSelection: inMultiSelection && !e.altKey,
      copyOnDrag: e.altKey,
    });
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

    nodeDrag.move(e);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (resizeStateRef.current?.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      resizeStateRef.current = null;
      return;
    }
    nodeDrag.end(e);
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

  // Gesture-time stand-in: mounted mid-gesture, hydrate after settle.
  if (provisionalMount && !isSelected) {
    return (
      <div
        ref={nodeRef}
        data-canvas-asset
        data-canvas-node-id={node.id}
        data-asset-lod="placeholder"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute cursor-grab overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card active:cursor-grabbing"
        style={{
          left: node.position.x,
          top: node.position.y,
          width,
          height,
        }}
      >
        <div className="truncate px-4 pt-3 text-canvas-body-sm font-medium text-canvas-ink/70">
          {asset.name}
        </div>
      </div>
    );
  }

  return (
    <MotionCanvasNode
      targetId={node.id}
      targetKind="artifact"
      bounds={{ x: node.position.x, y: node.position.y, w: width, h: height }}
    >
      <div
        ref={nodeRef}
        data-canvas-asset
        data-canvas-node-id={node.id}
        {...(isSelected ? { [CANVAS_NODE_INTERACTIVE_ATTR]: "" } : {})}
        {...(isSelected ? { "data-chrome-hover": "" } : {})}
        {...(isSelected ? { "data-selected": "" } : {})}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="group/asset group/artifact absolute"
        style={{
          left: node.position.x,
          top: node.position.y,
          width,
          height,
        }}
      >
        {!godView && (
          <>
            <div className={canvasSidePlugWrapperClass("left", "asset")}>
              <Plug
                side="left"
                accentColour="#7C9EFF"
                visible
                ariaLabel="Attach asset to question from left"
                onPointerDown={handleAssetPlugPointerDown("left")}
              />
            </div>
            <div className={canvasSidePlugWrapperClass("right", "asset")}>
              <Plug
                side="right"
                accentColour="#7C9EFF"
                visible
                ariaLabel="Attach asset to question from right"
                onPointerDown={handleAssetPlugPointerDown("right")}
              />
            </div>
          </>
        )}

        <CanvasSharpContent
          worldWidth={width}
          className={`h-full w-full ${!isSelected ? CANVAS_CONTENT_INERT_CLASS : ""}`}
        >
          {/* `.artifact-casing` opts this frame into the artifact style packs,
              so the stroke, radius, and shadow adapt to the active style
              (Neo / Brut / Liquid Glass) instead of staying constant. Vanilla
              falls back to the theme classes below. */}
          <div
            className={`artifact-casing flex h-full w-full flex-col overflow-hidden rounded-canvas border bg-canvas-card transition-shadow ${
              isSelected
                ? "border-canvas-accent ring-2 ring-canvas-accent/25 shadow-artifactHover"
                : "border-canvas-border/60 shadow-artifact hover:shadow-artifactHover"
            }`}
          >
            {/* Documents get a labelled header so they read as documents (and
                which kind) rather than images; images stay a bare preview. */}
            {previewKind && previewKind !== "image" ? (
              <CanvasAssetHeader asset={asset} previewKind={previewKind} />
            ) : null}
            <div className="min-h-0 flex-1">
              <AssetContentPreview
                asset={asset}
                layout="canvas"
                interactive={
                  needsClickToInteract
                    ? contentInteractive && isSelected
                    : isSelected
                }
                onActivate={
                  needsClickToInteract
                    ? () => setContentInteractive(true)
                    : undefined
                }
                noDrag={isSelected}
              />
            </div>
          </div>
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
            className={`absolute right-2 top-2 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-canvas-compact text-canvas-muted shadow-sm transition-opacity hover:text-canvas-ink ${
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/asset:opacity-100"
            }`}
          >
            x
          </button>
        )}
        {!canvasReadOnly && !isSelectionMember && (
          <NodeCornerResizeHandles
            ariaLabel="Resize asset"
            visibilityClass={
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/asset:opacity-100"
            }
            onCornerPointerDown={handleResizePointerDown}
          />
        )}
      </div>
    </MotionCanvasNode>
  );
}

/**
 * Memoized: re-renders only when its own props are replaced; store data
 * comes from narrow selectors inside (matches Card's memo contract).
 */
export const CanvasAssetNode = memo(
  CanvasAssetNodeInner,
  (prev, next) => prev.node === next.node,
);
