"use client";

import { memo, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { Plug } from "@/components/plugs/Plug";
import { SkillNodeCard } from "@/components/skills/SkillNodeCard";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
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
import { useGestureProvisionalMount } from "@/hooks/useGestureProvisionalMount";
import { isGodViewMode } from "@/lib/zoomDisplay";

const INTERACTIVE =
  "button, a, [data-no-drag], [data-plug], [data-resize-handle]";

/** Guards against firing the analysis request twice if two node instances of the same skill mount in the same tick. */
const inFlightAnalysis = new Set<string>();

function CanvasSkillNodeInner({ node }: { node: CanvasSkillNodeType }) {
  const skills = useCanvasStore((s) => s.canvasSkills);
  // Crossing-only subscription: re-renders when the god-view boolean flips,
  // not on every settled-scale change (the post-zoom "settle storm").
  const godView = useCanvasStore((s) => isGodViewMode(s.viewportSettledScale));
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
  // Mounted mid-gesture: cheap stand-in now, hydrate after settle.
  const provisionalMount = useGestureProvisionalMount();
  const [collapsed, setCollapsed] = useState(false);
  const expandedBounds = getCanvasSkillBounds(node, skill);
  const { w: width, h: height } = collapsed
    ? { w: CANVAS_SKILL_SIZE, h: CANVAS_SKILL_SIZE }
    : expandedBounds;
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
  // Imperative drag via the shared gesture layer — one store commit on drop.
  const nodeDrag = useCanvasNodeDrag({
    kind: "skill",
    nodeId: node.id,
    commitMove: (targetId, dx, dy) => moveCanvasSkill(targetId, dx, dy),
    makeCopy: (id) => useCanvasStore.getState().duplicateCanvasSkillNode(id),
    onDragStart: (targetId) => clearSpawnMetaIfDragging(targetId),
    recordUndo,
  });

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
    nodeDrag.start(e, {
      moveSelection: inMultiSelection && !e.altKey,
      copyOnDrag: e.altKey,
    });
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    nodeDrag.move(e);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    nodeDrag.end(e);
  };

  // Gesture-time stand-in: mounted mid-gesture, hydrate after settle.
  if (provisionalMount && !isSelected) {
    return (
      <div
        ref={nodeRef}
        data-canvas-skill
        data-canvas-node-id={node.id}
        data-skill-lod="placeholder"
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
          {skill.title}
        </div>
      </div>
    );
  }

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
            ? "border-canvas-accent ring-2 ring-canvas-accent/25 shadow-artifactHover"
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
            className={`absolute left-2 top-2 z-40 rounded-full border border-canvas-border/40 bg-canvas-card/95 px-2 py-0.5 text-canvas-micro font-medium text-canvas-muted transition-opacity hover:text-canvas-ink ${
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

/**
 * Memoized: re-renders only when its own props are replaced; store data
 * comes from narrow selectors inside (matches Card's memo contract).
 */
export const CanvasSkillNode = memo(
  CanvasSkillNodeInner,
  (prev, next) => prev.node === next.node,
);
