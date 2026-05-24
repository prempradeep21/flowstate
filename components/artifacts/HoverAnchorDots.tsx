"use client";

export function HoverAnchorDots() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas-accent opacity-0 transition-opacity group-hover:opacity-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 z-30 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas-accent opacity-0 transition-opacity group-hover:opacity-100"
      />
    </>
  );
}
