"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";

export interface CanvasDrawContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  time: number;
  animate: boolean;
}

interface Props {
  draw: (ctx: CanvasDrawContext) => void;
  animate?: boolean;
  className?: string;
}

export function ProceduralCanvasBackground({
  draw,
  animate = true,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let startTime = performance.now();
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!shouldAnimate) {
        drawRef.current({
          ctx,
          width,
          height,
          dpr,
          time: 0,
          animate: false,
        });
      }
    };

    const render = (now: number) => {
      if (document.visibilityState === "hidden") {
        rafId = 0;
        return;
      }
      const time = (now - startTime) / 1000;
      drawRef.current({ ctx, width, height, dpr, time, animate: shouldAnimate });
      if (shouldAnimate) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = 0;
      }
    };

    resize();
    render(startTime);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        shouldAnimate &&
        rafId === 0
      ) {
        startTime = performance.now();
        rafId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [shouldAnimate]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
