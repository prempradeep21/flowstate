"use client";

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
}) {
  const { plugRadius, arrowSize } = connectorMarkerSizes(viewportScale);

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
        d={d}
        fill="none"
        stroke={stroke}
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "6 5" : undefined}
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
      {showTargetArrow && (
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
