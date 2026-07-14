"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Shared building blocks for the canvas-loading scenes. Every primitive is a
 * purely decorative, token-styled shape positioned by percentage inside the
 * scene container. Positioning lives on an outer wrapper so scene animations
 * (in scenes.module.css) can freely animate transform on the inner box.
 */

interface PlacedProps {
  /** Percent offsets of the element centre within the scene container. */
  x: number;
  y: number;
  /** Animation class from scenes.module.css, applied to the inner box. */
  animClass?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function Placed({
  x,
  y,
  animClass,
  style,
  children,
}: PlacedProps & { children: ReactNode }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden
    >
      <div className={animClass} style={style}>
        {children}
      </div>
    </div>
  );
}

export function GhostCard({
  x,
  y,
  w = 72,
  h = 44,
  accent = false,
  animClass,
  style,
  children,
}: PlacedProps & { w?: number; h?: number; accent?: boolean }) {
  return (
    <Placed x={x} y={y} animClass={animClass} style={style}>
      <div
        className={`rounded-canvas border shadow-artifact ${
          accent
            ? "border-canvas-accent/40 bg-canvas-accent/10"
            : "border-canvas-border/80 bg-canvas-card/90"
        }`}
        style={{ width: w, height: h }}
      >
        {children ?? (
          <div className="px-2 pt-2">
            <div className="h-1.5 w-2/3 rounded-full bg-canvas-ink/15" />
            <div className="mt-1.5 h-1 w-5/6 rounded-full bg-canvas-ink/10" />
            <div className="mt-1 h-1 w-1/2 rounded-full bg-canvas-ink/10" />
          </div>
        )}
      </div>
    </Placed>
  );
}

export function Chip({
  x,
  y,
  w = 56,
  accent = false,
  animClass,
  style,
}: PlacedProps & { w?: number; accent?: boolean }) {
  return (
    <Placed x={x} y={y} animClass={animClass} style={style}>
      <div
        className={`flex h-6 items-center rounded-full border px-2 shadow-sm ${
          accent
            ? "border-canvas-accent/50 bg-canvas-accent/15"
            : "border-canvas-border/80 bg-canvas-card/90"
        }`}
        style={{ width: w }}
      >
        <div
          className={`h-1 w-full rounded-full ${
            accent ? "bg-canvas-accent/50" : "bg-canvas-ink/15"
          }`}
        />
      </div>
    </Placed>
  );
}

export function DocCard({
  x,
  y,
  animClass,
  style,
  children,
}: PlacedProps) {
  return (
    <Placed x={x} y={y} animClass={animClass} style={style}>
      <div
        className="relative overflow-hidden rounded-canvas border border-canvas-border/80 bg-canvas-card/95 shadow-artifact"
        style={{ width: 42, height: 54 }}
      >
        {/* folded corner */}
        <div className="absolute right-0 top-0 h-3 w-3 rounded-bl-canvas border-b border-l border-canvas-border/80 bg-canvas-bg/90" />
        <div className="px-1.5 pt-4">
          <div className="h-1 w-5/6 rounded-full bg-canvas-ink/15" />
          <div className="mt-1 h-1 w-2/3 rounded-full bg-canvas-ink/10" />
          <div className="mt-1 h-1 w-3/4 rounded-full bg-canvas-ink/10" />
          <div className="mt-1 h-1 w-1/2 rounded-full bg-canvas-ink/10" />
        </div>
        {children}
      </div>
    </Placed>
  );
}

export function CursorDot({
  x,
  y,
  color,
  animClass,
  style,
}: PlacedProps & { color: string }) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden>
      <div className={animClass} style={style}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill={color}>
          <path d="M1 1 L11 5.2 L6.4 6.4 L5 11 Z" />
        </svg>
        <div
          className="ml-2 mt-0.5 h-2.5 w-8 rounded-full opacity-80"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * SVG wire between scene elements. Render inside a scene-level
 * `<svg viewBox="0 0 100 100" preserveAspectRatio="none">` so path
 * coordinates line up with the percentage-positioned primitives.
 * `pathLength={1}` normalises dash units so keyframes can draw the
 * wire with `stroke-dashoffset: 1 → 0`.
 */
export function Wire({
  d,
  animClass,
  style,
}: {
  d: string;
  animClass?: string;
  style?: CSSProperties;
}) {
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      className={animClass}
      style={style}
    />
  );
}

export function SceneSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full text-canvas-ink/25"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {children}
    </svg>
  );
}
