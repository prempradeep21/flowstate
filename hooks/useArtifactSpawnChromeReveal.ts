"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/lib/store";

/** How long artifact chrome stays visible after a pop-up spawn before fading out. */
export const ARTIFACT_CHROME_REVEAL_MS = 5000;

/**
 * True for {@link ARTIFACT_CHROME_REVEAL_MS} after an artifact pop-up spawn.
 * Drives the same reveal window used for connector plugs and canvas chrome.
 */
export function useArtifactSpawnChromeReveal(nodeId: string): boolean {
  const spawnMeta = useCanvasStore((s) => s.spawnMeta);
  const [revealActive, setRevealActive] = useState(false);
  const armedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const isPopUp =
      spawnMeta?.targetId === nodeId &&
      spawnMeta?.targetKind === "artifact" &&
      spawnMeta.kind === "popUp";

    if (!isPopUp || armedAtRef.current === spawnMeta.createdAt) return;

    armedAtRef.current = spawnMeta.createdAt;
    setRevealActive(true);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    const elapsed = Date.now() - spawnMeta.createdAt;
    const remaining = Math.max(0, ARTIFACT_CHROME_REVEAL_MS - elapsed);
    timerRef.current = window.setTimeout(() => {
      setRevealActive(false);
      timerRef.current = null;
    }, remaining);
  }, [spawnMeta, nodeId]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [nodeId],
  );

  return revealActive;
}
