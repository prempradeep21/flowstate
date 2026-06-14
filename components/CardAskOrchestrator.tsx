"use client";

import { useMemo } from "react";
import { useCardAsk } from "@/hooks/useCardAsk";
import { useCanvasStore } from "@/lib/store";

function CardAskRunner({ cardId }: { cardId: string }) {
  useCardAsk(cardId, true);
  return null;
}

/** Runs card asks in chat view where canvas `Card` nodes are not mounted. */
export function CardAskOrchestrator() {
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);

  const thinkingCardIds = useMemo(
    () =>
      cardOrder.filter((id) => {
        const card = cards[id];
        return card && card.status === "thinking";
      }),
    [cards, cardOrder],
  );

  return (
    <>
      {thinkingCardIds.map((cardId) => (
        <CardAskRunner key={cardId} cardId={cardId} />
      ))}
    </>
  );
}
