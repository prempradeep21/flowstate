"use client";

import { useEffect, useId, useRef } from "react";
import {
  NETWORK_BACKGROUND_COLOR,
  NETWORK_MOVE_SPEED,
  NETWORK_PARTICLES_CONFIG,
} from "@/components/canvasBackgrounds/networkParticlesConfig";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";
import { isViewportGesturing } from "@/lib/canvasViewportGuard";
import type { ParticlesJSInstance } from "particles.js";

function StaticNetworkPreview({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
      style={{
        backgroundColor: NETWORK_BACKGROUND_COLOR,
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px, 96px 96px, 96px 96px",
        backgroundPosition: "0 0, 0 0, 0 0",
      }}
    />
  );
}

function destroyParticlesInstance(instance: ParticlesJSInstance | null) {
  if (!instance) return;
  instance.pJS.fn.vendors.destroypJS();
  if (!window.pJSDom) {
    window.pJSDom = [];
  }
}

export function NetworkBackground({
  animate = true,
  className,
}: BackgroundRenderProps) {
  const reactId = useId().replace(/:/g, "");
  const containerId = `network-particles-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ParticlesJSInstance | null>(null);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  useEffect(() => {
    if (!shouldAnimate) return;

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let rafId = 0;
    let lastSpeed = NETWORK_MOVE_SPEED;

    const resolveSpeed = () => {
      if (document.visibilityState === "hidden") return 0;
      if (isViewportGesturing()) return 0;
      return NETWORK_MOVE_SPEED;
    };

    const syncSpeed = () => {
      const speed = resolveSpeed();
      if (speed !== lastSpeed && instanceRef.current) {
        instanceRef.current.pJS.particles.move.speed = speed;
        lastSpeed = speed;
      }
    };

    const tick = () => {
      syncSpeed();
      rafId = requestAnimationFrame(tick);
    };

    const onVisibility = () => syncSpeed();

    (async () => {
      await import("particles.js");

      if (cancelled || !containerRef.current) return;

      if (!window.pJSDom) {
        window.pJSDom = [];
      }

      window.particlesJS(containerId, NETWORK_PARTICLES_CONFIG);

      const instances = window.pJSDom;
      if (!instances?.length) return;

      instanceRef.current = instances[instances.length - 1] ?? null;

      document.addEventListener("visibilitychange", onVisibility);
      rafId = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
      destroyParticlesInstance(instanceRef.current);
      instanceRef.current = null;
    };
  }, [shouldAnimate, containerId]);

  if (!shouldAnimate) {
    return <StaticNetworkPreview className={className} />;
  }

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
      style={{ backgroundColor: NETWORK_BACKGROUND_COLOR }}
    />
  );
}
