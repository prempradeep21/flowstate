"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import {
  useCanvasLoadRevealDelay,
  useClearSpawnMetaAfterAnimation,
  useSpawnMeta,
  useSpawnMotionMode,
} from "@/lib/motion/hooks";
import type { SpawnTargetKind } from "@/lib/motion/types";
import {
  applyWillChange,
  clearWillChange,
} from "@/lib/motion/performance";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { dropVariants, popUpVariants, SPAWN_ANIMATION_MS } from "@/lib/motion/variants";

function CanvasLoadRevealWrapper({
  delay,
  reducedMotion,
  children,
}: {
  delay: number | "pending";
  reducedMotion: boolean;
  children: ReactNode;
}) {
  if (delay === "pending") {
    return (
      <div className="motion-canvas-load-pending h-full w-full">{children}</div>
    );
  }

  const className = reducedMotion
    ? "motion-canvas-load-fade"
    : "motion-canvas-load-in";

  return (
    <div
      className={`${className} h-full w-full`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function MotionCanvasNode({
  targetId,
  targetKind,
  bounds,
  children,
}: {
  targetId: string;
  targetKind: SpawnTargetKind;
  bounds: { x: number; y: number; w: number; h: number };
  children: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spawnKind = useSpawnMeta(targetId, targetKind);
  const motionMode = useSpawnMotionMode(targetId, targetKind, bounds);
  const loadRevealDelay = useCanvasLoadRevealDelay(targetId, targetKind);
  const reducedMotion = useReducedMotion();

  useClearSpawnMetaAfterAnimation(targetId, targetKind, SPAWN_ANIMATION_MS);

  if (spawnKind && motionMode !== "none") {
    const variants =
      spawnKind === "drop"
        ? dropVariants
        : spawnKind === "popUp"
          ? popUpVariants
          : null;

    if (variants) {
      const initial =
        motionMode === "opacity"
          ? { opacity: 0, y: 0, scale: 1 }
          : variants.initial;
      const animate =
        motionMode === "opacity" ? variants.reduced : variants.animate;

      return (
        <m.div
          ref={wrapperRef}
          className="h-full w-full"
          initial={initial}
          animate={animate}
          onAnimationStart={() => applyWillChange(wrapperRef.current)}
          onAnimationComplete={() => clearWillChange(wrapperRef.current)}
        >
          {children}
        </m.div>
      );
    }
  }

  if (loadRevealDelay !== null) {
    return (
      <CanvasLoadRevealWrapper
        delay={loadRevealDelay}
        reducedMotion={reducedMotion}
      >
        {children}
      </CanvasLoadRevealWrapper>
    );
  }

  return <>{children}</>;
}
