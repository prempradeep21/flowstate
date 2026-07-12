"use client";

import { CSSProperties, PropsWithChildren } from "react";
import { useCanvasStore } from "@/lib/store";

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
  // Crossing-only subscription: the branch flips at scale 1; the actual
  // counter-scale factor below 1 comes from the --vp-scale CSS var (written
  // at settle by CanvasViewport), so settled-scale changes within a branch
  // never re-render this wrapper.
  const zoomedIn = useCanvasStore((s) => s.viewportSettledScale >= 1);
  if (zoomedIn) {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }

  return (
    <div
      className={className}
      style={{
        transform: "scale(calc(1 / min(var(--vp-scale, 1), 1)))",
        transformOrigin,
      }}
    >
      {children}
    </div>
  );
}
