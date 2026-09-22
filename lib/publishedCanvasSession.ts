import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

let sessionActive = false;
let adopted = false;
let restoreSnapshot: CanvasSnapshotSource | null = null;

/**
 * Isolates a published canvas (/c/<slug>) from cloud persistence.
 *
 * The signed-OUT reader needs no protection — autosave is already inert for a
 * guest. The danger is the SIGNED-IN visitor: they are not ephemeral, so
 * hydrating the published snapshot marks the store dirty and the autosave
 * writes a stranger's canvas straight over their own. This is the highest-
 * consequence failure in the whole publish feature, and it is silent.
 *
 * While a session is active the visitor's real canvas is stashed, autosave is
 * suppressed, and the real canvas is hydrated back on unmount.
 */
export function beginPublishedCanvasSession(saved: CanvasSnapshotSource): void {
  sessionActive = true;
  adopted = false;
  restoreSnapshot = JSON.parse(JSON.stringify(saved)) as CanvasSnapshotSource;
}

/**
 * Hands the store back to cloud persistence: a signed-in visitor's fork is
 * becoming a canvas of their own.
 *
 * Called BEFORE the insert, not after, because it is also the mutex — the
 * adopt path re-entering (a second mutation flipping `forked`, React
 * re-running the effect) must not create a second canvas.
 *
 * The restore stash is deliberately kept: it is the rollback token if the
 * insert fails, and `isPublishedCanvasAdopted` is what tells unmount to leave
 * the adopted fork alone instead of hydrating the old canvas back over it.
 */
export function adoptPublishedCanvasSession(): void {
  sessionActive = false;
  adopted = true;
}

/** Roll back an adoption that never produced a canvas, re-muting autosave. */
export function releasePublishedCanvasAdoption(): void {
  if (!restoreSnapshot) return;
  sessionActive = true;
  adopted = false;
}

export function endPublishedCanvasSession(): CanvasSnapshotSource | null {
  sessionActive = false;
  adopted = false;
  const snap = restoreSnapshot;
  restoreSnapshot = null;
  return snap;
}

export function isPublishedCanvasSessionActive(): boolean {
  return sessionActive;
}

/**
 * True from the moment a published canvas is adopted until the page unmounts.
 *
 * The session is over — saves must flow — but the normal canvas load must
 * still stand down: it would hydrate the visitor's last canvas straight over
 * the copy they just made.
 */
export function isPublishedCanvasAdopted(): boolean {
  return adopted;
}
