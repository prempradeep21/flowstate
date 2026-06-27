"use client";

import { useMemo } from "react";
import { getHiddenCardIds } from "@/lib/chatThreads";
import { useCanvasStore } from "@/lib/store";

/** Collapsed-branch hidden card ids derived from stable store slices. */
export function useHiddenCardIds(): Set<string> {
  const collapsedBranchThreadIds = useCanvasStore(
    (s) => s.collapsedBranchThreadIds,
  );
  const collapsedCardIds = useCanvasStore((s) => s.collapsedCardIds);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const connections = useCanvasStore((s) => s.connections);
  const threads = useCanvasStore((s) => s.threads);
  const threadOrder = useCanvasStore((s) => s.threadOrder);

  return useMemo(
    () =>
      getHiddenCardIds({
        collapsedBranchThreadIds,
        collapsedCardIds,
        chatsGloballyHidden,
        cards,
        cardOrder,
        connections,
        threads,
        threadOrder,
      }),
    [
      collapsedBranchThreadIds,
      collapsedCardIds,
      chatsGloballyHidden,
      cards,
      cardOrder,
      connections,
      threads,
      threadOrder,
    ],
  );
}
