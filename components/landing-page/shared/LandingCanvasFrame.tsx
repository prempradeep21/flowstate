"use client";

import { useRef } from "react";
import { Canvas } from "@/components/Canvas";
import { ThemeApplier } from "@/components/ThemeApplier";
import { useLandingCanvasDemo } from "@/hooks/useLandingCanvasDemo";
import type { CanvasSnapshot } from "@/lib/canvasSnapshot";

export function LandingCanvasFrame({
  buildSnapshot,
  height = 520,
  className = "",
  label,
}: {
  buildSnapshot: () => CanvasSnapshot;
  height?: number;
  className?: string;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useLandingCanvasDemo(buildSnapshot, containerRef);

  return (
    <div
      className={`relative overflow-hidden rounded-canvas border border-canvas-border bg-canvas-bg shadow-card ${className}`}
      style={{ height }}
      aria-label={label}
    >
      <ThemeApplier />
      <div ref={containerRef} className="absolute inset-0">
        <Canvas containerRef={containerRef} />
      </div>
    </div>
  );
}
