"use client";

import type { CanvasStroke } from "@/lib/canvasStroke";
import { strokeToSvgPath } from "@/lib/canvasStroke";

interface Props {
  strokes: Record<string, CanvasStroke>;
  strokeOrder: string[];
  activeStrokeId?: string | null;
}

export function CanvasDrawingLayer({
  strokes,
  strokeOrder,
  activeStrokeId,
}: Props) {
  // stroke.width is world px (fixed when the stroke was drawn), so strokes
  // scale with the canvas like everything else — no zoom compensation.
  const renderStroke = (stroke: CanvasStroke) => {

    if (stroke.points.length >= 2) {
      return (
        <path
          key={stroke.id}
          d={strokeToSvgPath(stroke.points)}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      return (
        <circle
          key={stroke.id}
          cx={point.x}
          cy={point.y}
          r={stroke.width / 2}
          fill={stroke.color}
        />
      );
    }

    return null;
  };

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-[5]"
      width={1}
      height={1}
      style={{ overflow: "visible" }}
      aria-hidden
    >
      {strokeOrder.map((id) => {
        const stroke = strokes[id];
        if (!stroke) return null;
        if (activeStrokeId === id) return null;
        return renderStroke(stroke);
      })}
      {activeStrokeId && strokes[activeStrokeId]
        ? renderStroke(strokes[activeStrokeId])
        : null}
    </svg>
  );
}
