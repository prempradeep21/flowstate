"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  GROUP_BOUNDS_PADDING,
  GROUP_HEADING_FONT_SIZE,
  GROUP_HEADING_LINE_HEIGHT,
} from "@/lib/groupBounds";
import { useGroupBounds } from "@/lib/useGroupBounds";
import { groupGestureRefs } from "@/lib/groupMembership";
import { plugAnchorAt } from "@/lib/plugConnector";
import { Plug } from "@/components/plugs/Plug";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import type { BranchGroup, PlugSide } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

interface GroupBoundsProps {
  group: BranchGroup;
}

/**
 * Frame stroke in WORLD px: it scales with the canvas like every node, and
 * nothing about it changes on zoom — a zoom-compensated stroke restyled every
 * frame after each zoom settled. Active state is colour only, same width.
 */
const FRAME_STROKE_PX = 2;
/** Divider hairline between the group's cards and artifacts, world px. */
const DIVIDER_STROKE_PX = 1.5;
/** Concentric with the nodes it frames: their lg corner + the frame padding. */
const CORNER_RADIUS = `calc(var(--canvas-radius-lg) + ${GROUP_BOUNDS_PADDING}px)`;

// Label drag moves the whole group; refs resolve at drag start so members
// added after mount are included. When this group is part of a multi-group
// selection, the drag carries every selected group; otherwise just this one.
// The chapters are fixed when the drag starts and the drop commits exactly
// those: re-reading the selection on drop meant a selection change mid-drag
// (a click elsewhere, the drag area unmounting) moved fewer chapters than
// the pointer had carried, and the rest snapped back.
function useGroupDrag(group: BranchGroup, onDrop?: (didMove: boolean) => void) {
  const moveGroupsBy = useCanvasStore((s) => s.moveGroupsBy);
  const carriedIdsRef = useRef<string[] | null>(null);
  const draggedGroupIds = (): string[] => {
    const st = useCanvasStore.getState();
    return st.selectedGroupIds.includes(group.id)
      ? st.selectedGroupIds.filter((id) => st.groups[id])
      : [group.id];
  };
  return useCanvasNodeDrag({
    kind: "group",
    nodeId: group.id,
    resolveRefs: () => {
      const st = useCanvasStore.getState();
      const ids = draggedGroupIds();
      carriedIdsRef.current = ids;
      return ids.flatMap((id) => groupGestureRefs(st, st.groups[id] ?? group));
    },
    // One store write for the whole selection: per-chapter writes each
    // re-ran bento, culling, persistence and every subscriber.
    commitMove: (_id, dx, dy) => {
      const ids = carriedIdsRef.current ?? draggedGroupIds();
      carriedIdsRef.current = null;
      moveGroupsBy(ids, dx, dy);
    },
    onDrop: (didMove) => {
      carriedIdsRef.current = null;
      onDrop?.(didMove);
    },
  });
}

/**
 * While a chapter is selected, its whole frame is a drag handle: this layer
 * sits above the chapter's cards, so a press anywhere inside moves the
 * selected chapters together instead of picking up one card or starting a
 * new selection box. A click without a drag deselects, handing the cards
 * back.
 */
function GroupSelectionDragAreaInner({ group }: GroupBoundsProps) {
  const bounds = useGroupBounds(group);
  const selected = useCanvasStore(
    (s) => s.activeGroupId === group.id || s.selectedGroupIds.includes(group.id),
  );
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const nodeDrag = useGroupDrag(group, (didMove) => {
    if (!didMove) useCanvasStore.getState().clearSelection();
  });
  if (!bounds || !selected || canvasReadOnly) return null;
  return (
    <div
      className="pointer-events-auto absolute cursor-grab active:cursor-grabbing"
      data-group-drag-area={group.id}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        borderRadius: CORNER_RADIUS,
        // Above every card, raised ones included.
        zIndex: 1_000_000,
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          useCanvasStore.getState().toggleGroupInSelection(group.id);
          return;
        }
        nodeDrag.start(e, { moveSelection: false });
      }}
      onPointerMove={(e) => nodeDrag.move(e)}
      onPointerUp={(e) => nodeDrag.end(e)}
      onPointerCancel={(e) => nodeDrag.end(e)}
    />
  );
}

export const GroupSelectionDragArea = memo(GroupSelectionDragAreaInner);

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
  const isActive = useCanvasStore(
    (s) => s.activeGroupId === group.id || s.selectedGroupIds.includes(group.id),
  );
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const setActiveGroupId = useCanvasStore((s) => s.setActiveGroupId);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const renameGroup = useCanvasStore((s) => s.renameGroup);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);

  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(group.label);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const nodeDrag = useGroupDrag(group);

  if (!bounds) return null;

  const handleLabelPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || editing) return;
    e.stopPropagation();
    e.preventDefault();
    const st = useCanvasStore.getState();
    // Shift/Cmd/Ctrl-click adds or removes this chapter from the selection.
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      st.toggleGroupInSelection(group.id);
      return;
    }
    // Grabbing one of several selected chapters drags them all.
    if (st.selectedGroupIds.length > 1 && st.selectedGroupIds.includes(group.id)) {
      if (!canvasReadOnly) nodeDrag.start(e, { moveSelection: false });
      return;
    }
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
      data-group-active={isActive || undefined}
      style={{
        // Pack stylesheets (Frost) size the concentric frame from this.
        ["--canvas-group-padding" as string]: `${GROUP_BOUNDS_PADDING}px`,
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
      }}
    >
      {/* Frame: an inset outline, so the stroke sits inside the bounds. */}
      <div
        className="canvas-group-frame absolute inset-0"
        aria-hidden
        style={{
          borderRadius: CORNER_RADIUS,
          background: "rgb(var(--canvas-card) / 0.3)",
          outlineStyle: "solid",
          outlineWidth: FRAME_STROKE_PX,
          outlineOffset: -FRAME_STROKE_PX,
          outlineColor: isActive
            ? "rgb(var(--canvas-accent))"
            : "rgb(var(--canvas-ink) / 0.16)",
        }}
      />
      {/*
        Hairline between the group's conversation cards and its artifacts.
        Inset by the frame padding so it starts and ends on the same gutter
        the tiles inside line up to, and translucent enough to read as a
        separation rather than a border of its own.
      */}
      {group.dividerY !== undefined ? (
        <div
          className="canvas-group-divider absolute -translate-y-1/2"
          aria-hidden
          style={{
            left: GROUP_BOUNDS_PADDING,
            width: Math.max(0, bounds.w - GROUP_BOUNDS_PADDING * 2),
            top: group.dividerY - bounds.y,
            height: DIVIDER_STROKE_PX,
            background: "rgb(var(--canvas-ink) / 0.18)",
          }}
        />
      ) : null}

      {/*
        Chapter title in the band computeGroupBounds reserved for it at the top
        of the frame, on the same gutter the tiles inside line up to. It scales
        with the canvas, so it reads as a title over the district at any zoom
        and stays the most legible thing on screen when the whole canvas is in
        view.
      */}
      {group.headingText ? (
        <div
          className="canvas-group-heading pointer-events-none absolute break-words font-semibold text-canvas-ink"
          style={{
            left: GROUP_BOUNDS_PADDING,
            top: GROUP_BOUNDS_PADDING,
            width: Math.max(0, bounds.w - GROUP_BOUNDS_PADDING * 2),
            maxWidth: Math.max(0, bounds.w - GROUP_BOUNDS_PADDING * 2),
            fontSize: GROUP_HEADING_FONT_SIZE,
            lineHeight: GROUP_HEADING_LINE_HEIGHT,
          }}
        >
          {group.headingText}
        </div>
      ) : null}

      {/*
        Name label above the top-left corner (Figma section header). It scales
        with the canvas like the frame it names, rather than holding a screen
        size while everything around it zooms.
      */}
      <div
        className="canvas-group-label-anchor pointer-events-auto absolute bottom-full left-0 mb-1.5 cursor-grab select-none active:cursor-grabbing"
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
            className="canvas-group-label-input rounded-canvas-sm border border-canvas-accent bg-canvas-card px-2 py-0.5 text-canvas-caption font-medium text-canvas-ink outline-none"
            aria-label="Group name"
          />
        ) : (
          <span
            className={`canvas-group-label inline-block rounded-canvas-sm border px-2 py-0.5 text-canvas-caption font-medium shadow-sm ${
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
          className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2"
        >
          <span className="canvas-group-badge rounded-canvas-sm bg-canvas-accent px-2 py-0.5 text-canvas-caption font-medium text-canvas-onAccent shadow-sm">
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
