"use client";

import { useCanvasStore } from "@/lib/store";

/**
 * Movable units in the current selection — each thread family counts as one,
 * matching `getCanvasSelectionUnitCount`.
 *
 * Nodes use this to tell "I am the selection" from "I am one member of a
 * multi-selection". Members hand their chrome over to the shared
 * SelectionBoundsBox: they keep an accent outline so you can see what is in
 * the set, but drop their own resize grips so the canvas shows one set of
 * bounds instead of N.
 */
export function useCanvasSelectionUnitCount(): number {
  return useCanvasStore(
    (s) => s.selectedFamilyRootIds.length + s.canvasSelection.length,
  );
}
