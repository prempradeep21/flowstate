"use client";

import { CSSProperties, PropsWithChildren } from "react";

interface CanvasSharpContentProps extends PropsWithChildren {
  className?: string;
  /** World-space width in px — keeps the outer box at full canvas width. */
  worldWidth?: number;
  style?: CSSProperties;
}

/**
 * Layout wrapper for canvas node bodies. Keeps world-space width so cards and
 * artifacts wrap text at their designed width at any zoom level.
 *
 * (Full inverse-scale sharp text was removed — it laid out at width × scale,
 * which collapsed line length and broke component widths when zoomed out.)
 */
export function CanvasSharpContent({
  children,
  className,
  worldWidth,
  style,
}: CanvasSharpContentProps) {
  return (
    <div
      className={className}
      style={{
        ...style,
        ...(worldWidth != null
          ? { width: worldWidth, maxWidth: worldWidth }
          : undefined),
      }}
    >
      {children}
    </div>
  );
}
