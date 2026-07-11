import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";

const BACKUP_PREFIX = "flowstate:canvas-backup:";

export interface CanvasLocalBackup {
  canvasId: string;
  userId: string;
  writtenAt: number;
  dbUpdatedAt: string | null;
  snapshot: CanvasSnapshot;
}

function backupKey(canvasId: string): string {
  return `${BACKUP_PREFIX}${canvasId}`;
}

export function writeCanvasLocalBackup(backup: CanvasLocalBackup): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(backupKey(backup.canvasId), JSON.stringify(backup));
  } catch {
    // Quota or private mode — persistence to Supabase remains primary.
  }
}

export function readCanvasLocalBackup(canvasId: string): CanvasLocalBackup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(backupKey(canvasId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CanvasLocalBackup>;
    const snapshot = parseCanvasSnapshot(parsed.snapshot);
    if (
      !parsed.canvasId ||
      !parsed.userId ||
      typeof parsed.writtenAt !== "number" ||
      !snapshot
    ) {
      return null;
    }
    return {
      canvasId: parsed.canvasId,
      userId: parsed.userId,
      writtenAt: parsed.writtenAt,
      dbUpdatedAt:
        typeof parsed.dbUpdatedAt === "string" ? parsed.dbUpdatedAt : null,
      snapshot,
    };
  } catch {
    return null;
  }
}

export function clearCanvasLocalBackup(canvasId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(backupKey(canvasId));
  } catch {
    // ignore
  }
}

/** True when a local backup should win over the row loaded from Supabase. */
export function shouldRestoreCanvasLocalBackup(
  backup: CanvasLocalBackup,
  userId: string,
  dbUpdatedAt: string,
  dbSnapshot: CanvasSnapshot,
): boolean {
  if (backup.userId !== userId) return false;
  const dbMs = new Date(dbUpdatedAt).getTime();
  if (Number.isFinite(dbMs) && backup.writtenAt > dbMs + 500) return true;
  return backupRichness(backup.snapshot) > backupRichness(dbSnapshot);
}

function backupRichness(snapshot: CanvasSnapshot): number {
  return (
    snapshot.cardOrder.length +
    (snapshot.canvasAssetOrder?.length ?? 0) +
    (snapshot.canvasArtifactOrder?.length ?? 0) +
    (snapshot.canvasGifOrder?.length ?? 0) +
    (snapshot.canvas3DOrder?.length ?? 0) +
    (snapshot.canvasTextLabelOrder?.length ?? 0) +
    Object.keys(snapshot.sessionArtifacts).length
  );
}
