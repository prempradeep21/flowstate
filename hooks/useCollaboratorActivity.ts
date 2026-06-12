"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  formatCollaboratorStatusLabel,
  resolveCollaboratorActivity,
  type CollaboratorActivityStatus,
} from "@/lib/collaboratorActivity";
import {
  getLastSeenByUserIdSnapshot,
  getRemotePresenceSnapshot,
  getRemotePresenceVersion,
  subscribeRemotePresence,
} from "@/lib/remotePresenceStore";

const STATUS_REFRESH_MS = 30_000;

export interface CollaboratorActivityView {
  status: CollaboratorActivityStatus;
  lastSeenAt: number | null;
  label: string;
}

export function useCollaboratorActivity(
  userId: string,
  onlineUserIds: Set<string>,
): CollaboratorActivityView {
  useSyncExternalStore(
    subscribeRemotePresence,
    getRemotePresenceVersion,
    () => 0,
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(
      () => setNow(Date.now()),
      STATUS_REFRESH_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const remotePresence = getRemotePresenceSnapshot();
  const lastSeenByUserId = getLastSeenByUserIdSnapshot();
  const { status, lastSeenAt } = resolveCollaboratorActivity({
    userId,
    onlineUserIds,
    remotePresence,
    lastSeenByUserId,
    now,
  });

  return {
    status,
    lastSeenAt,
    label: formatCollaboratorStatusLabel(status, lastSeenAt, now),
  };
}

export function useCollaboratorActivityMap(
  userIds: string[],
  onlineUserIds: Set<string>,
): Record<string, CollaboratorActivityView> {
  useSyncExternalStore(
    subscribeRemotePresence,
    getRemotePresenceVersion,
    () => 0,
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(
      () => setNow(Date.now()),
      STATUS_REFRESH_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const remotePresence = getRemotePresenceSnapshot();
  const lastSeenByUserId = getLastSeenByUserIdSnapshot();
  const result: Record<string, CollaboratorActivityView> = {};

  for (const userId of userIds) {
    const { status, lastSeenAt } = resolveCollaboratorActivity({
      userId,
      onlineUserIds,
      remotePresence,
      lastSeenByUserId,
      now,
    });
    result[userId] = {
      status,
      lastSeenAt,
      label: formatCollaboratorStatusLabel(status, lastSeenAt, now),
    };
  }

  return result;
}
