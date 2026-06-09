"use client";

import {
  STEM_LENGTH,
  eventColor,
  eventSide,
} from "@/lib/timelineLayout";

export function TimelinePendingMarker({
  x,
  eventIndex,
  axisY,
}: {
  x: number;
  eventIndex: number;
  axisY: number;
}) {
  const side = eventSide(eventIndex);
  const color = eventColor(eventIndex);
  const dotSize = 14;
  const dotRadius = dotSize / 2;

  return (
    <div
      className="pointer-events-none absolute top-0 z-20"
      style={{ left: x, width: 0, height: "100%" }}
      aria-hidden
    >
      <div
        className="absolute top-0 rounded-full bg-canvas-accent/10"
        style={{
          left: 0,
          width: 2,
          height: "100%",
          transform: "translateX(-50%)",
          boxShadow: "0 0 12px 4px rgba(107, 78, 255, 0.15)",
        }}
      />

      <div
        className="absolute"
        style={{ left: 0, top: axisY, width: 0, height: 0 }}
      >
        {side === "above" && (
          <div
            className="absolute"
            style={{
              left: "50%",
              bottom: dotRadius,
              transform: "translateX(-50%)",
            }}
          >
            <div
              className="mx-auto w-0.5 animate-pulse rounded-full"
              style={{
                height: STEM_LENGTH,
                backgroundColor: color,
                opacity: 0.9,
              }}
            />
          </div>
        )}

        <div
          className="absolute animate-pulse rounded-full ring-4 ring-canvas-accent/35"
          style={{
            width: dotSize,
            height: dotSize,
            left: -dotRadius,
            top: -dotRadius,
            backgroundColor: color,
          }}
        />

        {side === "below" && (
          <div
            className="absolute"
            style={{
              left: "50%",
              top: dotRadius,
              transform: "translateX(-50%)",
            }}
          >
            <div
              className="mx-auto w-0.5 animate-pulse rounded-full"
              style={{
                height: STEM_LENGTH,
                backgroundColor: color,
                opacity: 0.9,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
