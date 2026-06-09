"use client";

import {
  PointerEvent as ReactPointerEvent,
  useRef,
} from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import {
  getCanvasGifBounds,
  resizeGifMaintainingAspect,
} from "@/lib/canvasGifBounds";
import {
  useCanvasStore,
  type CanvasGifNode as CanvasGifNodeType,
} from "@/lib/store";

const DRAG_THRESHOLD_PX = 4;
const INTERACTIVE = "button, a, [data-no-drag], [data-resize-handle]";

function GifResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      data-resize-handle
      aria-label="Resize GIF"
      onPointerDown={onPointerDown}
      className="absolute bottom-0 right-0 z-40 flex h-6 w-6 cursor-nwse-resize items-end justify-end rounded-br-canvas p-1 opacity-0 transition-opacity group-hover/gif:opacity-100 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="text-canvas-muted">
        <path d="M11 5v6H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 9V11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function CanvasGifNode({ node }: { node: CanvasGifNodeType }) {
  const selectedCanvasGifId = useCanvasStore((s) => s.selectedCanvasGifId);
  const moveCanvasGif = useCanvasStore((s) => s.moveCanvasGif);
  const selectCanvasGif = useCanvasStore((s) => s.selectCanvasGif);
  const setCanvasGifSize = useCanvasStore((s) => s.setCanvasGifSize);
  const removeCanvasGifNode = useCanvasStore((s) => s.removeCanvasGifNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const { w: width, h: height } = getCanvasGifBounds(node);
  const isSelected = selectedCanvasGifId === node.id;
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    didMove: boolean;
    recordedUndo: boolean;
  } | null>(null);
  const resizeStateRef = useRef<{
    pointerId: number;
    startX: number;
    startW: number;
    didMove: boolean;
    recordedUndo: boolean;
  } | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE)) return;
    e.stopPropagation();
    e.preventDefault();
    selectCanvasGif(node.id);
    if (canvasReadOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      didMove: false,
      recordedUndo: false,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resizeStateRef.current;
    if (rs && rs.pointerId === e.pointerId) {
      const screenDx = e.clientX - rs.startX;
      if (!rs.didMove && Math.abs(screenDx) < DRAG_THRESHOLD_PX) return;
      if (!rs.recordedUndo) {
        recordUndo();
        rs.recordedUndo = true;
      }
      rs.didMove = true;
      const vpScale = useCanvasStore.getState().viewport.scale;
      setCanvasGifSize(
        node.id,
        resizeGifMaintainingAspect(
          node.aspectRatio,
          rs.startW + screenDx / vpScale,
        ),
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
    ds.didMove = true;
    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    const vpScale = useCanvasStore.getState().viewport.scale;
    moveCanvasGif(node.id, screenDx / vpScale, screenDy / vpScale);
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

  const handleResizePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || canvasReadOnly) return;
    e.stopPropagation();
    e.preventDefault();
    selectCanvasGif(node.id);
    nodeRef.current?.setPointerCapture(e.pointerId);
    resizeStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startW: width,
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
        data-canvas-gif
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
        <CanvasSharpContent worldWidth={width} className="h-full w-full">
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
            className="absolute right-1 top-1 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-[12px] text-canvas-muted opacity-0 shadow-sm transition-opacity hover:text-canvas-ink group-hover/gif:opacity-100"
          >
            x
          </button>
        )}
        {!canvasReadOnly && (
          <GifResizeHandle onPointerDown={handleResizePointerDown} />
        )}
      </div>
    </MotionCanvasNode>
  );
}
