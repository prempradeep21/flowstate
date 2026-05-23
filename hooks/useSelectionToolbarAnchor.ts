"use client";

import { useMemo } from "react";
import { computeSelectionBounds } from "@/lib/selectionBounds";
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
  const activeGroupId = useCanvasStore((s) => s.activeGroupId);
  const groups = useCanvasStore((s) => s.groups);
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const connections = useCanvasStore((s) => s.connections);
  const threads = useCanvasStore((s) => s.threads);
  const threadOrder = useCanvasStore((s) => s.threadOrder);
  const viewport = useCanvasStore((s) => s.viewport);

  const threadState = useMemo(
    () => ({ cards, cardOrder, connections, threads, threadOrder }),
    [cards, cardOrder, connections, threads, threadOrder],
  );

  const selectionKey = selectedFamilyRootIds.join(",");
  const activeGroup = activeGroupId ? groups[activeGroupId] : null;

  const worldBounds = useMemo(() => {
    if (selectedFamilyRootIds.length > 0) {
      return computeSelectionBounds(threadState, selectedFamilyRootIds);
    }
    if (activeGroup) {
      return computeGroupBounds(threadState, activeGroup);
    }
    return null;
  }, [threadState, selectionKey, activeGroup?.id, activeGroup?.familyRootThreadIds.join(",")]);

  if (!worldBounds) return null;

  const centerX = worldBounds.x + worldBounds.w / 2;
  const topY = worldBounds.y;

  return {
    left: viewport.x + centerX * viewport.scale,
    top: viewport.y + topY * viewport.scale - TOOLBAR_GAP_PX,
  };
}
