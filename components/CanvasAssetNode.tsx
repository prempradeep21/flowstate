"use client";

import {
  PointerEvent as ReactPointerEvent,
  useRef,
} from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { Plug } from "@/components/plugs/Plug";
import {
  getCanvasAssetBounds,
  resizeAssetMaintainingAspect,
} from "@/lib/canvasAssetBounds";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasAssetNode as CanvasAssetNodeType,
} from "@/lib/store";
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

function AssetResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      data-resize-handle
      aria-label="Resize asset"
      onPointerDown={onPointerDown}
      className="absolute bottom-0 right-0 z-40 flex h-6 w-6 cursor-nwse-resize items-end justify-end rounded-br-canvas p-1 opacity-0 transition-opacity group-hover/asset:opacity-100 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="text-canvas-muted">
        <path d="M11 5v6H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 9V11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function CanvasAssetNode({ node }: { node: CanvasAssetNodeType }) {
  const assets = useCanvasStore((s) => s.canvasAssets);
  const scale = useCanvasStore((s) => s.viewportSettledScale);
  const selectedCanvasAssetId = useCanvasStore((s) => s.selectedCanvasAssetId);
  const moveCanvasAsset = useCanvasStore((s) => s.moveCanvasAsset);
  const selectCanvasAsset = useCanvasStore((s) => s.selectCanvasAsset);
  const setCanvasAssetSize = useCanvasStore((s) => s.setCanvasAssetSize);
  const removeCanvasAssetNode = useCanvasStore((s) => s.removeCanvasAssetNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const asset = assets[node.assetId];
  const { w: width, h: height } = getCanvasAssetBounds(node, asset);
  const isSelected = selectedCanvasAssetId === node.id;
  const godView = isGodViewMode(scale);
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
    selectCanvasAsset(node.id);
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
      setCanvasAssetSize(
        node.id,
        resizeAssetMaintainingAspect(asset, rs.startW + screenDx / vpScale),
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
    moveCanvasAsset(node.id, screenDx / vpScale, screenDy / vpScale);
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
    selectCanvasAsset(node.id);
    nodeRef.current?.setPointerCapture(e.pointerId);
    resizeStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startW: width,
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
        className={`group/asset absolute rounded-canvas border bg-canvas-card shadow-card transition-shadow ${
          isSelected
            ? "border-canvas-ink shadow-cardHover"
            : "border-canvas-border hover:shadow-cardHover"
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
            <div className="h-full w-full overflow-hidden rounded-canvas bg-canvas-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.publicUrl}
                alt={asset.name}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center gap-3 rounded-canvas px-4 py-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-canvas bg-canvas-bg text-canvas-muted">
                <AssetKindIcon kind={asset.kind} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-canvas-ink">
                  {asset.name}
                </span>
                <span className="block text-[11px] uppercase tracking-wide text-canvas-muted">
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
        {!canvasReadOnly && <AssetResizeHandle onPointerDown={handleResizePointerDown} />}
      </div>
    </MotionCanvasNode>
  );
}
