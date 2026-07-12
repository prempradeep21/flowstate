"use client";

import { memo } from "react";
import { useGroupBounds } from "@/lib/useGroupBounds";
import type { BranchGroup } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import {
  compensatedStrokeWidth,
  worldLengthFromScreen,
} from "@/lib/zoomDisplay";

interface GroupBoundsProps {
  group: BranchGroup;
}

const SCREEN_STROKE = 3;
const SCREEN_DASH = 18;
const SCREEN_GAP = 14;
const CORNER_RADIUS = 12;

function GroupBoundsInner({ group }: GroupBoundsProps) {
  const bounds = useGroupBounds(group);
  // Stroke/dash feed rect GEOMETRY (x/y/w/h insets), so they can't move to
  // CSS vars — but clamping the selector at 1 makes it a constant while
  // zoomed in, so settles at scale ≥ 1 never re-render group frames.
  const scale = useCanvasStore((s) => Math.min(1, s.viewportSettledScale));

  if (!bounds) return null;

  const stroke = compensatedStrokeWidth(SCREEN_STROKE, scale, SCREEN_STROKE);
  const dash = worldLengthFromScreen(SCREEN_DASH, scale);
  const gap = worldLengthFromScreen(SCREEN_GAP, scale);
  const inset = stroke / 2;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
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
          fill="rgba(250, 250, 248, 0.35)"
          stroke="rgba(44, 42, 38, 0.55)"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`}
        />
      </svg>
      <span className="absolute left-3 top-3 rounded-canvas border border-canvas-border bg-canvas-card px-2 py-0.5 text-canvas-caption font-medium text-canvas-muted shadow-artifact">
        {group.label}
      </span>
    </div>
  );
}

/** Memoized like the node components — bounds derive from store selectors. */
export const GroupBounds = memo(
  GroupBoundsInner,
  (prev, next) => prev.group === next.group,
);
