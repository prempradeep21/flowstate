"use client";

import { PropsWithChildren } from "react";
import { useCanvasStore } from "@/lib/store";

export function CanvasViewport({ children }: PropsWithChildren) {
  const viewport = useCanvasStore((s) => s.viewport);

  return (
    <div
      className="absolute left-0 top-0 origin-top-left will-change-transform"
      style={{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
      }}
    >
      {children}
    </div>
  );
}
