"use client";

import { useMemo } from "react";
import { DEFAULT_CANVAS_TUNING } from "@/lib/canvasTuning";
import { computeGroupBounds } from "@/lib/groupBounds";
import type { BranchGroup } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

/** Stable bounds for a group — avoids zustand selector returning new objects each call. */
export function useGroupBounds(group: BranchGroup) {
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const connections = useCanvasStore((s) => s.connections);
  const threads = useCanvasStore((s) => s.threads);
  const threadOrder = useCanvasStore((s) => s.threadOrder);

  const groupBoundsPadding = DEFAULT_CANVAS_TUNING.groupBoundsPadding;

  const familyKey = group.familyRootThreadIds.join(",");

  return useMemo(
    () =>
      computeGroupBounds(
        { cards, cardOrder, connections, threads, threadOrder },
        group,
        groupBoundsPadding,
      ),
    [
      cards,
      cardOrder,
      connections,
      threads,
      threadOrder,
      group.id,
      familyKey,
      groupBoundsPadding,
    ],
  );
}
