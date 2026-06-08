"use client";

import { useEffect, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { SpawnKind, SpawnTargetKind } from "./types";
import { SPAWN_META_TTL_MS } from "./types";
import { useReducedMotion } from "./useReducedMotion";
import { shouldAnimateSpawn } from "./performance";

export function useSpawnMeta(
  targetId: string,
  targetKind: SpawnTargetKind,
): SpawnKind | null {
  const meta = useCanvasStore((s) => s.spawnMeta);
  if (!meta) return null;
  if (meta.targetId !== targetId || meta.targetKind !== targetKind) return null;
  if (Date.now() - meta.createdAt > SPAWN_META_TTL_MS) return null;
  return meta.kind;
}

export function useSpawnMotionMode(
  targetId: string,
  targetKind: SpawnTargetKind,
  bounds: { x: number; y: number; w: number; h: number },
): "full" | "opacity" | "none" {
  const reducedMotion = useReducedMotion();
  const kind = useSpawnMeta(targetId, targetKind);

  return useMemo(() => {
    if (!kind) return "none";
    return shouldAnimateSpawn(
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h,
      reducedMotion,
    );
  }, [kind, bounds.x, bounds.y, bounds.w, bounds.h, reducedMotion]);
}

export function useClearSpawnMetaAfterAnimation(
  targetId: string,
  targetKind: SpawnTargetKind,
  durationMs: number,
) {
  const clearSpawnMeta = useCanvasStore((s) => s.clearSpawnMeta);
  const kind = useSpawnMeta(targetId, targetKind);

  useEffect(() => {
    if (!kind) return;
    const t = window.setTimeout(() => clearSpawnMeta(), durationMs);
    return () => window.clearTimeout(t);
  }, [kind, targetId, targetKind, durationMs, clearSpawnMeta]);
}
