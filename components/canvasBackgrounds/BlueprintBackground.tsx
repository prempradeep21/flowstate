"use client";

import { useId } from "react";
import { ProceduralSvgBackground } from "@/components/canvasBackgrounds/ProceduralSvgBackground";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import {
  patternOffset,
  patternTileSize,
} from "@/components/canvasBackgrounds/viewportSync";

const BASE_SPACING = 20;
const BG_COLOR = "#1565C0";
const LINE_COLOR = "#FFFFFF";
const BORDER_INSET = 12;
const BORDER_GAP = 4;

export function BlueprintBackground({
  viewport = { x: 0, y: 0, scale: 1 },
  className,
}: BackgroundRenderProps) {
  const minorId = useId().replace(/:/g, "");
  const majorId = useId().replace(/:/g, "");
  const tileSize = patternTileSize(BASE_SPACING, viewport.scale);
  const majorTile = tileSize * 5;
  const offset = patternOffset(viewport, tileSize);
  const majorOffset = patternOffset(viewport, majorTile);
  const strokeWidth = Math.max(0.5, 0.5 * viewport.scale);
  const majorStroke = Math.max(0.75, 0.75 * viewport.scale);
  const crosshairStroke = Math.max(1, 1 * viewport.scale);
  const crosshairLen = 16 * viewport.scale;

  return (
    <ProceduralSvgBackground className={className}>
      <defs>
        <pattern
          id={minorId}
          width={tileSize}
          height={tileSize}
          patternUnits="userSpaceOnUse"
          x={offset.x}
          y={offset.y}
        >
          <path
            d={`M ${tileSize} 0 L 0 0 0 ${tileSize}`}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={strokeWidth}
            opacity={0.35}
          />
        </pattern>
        <pattern
          id={majorId}
          width={majorTile}
          height={majorTile}
          patternUnits="userSpaceOnUse"
          x={majorOffset.x}
          y={majorOffset.y}
        >
          <rect
            width={majorTile}
            height={majorTile}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={majorStroke}
            opacity={0.55}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={BG_COLOR} />
      <rect width="100%" height="100%" fill={`url(#${minorId})`} />
      <rect width="100%" height="100%" fill={`url(#${majorId})`} />

      {/* Double-line border frame */}
      <rect
        x={`${BORDER_INSET}%`}
        y={`${BORDER_INSET}%`}
        width={`${100 - BORDER_INSET * 2}%`}
        height={`${100 - BORDER_INSET * 2}%`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={`calc(${BORDER_INSET}% + ${BORDER_GAP}px)`}
        y={`calc(${BORDER_INSET}% + ${BORDER_GAP}px)`}
        width={`calc(${100 - BORDER_INSET * 2}% - ${BORDER_GAP * 2}px)`}
        height={`calc(${100 - BORDER_INSET * 2}% - ${BORDER_GAP * 2}px)`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />

      {/* Center crosshair */}
      <line
        x1="50%"
        y1={`calc(50% - ${crosshairLen}px)`}
        x2="50%"
        y2={`calc(50% + ${crosshairLen}px)`}
        stroke={LINE_COLOR}
        strokeWidth={crosshairStroke}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={`calc(50% - ${crosshairLen}px)`}
        y1="50%"
        x2={`calc(50% + ${crosshairLen}px)`}
        y2="50%"
        stroke={LINE_COLOR}
        strokeWidth={crosshairStroke}
        vectorEffect="non-scaling-stroke"
      />
    </ProceduralSvgBackground>
  );
}
