"use client";

import { useEffect } from "react";
import { FROST_MIN_WIDTH } from "@/components/frost/FrostArtifactNode";
import type { ArtifactKind } from "@/lib/artifactTypes";
import { getNodeDragFrame } from "@/lib/gesture/gestureLayer";
import {
  isBentoHeld,
  onBentoRelease,
  planBentoGroup,
  planMastheadStack,
  planSpineShifts,
  type BentoFamily,
} from "@/lib/groupBento";
import { MASTHEAD_ARTIFACT_KINDS } from "@/lib/transcriptArtifacts";
import { CHAPTER_GAP_X } from "@/lib/transcriptImport/chapterLayout";
import { useCanvasStore } from "@/lib/store";

/** How long the grid's move/resize transition runs (matches globals.css). */
const BENTO_TWEEN_MS = 460;
/** Size writes arrive in bursts (a style swap re-measures every card). */
const SETTLE_MS = 90;

const frostMinWidth = (kind: string) =>
  FROST_MIN_WIDTH[kind as ArtifactKind] ?? 0;

let tweenTimer: ReturnType<typeof setTimeout> | null = null;

/** Let the next geometry writes glide instead of jump (see globals.css). */
function startBentoTween() {
  const root = document.documentElement;
  root.dataset.bentoTween = "";
  if (tweenTimer) clearTimeout(tweenTimer);
  tweenTimer = setTimeout(() => {
    delete root.dataset.bentoTween;
    tweenTimer = null;
  }, BENTO_TWEEN_MS + 60);
}

/**
 * Keeps every bento group (lib/groupBento) packed: whenever a member's size
 * changes — a style swap, a card re-measure, a corner drag let go — the
 * group's artifacts re-pack, moving and resizing with a short transition.
 */
export function useGroupBento(family: BentoFamily) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      timer = null;
      // Never re-pack under a live gesture; try again once it ends.
      if (isBentoHeld() || getNodeDragFrame()) {
        schedule(200);
        return;
      }
      const st = useCanvasStore.getState();
      let tweening = false;
      for (const group of Object.values(st.groups)) {
        const plan = planBentoGroup({
          group,
          cards: st.cards,
          nodes: st.canvasArtifactNodes,
          sessionArtifacts: st.sessionArtifacts,
          family,
          frostMinWidth,
        });
        if (!plan) continue;
        if (
          Object.keys(plan.patches).length === 0 &&
          plan.dividerY === undefined
        ) {
          continue;
        }
        if (!tweening) {
          startBentoTween();
          tweening = true;
        }
        useCanvasStore
          .getState()
          .applyBentoLayout(group.id, plan.patches, plan.dividerY);
      }
      // The masthead column restacks, then the chapters keep one gap apart,
      // whatever widths the packs gave.
      const mid = useCanvasStore.getState();
      const stack = planMastheadStack({
        groups: mid.groups,
        cards: mid.cards,
        nodes: mid.canvasArtifactNodes,
        sessionArtifacts: mid.sessionArtifacts,
        mastheadKinds: MASTHEAD_ARTIFACT_KINDS,
        gap: CHAPTER_GAP_X,
      });
      if (Object.keys(stack).length > 0) {
        if (!tweening) startBentoTween();
        tweening = true;
        mid.moveArtifactsTo(stack);
      }
      const after = useCanvasStore.getState();
      const shifts = planSpineShifts({
        groups: after.groups,
        cards: after.cards,
        nodes: after.canvasArtifactNodes,
        sessionArtifacts: after.sessionArtifacts,
        mastheadKinds: MASTHEAD_ARTIFACT_KINDS,
        gap: CHAPTER_GAP_X,
      });
      if (Object.keys(shifts).length > 0) {
        if (!tweening) startBentoTween();
        after.shiftGroupsX(shifts);
      }
    };

    const schedule = (ms = SETTLE_MS) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, ms);
    };

    schedule(0);
    const unsubscribe = useCanvasStore.subscribe((s, prev) => {
      if (
        s.canvasArtifactNodes !== prev.canvasArtifactNodes ||
        s.cards !== prev.cards ||
        s.groups !== prev.groups
      ) {
        schedule();
      }
    });
    const offRelease = onBentoRelease(() => schedule(0));
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      offRelease();
    };
  }, [family]);
}
