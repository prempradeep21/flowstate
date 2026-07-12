"use client";

import { useEffect, useState } from "react";
import {
  isViewportGestureActive,
  onGestureSettleHydrate,
} from "@/lib/viewportGesture";

/**
 * Gesture-time mount policy (Figma-style deferred fidelity).
 *
 * A node that mounts WHILE a viewport gesture is active (typically revealed
 * by culling during a zoom-out) returns `true` and should render its cheap
 * provisional stand-in — mounting the full subtree mid-gesture is the
 * dominant source of dropped frames and pop-in. After the gesture settles,
 * the hydration queue flips this to `false` (one re-render into the normal
 * content path), time-sliced across frames so dozens of reveals don't spike
 * a single settle frame.
 *
 * Nodes that mount while the canvas is idle hydrate immediately (initial
 * state is `false`), so normal spawns/loads are unaffected.
 */
export function useGestureProvisionalMount(): boolean {
  const [provisional, setProvisional] = useState(() =>
    isViewportGestureActive(),
  );
  useEffect(() => {
    if (!provisional) return;
    return onGestureSettleHydrate(() => setProvisional(false));
  }, [provisional]);
  return provisional;
}
