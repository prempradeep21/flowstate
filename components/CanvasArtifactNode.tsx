"use client";

import {
  memo,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArtifactPermissionPrompt } from "@/components/artifacts/ArtifactPermissionPrompt";
import { ArtifactRemoteUpdateGlow } from "@/components/artifacts/ArtifactRemoteUpdateGlow";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import { useArtifactStyle } from "@/components/ArtifactStyleScope";
import {
  FROST_EDITABLE_KINDS,
  FROST_MASTHEAD_ZOOM,
  FROST_MIN_WIDTH,
  FrostArtifactNode,
} from "@/components/frost/FrostArtifactNode";
import {
  FrostGenerating,
  frostPlaceholderStyle,
} from "@/components/frost/FrostGenerating";
import { GeneratingArtifactContent } from "@/components/artifacts/GeneratingArtifactContent";
import { generatingArtifactHeadline } from "@/lib/artifactWorkingTitle";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { holdBento } from "@/lib/groupBento";
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
  clampArtifactSizeForKind,
  clampTableArtifactSize,
  getArtifactBounds,
  getBaseArtifactBounds,
  getArtifactClampOpts,
  getDefaultArtifactSize,
} from "@/lib/canvasNodeBounds";
import {
  MASTHEAD_ARTIFACT_KINDS,
  MASTHEAD_ARTIFACT_SCALE,
} from "@/lib/transcriptArtifacts";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import { computeTableIntrinsicSize } from "@/lib/tableColumnWidths";
import { clampStickyNoteArtifactSize } from "@/lib/stickyNoteArtifact";
import { CANVAS_ACCENT, connectorColour } from "@/lib/design/tokens";
import { artifactCategoryOf } from "@/lib/design/theme/artifactCategories";
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
  ARTIFACT_NODE_POINTER_EXEMPT,
} from "@/lib/artifactCanvasChrome";
import {
  findRemoteArtifactUpdatingCardId,
} from "@/lib/artifactRemoteUpdate";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import { useCanvasSelectionUnitCount } from "@/hooks/useCanvasSelectionUnitCount";
import {
  commitGroupMoveForItem,
  groupRefsForItemDrag,
} from "@/lib/groupMembership";
import { canvasSidePlugPointerClass } from "@/lib/canvasPlugChrome";
import { useGestureProvisionalMount } from "@/hooks/useGestureProvisionalMount";
import { isGodViewMode } from "@/lib/zoomDisplay";
import { useRaisedZIndex } from "@/hooks/useRaisedZIndex";

const DRAG_THRESHOLD_PX = 0;

const TEXT_SELECTABLE = ARTIFACT_NODE_POINTER_EXEMPT;

interface CanvasArtifactNodeProps {
  node: CanvasArtifactNodeType;
}

function CanvasArtifactNodeInner({ node }: CanvasArtifactNodeProps) {
  const raisedZIndex = useRaisedZIndex(node.id);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const threads = useCanvasStore((s) => s.threads);
  // Crossing-only subscription: re-renders when the god-view boolean flips,
  // not on every settled-scale change (the post-zoom "settle storm").
  const godView = useCanvasStore((s) => isGodViewMode(s.viewportSettledScale));
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasArtifactId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "artifact", node.id),
  );
  const selectionUnitCount = useCanvasSelectionUnitCount();
  /** One member of a larger selection — the shared bounds box owns the grips. */
  const isSelectionMember = isSelected && selectionUnitCount > 1;
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
  // Frost (a pack with a body family) draws every node through Style D.
  const frost = useArtifactStyle().pack.bodyFamily === "frost";
  const [frostHovered, setFrostHovered] = useState(false);
  const [frostEditing, setFrostEditing] = useState(false);
  // Edit ends with the selection — unless a todo still has unsaved changes.
  if (frostEditing && !isSelected && !todoEditing) setFrostEditing(false);
  const [pointerSessionActive, setPointerSessionActive] = useState(false);

  const chromeReveal = useArtifactSpawnChromeReveal(node.id);

  // Imperative drag: DOM transform per frame via the gesture layer, single
  // moveCanvasArtifact commit on drop. Alt-drag duplicates on first move and
  // drags the copy, exactly as before.
  const nodeDrag = useCanvasNodeDrag({
    kind: "artifact",
    nodeId: node.id,
    commitMove: (targetId, dx, dy) => {
      if (!commitGroupMoveForItem("artifact", targetId, dx, dy)) {
        moveCanvasArtifact(targetId, dx, dy);
      }
    },
    resolveRefs: (targetId) =>
      groupRefsForItemDrag("artifact", targetId) ?? [
        { kind: "artifact", id: targetId },
      ],
    makeCopy: (id) =>
      useCanvasStore.getState().duplicateCanvasArtifactNode(id),
    onDragStart: (targetId) => clearSpawnMetaIfDragging(targetId),
    onDrop: () => setPointerSessionActive(false),
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
  const releaseBentoRef = useRef<(() => void) | null>(null);
  useEffect(() => () => releaseBentoRef.current?.(), []);

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
  // Masthead artifacts are drawn blown up under Frost too (FROST_MASTHEAD_ZOOM):
  // the card lays out at width ÷ zoom and reports its size in those units.
  const frostZoom =
    frost && art && (MASTHEAD_ARTIFACT_KINDS.has(art.kind) || node.mastheadScale)
      ? FROST_MASTHEAD_ZOOM
      : 1;
  const frostZoomRef = useRef(frostZoom);
  frostZoomRef.current = frostZoom;
  // Mounted mid-gesture (culling reveal during pan/zoom): render a cheap
  // stand-in now, hydrate the full artifact a few nodes per frame.
  const provisionalMount = useGestureProvisionalMount(nodeRef);

  /** Font-scale / content growth wraps the node; never override a manual resize. */
  const handleArtifactContentAreaSize = useCallback(
    (contentArea: { w: number; h: number }) => {
      if (resizeStateRef.current) return;

      const st = useCanvasStore.getState();
      const current = st.canvasArtifactNodes[node.id];
      if (!current || current.userSetSize || current.layoutSetSize) return;
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
      const clampOpts = getArtifactClampOpts(artForBounds?.kind);

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

      // "Default state" floor: the stored node size — the last auto-measure
      // (user resizes are guarded by userSetSize above) — is authoritative.
      // Content that is still settling (web fonts, images, iframes loading
      // after a reveal) measures SMALLER than its final layout; without the
      // floor the node visibly shrank and re-grew on every reveal (shudder +
      // geometry churn). Auto-measure may only GROW the node beyond the
      // stored/spawn size.
      const targetW = Math.max(
        areaW + CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX,
        defaultSize?.w ?? 0,
        current.size?.w ?? 0,
      );
      const targetH = Math.max(
        areaH + ARTIFACT_CANVAS_CHROME_HEIGHT_PX,
        defaultSize?.h ?? 0,
        current.size?.h ?? 0,
      );
      const next =
        artForBounds?.kind === "stickynote"
          ? clampStickyNoteArtifactSize(targetW, targetH)
          : artForBounds?.kind === "table"
            ? clampTableArtifactSize(targetW, targetH)
            : clampArtifactSize(targetW, targetH, clampOpts);
      // Compare with what is stored, not what is drawn: content sizing may
      // draw a node smaller than its stored box (see getArtifactBounds), and
      // measuring against that would rewrite the same stored size forever.
      const stored = current.size ?? bounds;
      if (
        Math.abs(next.w - stored.w) > 1 ||
        Math.abs(next.h - stored.h) > 1
      ) {
        st.setCanvasArtifactSize(node.id, next);
      }
    },
    [node.id],
  );
  /**
   * Frost cards always show everything they hold (docs/design-system/
   * artifacts-frost.md §5): the node's height follows the card's own height,
   * growing or shrinking, whoever sized it. Width stays the node's own, never
   * narrower than the kind's Frost minimum (FROST_MIN_WIDTH).
   */
  // The least width the Frost card can take without cropping its content
  // (a table's narrowest layout); corner drags stop there.
  const frostMinWidthRef = useRef(0);
  const handleFrostHugHeight = useCallback(
    (
      rawH: number,
      rawMinW: number,
      rawNatural: number,
      rawW: number,
    ) => {
      // The card measures in its own (unzoomed) units; the node is in world.
      const z = frostZoomRef.current;
      const h = rawH * z;
      const contentMinW = rawMinW * z;
      const natural = rawNatural * z;
      const measuredW = rawW * z;
      frostMinWidthRef.current = contentMinW;
      const st = useCanvasStore.getState();
      const current = st.canvasArtifactNodes[node.id];
      if (!current) return;
      const artForBounds = current.artifactId
        ? st.sessionArtifacts[current.artifactId]
        : undefined;
      // Width: the node's own (a resize under Frost moves frostSize.w with
      // it), never under the kind's Frost minimum. Height: the card's own.
      const base = getBaseArtifactBounds(current, artForBounds);
      const minW = Math.max(
        (artForBounds && FROST_MIN_WIDTH[artForBounds.kind]) ?? 0,
        contentMinW,
      );
      // Never narrower than the box the node was given (a table's content
      // width is measured in vanilla type, which Frost sets larger).
      const nextW = Math.max(
        current.frostSize?.w ?? Math.max(base.w, current.size?.w ?? 0),
        minW,
      );
      const nextH = Math.round(h);
      // Mid-resize from a top grip, the bottom edge stays put: the card's
      // real height (content may need more than the pointer gives it) sets
      // where the top edge lands.
      const rs = resizeStateRef.current;
      if (rs && cornerResizeSigns(rs.corner).sy === -1) {
        const targetY = rs.startPosY + rs.startH - nextH;
        if (Math.abs(targetY - current.position.y) > 0.5) {
          st.moveCanvasArtifact(node.id, 0, targetY - current.position.y);
        }
      }
      const prev = current.frostSize;
      const measure = {
        w: Math.round(measuredW),
        h: Math.round(natural),
        minW: contentMinW,
      };
      const pm = current.frostMeasure;
      const sameMeasure =
        pm &&
        Math.abs(pm.w - measure.w) < 1 &&
        Math.abs(pm.h - measure.h) < 1 &&
        Math.abs(pm.minW - measure.minW) < 1;
      if (
        prev &&
        Math.abs(nextH - prev.h) <= 1 &&
        nextW === prev.w &&
        sameMeasure
      ) {
        return;
      }
      st.setCanvasArtifactFrostSize(node.id, { w: nextW, h: nextH }, measure);
    },
    [node.id],
  );

  // Only the cards this node reads — a whole-map subscription re-rendered
  // every mounted artifact on each card write (cards re-measure on every
  // zoom settle), and with idle warm-up most artifacts stay mounted.
  const sourceThreadId = useCanvasStore(
    (s) => s.cards[node.sourceCardId]?.threadId,
  );
  // The whole card only while a skeleton needs it (it re-renders on every
  // size write of that card).
  const generatingSourceCard = useCanvasStore((s) =>
    generatingPreview ? s.cards[node.sourceCardId] : undefined,
  );
  const remoteUpdatingThreadId = useCanvasStore((s) =>
    remoteUpdatingCardId != null
      ? s.cards[remoteUpdatingCardId]?.threadId
      : undefined,
  );
  const plugAccent = connectorColour(
    sourceThreadId !== undefined
      ? threads[sourceThreadId]?.accentColour
      : undefined,
    CANVAS_ACCENT,
  );
  const remoteUpdateAccent =
    (remoteUpdatingThreadId !== undefined
      ? threads[remoteUpdatingThreadId]?.accentColour
      : undefined) ?? plugAccent;
  // Breathing update glow follows the artifact's category colour, not the
  // source thread accent, so it reads as "this artifact is rebuilding".
  const remoteUpdateGlowColour = art
    ? `rgb(var(--artifact-cat-${artifactCategoryOf(art.kind)}-fg))`
    : remoteUpdateAccent;

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
      const clamped = clampArtifactSizeForKind(
        art?.kind,
        rs.startW + (sx * screenDx) / vpScale,
        rs.startH + (sy * screenDy) / vpScale,
      );
      // Frost never crops: the width stops where the content would overflow.
      const next = frost
        ? { ...clamped, w: Math.max(clamped.w, frostMinWidthRef.current) }
        : clamped;
      setCanvasArtifactSize(node.id, next, { userSet: true });
      // Keep the corner opposite the grip anchored in place.
      const targetX =
        sx === -1 ? rs.startPosX + (rs.startW - next.w) : rs.startPosX;
      // Frost never crops: the card is at least as tall as its content, so a
      // top grip anchors the bottom edge against the height actually drawn
      // (the card's height report corrects this once it re-measures).
      const frostH = frost
        ? useCanvasStore.getState().canvasArtifactNodes[node.id]?.frostSize?.h
        : undefined;
      const drawnH = frostH != null ? Math.max(next.h, frostH) : next.h;
      const targetY =
        sy === -1 ? rs.startPosY + (rs.startH - drawnH) : rs.startPosY;
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
      releaseBentoRef.current?.();
      releaseBentoRef.current = null;
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
    // A chapter grid waits until the grip is let go (lib/groupBento).
    releaseBentoRef.current?.();
    releaseBentoRef.current = holdBento();
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

  if (!preview && !art && !generatingPreview) return null;

  // Gesture-time stand-in: bordered rect + title at exact node bounds (same
  // helpers the culling index uses, so geometry never shifts on hydrate).
  // Selection and permission previews are interaction targets — full DOM.
  if (provisionalMount && !isSelected && !preview && frost) {
    const lod = frostPlaceholderStyle(art);
    return (
      <div
        ref={nodeRef}
        data-canvas-artifact
        data-canvas-node-id={node.id}
        data-artifact-lod="placeholder"
        data-frost-lod
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute z-20 cursor-grab overflow-hidden active:cursor-grabbing"
        style={{
          zIndex: raisedZIndex,
          left: node.position.x,
          top: node.position.y,
          width,
          height: artifactHeight,
          ...lod.style,
        }}
      >
        <div className="frost-lod-title" style={{ color: lod.color, overflowWrap: "break-word" }}>
          {art?.title ?? (generatingPreview ? generatingArtifactHeadline(generatingPreview) : "")}
        </div>
      </div>
    );
  }

  if (provisionalMount && !isSelected && !preview) {
    return (
      <div
        ref={nodeRef}
        data-canvas-artifact
        data-canvas-node-id={node.id}
        data-artifact-lod="placeholder"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute z-20 cursor-grab overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card active:cursor-grabbing"
        style={{
          zIndex: raisedZIndex,
          left: node.position.x,
          top: node.position.y,
          width,
          height: artifactHeight,
        }}
      >
        <div className="truncate px-6 pt-4 text-[22px] font-medium text-canvas-ink/70">
          {art?.title ?? (generatingPreview ? generatingArtifactHeadline(generatingPreview) : "")}
        </div>
      </div>
    );
  }

  const isRepoArtifact = art?.kind === "repo";
  const isPermissionPreview = !!preview;
  // A skeleton wears the chrome of the kind it is becoming, so it doesn't
  // change shape when the real artifact replaces it.
  const chromeKind = art?.kind ?? generatingPreview?.kind;
  const usesContainerFill =
    !!chromeKind && artifactKindUsesCanvasContainerFill(chromeKind);
  const usesPaddingChrome =
    !!chromeKind && artifactKindUsesCanvasPaddingChrome(chromeKind);
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
      {...(isSelected ? { "data-selected": "" } : {})}
      {...(!usesContainerFill ? { "data-naked-artifact": "" } : {})}
      data-artifact-kind={art?.kind ?? preview?.kind ?? generatingPreview?.kind}
      data-artifact-category={artifactCategoryOf(
        (art?.kind ?? preview?.kind ?? generatingPreview?.kind ?? "custom") as Parameters<typeof artifactCategoryOf>[0],
      )}
      {...(pointerSessionActive ? { "data-canvas-dragging": "" } : {})}
      {...(frost ? { "data-frost-artifact": "" } : {})}
      {...(frost && frostEditing ? { "data-frost-editing": "" } : {})}
      onDoubleClick={
        frost && art && FROST_EDITABLE_KINDS.has(art.kind) && !canvasReadOnly && !frostEditing
          ? () => setFrostEditing(true)
          : undefined
      }
      onPointerEnter={frost ? () => setFrostHovered(true) : undefined}
      onPointerLeave={frost ? () => setFrostHovered(false) : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`canvas-artifact-node-shell group/artifact absolute overflow-visible ${
        isRepoArtifact ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isSelected ? "z-30" : "z-20"}`}
      style={{
        zIndex: raisedZIndex,
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

      {remoteUpdatingCardId && !isPermissionPreview && !generatingPreview ? (
        <ArtifactRemoteUpdateGlow accentColour={remoteUpdateGlowColour} />
      ) : null}

      {frost && !isPermissionPreview && (art || generatingPreview) ? (
        <CanvasSharpContent worldWidth={width} className="relative flex h-full flex-col">
          {generatingPreview ? (
            <FrostGenerating
              nodeId={node.id}
              kind={generatingPreview.kind}
              title={generatingPreview.title}
              sourceCard={generatingSourceCard}
              size={{ w: width, h: artifactHeight }}
            />
          ) : art ? (
            <div
              className="flex flex-col"
              style={
                frostZoom !== 1
                  ? { zoom: frostZoom, width: width / frostZoom }
                  : { display: "contents" }
              }
            >
            <FrostArtifactNode
              nodeId={node.id}
              art={art}
              versionId={node.versionId}
              size={scaleSize(getBaseArtifactBounds(node, art), 1 / frostZoom)}
              isSelected={isSelected}
              hovered={frostHovered && !pointerSessionActive}
              contentInteractive={contentInteractive}
              editing={frostEditing}
              onEditingChange={setFrostEditing}
              sourceCardId={node.sourceCardId}
              onVersionChange={(vid) => setCanvasArtifactVersion(node.id, vid)}
              onRemove={() => removeCanvasArtifact(node.id)}
              onTodoEditingChange={setTodoEditing}
              hug
              sized={Boolean(node.userSetSize || node.layoutSetSize)}
              minHeight={
                Math.max(
                  node.userSetSize ? (node.size?.h ?? 0) : 0,
                  node.frostRowH ?? 0,
                ) / frostZoom
              }
              onHugHeight={handleFrostHugHeight}
            />
            </div>
          ) : null}
        </CanvasSharpContent>
      ) : (
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
            nodeId={node.id}
            kind={generatingPreview.kind}
            title={generatingPreview.title}
            sourceCard={generatingSourceCard}
          />
        ) : art ? (
          <div
            className="flex min-h-0 w-full flex-1 flex-col"
            /*
             * The masthead pair is drawn at 2.5× — node box and everything in
             * it, header chrome included, so the blow-up is uniform. Zoom (not
             * transform) so layout inside still resolves against the node box.
             * Any other kind placed in a masthead opts in per node, and a
             * chapter layout scales individual tiles the same way.
             */
            style={
              MASTHEAD_ARTIFACT_KINDS.has(art.kind) || node.mastheadScale
                ? { zoom: MASTHEAD_ARTIFACT_SCALE }
                : node.contentZoom && node.contentZoom !== 1
                  ? { zoom: node.contentZoom }
                  : undefined
            }
          >
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
              // table/todo hold a fixed default box (user-resizable via the
              // corner grips) and scroll their content internally instead of
              // auto-growing the node to fit every row/item.
              art.kind !== "repo" &&
              art.kind !== "audio" &&
              art.kind !== "stickynote" &&
              art.kind !== "table" &&
              art.kind !== "todo"
                ? handleArtifactContentAreaSize
                : undefined
            }
          />
          </div>
        ) : null}
      </CanvasSharpContent>
      )}

      {!godView && !isPermissionPreview && !isSelectionMember && (
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

function scaleSize(size: { w: number; h: number }, k: number) {
  return k === 1 ? size : { w: size.w * k, h: size.h * k };
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
