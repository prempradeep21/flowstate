"use client";

import { type RefObject, useEffect, useState } from "react";
import { getFamilyCardIds } from "@/lib/chatThreads";
import {
  queryVisibleNodes,
  shouldEnableViewportCulling,
  type VisibleNodes,
} from "@/lib/canvasSpatialIndex";
import { useCanvasStore } from "@/lib/store";

export function useViewportCulling(
  containerRef: RefObject<HTMLElement | null>,
  options?: { landingCardId?: string | null },
) {
  const nodeCount = useCanvasStore(
    (s) =>
      s.cardOrder.length +
      s.canvasArtifactOrder.length +
      s.canvasTextLabelOrder.length,
  );
  const enabled = shouldEnableViewportCulling(nodeCount);
  const [visible, setVisible] = useState<VisibleNodes | null>(null);

  useEffect(() => {
    if (!enabled) {
      setVisible(null);
      return;
    }

    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const state = useCanvasStore.getState();
        const rect = container.getBoundingClientRect();
        const alwaysVisibleCards = new Set<string>();

        if (options?.landingCardId) {
          alwaysVisibleCards.add(options.landingCardId);
        }

        for (const rootId of state.selectedFamilyRootIds) {
          for (const id of getFamilyCardIds(state, rootId)) {
            alwaysVisibleCards.add(id);
          }
        }

        const alwaysVisibleArtifacts = new Set<string>();
        if (state.selectedCanvasArtifactId) {
          alwaysVisibleArtifacts.add(state.selectedCanvasArtifactId);
        }

        const alwaysVisibleLabels = new Set<string>();
        if (state.selectedCanvasTextLabelId) {
          alwaysVisibleLabels.add(state.selectedCanvasTextLabelId);
        }

        setVisible(
          queryVisibleNodes(
            {
              viewport: state.viewport,
              cards: state.cards,
              cardOrder: state.cardOrder,
              canvasArtifactNodes: state.canvasArtifactNodes,
              canvasArtifactOrder: state.canvasArtifactOrder,
              canvasTextLabels: state.canvasTextLabels,
              canvasTextLabelOrder: state.canvasTextLabelOrder,
              sessionArtifacts: state.sessionArtifacts,
            },
            { width: rect.width, height: rect.height },
            {
              cards: alwaysVisibleCards,
              artifacts: alwaysVisibleArtifacts,
              labels: alwaysVisibleLabels,
            },
          ),
        );
      });
    };

    update();

    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      if (
        state.viewport !== prevState.viewport ||
        state.cards !== prevState.cards ||
        state.cardOrder !== prevState.cardOrder ||
        state.canvasArtifactNodes !== prevState.canvasArtifactNodes ||
        state.canvasArtifactOrder !== prevState.canvasArtifactOrder ||
        state.canvasTextLabels !== prevState.canvasTextLabels ||
        state.canvasTextLabelOrder !== prevState.canvasTextLabelOrder ||
        state.selectedFamilyRootIds !== prevState.selectedFamilyRootIds ||
        state.selectedCanvasArtifactId !== prevState.selectedCanvasArtifactId ||
        state.selectedCanvasTextLabelId !== prevState.selectedCanvasTextLabelId
      ) {
        update();
      }
    });

    const ro = new ResizeObserver(update);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      unsubscribe();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [containerRef, enabled, options?.landingCardId]);

  return { enabled, visible };
}
