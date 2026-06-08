"use client";

import { useCanvasSounds } from "@/hooks/useCanvasSounds";

/** Mounts the canvas sound subscriber once for the whole app. */
export function CanvasSoundBridge() {
  useCanvasSounds();
  return null;
}
