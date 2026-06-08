"use client";

import { useEffect, useRef } from "react";
import { isViewportGesturing } from "@/lib/canvasViewportGuard";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";

const SKY_SPEED = 0.2;

const SKY_COLORS = {
  background: "#000000",
  sky: "#5ca6ca",
  cloud: "#334d80",
};

interface VantaEffect {
  destroy(): void;
  setOptions(options: Record<string, unknown>): void;
  resize(): void;
}

function StaticSkyPreview({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
      style={{
        background: `linear-gradient(to top, ${SKY_COLORS.cloud} 0%, ${SKY_COLORS.sky} 35%, ${SKY_COLORS.background} 100%)`,
      }}
    />
  );
}

export function SkyBackground({
  animate = true,
  className,
}: BackgroundRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaEffect | null>(null);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  useEffect(() => {
    if (!shouldAnimate) return;

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let rafId = 0;
    let ro: ResizeObserver | null = null;
    let lastSpeed = SKY_SPEED;

    const resolveSpeed = () => {
      if (document.visibilityState === "hidden") return 0;
      if (isViewportGesturing()) return 0;
      return SKY_SPEED;
    };

    const syncSpeed = () => {
      const speed = resolveSpeed();
      if (speed !== lastSpeed && effectRef.current) {
        effectRef.current.setOptions({ speed });
        lastSpeed = speed;
      }
    };

    const tick = () => {
      syncSpeed();
      rafId = requestAnimationFrame(tick);
    };

    const onVisibility = () => syncSpeed();

    (async () => {
      const [THREE, clouds2Module] = await Promise.all([
        import("three"),
        import("vanta/dist/vanta.clouds2.min"),
      ]);

      if (cancelled || !containerRef.current) return;

      const CLOUDS2 = clouds2Module.default;

      effectRef.current = CLOUDS2({
        el: containerRef.current,
        THREE,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        speed: SKY_SPEED,
        backgroundColor: 0x000000,
        skyColor: 0x5ca6ca,
        cloudColor: 0x334d80,
        lightColor: 0xffffff,
        texturePath: "/vanta/noise.png",
      });

      ro = new ResizeObserver(() => effectRef.current?.resize());
      ro.observe(containerRef.current);

      document.addEventListener("visibilitychange", onVisibility);
      rafId = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
      ro?.disconnect();
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, [shouldAnimate]);

  if (!shouldAnimate) {
    return <StaticSkyPreview className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
    />
  );
}
