"use client";

import { useMemo } from "react";
import {
  getLateralBranchesFromCard,
  type LateralBranchFromCard,
} from "@/lib/chatThreads";
import { useCanvasStore } from "@/lib/store";

/** Lateral branches derived from stable store slices (React 19 getSnapshot-safe). */
export function useLateralBranchesFromCard(
  cardId: string,
): LateralBranchFromCard[] {
  const connections = useCanvasStore((s) => s.connections);
  const cards = useCanvasStore((s) => s.cards);

  return useMemo(
    () => getLateralBranchesFromCard(connections, cards, cardId),
    [connections, cards, cardId],
  );
}
