"use client";

import { useMemo } from "react";
import { getSelectionBounds } from "@/lib/canvasSelection";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasStore } from "@/lib/store";

const TOOLBAR_GAP_PX = 14;

export interface ToolbarAnchor {
  left: number;
  top: number;
}

/** Screen-space anchor above a world-space bounds rect (relative to canvas container). */
export function useSelectionToolbarAnchor(): ToolbarAnchor | null {
  const selectedFamilyRootIds = useCanvasStore((s) => s.selectedFamilyRootIds);
  const canvasSelection = useCanvasStore((s) => s.canvasSelection);
  const activeGroupId = useCanvasStore((s) => s.activeGroupId);
  const groups = useCanvasStore((s) => s.groups);
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
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);
  const canvasSkillNodes = useCanvasStore((s) => s.canvasSkillNodes);
  const canvasSkillOrder = useCanvasStore((s) => s.canvasSkillOrder);
  const canvasTextLabels = useCanvasStore((s) => s.canvasTextLabels);
  const canvasTextLabelOrder = useCanvasStore((s) => s.canvasTextLabelOrder);
  const viewport = useCanvasStore((s) => s.viewport);

  const nodesState = useMemo(
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
      canvasSkills,
      canvasSkillNodes,
      canvasSkillOrder,
      canvasTextLabels,
      canvasTextLabelOrder,
    ],
  );

  const activeGroup = activeGroupId ? groups[activeGroupId] : null;

  const worldBounds = useMemo(() => {
    if (selectedFamilyRootIds.length > 0 || canvasSelection.length > 0) {
      return getSelectionBounds(nodesState, {
        familyRootIds: selectedFamilyRootIds,
        items: canvasSelection,
      });
    }
    if (activeGroup) {
      return computeGroupBounds(nodesState, activeGroup);
    }
    return null;
  }, [nodesState, selectedFamilyRootIds, canvasSelection, activeGroup]);

  if (!worldBounds) return null;

  const centerX = worldBounds.x + worldBounds.w / 2;
  const topY = worldBounds.y;

  return {
    left: viewport.x + centerX * viewport.scale,
    top: viewport.y + topY * viewport.scale - TOOLBAR_GAP_PX,
  };
}
