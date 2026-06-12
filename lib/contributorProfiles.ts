"use client";

import { useMemo } from "react";
import type { CanvasMember, CollaboratorProfile } from "@/lib/collaborationTypes";
import type { Card } from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

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

/** Unique contributor ids with the artifact creator (v1 author) first. */
export function artifactContributorIds(
  artifact: SessionArtifact,
  cards?: Record<string, Card>,
  ownerId?: string,
): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  const push = (id: string | undefined) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };

  const versions = Array.isArray(artifact.versions) ? artifact.versions : [];
  push(versions[0]?.createdByUserId);
  for (let i = 1; i < versions.length; i++) {
    push(versions[i]?.createdByUserId);
  }

  if (ids.length === 0) {
    const sourceCardId = versions[0]?.sourceCardId;
    const card = sourceCardId && cards ? cards[sourceCardId] : undefined;
    for (const contributorId of card?.contributorIds ?? []) {
      push(contributorId);
    }
  }

  if (ids.length === 0) {
    push(ownerId);
  }

  return ids;
}

export function artifactContributorProfiles(
  artifact: SessionArtifact,
  members: CanvasMember[],
  ownerId: string | undefined,
  cards?: Record<string, Card>,
): CollaboratorProfile[] {
  const ids = artifactContributorIds(artifact, cards, ownerId);
  return resolveContributorProfiles(
    ids.length > 0 ? ids : undefined,
    members,
    ownerId,
  );
}
