"use client";

import { useEffect } from "react";
import {
  disposeThreadInactivity,
  ensureThreadRegistered,
  registerThreadInactivityHandlers,
  setThreadInactivityPaused,
  startThreadInactivityScheduler,
} from "@/lib/threadInactivity";
import { useCanvasStore } from "@/lib/store";

/** Mounts the per-thread inactivity collapse scheduler for the canvas session. */
export function useThreadInactivityCollapse(): void {
  useEffect(() => {
    registerThreadInactivityHandlers({
      readState: () => {
        const state = useCanvasStore.getState();
        return {
          cards: state.cards,
          cardOrder: state.cardOrder,
          connections: state.connections,
          threads: state.threads,
          threadOrder: state.threadOrder,
          collapsedCardIds: state.collapsedCardIds,
        };
      },
      applyCollapse: (threadIds) => {
        useCanvasStore.getState().autoCollapseInactiveThreads(threadIds);
      },
    });

    const { threadOrder } = useCanvasStore.getState();
    for (const threadId of threadOrder) {
      ensureThreadRegistered(threadId);
    }

    startThreadInactivityScheduler();

    const unsub = useCanvasStore.subscribe((state, prev) => {
      if (state.threadOrder === prev.threadOrder) return;
      const prevSet = new Set(prev.threadOrder);
      for (const threadId of state.threadOrder) {
        if (!prevSet.has(threadId)) {
          ensureThreadRegistered(threadId);
        }
      }
    });

    const onVisibility = () => {
      setThreadInactivityPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVisibility);
      disposeThreadInactivity();
    };
  }, []);
}
