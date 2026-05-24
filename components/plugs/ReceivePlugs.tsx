"use client";

import { useCanvasStore } from "@/lib/store";
import { counterScaleFactor } from "@/lib/zoomDisplay";

export function ReceivePlugs({
  accentColour,
  active,
  highlightSide,
}: {
  accentColour: string;
  active: boolean;
  highlightSide: "left" | "right" | null;
}) {
  const scale = useCanvasStore((s) => s.viewport.scale);
  const scaleFactor = counterScaleFactor(scale);

  if (!active) return null;

  return (
    <>
      {(["left", "right"] as const).map((side) => {
        const isLeft = side === "left";
        const highlighted = highlightSide === side;
        return (
          <div
            key={side}
            aria-hidden
            className={`pointer-events-none absolute top-1/2 z-40 ${
              isLeft ? "left-0" : "right-0"
            }`}
            style={{
              transform: `translate(${isLeft ? "-50%" : "50%"}, -50%) scale(${scaleFactor})`,
              transformOrigin: "center",
            }}
          >
            <span
              className={`block h-2.5 w-2.5 rounded-full border-2 bg-canvas-card transition-transform ${
                highlighted ? "scale-125" : ""
              }`}
              style={{ borderColor: accentColour }}
            />
          </div>
        );
      })}
    </>
  );
}
