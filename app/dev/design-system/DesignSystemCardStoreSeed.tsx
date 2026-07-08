"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/lib/store";
import type { DesignSystemCardSample } from "@/lib/designSystemCardSamples";

/** Seed minimal card state for pending placeholder demos. */
export function DesignSystemCardStoreSeed({
  sample,
  children,
}: {
  sample: DesignSystemCardSample;
  children: React.ReactNode;
}) {
  useEffect(() => {
    useCanvasStore.setState((state) => ({
      cards: {
        ...state.cards,
        [sample.card.id]: sample.card,
      },
    }));
    return () => {
      useCanvasStore.setState((state) => {
        const next = { ...state.cards };
        delete next[sample.card.id];
        return { cards: next };
      });
    };
  }, [sample]);

  return children;
}
