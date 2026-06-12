import { describe, expect, it } from "vitest";
import {
  mergePresencePayload,
  PRESENCE_BROADCAST_INTERVAL_MS,
  PRESENCE_MAX_FLUSHES_PER_SEC,
  PRESENCE_MIN_MOVE_WORLD_PX,
  PRESENCE_OFF_SCREEN,
  shouldFlushPresence,
} from "@/lib/collaboratorPresenceBroadcast";
import type { CollaboratorPresence } from "@/lib/collaborationTypes";

const basePayload: CollaboratorPresence = {
  userId: "user-1",
  displayName: "Test User",
  color: "#ff0000",
  worldX: 0,
  worldY: 0,
  updatedAt: 0,
};

describe("shouldFlushPresence", () => {
  it("does not flush when nothing is dirty", () => {
    expect(
      shouldFlushPresence({
        now: 1000,
        lastFlushAt: 900,
        lastWorldX: 0,
        lastWorldY: 0,
        nextWorldX: 10,
        nextWorldY: 10,
        viewportScale: 1,
        dirty: false,
      }),
    ).toBe(false);
  });

  it("flushes the first sample immediately", () => {
    expect(
      shouldFlushPresence({
        now: 1000,
        lastFlushAt: 0,
        lastWorldX: PRESENCE_OFF_SCREEN,
        lastWorldY: PRESENCE_OFF_SCREEN,
        nextWorldX: 12,
        nextWorldY: 8,
        viewportScale: 1,
        dirty: true,
      }),
    ).toBe(true);
  });

  it("waits for the broadcast interval when movement is below threshold", () => {
    expect(
      shouldFlushPresence({
        now: 1010,
        lastFlushAt: 1000,
        lastWorldX: 0,
        lastWorldY: 0,
        nextWorldX: 0.2,
        nextWorldY: 0.2,
        viewportScale: 1,
        dirty: true,
      }),
    ).toBe(false);
  });

  it("does not flush sub-pixel movement after the broadcast interval", () => {
    expect(
      shouldFlushPresence({
        now: 1000 + PRESENCE_BROADCAST_INTERVAL_MS + 1,
        lastFlushAt: 1000,
        lastWorldX: 0,
        lastWorldY: 0,
        nextWorldX: 0.2,
        nextWorldY: 0.2,
        viewportScale: 1,
        dirty: true,
      }),
    ).toBe(false);
  });

  it("scales the movement threshold with viewport zoom", () => {
    const minInterval = 1000 / PRESENCE_MAX_FLUSHES_PER_SEC;

    expect(
      shouldFlushPresence({
        now: 1000 + minInterval + 1,
        lastFlushAt: 1000,
        lastWorldX: 0,
        lastWorldY: 0,
        nextWorldX: 0.4,
        nextWorldY: 0,
        viewportScale: 2,
        dirty: true,
      }),
    ).toBe(false);

    expect(
      shouldFlushPresence({
        now: 1000 + minInterval + 1,
        lastFlushAt: 1000,
        lastWorldX: 0,
        lastWorldY: 0,
        nextWorldX: PRESENCE_MIN_MOVE_WORLD_PX,
        nextWorldY: 0,
        viewportScale: 2,
        dirty: true,
      }),
    ).toBe(true);
  });

  it("enforces the max flush rate cap", () => {
    const minInterval = 1000 / PRESENCE_MAX_FLUSHES_PER_SEC;
    expect(
      shouldFlushPresence({
        now: 1000 + minInterval - 1,
        lastFlushAt: 1000,
        lastWorldX: 0,
        lastWorldY: 0,
        nextWorldX: 100,
        nextWorldY: 100,
        viewportScale: 1,
        dirty: true,
      }),
    ).toBe(false);
  });
});

describe("mergePresencePayload", () => {
  it("merges world coordinates and timestamp into the base payload", () => {
    expect(
      mergePresencePayload(basePayload, 42, 84, 1234),
    ).toEqual({
      ...basePayload,
      worldX: 42,
      worldY: 84,
      updatedAt: 1234,
    });
  });
});
