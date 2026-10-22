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
        // Fixed world size — the plug scales with its card. Counter-scaled to
        // stay screen-constant, plugs ballooned over the cards when zoomed out.
        transform: `translate(${isLeft ? "-50%" : "50%"}, -50%)`,
        transformOrigin: "center",
      }}
    >
      <button
        type="button"
        data-plug
        aria-label={ariaLabel}
        onClick={onClick}
        onPointerDown={onPointerDown}
        // `block`: inline, the button sat on the wrapper's text baseline a
        // few px below centre — off the edge point the connector ring and
        // line resolve to. 10px / 2px ring = PLUG_DIAMETER_PX / PLUG_RING_PX.
        className={`canvas-plug pointer-events-auto block h-2.5 w-2.5 rounded-full border-2 bg-canvas-card shadow-sm transition-opacity ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ borderColor: accentColour }}
      />
    </div>
  );
}
