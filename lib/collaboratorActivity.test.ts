import { describe, expect, it } from "vitest";
import {
  formatCollaboratorStatusLabel,
  formatLastSeen,
  PRESENCE_INACTIVE_MS,
  resolveCollaboratorActivity,
} from "@/lib/collaboratorActivity";

describe("resolveCollaboratorActivity", () => {
  const now = 1_000_000;

  it("marks connected collaborators with recent cursor data as active", () => {
    const result = resolveCollaboratorActivity({
      userId: "u1",
      onlineUserIds: new Set(["u1"]),
      remotePresence: {
        u1: {
          userId: "u1",
          displayName: "A",
          color: "#000",
          worldX: 10,
          worldY: 20,
          updatedAt: now - 30_000,
        },
      },
      lastSeenByUserId: {},
      now,
    });
    expect(result.status).toBe("active");
  });

  it("marks connected collaborators as inactive after one minute without cursor movement", () => {
    const lastSeen = now - PRESENCE_INACTIVE_MS - 1;
    const result = resolveCollaboratorActivity({
      userId: "u1",
      onlineUserIds: new Set(["u1"]),
      remotePresence: {
        u1: {
          userId: "u1",
          displayName: "A",
          color: "#000",
          worldX: 10,
          worldY: 20,
          updatedAt: lastSeen,
        },
      },
      lastSeenByUserId: {},
      now,
    });
    expect(result.status).toBe("inactive");
    expect(result.lastSeenAt).toBe(lastSeen);
  });

  it("marks disconnected collaborators as offline while preserving last seen", () => {
    const result = resolveCollaboratorActivity({
      userId: "u1",
      onlineUserIds: new Set(),
      remotePresence: {},
      lastSeenByUserId: { u1: now - 120_000 },
      now,
    });
    expect(result.status).toBe("offline");
    expect(result.lastSeenAt).toBe(now - 120_000);
  });
});

describe("formatCollaboratorStatusLabel", () => {
  it("formats active, away, and offline labels", () => {
    const now = 1_000_000;
    expect(formatCollaboratorStatusLabel("active", now, now)).toBe(
      "Active now",
    );
    expect(
      formatCollaboratorStatusLabel("inactive", now - 120_000, now),
    ).toBe("Away · Last seen 2m ago");
    expect(
      formatCollaboratorStatusLabel("offline", now - 120_000, now),
    ).toBe("Offline · Last seen 2m ago");
  });
});

describe("formatLastSeen", () => {
  it("formats relative timestamps", () => {
    const now = 1_000_000;
    expect(formatLastSeen(now - 30_000, now)).toBe("just now");
    expect(formatLastSeen(now - 120_000, now)).toBe("2m ago");
  });
});
