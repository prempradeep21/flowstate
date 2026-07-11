"use client";

import { useEffect, useRef } from "react";
import { FocusAllChatsPanel } from "@/components/focus/FocusAllChatsPanel";
import { FocusArtifactPanel } from "@/components/focus/FocusArtifactPanel";
import { FocusAssetsPanel } from "@/components/focus/FocusAssetsPanel";
import { FocusChatPanel } from "@/components/focus/FocusChatPanel";
import { getThreadTailCardId, pickDefaultThreadId } from "@/lib/chatThreads";
import { useCanvasStore } from "@/lib/store";

/**
 * Keeps the middle panel following the conversation: when the active thread's
 * tail card produces a new artifact, it becomes the current artifact. Only
 * transitions update it, so a manual All-artifacts pick is not clobbered.
 */
function useCurrentArtifactSync() {
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const tailOutputArtifactId = useCanvasStore((s) => {
    if (!s.activeThreadId) return null;
    const tailId = getThreadTailCardId(
      {
        cards: s.cards,
        connections: s.connections,
        cardOrder: s.cardOrder,
        threads: {},
        threadOrder: [],
      },
      s.activeThreadId,
    );
    return tailId ? (s.cards[tailId]?.outputArtifactId ?? null) : null;
  });
  const prevRef = useRef<string | null>(tailOutputArtifactId);

  useEffect(() => {
    prevRef.current = null;
  }, [activeThreadId]);

  useEffect(() => {
    if (tailOutputArtifactId === prevRef.current) return;
    prevRef.current = tailOutputArtifactId;
    if (!tailOutputArtifactId) return;
    const state = useCanvasStore.getState();
    if (!state.sessionArtifacts[tailOutputArtifactId]) return;
    if (state.focusArtifactId === tailOutputArtifactId) return;
    state.setFocusArtifactId(tailOutputArtifactId);
  }, [tailOutputArtifactId]);
}

export function FocusView() {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const threads = useCanvasStore((s) => s.threads);
  const threadOrder = useCanvasStore((s) => s.threadOrder);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const focusDraftChat = useCanvasStore((s) => s.focusDraftChat);
  const focusSelectChat = useCanvasStore((s) => s.focusSelectChat);
  const setLeftPanelCollapsed = useCanvasStore((s) => s.setLeftPanelCollapsed);
  const setRightPanelCollapsed = useCanvasStore((s) => s.setRightPanelCollapsed);

  useCurrentArtifactSync();

  useEffect(() => {
    setLeftPanelCollapsed(true);
    setRightPanelCollapsed(true);
  }, [setLeftPanelCollapsed, setRightPanelCollapsed]);

  useEffect(() => {
    if (focusDraftChat) return;
    if (activeThreadId && threads[activeThreadId]) return;
    const next = pickDefaultThreadId({
      cards,
      connections,
      cardOrder,
      threads,
      threadOrder,
    });
    if (next) focusSelectChat(next);
  }, [
    focusDraftChat,
    activeThreadId,
    cards,
    connections,
    cardOrder,
    threads,
    threadOrder,
    focusSelectChat,
  ]);

  return (
    <div className="h-full w-full bg-canvas-bg">
      <div className="grid h-full grid-cols-[320px_420px_minmax(0,1fr)] gap-3 px-4 pb-20 pt-16">
        <div className="flex min-h-0 flex-col gap-3">
          <FocusAllChatsPanel />
          <FocusAssetsPanel />
        </div>
        <FocusChatPanel />
        <FocusArtifactPanel />
      </div>
    </div>
  );
}
