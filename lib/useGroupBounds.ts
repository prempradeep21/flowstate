"use client";

import { useMemo } from "react";
import { DEFAULT_CANVAS_TUNING } from "@/lib/canvasTuning";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasNodesState } from "@/hooks/useCanvasNodesState";
import type { BranchGroup } from "@/lib/store";

/** Stable bounds for a group — avoids zustand selector returning new objects each call. */
export function useGroupBounds(group: BranchGroup) {
  const nodesState = useCanvasNodesState();

  const groupBoundsPadding = DEFAULT_CANVAS_TUNING.groupBoundsPadding;

  return useMemo(
    () => computeGroupBounds(nodesState, group, groupBoundsPadding),
    [nodesState, group, groupBoundsPadding],
  );
}
