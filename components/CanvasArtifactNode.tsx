"use client";

import {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { ArtifactPermissionPrompt } from "@/components/artifacts/ArtifactPermissionPrompt";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { Plug } from "@/components/plugs/Plug";
import { clampArtifactSize, getArtifactBounds, MAX_TIMELINE_ARTIFACT_WIDTH } from "@/lib/canvasNodeBounds";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasArtifactNode as CanvasArtifactNodeType,
} from "@/lib/store";
import { useArtifactSpawnChromeReveal } from "@/hooks/useArtifactSpawnChromeReveal";
import {
  ARTIFACT_CANVAS_CASING_DEFAULT,
  ARTIFACT_CANVAS_CASING_SELECTED,
  ARTIFACT_CANVAS_CHROME_OPACITY,
  ARTIFACT_CANVAS_CONTAINER_FILL,
  ARTIFACT_CANVAS_PADDING_CHROME,
} from "@/lib/artifactCanvasChrome";
import {
  ARTIFACT_CHROME_ZONE_ATTR,
  shouldShowArtifactChromeHover,
} from "@/lib/artifactChromeHover";
import { CANVAS_ACCENT } from "@/lib/design/tokens";
import { playSound } from "@/lib/sounds/engine";
import { isGodViewMode } from "@/lib/zoomDisplay";

const DRAG_THRESHOLD_PX = 4;

const TEXT_SELECTABLE =
  'textarea, button, input, select, a, [contenteditable="true"], [data-selectable-text], [data-no-drag], [data-plug], [data-resize-handle], [data-canvas-scroll], [data-table-col-resize], [role="menu"], [role="listbox"], [role="option"], .leaflet-container, .leaflet-control-container, .leaflet-popup, .leaflet-tooltip, .leaflet-marker-icon';

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
      className={`absolute bottom-0 right-0 z-[60] flex h-8 w-8 cursor-nwse-resize items-end justify-end rounded-br-canvas p-1 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30 ${ARTIFACT_CANVAS_CHROME_OPACITY}`}
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

function ArtifactChromeEdgeZones() {
  return (
    <>
      <div
        {...{ [ARTIFACT_CHROME_ZONE_ATTR]: "" }}
        className="pointer-events-auto absolute inset-x-0 top-0 z-50 h-3"
        aria-hidden
      />
      <div
        {...{ [ARTIFACT_CHROME_ZONE_ATTR]: "" }}
        className="pointer-events-auto absolute inset-x-0 bottom-0 z-50 h-3"
        aria-hidden
      />
      <div
        {...{ [ARTIFACT_CHROME_ZONE_ATTR]: "" }}
        className="pointer-events-auto absolute inset-y-0 left-0 z-50 w-3"
        aria-hidden
      />
      <div
        {...{ [ARTIFACT_CHROME_ZONE_ATTR]: "" }}
        className="pointer-events-auto absolute inset-y-0 right-0 z-50 w-3"
        aria-hidden
      />
    </>
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
  const approvePermissionPreview = useCanvasStore(
    (s) => s.approvePermissionPreview,
  );
  const declinePermissionPreview = useCanvasStore(
    (s) => s.declinePermissionPreview,
  );
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const setCanvasArtifactSize = useCanvasStore((s) => s.setCanvasArtifactSize);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [todoEditing, setTodoEditing] = useState(false);
  const [chromeHover, setChromeHover] = useState(false);

  const syncChromeHover = useCallback((target: EventTarget | null) => {
    setChromeHover(shouldShowArtifactChromeHover(target));
  }, []);
  const chromeReveal = useArtifactSpawnChromeReveal(node.id);

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

  const preview = node.permissionPreview;
  const art = node.artifactId
    ? sessionArtifacts[node.artifactId]
    : undefined;
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
    if (target.closest(TEXT_SELECTABLE)) return;

    e.stopPropagation();
    selectCanvasArtifact(node.id);
    e.preventDefault();
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
    syncChromeHover(e.target);

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
        art?.kind === "timeline"
          ? { maxW: MAX_TIMELINE_ARTIFACT_WIDTH }
          : undefined,
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

  if (!preview && !art) return null;

  const isTransparentCanvasChrome =
    art?.kind === "repo" || art?.kind === "table" || art?.kind === "todo";
  const isPermissionPreview = !!preview;

  return (
    <div
      ref={nodeRef}
      data-canvas-artifact
      {...(chromeReveal ? { "data-chrome-reveal": "" } : {})}
      {...(chromeHover ? { "data-chrome-hover": "" } : {})}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerEnter={(e) => syncChromeHover(e.target)}
      onPointerLeave={() => setChromeHover(false)}
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
        isExiting={node.isExiting}
        bounds={{
          x: node.position.x,
          y: node.position.y,
          w: width,
          h: artifactHeight,
        }}
      >
      {!godView && !isPermissionPreview && (
        <>
          <ArtifactChromeEdgeZones />
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-30 [&_button]:pointer-events-auto ${ARTIFACT_CANVAS_CHROME_OPACITY}`}
          >
            <Plug
              side="left"
              accentColour={plugAccent}
              visible
              ariaLabel="Pull artifact context into a question"
              onPointerDown={handleArtifactPlugPointerDown("left")}
            />
          </div>
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-30 [&_button]:pointer-events-auto ${ARTIFACT_CANVAS_CHROME_OPACITY}`}
          >
            <Plug
              side="right"
              accentColour={plugAccent}
              visible
              ariaLabel="Pull artifact context into a question"
              onPointerDown={handleArtifactPlugPointerDown("right")}
            />
          </div>
        </>
      )}

      <CanvasSharpContent
        worldWidth={width}
        className={
          isPermissionPreview
            ? `flex h-full flex-col overflow-hidden rounded-canvas border p-5 ${ARTIFACT_CANVAS_CONTAINER_FILL} ${ARTIFACT_CANVAS_PADDING_CHROME} ${
                isSelected
                  ? ARTIFACT_CANVAS_CASING_SELECTED
                  : ARTIFACT_CANVAS_CASING_DEFAULT
              }`
            : isTransparentCanvasChrome
              ? `flex h-full flex-col overflow-visible bg-transparent p-0 ${
                  todoEditing
                    ? "rounded-canvas border-2 border-dashed border-canvas-accent p-5"
                    : isSelected
                      ? `rounded-canvas ${ARTIFACT_CANVAS_CASING_SELECTED}`
                      : ""
                }`
              : `flex h-full flex-col overflow-hidden rounded-canvas ${ARTIFACT_CANVAS_CONTAINER_FILL} ${ARTIFACT_CANVAS_PADDING_CHROME} transition-shadow ${
                  isSelected
                    ? ARTIFACT_CANVAS_CASING_SELECTED
                    : ARTIFACT_CANVAS_CASING_DEFAULT
                }`
        }
      >
        {isPermissionPreview && preview ? (
          <ArtifactPermissionPrompt
            kind={preview.kind}
            title={preview.title}
            copy={preview.copy}
            busy={preview.status === "declining"}
            onApprove={() => approvePermissionPreview(node.id)}
            onDecline={() => declinePermissionPreview(node.id)}
          />
        ) : art ? (
          <ArtifactShell
            layout="canvas"
            sessionArtifact={art}
            versionId={node.versionId}
            sourceCardId={node.sourceCardId}
            onVersionChange={(vid) => setCanvasArtifactVersion(node.id, vid)}
            menuVariant="canvas"
            onExpand={() =>
              openSessionArtifact(node.artifactId, node.versionId)
            }
            onRemoveFromCanvas={() => removeCanvasArtifact(node.id)}
            onTodoEditingChange={setTodoEditing}
          />
        ) : null}
      </CanvasSharpContent>

      {!godView && !isPermissionPreview && (
        <ArtifactResizeHandle onPointerDown={handleResizePointerDown} />
      )}
      </MotionCanvasNode>
    </div>
  );
}
