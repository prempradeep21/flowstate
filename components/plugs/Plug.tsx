"use client";

import { PointerEvent as ReactPointerEvent } from "react";

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
  const isLeft = side === "left";

  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-30 ${isLeft ? "left-0" : "right-0"}`}
      style={{
        // Counter-scale via the --vp-scale CSS var (written at settle by
        // CanvasViewport). Two plugs per visible card — a React subscription
        // here multiplied the post-zoom settle re-render across the canvas.
        transform: `translate(${isLeft ? "-50%" : "50%"}, -50%) scale(calc(1 / min(var(--vp-scale, 1), 1)))`,
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
