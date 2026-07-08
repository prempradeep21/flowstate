"use client";

import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { Plug } from "@/components/plugs/Plug";
import { SkillNodeCard } from "@/components/skills/SkillNodeCard";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { isCanvasItemSelected } from "@/lib/canvasSelection";
import {
  CANVAS_CONTENT_INERT_CLASS,
  CANVAS_NODE_INTERACTIVE_ATTR,
} from "@/lib/canvasNodeInteraction";
import {
  CANVAS_SKILL_CARD_MIN_HEIGHT,
  CANVAS_SKILL_CARD_WIDTH,
  CANVAS_SKILL_SIZE,
  getCanvasSkillBounds,
} from "@/lib/canvasSkillBounds";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasSkillNode as CanvasSkillNodeType,
} from "@/lib/store";
import { canvasSidePlugWrapperClass } from "@/lib/canvasPlugChrome";
import { isGodViewMode } from "@/lib/zoomDisplay";

const DRAG_THRESHOLD_PX = 0;
const INTERACTIVE =
  "button, a, [data-no-drag], [data-plug], [data-resize-handle]";

/** Guards against firing the analysis request twice if two node instances of the same skill mount in the same tick. */
const inFlightAnalysis = new Set<string>();

export function CanvasSkillNode({ node }: { node: CanvasSkillNodeType }) {
  const skills = useCanvasStore((s) => s.canvasSkills);
  const scale = useCanvasStore((s) => s.viewportSettledScale);
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasSkillId === node.id ||
      isCanvasItemSelected(s.canvasSelection, "skill", node.id),
  );
  const moveCanvasSkill = useCanvasStore((s) => s.moveCanvasSkill);
  const setCanvasSkillNodeSize = useCanvasStore((s) => s.setCanvasSkillNodeSize);
  const setCanvasSkillMetadataStatus = useCanvasStore((s) => s.setCanvasSkillMetadataStatus);
  const setCanvasSkillAiMetadata = useCanvasStore((s) => s.setCanvasSkillAiMetadata);
  const selectCanvasSkill = useCanvasStore((s) => s.selectCanvasSkill);
  const removeCanvasSkillNode = useCanvasStore((s) => s.removeCanvasSkillNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const skill = skills[node.skillId];
  const [collapsed, setCollapsed] = useState(false);
  const expandedBounds = getCanvasSkillBounds(node, skill);
  const { w: width, h: height } = collapsed
    ? { w: CANVAS_SKILL_SIZE, h: CANVAS_SKILL_SIZE }
    : expandedBounds;
  const godView = isGodViewMode(scale);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // First time this skill appears on any canvas node, read the full file with an LLM.
  useEffect(() => {
    const skillId = node.skillId;
    const current = skills[skillId];
    if (!current) return;
    if (current.metadataStatus && current.metadataStatus !== "pending") return;
    if (inFlightAnalysis.has(skillId)) return;
    inFlightAnalysis.add(skillId);
    setCanvasSkillMetadataStatus(skillId, "analyzing");

    const params = new URLSearchParams({
      url: current.publicUrl,
      fileName: current.fileName,
    });
    fetch(`/api/skills/analyze?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("analyze failed"))))
      .then((data: { metadata: NonNullable<typeof current.metadata> }) => {
        setCanvasSkillAiMetadata(skillId, data.metadata);
      })
      .catch(() => {
        setCanvasSkillMetadataStatus(skillId, "unavailable");
      })
      .finally(() => {
        inFlightAnalysis.delete(skillId);
      });
    // Only ever run once per skill — deliberately not re-running on metadata/status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.skillId]);

  // Rich cards grow to fit content (fixed width, auto height); plain icon tiles stay fixed-size.
  useEffect(() => {
    if (!skill?.metadata || collapsed) return;
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const measuredHeight = Math.ceil(entry.contentRect.height);
      const nextHeight = Math.max(measuredHeight, CANVAS_SKILL_CARD_MIN_HEIGHT);
      const current = useCanvasStore.getState().canvasSkillNodes[node.id];
      if (current?.size && Math.abs(current.size.h - nextHeight) <= 1) return;
      setCanvasSkillNodeSize(node.id, { w: CANVAS_SKILL_CARD_WIDTH, h: nextHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [skill?.metadata, collapsed, node.id, setCanvasSkillNodeSize]);
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    didMove: boolean;
    recordedUndo: boolean;
    /** Alt held at drag start — first move duplicates and drags the copy. */
    copyOnDrag: boolean;
    /** Node actually being dragged (the duplicate when alt-dragging). */
    targetId: string;
    /** Whole multi-selection moves together when this node is part of it. */
    moveSelection: boolean;
  } | null>(null);

  if (!skill) return null;

  const skillPlugWorld = (side: "left" | "right") => {
    const anchor = plugAnchorAt(
      node.position.x,
      node.position.y,
      width,
      height,
      side,
    );
    return { x: anchor.px, y: anchor.py };
  };

  const handleSkillPlugPointerDown =
    (side: "left" | "right") => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      startPlugDrag({
        kind: "skill",
        skillNodeId: node.id,
        skillId: node.skillId,
        fromSide: side,
        pointerWorld: skillPlugWorld(side),
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
      isCanvasItemSelected(st.canvasSelection, "skill", node.id) &&
      st.selectedFamilyRootIds.length + st.canvasSelection.length > 1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      st.toggleCanvasSelectionItem({ kind: "skill", id: node.id });
      return;
    }
    if (!inMultiSelection) selectCanvasSkill(node.id);
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
      const copyId = useCanvasStore.getState().duplicateCanvasSkillNode(node.id);
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
      moveCanvasSkill(ds.targetId, screenDx / vpScale, screenDy / vpScale);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragStateRef.current = null;
  };

  return (
    <MotionCanvasNode
      targetId={node.id}
      targetKind="artifact"
      bounds={{ x: node.position.x, y: node.position.y, w: width, h: height }}
    >
      <div
        ref={nodeRef}
        data-canvas-skill
        data-canvas-node-id={node.id}
        {...(isSelected ? { [CANVAS_NODE_INTERACTIVE_ATTR]: "" } : {})}
        {...(isSelected ? { "data-chrome-hover": "" } : {})}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`group/skill absolute rounded-[20px] border bg-canvas-card shadow-artifact transition-shadow ${
          isSelected
            ? "border-canvas-ink shadow-artifactHover"
            : "border-canvas-border hover:shadow-artifactHover"
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width,
          height,
        }}
      >
        {!godView && (
          <>
            <div className={canvasSidePlugWrapperClass("left", "skill")}>
              <Plug
                side="left"
                accentColour="#111111"
                visible
                ariaLabel="Attach skill to question from left"
                onPointerDown={handleSkillPlugPointerDown("left")}
              />
            </div>
            <div className={canvasSidePlugWrapperClass("right", "skill")}>
              <Plug
                side="right"
                accentColour="#111111"
                visible
                ariaLabel="Attach skill to question from right"
                onPointerDown={handleSkillPlugPointerDown("right")}
              />
            </div>
          </>
        )}

        <CanvasSharpContent
          worldWidth={width}
          className={`h-full w-full ${!isSelected ? CANVAS_CONTENT_INERT_CLASS : ""}`}
        >
          <div
            ref={contentRef}
            className={!collapsed && skill.metadata ? "w-full" : "h-full w-full"}
          >
            <SkillNodeCard skill={skill} collapsed={collapsed} />
          </div>
        </CanvasSharpContent>

        {skill.metadata && (
          <button
            type="button"
            data-no-drag
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand skill card" : "Collapse skill card"}
            onClick={() => setCollapsed((prev) => !prev)}
            className={`absolute left-2 top-2 z-40 rounded-full border border-canvas-border/40 bg-canvas-card/80 px-2 py-0.5 text-canvas-micro font-medium text-canvas-muted backdrop-blur-[2px] transition-opacity hover:text-canvas-ink ${
              collapsed ? "opacity-100" : "opacity-0 group-hover/skill:opacity-100"
            }`}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        )}

        {!canvasReadOnly && (
          <button
            type="button"
            data-no-drag
            aria-label={`Remove ${skill.title} from canvas`}
            onClick={() => {
              recordUndo();
              removeCanvasSkillNode(node.id);
            }}
            className={`absolute right-2 top-2 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-canvas-compact text-canvas-muted shadow-sm transition-opacity hover:text-canvas-ink ${
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/skill:opacity-100"
            }`}
          >
            x
          </button>
        )}
      </div>
    </MotionCanvasNode>
  );
}
