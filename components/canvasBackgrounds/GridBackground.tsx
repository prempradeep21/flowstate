"use client";

import { useId } from "react";
import { ProceduralSvgBackground } from "@/components/canvasBackgrounds/ProceduralSvgBackground";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import {
  patternOffset,
  patternTileSize,
} from "@/components/canvasBackgrounds/viewportSync";

const BASE_SPACING = 22;
const DOT_COLOR = "#8B8A86";
const BG_COLOR = "#FAFAF8";

export function GridBackground({
  viewport = { x: 0, y: 0, scale: 1 },
  className,
}: BackgroundRenderProps) {
  const patternId = useId().replace(/:/g, "");
  const tileSize = patternTileSize(BASE_SPACING, viewport.scale);
  const offset = patternOffset(viewport, tileSize);
  const dotRadius = Math.max(0.5, 0.5 * viewport.scale);

  return (
    <ProceduralSvgBackground className={className}>
      <defs>
        <pattern
          id={patternId}
          width={tileSize}
          height={tileSize}
          patternUnits="userSpaceOnUse"
          x={offset.x}
          y={offset.y}
        >
          <circle
            cx={tileSize / 2}
            cy={tileSize / 2}
            r={dotRadius}
            fill={DOT_COLOR}
          />
        </pattern>
      </defs>
      <rect x={0} y={0} width="100%" height="100%" fill={BG_COLOR} />
      <rect x={0} y={0} width="100%" height="100%" fill={`url(#${patternId})`} />
    </ProceduralSvgBackground>
  );
}
