"use client";

import { useMemo } from "react";
import type { CanvasMember, CollaboratorProfile } from "@/lib/collaborationTypes";

export function resolveContributorProfiles(
  contributorIds: string[] | undefined,
  members: CanvasMember[],
  ownerId: string | undefined,
): CollaboratorProfile[] {
  const ids =
    contributorIds && contributorIds.length > 0
      ? contributorIds
      : ownerId
        ? [ownerId]
        : [];

  const byId = new Map(members.map((m) => [m.userId, m.profile]));

  return ids
    .map((id) => byId.get(id))
    .filter((p): p is CollaboratorProfile => Boolean(p));
}

export function useContributorProfiles(
  contributorIds: string[] | undefined,
  members: CanvasMember[],
  ownerId: string | undefined,
): CollaboratorProfile[] {
  return useMemo(
    () => resolveContributorProfiles(contributorIds, members, ownerId),
    [contributorIds, members, ownerId],
  );
}

export function artifactContributorProfiles(
  artifact: { versions: { createdByUserId?: string }[] },
  members: CanvasMember[],
  ownerId: string | undefined,
): CollaboratorProfile[] {
  const ids = [
    ...new Set(
      artifact.versions
        .map((v) => v.createdByUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (ids.length === 0 && ownerId) {
    return resolveContributorProfiles([ownerId], members, ownerId);
  }
  return resolveContributorProfiles(ids, members, ownerId);
}
