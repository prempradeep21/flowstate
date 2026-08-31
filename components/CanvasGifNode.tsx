"use client";

import { memo,
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
import {
  getCanvasGifBounds,
  resizeGifMaintainingAspect,
} from "@/lib/canvasGifBounds";
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
import {
  useCanvasStore,
  type CanvasGifNode as CanvasGifNodeType,
} from "@/lib/store";

const DRAG_THRESHOLD_PX = 0;
const INTERACTIVE = "button, a, [data-no-drag], [data-resize-handle]";

function CanvasGifNodeInner({ node }: { node: CanvasGifNodeType }) {
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasGifId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "gif", node.id),
  );
  const selectionUnitCount = useCanvasSelectionUnitCount();
  /** One member of a larger selection — the shared bounds box owns the grips. */
  const isSelectionMember = isSelected && selectionUnitCount > 1;
  const moveCanvasGif = useCanvasStore((s) => s.moveCanvasGif);
  const selectCanvasGif = useCanvasStore((s) => s.selectCanvasGif);
  const setCanvasGifSize = useCanvasStore((s) => s.setCanvasGifSize);
  const removeCanvasGifNode = useCanvasStore((s) => s.removeCanvasGifNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const { w: width, h: height } = getCanvasGifBounds(node);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  // Imperative drag via the shared gesture layer — one store commit on drop.
  const nodeDrag = useCanvasNodeDrag({
    kind: "gif",
    nodeId: node.id,
    commitMove: (targetId, dx, dy) => {
      if (!commitGroupMoveForItem("gif", targetId, dx, dy)) {
        moveCanvasGif(targetId, dx, dy);
      }
    },
    resolveRefs: (targetId) =>
      groupRefsForItemDrag("gif", targetId) ?? [{ kind: "gif", id: targetId }],
    makeCopy: (id) => useCanvasStore.getState().duplicateCanvasGifNode(id),
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
      isCanvasItemSelected(st.canvasSelection, "gif", node.id) &&
      st.selectedFamilyRootIds.length + st.canvasSelection.length > 1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      st.toggleCanvasSelectionItem({ kind: "gif", id: node.id });
      return;
    }
    if (!inMultiSelection) selectCanvasGif(node.id);
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
      const next = resizeGifMaintainingAspect(
        node.aspectRatio,
        rs.startW + (sx * screenDx) / vpScale,
      );
      setCanvasGifSize(node.id, next);
      // Keep the corner opposite the grip anchored in place.
      const targetX =
        sx === -1 ? rs.startPosX + (rs.startW - next.w) : rs.startPosX;
      const targetY =
        sy === -1 ? rs.startPosY + (rs.startH - next.h) : rs.startPosY;
      moveCanvasGif(
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
    selectCanvasGif(node.id);
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
        data-canvas-gif
        data-canvas-node-id={node.id}
        {...(isSelected ? { [CANVAS_NODE_INTERACTIVE_ATTR]: "" } : {})}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`group/gif absolute rounded-canvas transition-shadow ${borderClass}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width,
          height,
        }}
      >
        <CanvasSharpContent
          worldWidth={width}
          className={`h-full w-full ${!isSelected ? CANVAS_CONTENT_INERT_CLASS : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.url}
            alt={node.title}
            draggable={false}
            className="h-full w-full object-contain"
          />
        </CanvasSharpContent>

        {!canvasReadOnly && (
          <button
            type="button"
            data-no-drag
            aria-label={`Remove ${node.title} from canvas`}
            onClick={() => {
              recordUndo();
              removeCanvasGifNode(node.id);
            }}
            className={`absolute right-1 top-1 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-canvas-compact text-canvas-muted shadow-sm transition-opacity hover:text-canvas-ink ${
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/gif:opacity-100"
            }`}
          >
            x
          </button>
        )}
        {!canvasReadOnly && !isSelectionMember && (
          <NodeCornerResizeHandles
            ariaLabel="Resize GIF"
            visibilityClass={
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/gif:opacity-100"
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
export const CanvasGifNode = memo(
  CanvasGifNodeInner,
  (prev, next) => prev.node === next.node,
);
