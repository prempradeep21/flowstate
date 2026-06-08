"use client";

import { useEffect, useRef } from "react";
import type { CardSide } from "@/lib/store";
import type { PlugAnchor } from "@/lib/plugConnector";
import {
  connectorArrowPath,
  connectorMarkerSizes,
  connectorPlugCirclePath,
} from "@/lib/plugConnector";

const PLUG_FILL = "#F7F6F3";

export function ConnectorPathGroup({
  d,
  stroke,
  strokeWidth,
  fromAnchor,
  toAnchor,
  toSide,
  viewportScale,
  dashed,
  opacity = 0.85,
  showSourcePlug = true,
  showTargetArrow = true,
  hitWidth,
  onPointerEnter,
  onPointerLeave,
  drawIn = false,
  onDrawComplete,
}: {
  d: string;
  stroke: string;
  strokeWidth: number;
  fromAnchor: PlugAnchor;
  toAnchor: PlugAnchor;
  toSide: CardSide;
  viewportScale: number;
  dashed?: boolean;
  opacity?: number;
  showSourcePlug?: boolean;
  showTargetArrow?: boolean;
  hitWidth?: number;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  drawIn?: boolean;
  onDrawComplete?: () => void;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const { plugRadius, arrowSize } = connectorMarkerSizes(viewportScale);

  useEffect(() => {
    if (!drawIn || !pathRef.current) return;
    const path = pathRef.current;
    const length = path.getTotalLength();
    path.style.setProperty("--connection-length", String(length));
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    const onEnd = () => {
      path.classList.remove("connection-draw-in");
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
      onDrawComplete?.();
    };

    path.addEventListener("animationend", onEnd, { once: true });
    return () => path.removeEventListener("animationend", onEnd);
  }, [drawIn, d, onDrawComplete]);

  return (
    <>
      {hitWidth != null && (
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={hitWidth}
          strokeLinecap="round"
          className="cursor-pointer"
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        />
      )}
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={stroke}
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "6 5" : undefined}
        vectorEffect="non-scaling-stroke"
        className={drawIn ? "connection-draw-in" : undefined}
        pointerEvents="none"
      />
      {showSourcePlug && (
        <path
          d={connectorPlugCirclePath(fromAnchor.px, fromAnchor.py, plugRadius)}
          fill={PLUG_FILL}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeOpacity={opacity}
          pointerEvents="none"
        />
      )}
      {showTargetArrow &&
        (toSide === "left" || toSide === "right") && (
        <path
          d={connectorArrowPath(toAnchor.px, toAnchor.py, toSide, arrowSize)}
          fill={stroke}
          fillOpacity={opacity}
          stroke="none"
          pointerEvents="none"
        />
      )}
    </>
  );
}
