"use client";

import { useCallback } from "react";
import { isCardInSelectedFamilies } from "@/lib/chatThreads";
import {
  isCanvasItemSelected,
  type CanvasSelectionKind,
} from "@/lib/canvasSelection";
import { useCanvasStore } from "@/lib/store";

/**
 * Whether a connector belongs to the current selection, and so rises to the
 * top of the canvas with it: a selected card (or any card in a selected
 * family), or a selected node. A raised card never has its own links drawn
 * underneath another card — or under a group's well.
 */
export function useLiftedConnector() {
  const selectedFamilyRootIds = useCanvasStore((s) => s.selectedFamilyRootIds);
  const canvasSelection = useCanvasStore((s) => s.canvasSelection);
  const selectedArtifactId = useCanvasStore((s) => s.selectedCanvasArtifactId);
  const activeGroupId = useCanvasStore((s) => s.activeGroupId);
  return useCallback(
    (
      cardId: string,
      node?: { kind: CanvasSelectionKind | "group"; id: string },
    ) => {
      const st = useCanvasStore.getState();
      if (isCardInSelectedFamilies(st, cardId, selectedFamilyRootIds)) return true;
      if (!node) return false;
      if (node.kind === "group") return node.id === activeGroupId;
      if (node.kind === "artifact" && node.id === selectedArtifactId) return true;
      return isCanvasItemSelected(canvasSelection, node.kind, node.id);
    },
    [selectedFamilyRootIds, canvasSelection, selectedArtifactId, activeGroupId],
  );
}

/** z for a selection's plug links: above every node, raised ones included. */
export const LIFTED_CONNECTOR_Z = 1000;
