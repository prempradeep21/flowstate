"use client";

import { useEffect, useRef } from "react";
import {
  notifyCanvasViewportMovement,
  playSound,
  setMasterMuted,
  setMasterVolume,
} from "@/lib/sounds/engine";
import { isChatCollapseSoundSuppressed } from "@/lib/collapseSoundSuppress";
import { isViewportGesturing } from "@/lib/canvasViewportGuard";
import { useCanvasStore } from "@/lib/store";

function isArtifactPanelOpen(state: {
  openSessionArtifactId: string | null;
  openArtifactCardId: string | null;
  openGroupArtifactId: string | null;
}): boolean {
  return Boolean(
    state.openSessionArtifactId ||
      state.openArtifactCardId ||
      state.openGroupArtifactId,
  );
}

function arraysChanged(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return true;
  const setB = new Set(b);
  return a.some((id) => !setB.has(id));
}

/** Subscribes to canvas store transitions and plays mapped UI sounds. */
export function useCanvasSounds(): void {
  const initialized = useRef(false);

  useEffect(() => {
    const state = useCanvasStore.getState();
    setMasterVolume(state.soundVolume);
    setMasterMuted(!state.soundEnabled);
    initialized.current = true;
  }, []);

  useEffect(() => {
    const unsubPrefs = useCanvasStore.subscribe((state, prev) => {
      if (!initialized.current) return;
      if (state.soundVolume !== prev.soundVolume) {
        setMasterVolume(state.soundVolume);
      }
      if (state.soundEnabled !== prev.soundEnabled) {
        setMasterMuted(!state.soundEnabled);
      }
    });

    let prev = useCanvasStore.getState();
    const mountAt = Date.now();

    const unsubEvents = useCanvasStore.subscribe((state) => {
      if (!initialized.current) return;

      for (const cardId of state.cardOrder) {
        const card = state.cards[cardId];
        const prevCard = prev.cards[cardId];
        if (!card || !prevCard || card.status === prevCard.status) continue;

        if (card.status === "thinking" && prevCard.status !== "thinking") {
          void playSound("agent-thinking-start");
        }
        if (card.status === "streaming" && prevCard.status === "thinking") {
          void playSound("agent-streaming-start");
        }
        if (
          card.status === "done" &&
          (prevCard.status === "thinking" || prevCard.status === "streaming")
        ) {
          void playSound("agent-complete");
        }
      }

      if (
        arraysChanged(
          state.collapsedBranchThreadIds,
          prev.collapsedBranchThreadIds,
        )
      ) {
        void playSound("branch-collapse");
      }

      if (arraysChanged(state.collapsedCardIds, prev.collapsedCardIds)) {
        if (!isChatCollapseSoundSuppressed()) {
          void playSound("chat-collapse");
        }
      }

      const wasPanelOpen = isArtifactPanelOpen(prev);
      const isPanelOpen = isArtifactPanelOpen(state);
      if (!wasPanelOpen && isPanelOpen) {
        void playSound("artifact-panel-open");
      } else if (wasPanelOpen && !isPanelOpen) {
        void playSound("artifact-panel-close");
      }

      if (prev.plugDrag && !state.plugDrag) {
        if (prev.plugDrag.kind === "branch") {
          void playSound("branch-create");
        } else if (
          (prev.plugDrag.kind === "artifact" || prev.plugDrag.kind === "asset") &&
          prev.plugDrag.receiveTargetCardId
        ) {
          void playSound("plug-connect");
        }
      }

      if (Date.now() - mountAt > 1000 && isViewportGesturing()) {
        const dx = state.viewport.x - prev.viewport.x;
        const dy = state.viewport.y - prev.viewport.y;
        const scaleRatio =
          prev.viewport.scale > 0
            ? state.viewport.scale / prev.viewport.scale
            : 1;
        if (dx !== 0 || dy !== 0 || scaleRatio !== 1) {
          notifyCanvasViewportMovement(dx, dy, scaleRatio);
        }
      }

      if (state.undoPast.length < prev.undoPast.length) {
        void playSound("undo");
      }

      prev = state;
    });

    return () => {
      unsubPrefs();
      unsubEvents();
    };
  }, []);
}
