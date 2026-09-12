"use client";

import { useMemo } from "react";
import type { CanvasNodesState } from "@/lib/canvasSelection";
import { useCanvasStore } from "@/lib/store";

/**
 * Every selectable canvas node collection as one memoized object — the state
 * bag `getSelectionUnits` / `getSelectionBounds` / `computeGroupBounds`
 * expect. Shared by the selection toolbar and group chrome so each consumer
 * doesn't hand-roll twenty store subscriptions.
 */
export function useCanvasNodesState(): CanvasNodesState {
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const connections = useCanvasStore((s) => s.connections);
  const threads = useCanvasStore((s) => s.threads);
  const threadOrder = useCanvasStore((s) => s.threadOrder);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const canvasArtifactOrder = useCanvasStore((s) => s.canvasArtifactOrder);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const canvasAssetNodes = useCanvasStore((s) => s.canvasAssetNodes);
  const canvasAssetOrder = useCanvasStore((s) => s.canvasAssetOrder);
  const canvasGifNodes = useCanvasStore((s) => s.canvasGifNodes);
  const canvasGifOrder = useCanvasStore((s) => s.canvasGifOrder);
  const canvas3DNodes = useCanvasStore((s) => s.canvas3DNodes);
  const canvas3DOrder = useCanvasStore((s) => s.canvas3DOrder);
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);
  const canvasSkillNodes = useCanvasStore((s) => s.canvasSkillNodes);
  const canvasSkillOrder = useCanvasStore((s) => s.canvasSkillOrder);
  const canvasTextLabels = useCanvasStore((s) => s.canvasTextLabels);
  const canvasTextLabelOrder = useCanvasStore((s) => s.canvasTextLabelOrder);

  return useMemo(
    () => ({
      cards,
      cardOrder,
      connections,
      threads,
      threadOrder,
      canvasArtifactNodes,
      canvasArtifactOrder,
      sessionArtifacts,
      canvasAssets,
      canvasAssetNodes,
      canvasAssetOrder,
      canvasGifNodes,
      canvasGifOrder,
      canvas3DNodes,
      canvas3DOrder,
      canvasSkills,
      canvasSkillNodes,
      canvasSkillOrder,
      canvasTextLabels,
      canvasTextLabelOrder,
    }),
    [
      cards,
      cardOrder,
      connections,
      threads,
      threadOrder,
      canvasArtifactNodes,
      canvasArtifactOrder,
      sessionArtifacts,
      canvasAssets,
      canvasAssetNodes,
      canvasAssetOrder,
      canvasGifNodes,
      canvasGifOrder,
      canvas3DNodes,
      canvas3DOrder,
      canvasSkills,
      canvasSkillNodes,
      canvasSkillOrder,
      canvasTextLabels,
      canvasTextLabelOrder,
    ],
  );
}
