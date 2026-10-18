"use client";

import { useEffect, useRef } from "react";
import {
  buildCanvasLayoutOutline,
  writeCanvasLayoutOutline,
} from "@/lib/canvasLayoutOutline";
import { useCanvasStore } from "@/lib/store";

type StoreState = ReturnType<typeof useCanvasStore.getState>;

const WRITE_DEBOUNCE_MS = 1500;

function layoutChanged(state: StoreState, prev: StoreState): boolean {
  return (
    state.viewport !== prev.viewport ||
    state.cards !== prev.cards ||
    state.cardOrder !== prev.cardOrder ||
    state.canvasArtifactNodes !== prev.canvasArtifactNodes ||
    state.canvasArtifactOrder !== prev.canvasArtifactOrder ||
    state.sessionArtifacts !== prev.sessionArtifacts ||
    state.canvasAssetNodes !== prev.canvasAssetNodes ||
    state.canvasAssetOrder !== prev.canvasAssetOrder ||
    state.canvasGifNodes !== prev.canvasGifNodes ||
    state.canvas3DNodes !== prev.canvas3DNodes ||
    state.canvasSkillNodes !== prev.canvasSkillNodes ||
    state.canvasTextLabels !== prev.canvasTextLabels ||
    state.canvasTextLabelOrder !== prev.canvasTextLabelOrder
  );
}

/**
 * Keeps a local layout outline of the open canvas (see canvasLayoutOutline)
 * so the next time it loads — from Home or the sidebar — its real layout
 * shows as skeletons while the data is fetched.
 *
 * Writes are debounced, and flushed when a switch starts, the tab hides or
 * the workspace unmounts. While switching, the store and activeCanvasId can
 * briefly disagree, so nothing is written until the switch settles.
 */
export function useCanvasLayoutOutlineCache(
  activeCanvasId: string | null,
  isSwitchingCanvas: boolean,
): void {
  const canvasIdRef = useRef(activeCanvasId);
  const switchingRef = useRef(isSwitchingCanvas);
  const timerRef = useRef<number | null>(null);
  const flushRef = useRef<() => void>(() => {});

  flushRef.current = () => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const canvasId = canvasIdRef.current;
    if (!canvasId) return;
    writeCanvasLayoutOutline(
      canvasId,
      buildCanvasLayoutOutline(useCanvasStore.getState()),
    );
  };

  useEffect(() => {
    // Leaving the previous canvas (or starting a switch away from it): save
    // its latest layout before the store is replaced.
    if (isSwitchingCanvas && !switchingRef.current) flushRef.current();
    switchingRef.current = isSwitchingCanvas;
    if (canvasIdRef.current !== activeCanvasId) {
      // The store may already hold the new canvas here, so a pending write
      // for the old id is dropped rather than flushed under the wrong id.
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      canvasIdRef.current = activeCanvasId;
    }
    if (!isSwitchingCanvas && activeCanvasId) schedule();
  }, [activeCanvasId, isSwitchingCanvas]);

  function schedule() {
    if (switchingRef.current || !canvasIdRef.current) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => flushRef.current(),
      WRITE_DEBOUNCE_MS,
    );
  }

  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state, prev) => {
      if (layoutChanged(state, prev)) schedule();
    });
    const onHide = () => flushRef.current();
    window.addEventListener("pagehide", onHide);
    return () => {
      unsub();
      window.removeEventListener("pagehide", onHide);
      flushRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
