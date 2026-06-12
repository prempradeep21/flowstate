import type { CollaboratorPresence } from "@/lib/collaborationTypes";

export type RemotePresenceMap = Readonly<Record<string, CollaboratorPresence>>;

const EMPTY: RemotePresenceMap = {};

let remotePresence: RemotePresenceMap = EMPTY;
let version = 0;
const listeners = new Set<() => void>();

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
    result[key] = latest;
  }
  return result;
}

export function setRemotePresence(next: RemotePresenceMap): void {
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
