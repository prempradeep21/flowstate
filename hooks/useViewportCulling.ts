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
      s.canvasAssetOrder.length +
      s.canvasGifOrder.length +
      s.canvasSkillOrder.length +
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

        const alwaysVisibleAssets = new Set<string>();
        if (state.selectedCanvasAssetId) {
          alwaysVisibleAssets.add(state.selectedCanvasAssetId);
        }

        const alwaysVisibleGifs = new Set<string>();
        if (state.selectedCanvasGifId) {
          alwaysVisibleGifs.add(state.selectedCanvasGifId);
        }

        const alwaysVisibleSkills = new Set<string>();
        if (state.selectedCanvasSkillId) {
          alwaysVisibleSkills.add(state.selectedCanvasSkillId);
        }

        const alwaysVisibleLabels = new Set<string>();
        if (state.selectedCanvasTextLabelId) {
          alwaysVisibleLabels.add(state.selectedCanvasTextLabelId);
        }

        // Multi-selected nodes always render so batch drags stay coherent.
        for (const item of state.canvasSelection) {
          if (item.kind === "artifact") alwaysVisibleArtifacts.add(item.id);
          else if (item.kind === "asset") alwaysVisibleAssets.add(item.id);
          else if (item.kind === "gif") alwaysVisibleGifs.add(item.id);
          else if (item.kind === "skill") alwaysVisibleSkills.add(item.id);
          else alwaysVisibleLabels.add(item.id);
        }

        for (const id of Object.keys(state.composerDraftsByCardId)) {
          const draft = state.composerDraftsByCardId[id]?.trim();
          if (draft) alwaysVisibleCards.add(id);
        }

        setVisible(
          queryVisibleNodes(
            {
              viewport: state.viewport,
              cards: state.cards,
              cardOrder: state.cardOrder,
              canvasArtifactNodes: state.canvasArtifactNodes,
              canvasArtifactOrder: state.canvasArtifactOrder,
              canvasAssets: state.canvasAssets,
              canvasAssetNodes: state.canvasAssetNodes,
              canvasAssetOrder: state.canvasAssetOrder,
              canvasGifNodes: state.canvasGifNodes,
              canvasGifOrder: state.canvasGifOrder,
              canvasSkills: state.canvasSkills,
              canvasSkillNodes: state.canvasSkillNodes,
              canvasSkillOrder: state.canvasSkillOrder,
              canvasTextLabels: state.canvasTextLabels,
              canvasTextLabelOrder: state.canvasTextLabelOrder,
              sessionArtifacts: state.sessionArtifacts,
            },
            { width: rect.width, height: rect.height },
            {
              cards: alwaysVisibleCards,
              artifacts: alwaysVisibleArtifacts,
              assets: alwaysVisibleAssets,
              gifs: alwaysVisibleGifs,
              skills: alwaysVisibleSkills,
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
        state.canvasAssets !== prevState.canvasAssets ||
        state.canvasAssetNodes !== prevState.canvasAssetNodes ||
        state.canvasAssetOrder !== prevState.canvasAssetOrder ||
        state.canvasGifNodes !== prevState.canvasGifNodes ||
        state.canvasGifOrder !== prevState.canvasGifOrder ||
        state.canvasSkills !== prevState.canvasSkills ||
        state.canvasSkillNodes !== prevState.canvasSkillNodes ||
        state.canvasSkillOrder !== prevState.canvasSkillOrder ||
        state.canvasTextLabels !== prevState.canvasTextLabels ||
        state.canvasTextLabelOrder !== prevState.canvasTextLabelOrder ||
        state.selectedFamilyRootIds !== prevState.selectedFamilyRootIds ||
        state.canvasSelection !== prevState.canvasSelection ||
        state.selectedCanvasArtifactId !== prevState.selectedCanvasArtifactId ||
        state.selectedCanvasAssetId !== prevState.selectedCanvasAssetId ||
        state.selectedCanvasGifId !== prevState.selectedCanvasGifId ||
        state.selectedCanvasSkillId !== prevState.selectedCanvasSkillId ||
        state.selectedCanvasTextLabelId !== prevState.selectedCanvasTextLabelId ||
        state.composerDraftsByCardId !== prevState.composerDraftsByCardId
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
