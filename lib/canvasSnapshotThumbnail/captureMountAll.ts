import { useSyncExternalStore } from "react";

/**
 * While a dashboard thumbnail is being captured, viewport culling must stand
 * down: the capture renders the WHOLE canvas at fit-to-content, but culling
 * unmounts offscreen cards/labels/skills and content-visibility-hides offscreen
 * artifacts — they would come out missing (or as blank boxes) in the image.
 *
 * A module-level flag rather than store state so flipping it re-renders only
 * the node layer that reads it, never the canvas's other store subscribers.
 */
let mountAll = false;
const listeners = new Set<() => void>();

export function setCaptureMountAllNodes(next: boolean): void {
  if (mountAll === next) return;
  mountAll = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => mountAll;
const getServerSnapshot = () => false;

export function useCaptureMountAllNodes(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
