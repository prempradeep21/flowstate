"use client";

import { useEffect, useId, useRef, useState } from "react";
import { isViewportGesturing } from "@/lib/canvasViewportGuard";
import { ProceduralSvgBackground } from "@/components/canvasBackgrounds/ProceduralSvgBackground";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";
import { CANVAS_BG } from "@/lib/design/tokens";

interface Blob {
  cx: number;
  cy: number;
  r: number;
  color: string;
  dx: number;
  dy: number;
  phase: number;
}

const BLOBS: Omit<Blob, "cx" | "cy">[] = [
  { r: 0.45, color: "#C8E6A0", dx: 0.08, dy: 0.05, phase: 0 },
  { r: 0.4, color: "#A8D4F5", dx: -0.06, dy: 0.07, phase: 1.2 },
  { r: 0.35, color: "#F5D4A8", dx: 0.05, dy: -0.06, phase: 2.4 },
  { r: 0.38, color: "#D4C8F5", dx: -0.04, dy: -0.05, phase: 3.6 },
];

export function AmbientGradientBackground({
  animate = true,
  className,
}: BackgroundRenderProps) {
  const blurId = useId().replace(/:/g, "");
  const grainId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;
  const [blobs, setBlobs] = useState<Blob[]>(() =>
    BLOBS.map((b, i) => ({
      ...b,
      cx: 0.3 + (i % 2) * 0.35,
      cy: 0.25 + Math.floor(i / 2) * 0.35,
    })),
  );
  const rafRef = useRef(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    const start = performance.now();
    const tick = (now: number) => {
      if (!isViewportGesturing()) {
        const t = (now - start) / 1000;
        setBlobs(
          BLOBS.map((b, i) => ({
            ...b,
            cx: 0.5 + Math.sin(t * 0.15 + b.phase) * b.dx + (i % 2 === 0 ? -0.15 : 0.15),
            cy: 0.5 + Math.cos(t * 0.12 + b.phase) * b.dy + (i < 2 ? -0.1 : 0.1),
          })),
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shouldAnimate]);

  return (
    <ProceduralSvgBackground className={className}>
      <defs>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="60" />
        </filter>
        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        {blobs.map((blob, i) => (
          <radialGradient
            key={i}
            id={`${blurId}-grad-${i}`}
            cx={`${blob.cx * 100}%`}
            cy={`${blob.cy * 100}%`}
            r={`${blob.r * 100}%`}
          >
            <stop offset="0%" stopColor={blob.color} stopOpacity={0.55} />
            <stop offset="100%" stopColor={blob.color} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      <rect width="100%" height="100%" fill={CANVAS_BG} />
      <g filter={`url(#${blurId})`}>
        {blobs.map((_, i) => (
          <rect
            key={i}
            width="100%"
            height="100%"
            fill={`url(#${blurId}-grad-${i})`}
          />
        ))}
      </g>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${grainId})`}
        opacity={0.04}
        style={{ mixBlendMode: "multiply" }}
      />
    </ProceduralSvgBackground>
  );
}
