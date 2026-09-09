import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/**
 * Isolate admin transcript-import playground from cloud persistence.
 *
 * A repeat begin while the session is already active is ignored: by then the
 * store holds playground content, so re-stashing would make the restore on the
 * way out write the playground snapshot over the user's real canvas — which is
 * exactly how the Walt Disney and Electronics and Hardware canvases were lost.
 */
export function beginTranscriptImportPlaygroundSession(
  saved: CanvasSnapshotSource,
): void {
  if (sessionActive) return;
  sessionActive = true;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

/**
 * Put the user's real canvas back, then re-arm cloud persistence.
 *
 * The flag is cleared only after `restore` has run, so no save can ever observe
 * playground content with the guard down.
 */
export function endTranscriptImportPlaygroundSession(
  restore: (snapshot: CanvasSnapshotSource) => void,
): void {
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  try {
    if (snap) restore(snap);
  } finally {
    sessionActive = false;
  }
}

export function isTranscriptImportPlaygroundSessionActive(): boolean {
  return sessionActive;
}
