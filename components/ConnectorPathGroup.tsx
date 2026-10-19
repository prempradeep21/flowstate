"use client";

import { useEffect, useRef } from "react";
import type { CardSide } from "@/lib/store";
import type { PlugAnchor } from "@/lib/plugConnector";
import {
  connectorMarkerSizes,
  connectorPlugCirclePath,
} from "@/lib/plugConnector";

/** Resolves through the theme CSS variable so plugs follow light/dark. */
const PLUG_FILL = "rgb(var(--canvas-plug-fill))";

export function ConnectorPathGroup({
  d,
  stroke,
  strokeWidth,
  fromAnchor,
  toAnchor,
  viewportScale,
  dashed,
  opacity = 0.85,
  showSourcePlug = true,
  showTargetPlug = true,
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
  /** Unused since both ends draw the same ring; kept so callers needn't change. */
  toSide?: CardSide;
  viewportScale: number;
  dashed?: boolean;
  opacity?: number;
  showSourcePlug?: boolean;
  showTargetPlug?: boolean;
  hitWidth?: number;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  drawIn?: boolean;
  onDrawComplete?: () => void;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const { plugRadius, plugRingWidth } = connectorMarkerSizes(viewportScale);

  useEffect(() => {
    if (!drawIn || !pathRef.current) return;
    const path = pathRef.current;
    const length = path.getTotalLength();
    path.style.setProperty("--connection-length", String(length));
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    const onEnd = () => {
      path.classList.remove("connection-draw-in");
      path.style.removeProperty("stroke-dasharray");
      path.style.removeProperty("stroke-dashoffset");
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
        style={{ stroke }}
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
        <PlugRing
          anchor={fromAnchor}
          radius={plugRadius}
          ringWidth={plugRingWidth}
          stroke={stroke}
        />
      )}
      {showTargetPlug && (
        <PlugRing
          anchor={toAnchor}
          radius={plugRadius}
          ringWidth={plugRingWidth}
          stroke={stroke}
        />
      )}
    </>
  );
}

/** Same ring as the DOM <Plug>, centred on the card edge at `anchor`. */
function PlugRing({
  anchor,
  radius,
  ringWidth,
  stroke,
}: {
  anchor: PlugAnchor;
  radius: number;
  ringWidth: number;
  stroke: string;
}) {
  return (
    <path
      d={connectorPlugCirclePath(anchor.px, anchor.py, radius)}
      style={{ fill: PLUG_FILL, stroke }}
      strokeWidth={ringWidth}
      pointerEvents="none"
    />
  );
}
