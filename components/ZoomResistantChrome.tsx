"use client";

import { CSSProperties, PropsWithChildren } from "react";
import { useCanvasStore } from "@/lib/store";
import { counterScaleFactor } from "@/lib/zoomDisplay";

interface ZoomResistantChromeProps extends PropsWithChildren {
  transformOrigin?: CSSProperties["transformOrigin"];
  className?: string;
}

/** Keeps controls (inputs, buttons, handles) readable at every zoom level. */
export function ZoomResistantChrome({
  children,
  transformOrigin = "top left",
  className,
}: ZoomResistantChromeProps) {
  const scale = useCanvasStore((s) => s.viewport.scale);
  if (scale >= 1) {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }

  return (
    <div
      className={className}
      style={{
        transform: `scale(${counterScaleFactor(scale)})`,
        transformOrigin,
      }}
    >
      {children}
    </div>
  );
}
