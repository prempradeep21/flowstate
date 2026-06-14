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
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      {strokeOrder.map((id) => {
        const stroke = strokes[id];
        if (!stroke || stroke.points.length < 2) return null;
        return (
          <path
            key={id}
            d={strokeToSvgPath(stroke.points)}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {activeStrokeId && strokes[activeStrokeId]?.points.length === 1 && (
        <circle
          cx={strokes[activeStrokeId].points[0].x}
          cy={strokes[activeStrokeId].points[0].y}
          r={strokes[activeStrokeId].width / 2}
          fill={strokes[activeStrokeId].color}
        />
      )}
    </svg>
  );
}
