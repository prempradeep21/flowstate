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
  // Zoom compensation comes entirely from the --vp-scale CSS var (written at
  // settle by CanvasViewport): stroke-width is a presentation property on
  // SVG, so calc() tracks settle with no React subscription here.
  const renderStroke = (stroke: CanvasStroke) => {
    // compensatedStrokeWidth(w, scale, w) as CSS: w at scale ≥ 1, w/scale below.
    const strokeWidthCss = `calc(${stroke.width}px / min(var(--vp-scale, 1), 1))`;

    if (stroke.points.length >= 2) {
      return (
        <path
          key={stroke.id}
          d={strokeToSvgPath(stroke.points)}
          fill="none"
          stroke={stroke.color}
          style={{ strokeWidth: strokeWidthCss }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      return (
        // r is geometry (not a presentation property), so counter-scale the
        // dot about its own center instead — same result as r/scale.
        <circle
          key={stroke.id}
          cx={point.x}
          cy={point.y}
          r={stroke.width / 2}
          fill={stroke.color}
          style={{
            transform: "scale(calc(1 / min(var(--vp-scale, 1), 1)))",
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
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
