"use client";

import { memo,
  PointerEvent as ReactPointerEvent,
  useRef,
} from "react";
import { ThreeDModelViewer } from "@/components/artifacts/ThreeDModelViewer";
import {
  cornerResizeSigns,
  NodeCornerResizeHandles,
  type NodeResizeCorner,
} from "@/components/canvas/NodeCornerResizeHandles";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import {
  getCanvas3DBounds,
  resize3DMaintainingAspect,
} from "@/lib/canvas3dBounds";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import { useCanvasSelectionUnitCount } from "@/hooks/useCanvasSelectionUnitCount";
import {
  commitGroupMoveForItem,
  groupRefsForItemDrag,
} from "@/lib/groupMembership";
import { useGestureProvisionalMount } from "@/hooks/useGestureProvisionalMount";
import { isGodViewMode } from "@/lib/zoomDisplay";
import { isCanvasItemSelected } from "@/lib/canvasSelection";
import {
  CANVAS_CONTENT_INERT_CLASS,
  CANVAS_NODE_INTERACTIVE_ATTR,
} from "@/lib/canvasNodeInteraction";
import {
  useCanvasStore,
  type Canvas3DNode as Canvas3DNodeType,
} from "@/lib/store";

const DRAG_THRESHOLD_PX = 0;
const INTERACTIVE = "button, a, [data-no-drag], [data-resize-handle], canvas";

function Canvas3DNodeInner({ node }: { node: Canvas3DNodeType }) {
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvas3DId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "3d", node.id),
  );
  const selectionUnitCount = useCanvasSelectionUnitCount();
  /** One member of a larger selection — the shared bounds box owns the grips. */
  const isSelectionMember = isSelected && selectionUnitCount > 1;
  const godView = useCanvasStore((s) => isGodViewMode(s.viewportSettledScale));
  const moveCanvas3D = useCanvasStore((s) => s.moveCanvas3D);
  const selectCanvas3D = useCanvasStore((s) => s.selectCanvas3D);
  const setCanvas3DSize = useCanvasStore((s) => s.setCanvas3DSize);
  const removeCanvas3DNode = useCanvasStore((s) => s.removeCanvas3DNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const { w: width, h: height } = getCanvas3DBounds(node);
  // Mounted mid-gesture: cheap stand-in now, hydrate after settle.
  const provisionalMount = useGestureProvisionalMount();
  const nodeRef = useRef<HTMLDivElement | null>(null);
  // Imperative drag via the shared gesture layer — one store commit on drop.
  const nodeDrag = useCanvasNodeDrag({
    kind: "3d",
    nodeId: node.id,
    commitMove: (targetId, dx, dy) => {
      if (!commitGroupMoveForItem("3d", targetId, dx, dy)) {
        moveCanvas3D(targetId, dx, dy);
      }
    },
    resolveRefs: (targetId) =>
      groupRefsForItemDrag("3d", targetId) ?? [{ kind: "3d", id: targetId }],
    makeCopy: (id) => useCanvasStore.getState().duplicateCanvas3DNode(id),
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

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE)) return;
    e.stopPropagation();
    e.preventDefault();
    const st = useCanvasStore.getState();
    const inMultiSelection =
      isCanvasItemSelected(st.canvasSelection, "3d", node.id) &&
      st.selectedFamilyRootIds.length + st.canvasSelection.length > 1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      st.toggleCanvasSelectionItem({ kind: "3d", id: node.id });
      return;
    }
    if (!inMultiSelection) selectCanvas3D(node.id);
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
      const next = resize3DMaintainingAspect(
        rs.startW + (sx * screenDx) / vpScale,
      );
      setCanvas3DSize(node.id, next);
      const targetX =
        sx === -1 ? rs.startPosX + (rs.startW - next.w) : rs.startPosX;
      const targetY =
        sy === -1 ? rs.startPosY + (rs.startH - next.h) : rs.startPosY;
      moveCanvas3D(
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
    selectCanvas3D(node.id);
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

  // Gesture-time stand-in: 3D nodes host WebGL viewers — the heaviest
  // possible mid-gesture mount. Hydrate after settle.
  if (provisionalMount && !isSelected) {
    return (
      <div
        ref={nodeRef}
        data-canvas-3d
        data-canvas-node-id={node.id}
        data-3d-lod="placeholder"
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
          {node.title}
        </div>
      </div>
    );
  }

  const borderClass = isSelected
    ? "ring-2 ring-canvas-accent"
    : "ring-1 ring-transparent hover:ring-canvas-border/60";

  return (
    <MotionCanvasNode
      targetId={node.id}
      targetKind="artifact"
      bounds={{ x: node.position.x, y: node.position.y, w: width, h: height }}
    >
      <div
        ref={nodeRef}
        data-canvas-3d
        data-canvas-node-id={node.id}
        {...(isSelected ? { [CANVAS_NODE_INTERACTIVE_ATTR]: "" } : {})}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`group/3d absolute overflow-hidden rounded-canvas transition-shadow ${borderClass}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width,
          height,
        }}
      >
        <div
          className={`h-full w-full ${!isSelected ? CANVAS_CONTENT_INERT_CLASS : ""}`}
        >
          <ThreeDModelViewer
            modelUrl={node.modelUrl}
            format={node.format}
            interactive={isSelected && !canvasReadOnly}
            // Stop the per-node rAF render loop when zoomed out far enough
            // that the rotation is sub-legible anyway.
            autoRotate={!isSelected && !godView}
            playAnimations
          />
        </div>

        {!canvasReadOnly && (
          <button
            type="button"
            data-no-drag
            aria-label={`Remove ${node.title} from canvas`}
            onClick={() => {
              recordUndo();
              removeCanvas3DNode(node.id);
            }}
            className={`absolute right-1 top-1 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-canvas-compact text-canvas-muted shadow-sm transition-opacity hover:text-canvas-ink ${
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/3d:opacity-100"
            }`}
          >
            x
          </button>
        )}
        {!canvasReadOnly && !isSelectionMember && (
          <NodeCornerResizeHandles
            ariaLabel="Resize 3D object"
            visibilityClass={
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/3d:opacity-100"
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
export const Canvas3DNode = memo(
  Canvas3DNodeInner,
  (prev, next) => prev.node === next.node,
);
