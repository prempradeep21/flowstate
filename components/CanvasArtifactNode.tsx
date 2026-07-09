"use client";

import {
  memo,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { ArtifactPermissionPrompt } from "@/components/artifacts/ArtifactPermissionPrompt";
import { ArtifactRemoteUpdateStroke } from "@/components/artifacts/ArtifactRemoteUpdateStroke";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import { GeneratingArtifactContent } from "@/components/artifacts/GeneratingArtifactContent";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import {
  cornerResizeSigns,
  NodeCornerResizeHandles,
  type NodeResizeCorner,
} from "@/components/canvas/NodeCornerResizeHandles";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { Plug } from "@/components/plugs/Plug";
import {
  CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX,
  clampArtifactSize,
  clampStreetViewArtifactSize,
  clampTableArtifactSize,
  getArtifactBounds,
  getDefaultArtifactSize,
  MAX_TIMELINE_ARTIFACT_WIDTH,
  MAX_AUDIO_ARTIFACT_WIDTH,
} from "@/lib/canvasNodeBounds";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import { computeTableIntrinsicSize } from "@/lib/tableColumnWidths";
import { clampStickyNoteArtifactSize } from "@/lib/stickyNoteArtifact";
import { CANVAS_ACCENT } from "@/lib/design/tokens";
import { REPO_DRAG_HANDLE_ATTR } from "@/lib/repoArtifactLayout";
import { isCanvasItemSelected } from "@/lib/canvasSelection";
import { CANVAS_NODE_INTERACTIVE_ATTR } from "@/lib/canvasNodeInteraction";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasArtifactNode as CanvasArtifactNodeType,
} from "@/lib/store";
import { useArtifactSpawnChromeReveal } from "@/hooks/useArtifactSpawnChromeReveal";
import {
  ARTIFACT_CANVAS_CASING_DEFAULT,
  ARTIFACT_CANVAS_CASING_SELECTED,
  ARTIFACT_CANVAS_CHROME_HEIGHT_PX,
  ARTIFACT_CANVAS_CHROME_OPACITY,
  ARTIFACT_CANVAS_CONTAINER_FILL,
  ARTIFACT_CANVAS_PADDING_CHROME,
  artifactKindUsesCanvasContainerFill,
  artifactKindUsesCanvasPaddingChrome,
} from "@/lib/artifactCanvasChrome";
import {
  findRemoteArtifactUpdatingCardId,
} from "@/lib/artifactRemoteUpdate";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import { canvasSidePlugPointerClass } from "@/lib/canvasPlugChrome";
import { playSound } from "@/lib/sounds/engine";
import { isGodViewMode } from "@/lib/zoomDisplay";

const DRAG_THRESHOLD_PX = 0;

const TEXT_SELECTABLE =
  'textarea, button, input, select, a, [contenteditable="true"], [data-selectable-text], [data-no-drag], [data-plug], [data-resize-handle], [data-canvas-scroll], [data-table-col-resize], [role="menu"], [role="listbox"], [role="option"], .leaflet-container, .leaflet-control-container, .leaflet-popup, .leaflet-tooltip, .leaflet-marker-icon';

interface CanvasArtifactNodeProps {
  node: CanvasArtifactNodeType;
}

function CanvasArtifactNodeInner({ node }: CanvasArtifactNodeProps) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const scale = useCanvasStore((s) => s.viewportSettledScale);
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasArtifactId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "artifact", node.id),
  );
  const moveCanvasArtifact = useCanvasStore((s) => s.moveCanvasArtifact);
  const selectCanvasArtifact = useCanvasStore((s) => s.selectCanvasArtifact);
  const setCanvasArtifactVersion = useCanvasStore(
    (s) => s.setCanvasArtifactVersion,
  );
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
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [todoEditing, setTodoEditing] = useState(false);
  const [pointerSessionActive, setPointerSessionActive] = useState(false);

  const chromeReveal = useArtifactSpawnChromeReveal(node.id);

  // Imperative drag: DOM transform per frame via the gesture layer, single
  // moveCanvasArtifact commit on drop. Alt-drag duplicates on first move and
  // drags the copy, exactly as before.
  const nodeDrag = useCanvasNodeDrag({
    kind: "artifact",
    nodeId: node.id,
    commitMove: (targetId, dx, dy) => moveCanvasArtifact(targetId, dx, dy),
    makeCopy: (id) =>
      useCanvasStore.getState().duplicateCanvasArtifactNode(id),
    onDragStart: (targetId) => clearSpawnMetaIfDragging(targetId),
    onDrop: (didMove) => {
      if (didMove) void playSound("artifact-drag-drop");
      setPointerSessionActive(false);
    },
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

  const preview = node.permissionPreview;
  const generatingPreview = node.generatingPreview;
  const remoteUpdatingCardId = useCanvasStore((s) => {
    if (!node.artifactId || preview || generatingPreview) return null;
    return findRemoteArtifactUpdatingCardId(node.artifactId, node.sourceCardId, {
      cards: s.cards,
      cardOrder: s.cardOrder,
      sessionArtifacts: s.sessionArtifacts,
      connections: s.connections,
      canvasArtifactNodes: s.canvasArtifactNodes,
      artifactPlugConnections: s.artifactPlugConnections,
      plugComposerAttachments: s.plugComposerAttachments,
    });
  });
  const art = node.artifactId
    ? sessionArtifacts[node.artifactId]
    : undefined;
  const { w: width, h: artifactHeight } = getArtifactBounds(node, art);
  const godView = isGodViewMode(scale);

  /** Font-scale / content growth wraps the node; never override a manual resize. */
  const handleArtifactContentAreaSize = useCallback(
    (contentArea: { w: number; h: number }) => {
      if (resizeStateRef.current) return;

      const st = useCanvasStore.getState();
      const current = st.canvasArtifactNodes[node.id];
      if (!current || current.userSetSize) return;
      const artForBounds = current.artifactId
        ? st.sessionArtifacts[current.artifactId]
        : undefined;
      const bounds = getArtifactBounds(current, artForBounds);
      const latestPayload = artForBounds?.versions.find(
        (v) => v.id === artForBounds.latestVersionId,
      )?.payload;
      const defaultSize = artForBounds
        ? getDefaultArtifactSize(artForBounds.kind, latestPayload)
        : null;
      const clampOpts =
        artForBounds?.kind === "timeline"
          ? { maxW: MAX_TIMELINE_ARTIFACT_WIDTH }
          : artForBounds?.kind === "audio"
            ? { maxW: MAX_AUDIO_ARTIFACT_WIDTH }
            : undefined;

      let areaW = contentArea.w;
      let areaH = contentArea.h;
      if (
        artForBounds?.kind === "table" &&
        latestPayload?.type === "table"
      ) {
        const { columns, rows } = normalizeTableArtifactData(latestPayload.data);
        const intrinsic = computeTableIntrinsicSize(columns, rows);
        const currentContentW =
          bounds.w - CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX;
        areaW = Math.max(areaW, intrinsic.widthPx, currentContentW);
        areaH = Math.max(areaH, intrinsic.heightPx);
      }

      // Fill-layout stages measure w-full / h-full children; never auto-shrink below spawn size.
      const targetW = Math.max(
        areaW + CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX,
        defaultSize?.w ?? 0,
      );
      const targetH = Math.max(
        areaH + ARTIFACT_CANVAS_CHROME_HEIGHT_PX,
        defaultSize?.h ?? 0,
      );
      const next =
        artForBounds?.kind === "streetview"
          ? clampStreetViewArtifactSize(targetW)
          : artForBounds?.kind === "stickynote"
            ? clampStickyNoteArtifactSize(targetW, targetH)
            : artForBounds?.kind === "table"
              ? clampTableArtifactSize(targetW, targetH)
              : clampArtifactSize(targetW, targetH, clampOpts);
      if (
        Math.abs(next.w - bounds.w) > 1 ||
        Math.abs(next.h - bounds.h) > 1
      ) {
        st.setCanvasArtifactSize(node.id, next);
      }
    },
    [node.id],
  );
  const sourceCard = cards[node.sourceCardId];
  const remoteUpdatingCard =
    remoteUpdatingCardId != null ? cards[remoteUpdatingCardId] : undefined;
  const plugAccent =
    (sourceCard && threads[sourceCard.threadId]?.accentColour) ?? CANVAS_ACCENT;
  const remoteUpdateAccent =
    (remoteUpdatingCard &&
      threads[remoteUpdatingCard.threadId]?.accentColour) ??
    plugAccent;

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
    const isRepoArtifact = art?.kind === "repo";

    if (isRepoArtifact) {
      if (!target.closest(`[${REPO_DRAG_HANDLE_ATTR}]`)) return;
      if (target.closest("button, a, [data-no-drag]")) return;
    } else if (target.closest(TEXT_SELECTABLE)) {
      return;
    }

    e.stopPropagation();
    const st = useCanvasStore.getState();
    const inMultiSelection =
      isCanvasItemSelected(st.canvasSelection, "artifact", node.id) &&
      st.selectedFamilyRootIds.length + st.canvasSelection.length > 1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      st.toggleCanvasSelectionItem({ kind: "artifact", id: node.id });
      return;
    }
    if (!inMultiSelection) selectCanvasArtifact(node.id);
    if (canvasReadOnly) return;
    e.preventDefault();
    setPointerSessionActive(true);
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
      const dist = Math.hypot(screenDx, screenDy);
      if (!rs.didMove && dist < DRAG_THRESHOLD_PX) return;

      if (!rs.recordedUndo) {
        recordUndo();
        rs.recordedUndo = true;
      }
      rs.didMove = true;

      const vpScale = useCanvasStore.getState().viewport.scale;
      const { sx, sy } = cornerResizeSigns(rs.corner);
      const next =
        art?.kind === "streetview"
          ? clampStreetViewArtifactSize(
              rs.startW + (sx * screenDx) / vpScale,
            )
          : art?.kind === "stickynote"
            ? clampStickyNoteArtifactSize(
                rs.startW + (sx * screenDx) / vpScale,
                rs.startH + (sy * screenDy) / vpScale,
              )
            : art?.kind === "table"
              ? clampTableArtifactSize(
                  rs.startW + (sx * screenDx) / vpScale,
                  rs.startH + (sy * screenDy) / vpScale,
                )
              : clampArtifactSize(
              rs.startW + (sx * screenDx) / vpScale,
              rs.startH + (sy * screenDy) / vpScale,
              art?.kind === "timeline"
                ? { maxW: MAX_TIMELINE_ARTIFACT_WIDTH }
                : art?.kind === "audio"
                  ? { maxW: MAX_AUDIO_ARTIFACT_WIDTH }
                  : undefined,
            );
      setCanvasArtifactSize(node.id, next, { userSet: true });
      // Keep the corner opposite the grip anchored in place.
      const targetX =
        sx === -1 ? rs.startPosX + (rs.startW - next.w) : rs.startPosX;
      const targetY =
        sy === -1 ? rs.startPosY + (rs.startH - next.h) : rs.startPosY;
      moveCanvasArtifact(
        node.id,
        targetX - node.position.x,
        targetY - node.position.y,
      );
      return;
    }

    nodeDrag.move(e);
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
      setPointerSessionActive(false);
      return;
    }

    nodeDrag.end(e);
  };

  const handleResizePointerDown = (
    corner: NodeResizeCorner,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectCanvasArtifact(node.id);
    const root = nodeRef.current;
    if (root) root.setPointerCapture(e.pointerId);
    setPointerSessionActive(true);
    resizeStateRef.current = {
      pointerId: e.pointerId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startW: width,
      startH: artifactHeight,
      startPosX: node.position.x,
      startPosY: node.position.y,
      didMove: false,
      recordedUndo: false,
    };
  };

  if (!preview && !art) return null;

  const isRepoArtifact = art?.kind === "repo";
  const isPermissionPreview = !!preview;
  const usesContainerFill =
    !!art && artifactKindUsesCanvasContainerFill(art.kind);
  const usesPaddingChrome =
    !!art && artifactKindUsesCanvasPaddingChrome(art.kind);
  const contentInteractive = isSelected || isPermissionPreview;
  /** Selection or permission suggestion keeps chrome, fill, plugs, and resize grips visible. */
  const chromeSelected = isSelected || isPermissionPreview;

  return (
    <div
      ref={nodeRef}
      data-canvas-artifact
      data-canvas-node-id={node.id}
      {...(contentInteractive ? { [CANVAS_NODE_INTERACTIVE_ATTR]: "" } : {})}
      {...(isPermissionPreview ? { "data-permission-preview": "" } : {})}
      {...(chromeReveal || isPermissionPreview ? { "data-chrome-reveal": "" } : {})}
      {...(chromeSelected ? { "data-chrome-hover": "" } : {})}
      {...(!usesContainerFill ? { "data-naked-artifact": "" } : {})}
      {...(pointerSessionActive ? { "data-canvas-dragging": "" } : {})}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`canvas-artifact-node-shell group/artifact absolute overflow-visible ${
        isRepoArtifact ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isSelected ? "z-30" : "z-20"}`}
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
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-30 ${ARTIFACT_CANVAS_CHROME_OPACITY} ${canvasSidePlugPointerClass("artifact")}`}
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
            className={`pointer-events-none absolute inset-y-0 right-0 z-30 ${ARTIFACT_CANVAS_CHROME_OPACITY} ${canvasSidePlugPointerClass("artifact")}`}
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
            ? `relative flex h-full flex-col overflow-hidden rounded-canvas border ${ARTIFACT_CANVAS_CONTAINER_FILL} ${ARTIFACT_CANVAS_PADDING_CHROME} ${
                isSelected
                  ? ARTIFACT_CANVAS_CASING_SELECTED
                  : ARTIFACT_CANVAS_CASING_DEFAULT
              }`
            : `relative flex h-full flex-col rounded-canvas transition-shadow ${
                usesContainerFill ? ARTIFACT_CANVAS_CONTAINER_FILL : ""
              } ${usesPaddingChrome ? ARTIFACT_CANVAS_PADDING_CHROME : ""} ${
                  isRepoArtifact ? "overflow-visible" : "overflow-hidden"
                } ${
                  todoEditing
                    ? "border-2 border-dashed border-canvas-accent"
                    : isSelected
                      ? ARTIFACT_CANVAS_CASING_SELECTED
                      : ARTIFACT_CANVAS_CASING_DEFAULT
                }`
        }
      >
        {remoteUpdatingCardId && !isPermissionPreview && !generatingPreview ? (
          <ArtifactRemoteUpdateStroke accentColour={remoteUpdateAccent} />
        ) : null}
        {isPermissionPreview && preview ? (
          <ArtifactPermissionPrompt
            kind={preview.kind}
            title={preview.title}
            copy={preview.copy}
            busy={preview.status === "declining"}
            onApprove={() => approvePermissionPreview(node.id)}
            onDecline={() => declinePermissionPreview(node.id)}
          />
        ) : generatingPreview ? (
          <GeneratingArtifactContent
            kind={generatingPreview.kind}
            title={generatingPreview.title}
            sourceCard={sourceCard}
          />
        ) : art ? (
          <ArtifactShell
            layout="canvas"
            sessionArtifact={art}
            versionId={node.versionId}
            sourceCardId={node.sourceCardId}
            contentInteractive={contentInteractive}
            onVersionChange={(vid) => setCanvasArtifactVersion(node.id, vid)}
            menuVariant="canvas"
            onRemoveFromCanvas={() => removeCanvasArtifact(node.id)}
            onTodoEditingChange={setTodoEditing}
            onArtifactContentAreaSizeChange={
              art.kind !== "repo" &&
              art.kind !== "audio" &&
              art.kind !== "stickynote"
                ? handleArtifactContentAreaSize
                : undefined
            }
          />
        ) : null}
      </CanvasSharpContent>

      {!godView && !isPermissionPreview && (
        <NodeCornerResizeHandles
          ariaLabel="Resize artifact"
          zClass="z-[60]"
          visibilityClass={ARTIFACT_CANVAS_CHROME_OPACITY}
          onCornerPointerDown={handleResizePointerDown}
        />
      )}
      </MotionCanvasNode>
    </div>
  );
}

/**
 * Memoized: re-renders only when its node object is replaced (position/size
 * commit). Everything else it needs comes from narrow store selectors inside,
 * matching Card's memo contract — without this, every store write re-rendered
 * every artifact node on the canvas.
 */
export const CanvasArtifactNode = memo(
  CanvasArtifactNodeInner,
  (prev, next) => prev.node === next.node,
);
