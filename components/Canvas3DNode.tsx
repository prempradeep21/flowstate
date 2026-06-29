"use client";

import {
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

export function Canvas3DNode({ node }: { node: Canvas3DNodeType }) {
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvas3DId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "3d", node.id),
  );
  const moveCanvas3D = useCanvasStore((s) => s.moveCanvas3D);
  const selectCanvas3D = useCanvasStore((s) => s.selectCanvas3D);
  const setCanvas3DSize = useCanvasStore((s) => s.setCanvas3DSize);
  const removeCanvas3DNode = useCanvasStore((s) => s.removeCanvas3DNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const { w: width, h: height } = getCanvas3DBounds(node);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    didMove: boolean;
    recordedUndo: boolean;
    copyOnDrag: boolean;
    targetId: string;
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
      const copyId = useCanvasStore.getState().duplicateCanvas3DNode(node.id);
      if (copyId) ds.targetId = copyId;
    }
    if (!ds.didMove) clearSpawnMetaIfDragging(ds.targetId);
    ds.didMove = true;
    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    const st = useCanvasStore.getState();
    const vpScale = st.viewport.scale;
    if (ds.moveSelection) {
      st.moveSelectedCanvasItems(screenDx / vpScale, screenDy / vpScale);
    } else {
      moveCanvas3D(ds.targetId, screenDx / vpScale, screenDy / vpScale);
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

  const borderClass = isSelected
    ? "ring-2 ring-canvas-ink/40"
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
            autoRotate={!isSelected}
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
            className={`absolute right-1 top-1 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-[12px] text-canvas-muted shadow-sm transition-opacity hover:text-canvas-ink ${
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/3d:opacity-100"
            }`}
          >
            x
          </button>
        )}
        {!canvasReadOnly && (
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
