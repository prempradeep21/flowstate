"use client";

import {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useRef,
  useState,
} from "react";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { CANVAS_TRANSLUCENT_FILL_CLASS } from "@/components/QaQuestionSection";
import { Plug } from "@/components/plugs/Plug";
import { clampArtifactSize, getArtifactBounds } from "@/lib/canvasNodeBounds";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasArtifactNode as CanvasArtifactNodeType,
} from "@/lib/store";
import { CANVAS_ACCENT } from "@/lib/design/tokens";
import { playSound } from "@/lib/sounds/engine";
import { isGodViewMode } from "@/lib/zoomDisplay";

const DRAG_THRESHOLD_PX = 4;

const INTERACTIVE =
  "button, textarea, input, select, a, [role='menu'], [role='listbox'], [role='option'], [data-no-drag], [data-plug], [data-resize-handle], [data-canvas-scroll], [data-table-col-resize], .leaflet-container, .leaflet-control-container, .leaflet-popup, .leaflet-tooltip, .leaflet-marker-icon";

interface CanvasArtifactNodeProps {
  node: CanvasArtifactNodeType;
}

function ArtifactResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      data-resize-handle
      aria-label="Resize artifact"
      onPointerDown={onPointerDown}
      className="absolute bottom-0 right-0 z-40 flex h-6 w-6 cursor-nwse-resize items-end justify-end rounded-br-canvas p-1 opacity-0 transition-opacity group-hover/artifact:opacity-100 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
        className="text-canvas-muted"
      >
        <path
          d="M11 5v6H5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M11 9V11H9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export function CanvasArtifactNode({ node }: CanvasArtifactNodeProps) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const scale = useCanvasStore((s) => s.viewportSettledScale);
  const selectedCanvasArtifactId = useCanvasStore(
    (s) => s.selectedCanvasArtifactId,
  );
  const moveCanvasArtifact = useCanvasStore((s) => s.moveCanvasArtifact);
  const selectCanvasArtifact = useCanvasStore((s) => s.selectCanvasArtifact);
  const setCanvasArtifactVersion = useCanvasStore(
    (s) => s.setCanvasArtifactVersion,
  );
  const openSessionArtifact = useCanvasStore((s) => s.openSessionArtifact);
  const removeCanvasArtifact = useCanvasStore((s) => s.removeCanvasArtifact);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const setCanvasArtifactSize = useCanvasStore((s) => s.setCanvasArtifactSize);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [todoEditing, setTodoEditing] = useState(false);

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
    startY: number;
    startW: number;
    startH: number;
    didMove: boolean;
    recordedUndo: boolean;
  } | null>(null);

  const art = sessionArtifacts[node.artifactId];
  const isSelected = selectedCanvasArtifactId === node.id;
  const { w: width, h: artifactHeight } = getArtifactBounds(node, art);
  const godView = isGodViewMode(scale);
  const sourceCard = cards[node.sourceCardId];
  const plugAccent =
    (sourceCard && threads[sourceCard.threadId]?.accentColour) ?? CANVAS_ACCENT;

  const artifactPlugWorld = (side: "left" | "right") => {
    const anchor = plugAnchorAt(
      node.position.x,
      node.position.y,
      width,
      artifactHeight,
      side,
    );
    return { x: anchor.px, y: anchor.py };
  };

  const handleArtifactPlugPointerDown =
    (side: "left" | "right") => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      startPlugDrag({
        kind: "artifact",
        artifactNodeId: node.id,
        artifactId: node.artifactId,
        versionId: node.versionId,
        fromSide: side,
        pointerWorld: artifactPlugWorld(side),
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
    selectCanvasArtifact(node.id);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
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
      const screenDy = e.clientY - rs.startY;
      const dist = Math.hypot(screenDx, screenDy);
      if (!rs.didMove && dist < DRAG_THRESHOLD_PX) return;

      if (!rs.recordedUndo) {
        recordUndo();
        rs.recordedUndo = true;
      }
      rs.didMove = true;

      const vpScale = useCanvasStore.getState().viewport.scale;
      const next = clampArtifactSize(
        rs.startW + screenDx / vpScale,
        rs.startH + screenDy / vpScale,
      );
      setCanvasArtifactSize(node.id, next);
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
    moveCanvasArtifact(node.id, screenDx / vpScale, screenDy / vpScale);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resizeStateRef.current;
    if (rs && rs.pointerId === e.pointerId) {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      resizeStateRef.current = null;
      return;
    }

    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    if (ds.didMove) {
      void playSound("artifact-drag-drop");
    }
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragStateRef.current = null;
  };

  const handleResizePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectCanvasArtifact(node.id);
    const root = nodeRef.current;
    if (root) root.setPointerCapture(e.pointerId);
    resizeStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startW: width,
      startH: artifactHeight,
      didMove: false,
      recordedUndo: false,
    };
  };

  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  if (!art) return null;

  const isRepoArtifact = art.kind === "repo";

  return (
    <div
      ref={nodeRef}
      data-canvas-artifact
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className={`group/artifact absolute cursor-grab overflow-visible active:cursor-grabbing ${
        isSelected ? "z-30" : "z-20"
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width,
        height: artifactHeight,
      }}
    >
      <MotionCanvasNode
        targetId={node.id}
        targetKind="artifact"
        bounds={{
          x: node.position.x,
          y: node.position.y,
          w: width,
          h: artifactHeight,
        }}
      >
      {!godView && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-30 opacity-0 transition-opacity group-hover/artifact:opacity-100 [&_button]:pointer-events-auto">
            <Plug
              side="left"
              accentColour={plugAccent}
              visible
              ariaLabel="Pull artifact context into a question"
              onPointerDown={handleArtifactPlugPointerDown("left")}
            />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 opacity-0 transition-opacity group-hover/artifact:opacity-100 [&_button]:pointer-events-auto">
            <Plug
              side="right"
              accentColour={plugAccent}
              visible
              ariaLabel="Pull artifact context into a question"
              onPointerDown={handleArtifactPlugPointerDown("right")}
            />
          </div>
          <ArtifactResizeHandle onPointerDown={handleResizePointerDown} />
        </>
      )}

      <CanvasSharpContent
        worldWidth={width}
        className={
          isRepoArtifact
            ? `flex h-full flex-col overflow-visible bg-transparent p-0 ${
                isSelected ? "ring-2 ring-canvas-ink/20 rounded-canvas" : ""
              }`
            : `flex h-full flex-col overflow-hidden rounded-canvas border ${CANVAS_TRANSLUCENT_FILL_CLASS} p-5 shadow-card transition-shadow hover:shadow-cardHover ${
                todoEditing
                  ? "border-2 border-dashed border-canvas-accent"
                  : isSelected
                    ? "border-canvas-ink ring-2 ring-canvas-ink/25"
                    : "border-canvas-border"
              }`
        }
      >
        <ArtifactShell
          layout="canvas"
          sessionArtifact={art}
          versionId={node.versionId}
          onVersionChange={(vid) => setCanvasArtifactVersion(node.id, vid)}
          menuVariant="canvas"
          onExpand={() =>
            openSessionArtifact(node.artifactId, node.versionId)
          }
          onRemoveFromCanvas={() => removeCanvasArtifact(node.id)}
          onTodoEditingChange={setTodoEditing}
        />
      </CanvasSharpContent>
      </MotionCanvasNode>
    </div>
  );
}
