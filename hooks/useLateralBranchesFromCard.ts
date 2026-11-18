"use client";

import { useMemo } from "react";
import type { LateralBranchFromCard } from "@/lib/chatThreads";
import { lateralConnectionsFrom } from "@/lib/canvasDerivedIndex";
import { useCanvasStore } from "@/lib/store";

const FIELD = "\u0000";
const ENTRY = "\u0001";

/**
 * Lateral branches pulled from a card, same result as
 * getLateralBranchesFromCard. The selector returns a string signature, so a
 * card re-renders only when its own branches change. Subscribing to the whole
 * `cards` map re-rendered every mounted card on every streamed token.
 */
export function useLateralBranchesFromCard(
  cardId: string,
): LateralBranchFromCard[] {
  const signature = useCanvasStore((s) => {
    const conns = lateralConnectionsFrom(s.connections, cardId);
    if (conns.length === 0) return "";
    const parts: string[] = [];
    for (const conn of conns) {
      const root = s.cards[conn.to];
      if (!root) continue;
      parts.push(`${conn.fromSide}${FIELD}${root.threadId}${FIELD}${root.id}`);
    }
    return parts.join(ENTRY);
  });

  return useMemo(() => {
    if (!signature) return [];
    return signature.split(ENTRY).map((entry) => {
      const [side, threadId, branchRootCardId] = entry.split(FIELD);
      return {
        side: side as LateralBranchFromCard["side"],
        threadId,
        branchRootCardId,
      };
    });
  }, [signature]);
}
