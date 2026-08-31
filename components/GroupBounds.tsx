"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useGroupBounds } from "@/lib/useGroupBounds";
import { groupGestureRefs } from "@/lib/groupMembership";
import { plugAnchorAt } from "@/lib/plugConnector";
import { Plug } from "@/components/plugs/Plug";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import type { BranchGroup, PlugSide } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";

interface GroupBoundsProps {
  group: BranchGroup;
}

const SCREEN_STROKE = 1.5;
const CORNER_RADIUS = 10;

/** Counter-scale chrome (label, badge) so it stays screen-constant under zoom. */
const CHROME_COUNTER_SCALE = "scale(calc(1 / min(var(--vp-scale, 1), 1)))";

/**
 * Figma-section-style group container: translucent fill behind the members,
 * name label above the top-left corner, accent border + size badge when
 * active, and side plugs to pull the whole group into a chat as context.
 *
 * The container itself is pointer-events-none so marquee/pan still work in
 * the empty space inside a group — only the label and plugs are interactive.
 * Dragging the label moves every member as one unit (locked positions).
 */
function GroupBoundsInner({ group }: GroupBoundsProps) {
  const bounds = useGroupBounds(group);
  // Stroke feeds rect GEOMETRY (x/y/w/h insets), so it can't move to CSS
  // vars — but clamping the selector at 1 makes it a constant while zoomed
  // in, so settles at scale ≥ 1 never re-render group frames.
  const scale = useCanvasStore((s) => Math.min(1, s.viewportSettledScale));
  const isActive = useCanvasStore((s) => s.activeGroupId === group.id);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const setActiveGroupId = useCanvasStore((s) => s.setActiveGroupId);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const renameGroup = useCanvasStore((s) => s.renameGroup);
  const moveGroupBy = useCanvasStore((s) => s.moveGroupBy);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);

  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(group.label);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  // Label drag moves the whole group; refs resolve at drag start so members
  // added after mount are included. The commit always goes through
  // moveGroupBy.
  const nodeDrag = useCanvasNodeDrag({
    kind: "group",
    nodeId: group.id,
    resolveRefs: () =>
      groupGestureRefs(useCanvasStore.getState(), group),
    commitMove: (_id, dx, dy) => moveGroupBy(group.id, dx, dy),
  });

  if (!bounds) return null;

  const stroke = compensatedStrokeWidth(SCREEN_STROKE, scale, SCREEN_STROKE);
  const inset = stroke / 2;

  const handleLabelPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || editing) return;
    e.stopPropagation();
    e.preventDefault();
    // Activating the group clears any node selection (section semantics).
    clearSelection();
    setActiveGroupId(group.id);
    if (!canvasReadOnly) nodeDrag.start(e, { moveSelection: false });
  };

  const commitRename = () => {
    setEditing(false);
    renameGroup(group.id, draftLabel);
  };

  const handleGroupPlugPointerDown =
    (side: PlugSide) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      const anchor = plugAnchorAt(
        bounds.x,
        bounds.y,
        bounds.w,
        bounds.h,
        side,
      );
      startPlugDrag({
        kind: "group",
        groupId: group.id,
        fromSide: side,
        pointerWorld: { x: anchor.px, y: anchor.py },
        didDrag: false,
        receiveTargetCardId: null,
        hoveredReceiveSide: null,
      });
    };

  return (
    <div
      className="pointer-events-none absolute"
      data-group-bounds={group.id}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
      }}
    >
      <svg
        className="absolute left-0 top-0 overflow-visible"
        width={bounds.w}
        height={bounds.h}
        aria-hidden
      >
        <rect
          x={inset}
          y={inset}
          width={Math.max(0, bounds.w - stroke)}
          height={Math.max(0, bounds.h - stroke)}
          rx={CORNER_RADIUS}
          ry={CORNER_RADIUS}
          fill="rgb(var(--canvas-card) / 0.3)"
          stroke={
            isActive
              ? "rgb(var(--canvas-accent))"
              : "rgb(var(--canvas-ink) / 0.16)"
          }
          strokeWidth={isActive ? stroke * 1.5 : stroke}
        />
      </svg>

      {/* Name label above the top-left corner (Figma section header). */}
      <div
        className="pointer-events-auto absolute bottom-full left-0 mb-1.5 origin-bottom-left cursor-grab select-none active:cursor-grabbing"
        style={{ transform: CHROME_COUNTER_SCALE }}
        onPointerDown={handleLabelPointerDown}
        onPointerMove={(e) => nodeDrag.move(e)}
        onPointerUp={(e) => nodeDrag.end(e)}
        onPointerCancel={(e) => nodeDrag.end(e)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (canvasReadOnly) return;
          setDraftLabel(group.label);
          setEditing(true);
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setEditing(false);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded-canvas-sm border border-canvas-accent bg-canvas-card px-2 py-0.5 text-canvas-caption font-medium text-canvas-ink outline-none"
            aria-label="Group name"
          />
        ) : (
          <span
            className={`inline-block rounded-canvas-sm border px-2 py-0.5 text-canvas-caption font-medium shadow-sm ${
              isActive
                ? "border-canvas-accent bg-canvas-card text-canvas-accent"
                : "border-canvas-border bg-canvas-card/90 text-canvas-muted"
            }`}
          >
            {group.label}
          </span>
        )}
      </div>

      {/* Side plugs — pull the whole group into a chat as joint context. */}
      {isActive && !canvasReadOnly && (
        <>
          <div className="pointer-events-auto absolute inset-y-0 left-0">
            <Plug
              side="left"
              accentColour="rgb(var(--canvas-accent))"
              visible
              ariaLabel="Pull this group into a question as context"
              onPointerDown={handleGroupPlugPointerDown("left")}
            />
          </div>
          <div className="pointer-events-auto absolute inset-y-0 right-0">
            <Plug
              side="right"
              accentColour="rgb(var(--canvas-accent))"
              visible
              ariaLabel="Pull this group into a question as context"
              onPointerDown={handleGroupPlugPointerDown("right")}
            />
          </div>
        </>
      )}

      {/* Size badge below the box while active (Figma selected-section chrome). */}
      {isActive && (
        <div
          className="pointer-events-none absolute left-1/2 top-full mt-1.5 origin-top"
          style={{ transform: `translateX(-50%) ${CHROME_COUNTER_SCALE}` }}
        >
          <span className="rounded-canvas-sm bg-canvas-accent px-2 py-0.5 text-canvas-caption font-medium text-canvas-onAccent shadow-sm">
            {Math.round(bounds.w)} × {Math.round(bounds.h)}
          </span>
        </div>
      )}
    </div>
  );
}

/** Memoized like the node components — bounds derive from store selectors. */
export const GroupBounds = memo(
  GroupBoundsInner,
  (prev, next) => prev.group === next.group,
);
