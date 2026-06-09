"use client";

import { PointerEvent as ReactPointerEvent, useRef } from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import { Plug } from "@/components/plugs/Plug";
import { SkillBrainIcon } from "@/components/skills/SkillBrainIcon";
import { getCanvasSkillBounds } from "@/lib/canvasSkillBounds";
import { plugAnchorAt } from "@/lib/plugConnector";
import {
  useCanvasStore,
  type CanvasSkillNode as CanvasSkillNodeType,
} from "@/lib/store";
import { isGodViewMode } from "@/lib/zoomDisplay";

const DRAG_THRESHOLD_PX = 4;
const INTERACTIVE =
  "button, a, [data-no-drag], [data-plug], [data-resize-handle]";

export function CanvasSkillNode({ node }: { node: CanvasSkillNodeType }) {
  const skills = useCanvasStore((s) => s.canvasSkills);
  const scale = useCanvasStore((s) => s.viewportSettledScale);
  const selectedCanvasSkillId = useCanvasStore((s) => s.selectedCanvasSkillId);
  const moveCanvasSkill = useCanvasStore((s) => s.moveCanvasSkill);
  const selectCanvasSkill = useCanvasStore((s) => s.selectCanvasSkill);
  const removeCanvasSkillNode = useCanvasStore((s) => s.removeCanvasSkillNode);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  const skill = skills[node.skillId];
  const { w: width, h: height } = getCanvasSkillBounds(node, skill);
  const isSelected = selectedCanvasSkillId === node.id;
  const godView = isGodViewMode(scale);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    didMove: boolean;
    recordedUndo: boolean;
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
    selectCanvasSkill(node.id);
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
    moveCanvasSkill(node.id, screenDx / vpScale, screenDy / vpScale);
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`group/skill absolute rounded-[20px] border bg-canvas-card shadow-card transition-shadow ${
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
          accentColour="#111111"
          visible={!godView}
          ariaLabel="Attach skill to question from left"
          onPointerDown={handleSkillPlugPointerDown("left")}
        />
        <Plug
          side="right"
          accentColour="#111111"
          visible={!godView}
          ariaLabel="Attach skill to question from right"
          onPointerDown={handleSkillPlugPointerDown("right")}
        />

        <CanvasSharpContent worldWidth={width} className="h-full w-full">
          <div className="relative flex h-full w-full flex-col items-center justify-center px-3 pb-3 pt-5">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-canvas-ink px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-canvas-card">
              Skill
            </span>
            <SkillBrainIcon className="h-11 w-11 shrink-0 text-canvas-ink" />
            <span className="mt-2 line-clamp-2 text-center text-[13px] font-medium leading-tight text-canvas-ink">
              {skill.title}
            </span>
          </div>
        </CanvasSharpContent>

        {!canvasReadOnly && (
          <button
            type="button"
            data-no-drag
            aria-label={`Remove ${skill.title} from canvas`}
            onClick={() => {
              recordUndo();
              removeCanvasSkillNode(node.id);
            }}
            className="absolute right-2 top-2 z-40 rounded-full bg-canvas-card/90 px-1.5 py-0.5 text-[12px] text-canvas-muted opacity-0 shadow-sm transition-opacity hover:text-canvas-ink group-hover/skill:opacity-100"
          >
            x
          </button>
        )}
      </div>
    </MotionCanvasNode>
  );
}
