"use client";

import { useSyncExternalStore } from "react";
import {
  getRemotePresenceSnapshot,
  getRemotePresenceVersion,
  subscribeRemotePresence,
  type RemotePresenceMap,
} from "@/lib/remotePresenceStore";

const EMPTY_SERVER: RemotePresenceMap = {};

export function useRemotePresence(): RemotePresenceMap {
  return useSyncExternalStore(
    subscribeRemotePresence,
    getRemotePresenceSnapshot,
    () => EMPTY_SERVER,
  );
}

export function useRemotePresenceVersion(): number {
  return useSyncExternalStore(
    subscribeRemotePresence,
    getRemotePresenceVersion,
    () => 0,
  );
}
