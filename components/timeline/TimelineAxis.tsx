"use client";

import {
  segmentColorAt,
  type TimelineSegment,
  type TimelineTick,
} from "@/lib/timelineLayout";

export function TimelineAxis({
  ticks,
  segments,
  trackWidth,
  trackHeight,
  axisY,
  animating,
}: {
  ticks: TimelineTick[];
  segments: TimelineSegment[];
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
      {/* Background band — a flat 10% tint of each phase's colour. The
          `timeline-band` class sets fill-opacity per theme (see globals.css). */}
      {segments.map((seg, i) =>
        seg.band ? (
          <rect
            key={`band-${i}`}
            className="timeline-band"
            x={seg.x1}
            y={0}
            width={Math.max(0, seg.x2 - seg.x1)}
            height={trackHeight}
            fill={seg.color}
          />
        ) : null,
      )}

      {/* Solid colour-sectioned axis — clear bands, no gradients. */}
      {segments.map((seg, i) => (
        <line
          key={`seg-${i}`}
          x1={seg.x1}
          y1={axisY}
          x2={seg.x2}
          y2={axisY}
          stroke={seg.color}
          strokeWidth={5}
        />
      ))}

      {ticks.map((tick) => {
        const color = segmentColorAt(tick.x, segments);
        return (
          <g
            key={tick.at}
            style={{
              transition: animating ? "opacity 320ms ease" : undefined,
            }}
          >
            <line
              x1={tick.x}
              y1={axisY - 10}
              x2={tick.x}
              y2={axisY + 10}
              stroke={color}
              strokeWidth={2}
              opacity={0.55}
            />
            <text
              x={tick.x}
              y={axisY + 32}
              textAnchor="middle"
              fill="rgb(var(--canvas-muted))"
              fontSize={15}
              fontFamily="system-ui, sans-serif"
              fontWeight={600}
            >
              {tick.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
