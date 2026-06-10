"use client";

import { useThreadInactivityCollapse } from "@/hooks/useThreadInactivityCollapse";

/** Mounts the thread inactivity auto-collapse scheduler once for the whole app. */
export function CanvasInactivityBridge() {
  useThreadInactivityCollapse();
  return null;
}
