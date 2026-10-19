"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CANVAS_TUNING } from "@/lib/canvasTuning";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasNodesState } from "@/hooks/useCanvasNodesState";
import type { BranchGroup } from "@/lib/store";

/** Stable bounds for a group — avoids zustand selector returning new objects each call. */
export function useGroupBounds(group: BranchGroup) {
  const nodesState = useCanvasNodesState();

  const groupBoundsPadding = DEFAULT_CANVAS_TUNING.groupBoundsPadding;

  // The heading band is measured in the rendered font; re-measure once web
  // fonts land so a fallback-font line count does not stick.
  const [fontsReady, setFontsReady] = useState(
    () => typeof document === "undefined" || document.fonts?.status === "loaded",
  );
  useEffect(() => {
    if (fontsReady || !group.headingText) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fontsReady, group.headingText]);

  return useMemo(
    () => computeGroupBounds(nodesState, group, groupBoundsPadding),
    // fontsReady only invalidates the memo; the measure reads the DOM itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodesState, group, groupBoundsPadding, fontsReady],
  );
}
