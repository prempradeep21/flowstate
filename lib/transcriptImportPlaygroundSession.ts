import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/** Isolate admin transcript-import playground from cloud persistence. */
export function beginTranscriptImportPlaygroundSession(
  saved: CanvasSnapshotSource,
): void {
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

export function endTranscriptImportPlaygroundSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isTranscriptImportPlaygroundSessionActive(): boolean {
  return sessionActive;
}
