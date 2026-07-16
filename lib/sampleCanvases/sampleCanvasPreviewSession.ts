import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/**
 * Isolate a previewed sample canvas from cloud persistence while a preview page
 * is open. Mirrors the artifact-catalog / perf-fixture session pattern.
 *
 * This matters more here than on the other fixture routes: the preview is
 * reachable from the admin portal by a signed-in admin whose own canvas is
 * already hydrated in the shared store. Without this guard, hydrating a sample
 * snapshot marks the store dirty and the autosave writes the sample straight
 * over whatever canvas the admin last had open.
 */
export function beginSampleCanvasPreviewSession(
  saved: CanvasSnapshotSource,
): void {
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

export function endSampleCanvasPreviewSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isSampleCanvasPreviewSessionActive(): boolean {
  return sessionActive;
}
