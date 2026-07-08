import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/** Isolate design-system demos from cloud persistence while the dev page is open. */
export function beginDesignSystemSandboxSession(
  saved: CanvasSnapshotSource,
): void {
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

export function endDesignSystemSandboxSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isDesignSystemSandboxSessionActive(): boolean {
  return sessionActive;
}
