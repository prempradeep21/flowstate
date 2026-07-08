import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/** Isolate sandbox canvas from cloud persistence while the dev page is open. */
export function beginMobileSdlcSandboxSession(saved: CanvasSnapshotSource): void {
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

export function endMobileSdlcSandboxSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isMobileSdlcSandboxSessionActive(): boolean {
  return sessionActive;
}
