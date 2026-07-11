import type { RemotePresenceMap } from "@/lib/remotePresenceStore";

/** Cursor stillness threshold before a connected collaborator is considered away. */
export const PRESENCE_INACTIVE_MS = 60_000;

export type CollaboratorActivityStatus = "active" | "inactive" | "offline";

export function formatLastSeen(timestampMs: number, now = Date.now()): string {
  const sec = Math.max(0, Math.floor((now - timestampMs) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export function formatCollaboratorStatusLabel(
  status: CollaboratorActivityStatus,
  lastSeenAt: number | null,
  now = Date.now(),
): string {
  switch (status) {
    case "active":
      return "Active now";
    case "inactive":
      return lastSeenAt
        ? `Away · Last seen ${formatLastSeen(lastSeenAt, now)}`
        : "Away";
    case "offline":
      return lastSeenAt
        ? `Offline · Last seen ${formatLastSeen(lastSeenAt, now)}`
        : "Offline";
  }
}

export function resolveCollaboratorActivity(args: {
  userId: string;
  onlineUserIds: Set<string>;
  remotePresence: RemotePresenceMap;
  lastSeenByUserId: Readonly<Record<string, number>>;
  now?: number;
}): { status: CollaboratorActivityStatus; lastSeenAt: number | null } {
  const now = args.now ?? Date.now();
  const presence = args.remotePresence[args.userId];
  const lastSeenAt =
    presence?.updatedAt ?? args.lastSeenByUserId[args.userId] ?? null;

  if (!args.onlineUserIds.has(args.userId)) {
    return { status: "offline", lastSeenAt };
  }

  if (presence && now - presence.updatedAt <= PRESENCE_INACTIVE_MS) {
    return { status: "active", lastSeenAt: presence.updatedAt };
  }

  return { status: "inactive", lastSeenAt };
}

export function collaboratorStatusDotClass(
  status: CollaboratorActivityStatus,
): string {
  switch (status) {
    case "active":
      return "bg-canvas-success";
    case "inactive":
      return "bg-amber-400";
    case "offline":
      return "bg-canvas-muted/60";
  }
}
