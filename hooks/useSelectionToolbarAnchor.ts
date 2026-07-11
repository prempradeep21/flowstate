"use client";

import { useMemo } from "react";
import { getSelectionBounds } from "@/lib/canvasSelection";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasStore } from "@/lib/store";

export const TOOLBAR_GAP_PX = 14;

export interface ToolbarWorldAnchor {
  /** World-space center-x of the selection bounds. */
  worldX: number;
  /** World-space top-y of the selection bounds. */
  worldY: number;
}

/** Screen-space position for a world anchor (relative to canvas container). */
export function toolbarScreenPosition(
  anchor: ToolbarWorldAnchor,
  viewport: { x: number; y: number; scale: number },
): { left: number; top: number } {
  return {
    left: viewport.x + anchor.worldX * viewport.scale,
    top: viewport.y + anchor.worldY * viewport.scale - TOOLBAR_GAP_PX,
  };
}

/**
 * World-space anchor above the selection bounds. Deliberately does NOT
 * subscribe to the live viewport (which changes every pan/zoom frame) —
 * the toolbar applies the world→screen conversion imperatively.
 */
export function useSelectionToolbarAnchor(): ToolbarWorldAnchor | null {
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
  const canvas3DNodes = useCanvasStore((s) => s.canvas3DNodes);
  const canvas3DOrder = useCanvasStore((s) => s.canvas3DOrder);
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);
  const canvasSkillNodes = useCanvasStore((s) => s.canvasSkillNodes);
  const canvasSkillOrder = useCanvasStore((s) => s.canvasSkillOrder);
  const canvasTextLabels = useCanvasStore((s) => s.canvasTextLabels);
  const canvasTextLabelOrder = useCanvasStore((s) => s.canvasTextLabelOrder);

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

  return useMemo(() => {
    if (!worldBounds) return null;
    return {
      worldX: worldBounds.x + worldBounds.w / 2,
      worldY: worldBounds.y,
    };
  }, [worldBounds]);
}
