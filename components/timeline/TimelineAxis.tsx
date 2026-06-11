"use client";

import type { TimelineTick } from "@/lib/timelineLayout";
import { canvasColors } from "@/lib/design/tokens";

export function TimelineAxis({
  ticks,
  trackWidth,
  trackHeight,
  axisY,
  animating,
}: {
  ticks: TimelineTick[];
  trackWidth: number;
  trackHeight: number;
  axisY: number;
  animating?: boolean;
}) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={trackWidth}
      height={trackHeight}
      aria-hidden
    >
      <line
        x1={0}
        y1={axisY}
        x2={trackWidth}
        y2={axisY}
        stroke={canvasColors.ink}
        strokeWidth={2}
        opacity={0.9}
      />

      {ticks.map((tick) => (
        <g
          key={tick.at}
          style={{
            transition: animating ? "opacity 320ms ease" : undefined,
          }}
        >
          <line
            x1={tick.x}
            y1={axisY - 9}
            x2={tick.x}
            y2={axisY + 9}
            stroke={canvasColors.muted}
            strokeWidth={2}
            opacity={0.65}
          />
          <text
            x={tick.x}
            y={axisY + 28}
            textAnchor="middle"
            fill={canvasColors.muted}
            fontSize={14}
            fontFamily="system-ui, sans-serif"
            fontWeight={500}
          >
            {tick.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
