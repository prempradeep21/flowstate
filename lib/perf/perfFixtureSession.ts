import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/**
 * Isolate the perf-benchmark fixture canvas from cloud persistence while the
 * /dev/perf page is open. Mirrors the mobile-SDLC sandbox session pattern.
 */
export function beginPerfFixtureSession(saved: CanvasSnapshotSource): void {
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

export function endPerfFixtureSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isPerfFixtureSessionActive(): boolean {
  return sessionActive;
}
