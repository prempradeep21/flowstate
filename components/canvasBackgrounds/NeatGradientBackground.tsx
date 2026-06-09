"use client";

import { useEffect, useRef } from "react";
import {
  NEAT_GRADIENT_CONFIG,
  NEAT_GRADIENT_SPEED,
} from "@/components/canvasBackgrounds/neatGradientConfig";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";
import { isViewportGesturing } from "@/lib/canvasViewportGuard";

interface NeatGradientInstance {
  destroy(): void;
  speed: number;
}

function StaticNeatGradientPreview({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
      style={{
        background:
          "linear-gradient(to bottom, #050C31 0%, #000000 50%, #000000 100%)",
      }}
    />
  );
}

export function NeatGradientBackground({
  animate = true,
  className,
}: BackgroundRenderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gradientRef = useRef<NeatGradientInstance | null>(null);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  useEffect(() => {
    if (!shouldAnimate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let rafId = 0;
    let lastSpeed = NEAT_GRADIENT_SPEED;

    const resolveSpeed = () => {
      if (document.visibilityState === "hidden") return 0;
      if (isViewportGesturing()) return 0;
      return NEAT_GRADIENT_SPEED;
    };

    const syncSpeed = () => {
      const speed = resolveSpeed();
      if (speed !== lastSpeed && gradientRef.current) {
        gradientRef.current.speed = speed;
        lastSpeed = speed;
      }
    };

    const tick = () => {
      syncSpeed();
      rafId = requestAnimationFrame(tick);
    };

    const onVisibility = () => syncSpeed();

    (async () => {
      const { NeatGradient } = await import("@firecms/neat");
      if (cancelled || !canvasRef.current) return;

      gradientRef.current = new NeatGradient({
        ref: canvasRef.current,
        ...NEAT_GRADIENT_CONFIG,
      });

      document.addEventListener("visibilitychange", onVisibility);
      rafId = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
      gradientRef.current?.destroy();
      gradientRef.current = null;
    };
  }, [shouldAnimate]);

  if (!shouldAnimate) {
    return <StaticNeatGradientPreview className={className} />;
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
