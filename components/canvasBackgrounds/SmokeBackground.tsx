"use client";

import { useEffect, useRef } from "react";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";
import {
  SmokeWebGLRenderer,
  hexToRgb,
} from "@/components/canvasBackgrounds/smokeWebGL";

const DEFAULT_SMOKE_COLOR = "#808080";

export function SmokeBackground({
  animate = true,
  className = "",
}: BackgroundRenderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SmokeWebGLRenderer | null>(null);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: SmokeWebGLRenderer;
    try {
      renderer = new SmokeWebGLRenderer(canvas);
    } catch {
      return;
    }
    rendererRef.current = renderer;

    const rgb = hexToRgb(DEFAULT_SMOKE_COLOR);
    if (rgb) renderer.updateColor(rgb);

    let rafId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      renderer.resize(width, height);
      if (!shouldAnimate) {
        renderer.render(0);
      }
    };

    const loop = (now: number) => {
      if (document.visibilityState === "hidden") {
        rafId = 0;
        return;
      }
      renderer.render(now);
      if (shouldAnimate) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = 0;
      }
    };

    resize();
    if (shouldAnimate) {
      rafId = requestAnimationFrame(loop);
    } else {
      renderer.render(0);
    }

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        shouldAnimate &&
        rafId === 0
      ) {
        rafId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [shouldAnimate]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#141414] ${className}`}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
