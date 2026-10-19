"use client";

import { type RefObject, startTransition, useEffect, useState } from "react";
import {
  isViewportGestureActive,
  onGestureSettleHydrate,
} from "@/lib/viewportGesture";

/**
 * Screen-space distance from an element to the window (0 when it overlaps).
 * Hydration order: what is on screen, or about to be, fills in first.
 */
function screenDistance(el: HTMLElement | null): number {
  if (!el) return Number.POSITIVE_INFINITY;
  const r = el.getBoundingClientRect();
  const dx = Math.max(0, -r.right, r.left - window.innerWidth);
  const dy = Math.max(0, -r.bottom, r.top - window.innerHeight);
  return dx + dy;
}

/**
 * Gesture-time mount policy (Figma-style deferred fidelity).
 *
 * A node that mounts WHILE a viewport gesture is active (revealed by culling
 * during a pan or zoom) returns `true` and should render its cheap
 * provisional stand-in — mounting many full subtrees in one gesture frame is
 * the dominant source of dropped frames. The hydration queue then flips this
 * to `false` a few nodes per frame, nearest the screen first, and keeps doing
 * so DURING the gesture for nodes on or near the screen: culling mounts nodes
 * in a band beyond the screen edge, so a pan finds them whole by the time
 * they scroll into view. The swap is a transition, so React time-slices a
 * heavy mount around gesture input instead of blocking whole frames.
 *
 * Pass the node's root ref so the queue can prioritise by screen distance.
 * Nodes that mount while the canvas is idle hydrate immediately (initial
 * state is `false`), so normal spawns/loads are unaffected.
 */
export function useGestureProvisionalMount(
  nodeRef?: RefObject<HTMLElement | null>,
): boolean {
  const [provisional, setProvisional] = useState(() =>
    isViewportGestureActive(),
  );
  useEffect(() => {
    if (!provisional) return;
    return onGestureSettleHydrate(
      () => startTransition(() => setProvisional(false)),
      nodeRef ? () => screenDistance(nodeRef.current) : undefined,
    );
  }, [provisional, nodeRef]);
  return provisional;
}
