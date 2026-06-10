import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/** Isolate catalog canvas from cloud persistence while the dev page is open. */
export function beginArtifactCatalogSession(saved: CanvasSnapshotSource): void {
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

export function endArtifactCatalogSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isArtifactCatalogSessionActive(): boolean {
  return sessionActive;
}
