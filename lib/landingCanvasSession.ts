import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/** Isolate landing-page canvas demos from cloud persistence while the page is open. */
export function beginLandingCanvasSession(saved: CanvasSnapshotSource): void {
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

export function endLandingCanvasSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isLandingCanvasSessionActive(): boolean {
  return sessionActive;
}
