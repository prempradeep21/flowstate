"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import {
  useClearSpawnMetaAfterAnimation,
  useSpawnMeta,
  useSpawnMotionMode,
} from "@/lib/motion/hooks";
import type { SpawnTargetKind } from "@/lib/motion/types";
import {
  applyWillChange,
  clearWillChange,
} from "@/lib/motion/performance";
import { dropVariants, popUpVariants, SPAWN_ANIMATION_MS } from "@/lib/motion/variants";

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

  useClearSpawnMetaAfterAnimation(targetId, targetKind, SPAWN_ANIMATION_MS);

  if (!spawnKind || motionMode === "none") {
    return <>{children}</>;
  }

  const variants =
    spawnKind === "drop"
      ? dropVariants
      : spawnKind === "popUp"
        ? popUpVariants
        : null;

  if (!variants) {
    return <>{children}</>;
  }

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
