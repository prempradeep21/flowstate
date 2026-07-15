import { describe, expect, it } from "vitest";
import {
  shouldRestoreCanvasLocalBackup,
  type CanvasLocalBackup,
} from "@/lib/canvasLocalBackup";
import {
  buildEmptyCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";

const USER = "user-1";
const DB_UPDATED_AT = "2026-07-15T16:00:00.000Z";
const DB_MS = new Date(DB_UPDATED_AT).getTime();

function snapshotWithCards(count: number): CanvasSnapshot {
  const snapshot = buildEmptyCanvasSnapshot();
  for (let i = 0; i < count; i += 1) {
    const id = `card-${i}`;
    snapshot.cards[id] = {
      id,
      threadId: "t1",
      question: "q",
      answer: "a",
      status: "done",
      position: { x: 0, y: 0 },
      parentCardId: null,
      parentConversationId: null,
    };
    snapshot.cardOrder.push(id);
  }
  return snapshot;
}

function backup(overrides: Partial<CanvasLocalBackup>): CanvasLocalBackup {
  return {
    canvasId: "canvas-1",
    userId: USER,
    writtenAt: DB_MS + 60_000,
    dbUpdatedAt: DB_UPDATED_AT,
    snapshot: snapshotWithCards(3),
    ...overrides,
  };
}

describe("shouldRestoreCanvasLocalBackup", () => {
  it("restores a backup taken on top of the loaded row version with unsaved changes", () => {
    expect(
      shouldRestoreCanvasLocalBackup(
        backup({}),
        USER,
        DB_UPDATED_AT,
        snapshotWithCards(1),
      ),
    ).toBe(true);
  });

  it("rejects a backup whose base row version does not match, even if richer and newer", () => {
    // The poison case: a backup mis-paired with this canvas id during a
    // switch carries another canvas's (richer) content and a stale base.
    expect(
      shouldRestoreCanvasLocalBackup(
        backup({
          dbUpdatedAt: "2026-07-15T15:00:00.000Z",
          writtenAt: DB_MS + 120_000,
          snapshot: snapshotWithCards(50),
        }),
        USER,
        DB_UPDATED_AT,
        snapshotWithCards(1),
      ),
    ).toBe(false);
  });

  it("rejects a backup with a null base version (pre-fix backups)", () => {
    expect(
      shouldRestoreCanvasLocalBackup(
        backup({ dbUpdatedAt: null, snapshot: snapshotWithCards(50) }),
        USER,
        DB_UPDATED_AT,
        snapshotWithCards(1),
      ),
    ).toBe(false);
  });

  it("uses richness as a tiebreak only when the base version matches", () => {
    // Same base version, written within the 500ms window of the row save —
    // richer backup wins (interrupted save left more content locally).
    expect(
      shouldRestoreCanvasLocalBackup(
        backup({ writtenAt: DB_MS + 100, snapshot: snapshotWithCards(5) }),
        USER,
        DB_UPDATED_AT,
        snapshotWithCards(2),
      ),
    ).toBe(true);
    // Same base version but poorer content — DB wins.
    expect(
      shouldRestoreCanvasLocalBackup(
        backup({ writtenAt: DB_MS + 100, snapshot: snapshotWithCards(1) }),
        USER,
        DB_UPDATED_AT,
        snapshotWithCards(2),
      ),
    ).toBe(false);
  });

  it("rejects a backup from a different user", () => {
    expect(
      shouldRestoreCanvasLocalBackup(
        backup({ userId: "someone-else" }),
        USER,
        DB_UPDATED_AT,
        snapshotWithCards(1),
      ),
    ).toBe(false);
  });
});
