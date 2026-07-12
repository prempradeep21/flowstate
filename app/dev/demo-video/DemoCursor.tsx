"use client";

/**
 * Scripted cursor for the demo video. Rendered in screen space (the app
 * projects world → screen each frame), so it stays glued to its target
 * while the camera moves.
 */
export function DemoCursor({
  x,
  y,
  opacity,
  pressed,
}: {
  x: number;
  y: number;
  opacity: number;
  pressed: boolean;
}) {
  if (opacity <= 0) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-[60000]"
      style={{
        transform: `translate(${x}px, ${y}px) scale(${pressed ? 0.88 : 1})`,
        transformOrigin: "4px 4px",
        opacity,
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: "drop-shadow(0 1px 2px rgba(20,18,14,0.35))" }}
      >
        <path
          d="M5.5 3.2L18.6 14.2L12.6 14.9L15.6 21.4L13.1 22.5L10.2 15.9L5.5 19.5V3.2Z"
          fill="#FFFFFF"
          stroke="#2C2A26"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Expanding click ring, p in 0..1. Screen space. */
export function ClickRipple({ x, y, p }: { x: number; y: number; p: number }) {
  const size = 8 + p * 30;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[59999] rounded-full border-2 border-canvas-ink/50"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: (1 - p) * 0.7,
      }}
    />
  );
}
