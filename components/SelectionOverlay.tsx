"use client";

interface SelectionOverlayProps {
  rect: { x: number; y: number; w: number; h: number } | null;
}

export function SelectionOverlay({ rect }: SelectionOverlayProps) {
  if (!rect || rect.w < 2 && rect.h < 2) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-30 border-2 border-dashed border-canvas-accent/50 bg-canvas-accent/5"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
      }}
    />
  );
}
