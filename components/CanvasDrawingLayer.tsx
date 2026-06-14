"use client";

import type { CanvasStroke } from "@/lib/canvasStroke";
import { strokeToSvgPath } from "@/lib/canvasStroke";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";
import { useCanvasStore } from "@/lib/store";

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
  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);

  const renderStroke = (stroke: CanvasStroke) => {
    const strokeWidth = compensatedStrokeWidth(
      stroke.width,
      viewportSettledScale,
      stroke.width,
    );

    if (stroke.points.length >= 2) {
      return (
        <path
          key={stroke.id}
          d={strokeToSvgPath(stroke.points)}
          fill="none"
          stroke={stroke.color}
          strokeWidth={strokeWidth}
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
          r={strokeWidth / 2}
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
