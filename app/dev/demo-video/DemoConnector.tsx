"use client";

import { useLayoutEffect, useRef } from "react";
import type { Card as CardType, CardSide, ConnectorStyle } from "@/lib/store";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import {
  buildPlugConnectorPath,
  connectorArrowPath,
  connectorMarkerSizes,
  connectorPlugCirclePath,
  plugAnchorAt,
  plugAnchorAtWorldPoint,
  resolveConnectionAnchors,
} from "@/lib/plugConnector";
import { getConnectionCardBounds } from "@/lib/canvasMeasure";

/** Matches Connections.tsx / ConnectorPathGroup rendering exactly, but with
 *  the draw-in progress supplied deterministically from the timeline instead
 *  of the wall-clock `connection-draw-in` CSS animation. */

const PLUG_FILL = "rgb(var(--canvas-plug-fill))";
const BASE_STROKE_SCREEN = 1.75;

export function DemoConnector({
  fromCard,
  toCard,
  fromSide,
  toSide,
  stroke,
  style,
  viewportScale,
  progress,
}: {
  fromCard: CardType;
  toCard: CardType;
  fromSide: CardSide;
  toSide: CardSide;
  stroke: string;
  style: ConnectorStyle;
  viewportScale: number;
  progress: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const { arrowSize } = connectorMarkerSizes(viewportScale);
  const {
    fromAnchor,
    toAnchor,
    fromSide: fs,
    toSide: ts,
  } = resolveConnectionAnchors(
    { fromSide, toSide },
    fromCard,
    toCard,
    RESOLVED_CANVAS_TUNING,
  );
  const { d } = buildPlugConnectorPath(fromAnchor, toAnchor, fs, ts, style, {
    trimTargetArrowInset: arrowSize * 1.35,
  });

  // Deterministic draw-in: dashoffset from timeline progress.
  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    if (progress >= 1) {
      path.style.removeProperty("stroke-dasharray");
      path.style.removeProperty("stroke-dashoffset");
      return;
    }
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String((1 - progress) * length);
  }, [progress, d]);

  if (progress <= 0) return null;

  return (
    <g>
      <path
        ref={pathRef}
        d={d}
        fill="none"
        style={{ stroke }}
        strokeOpacity={0.85}
        strokeWidth={BASE_STROKE_SCREEN}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <ConnectorMarkers
        fromAnchor={fromAnchor}
        toAnchor={toAnchor}
        toSide={ts}
        stroke={stroke}
        viewportScale={viewportScale}
        showArrow={progress >= 0.98 && (ts === "left" || ts === "right")}
      />
    </g>
  );
}

function ConnectorMarkers({
  fromAnchor,
  toAnchor,
  toSide,
  stroke,
  viewportScale,
  showArrow,
}: {
  fromAnchor: { px: number; py: number };
  toAnchor: { px: number; py: number };
  toSide: CardSide;
  stroke: string;
  viewportScale: number;
  showArrow: boolean;
}) {
  const { plugRadius, arrowSize } = connectorMarkerSizes(viewportScale);
  return (
    <>
      <path
        d={connectorPlugCirclePath(fromAnchor.px, fromAnchor.py, plugRadius)}
        style={{ fill: PLUG_FILL, stroke }}
        strokeWidth={BASE_STROKE_SCREEN}
        strokeOpacity={0.85}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      {showArrow && (
        <path
          d={connectorArrowPath(toAnchor.px, toAnchor.py, toSide, arrowSize)}
          style={{ fill: stroke }}
          fillOpacity={0.85}
          stroke="none"
          pointerEvents="none"
        />
      )}
    </>
  );
}

/** The live "pull a branch" drag preview — solid accent stroke, no arrow,
 *  exactly like PlugConnectorLayer's branch case. */
export function DemoGhostConnector({
  fromCard,
  fromSide,
  to,
  stroke,
  style,
  viewportScale,
}: {
  fromCard: CardType;
  fromSide: "left" | "right";
  to: { x: number; y: number };
  stroke: string;
  style: ConnectorStyle;
  viewportScale: number;
}) {
  const { w, h } = getConnectionCardBounds(fromCard, RESOLVED_CANVAS_TUNING);
  const fromAnchor = plugAnchorAt(
    fromCard.position.x,
    fromCard.position.y,
    w,
    h,
    fromSide,
  );
  const end = plugAnchorAtWorldPoint(to.x, to.y, fromSide);
  const { d } = buildPlugConnectorPath(
    fromAnchor,
    end,
    fromSide,
    fromSide === "left" ? "right" : "left",
    style,
  );
  return (
    <g>
      <path
        d={d}
        fill="none"
        style={{ stroke }}
        strokeOpacity={0.85}
        strokeWidth={BASE_STROKE_SCREEN}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <ConnectorMarkers
        fromAnchor={fromAnchor}
        toAnchor={end}
        toSide={fromSide === "left" ? "right" : "left"}
        stroke={stroke}
        viewportScale={viewportScale}
        showArrow={false}
      />
    </g>
  );
}
