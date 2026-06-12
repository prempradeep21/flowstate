import type { CollaboratorPresence } from "@/lib/collaborationTypes";

export type RemotePresenceMap = Readonly<Record<string, CollaboratorPresence>>;

const EMPTY: RemotePresenceMap = {};
const EMPTY_LAST_SEEN: Readonly<Record<string, number>> = {};

let remotePresence: RemotePresenceMap = EMPTY;
let lastSeenByUserId: Readonly<Record<string, number>> = EMPTY_LAST_SEEN;
let version = 0;
const listeners = new Set<() => void>();

function recordLastSeenFromPresence(next: RemotePresenceMap): void {
  let changed = false;
  let nextLastSeen: Record<string, number> | null = null;
  for (const [userId, presence] of Object.entries(next)) {
    const previous = lastSeenByUserId[userId] ?? 0;
    if (presence.updatedAt <= previous) continue;
    if (!changed) {
      nextLastSeen = { ...lastSeenByUserId };
      changed = true;
    }
    nextLastSeen![userId] = presence.updatedAt;
  }
  if (changed && nextLastSeen) lastSeenByUserId = nextLastSeen;
}

export function parsePresenceState(
  state: Record<string, CollaboratorPresence[]>,
  excludeUserId?: string,
): RemotePresenceMap {
  const result: Record<string, CollaboratorPresence> = {};
  for (const key of Object.keys(state)) {
    if (key === excludeUserId) continue;
    const entries = state[key];
    const latest = entries?.[entries.length - 1];
    if (!latest) continue;
    if (
      typeof latest.worldX !== "number" ||
      typeof latest.worldY !== "number"
    ) {
      continue;
    }
    result[key] = {
      ...latest,
      userId: latest.userId ?? key,
    };
  }
  return result;
}

export function setRemotePresence(next: RemotePresenceMap): void {
  recordLastSeenFromPresence(next);
  remotePresence = next;
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function clearRemotePresence(): void {
  if (remotePresence === EMPTY) return;
  remotePresence = EMPTY;
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeRemotePresence(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRemotePresenceSnapshot(): RemotePresenceMap {
  return remotePresence;
}

export function getRemotePresenceVersion(): number {
  return version;
}

export function getLastSeenByUserIdSnapshot(): Readonly<
  Record<string, number>
> {
  return lastSeenByUserId;
}
