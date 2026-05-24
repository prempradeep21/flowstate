"use client";

import { PointerEvent as ReactPointerEvent } from "react";
import { useCanvasStore } from "@/lib/store";
import { counterScaleFactor } from "@/lib/zoomDisplay";

export function Plug({
  side,
  accentColour,
  visible,
  ariaLabel,
  onPointerDown,
  onClick,
}: {
  side: "left" | "right";
  accentColour: string;
  visible: boolean;
  ariaLabel: string;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onClick?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const scale = useCanvasStore((s) => s.viewport.scale);
  const isLeft = side === "left";

  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-30 ${isLeft ? "left-0" : "right-0"}`}
      style={{
        transform: `translate(${isLeft ? "-50%" : "50%"}, -50%) scale(${counterScaleFactor(scale)})`,
        transformOrigin: "center",
      }}
    >
      <button
        type="button"
        data-plug
        aria-label={ariaLabel}
        onClick={onClick}
        onPointerDown={onPointerDown}
        className={`pointer-events-auto h-2.5 w-2.5 rounded-full border-2 bg-canvas-card shadow-sm transition-opacity ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ borderColor: accentColour }}
      />
    </div>
  );
}
