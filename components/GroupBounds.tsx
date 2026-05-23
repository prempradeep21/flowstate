"use client";

import { ZoomResistantChrome } from "@/components/ZoomResistantChrome";
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

export function GroupBounds({ group }: GroupBoundsProps) {
  const bounds = useGroupBounds(group);
  const scale = useCanvasStore((s) => s.viewport.scale);

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
      <ZoomResistantChrome
        className="absolute left-3 top-3"
        transformOrigin="top left"
      >
        <span className="rounded-md border border-canvas-border bg-canvas-card px-2 py-0.5 text-[11px] font-medium text-canvas-muted shadow-card">
          {group.label}
        </span>
      </ZoomResistantChrome>
    </div>
  );
}
