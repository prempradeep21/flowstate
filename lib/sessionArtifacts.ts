import type {
  ArtifactPayload,
  ArtifactKind,
  CalendarEvent,
} from "@/lib/artifactTypes";
import {
  imagesPayloadFromCardImages,
  payloadToArtifactKind,
  videoPayloadToImages,
} from "@/lib/artifactTypes";
import { normalizeChartPayload } from "@/lib/chartArtifact";
import {
  mergeCalendarEventsFromAi,
  normalizeCalendarEvent,
  normalizeCalendarPayload,
} from "@/lib/calendarArtifact";
import { normalizeTablePayload } from "@/lib/tableArtifact";
import {
  mergeTodoItemsFromAi,
  normalizeTodoItem,
  normalizeTodoPayload,
} from "@/lib/todoArtifact";
import { normalizeStreetViewPayload } from "@/lib/streetViewArtifact";
import { normalizeWebsitePayload } from "@/lib/websiteArtifact";
import { normalizeEmbedPayload } from "@/lib/embedArtifact";
import { normalizeRepoPayload } from "@/lib/repoArtifact";
import {
  mergeTimelineEventsFromAi,
  normalizeTimelineEvent,
  normalizeTimelinePayload,
} from "@/lib/timelineArtifact";
import type { Card, CardImage, Connection } from "@/lib/store";
import { getThreadCardChain } from "@/lib/chatThreads";

export interface ArtifactVersion {
  id: string;
  number: number;
  payload: ArtifactPayload;
  createdAt: number;
  sourceCardId: string;
  createdByUserId?: string;
}

export interface SessionArtifact {
  id: string;
  title: string;
  kind: ArtifactKind;
  versions: ArtifactVersion[];
  latestVersionId: string;
}

export interface AttachedArtifactRef {
  artifactId: string;
  versionId: string;
}

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function newArtifactVersionId() {
  return newId("aver");
}

export function newSessionArtifactId() {
  return newId("art");
}

export function getLatestVersion(
  artifact: SessionArtifact,
): ArtifactVersion | undefined {
  const versions = Array.isArray(artifact.versions) ? artifact.versions : [];
  if (versions.length === 0) return undefined;
  return (
    versions.find((v) => v.id === artifact.latestVersionId) ??
    versions[versions.length - 1]
  );
}

export function getVersionById(
  artifact: SessionArtifact,
  versionId: string,
): ArtifactVersion | undefined {
  const versions = Array.isArray(artifact.versions) ? artifact.versions : [];
  return versions.find((v) => v.id === versionId);
}

/** Next version number if a successful payload were committed now. */
export function getNextArtifactVersionNumber(
  artifact: SessionArtifact | undefined,
): number {
  if (!artifact) return 1;
  const versions = Array.isArray(artifact.versions) ? artifact.versions : [];
  if (versions.length === 0) return 1;
  return versions[versions.length - 1]!.number + 1;
}

/** Version label to show in previews while a turn is still in flight. */
export function resolvePreviewVersionNumber(
  card: Card,
  sessionArtifacts: Record<string, SessionArtifact>,
  cards: Record<string, Card>,
  connections: Connection[],
  cardOrder: string[],
): number {
  const targetId =
    card.outputArtifactId ??
    resolveEditingArtifactId(card, cards, connections, cardOrder);
  if (targetId) {
    return getNextArtifactVersionNumber(sessionArtifacts[targetId]);
  }
  return 1;
}

export function artifactDisplayTitle(
  artifact: SessionArtifact,
  version?: ArtifactVersion,
  activeCodeFilePath?: string,
): string {
  const v = version ?? getLatestVersion(artifact);
  if (!v) return artifact.title;
  if (artifact.kind === "code") {
    const files = v.payload.type === "code" ? v.payload.data.files : [];
    if (activeCodeFilePath) return activeCodeFilePath;
    return files[0]?.path ?? artifact.title;
  }
  return v.payload.title || artifact.title;
}

export function previewLabelForCard(
  artifacts: Record<string, SessionArtifact>,
  card: Card,
): string | null {
  if (card.outputArtifactId) {
    const art = artifacts[card.outputArtifactId];
    if (!art) return null;
    const ver = card.outputArtifactVersionId
      ? getVersionById(art, card.outputArtifactVersionId)
      : undefined;
    return artifactDisplayTitle(art, ver ?? getLatestVersion(art));
  }
  if (card.artifactPayload) {
    return card.artifactPayload.title;
  }
  return null;
}

export function buildImagesArtifactFromCard(
  images: CardImage[],
  title = "Images",
): ArtifactPayload {
  return imagesPayloadFromCardImages(images, title);
}

export function normalizePayloadForRegistry(
  payload: ArtifactPayload,
  previousPayload?: ArtifactPayload,
): ArtifactPayload {
  if (payload.type === "video") {
    return videoPayloadToImages(payload);
  }
  if (payload.type === "table") {
    return normalizeTablePayload(payload);
  }
  if (payload.type === "todo") {
    const normalized = normalizeTodoPayload(payload);
    if (previousPayload?.type === "todo") {
      const incomingItems = normalized.data.items.map((item) =>
        normalizeTodoItem(item),
      );
      return {
        ...normalized,
        data: {
          items: mergeTodoItemsFromAi(
            previousPayload.data.items,
            incomingItems,
          ),
        },
      };
    }
    return normalized;
  }
  if (payload.type === "calendar") {
    const normalized = normalizeCalendarPayload(payload);
    if (previousPayload?.type === "calendar") {
      const incomingEvents = normalized.data.events
        .map((event: CalendarEvent) => normalizeCalendarEvent(event))
        .filter((e): e is CalendarEvent => e !== null);
      return {
        ...normalized,
        data: {
          ...normalized.data,
          events: mergeCalendarEventsFromAi(
            previousPayload.data.events,
            incomingEvents,
          ),
        },
      };
    }
    return normalized;
  }
  if (payload.type === "streetview") {
    return normalizeStreetViewPayload(payload);
  }
  if (payload.type === "website") {
    return normalizeWebsitePayload(payload);
  }
  if (payload.type === "embed") {
    return normalizeEmbedPayload(payload);
  }
  if (payload.type === "repo") {
    return normalizeRepoPayload(payload);
  }
  if (payload.type === "chart") {
    return normalizeChartPayload(payload);
  }
  if (payload.type === "timeline") {
    const normalized = normalizeTimelinePayload(payload);
    if (previousPayload?.type === "timeline") {
      const incomingEvents = normalized.data.events
        .map((event) => normalizeTimelineEvent(event))
        .filter((e): e is NonNullable<typeof e> => e !== null);
      return {
        ...normalized,
        data: {
          ...normalized.data,
          events: mergeTimelineEventsFromAi(
            previousPayload.data.events,
            incomingEvents,
          ),
        },
      };
    }
    return normalized;
  }
  return payload;
}

export function createVersionEntry(
  payload: ArtifactPayload,
  sourceCardId: string,
  versionNumber: number,
): ArtifactVersion {
  const normalized = normalizePayloadForRegistry(payload);
  return {
    id: newArtifactVersionId(),
    number: versionNumber,
    payload: normalized,
    createdAt: Date.now(),
    sourceCardId,
  };
}

export function createSessionArtifactFromPayload(
  payload: ArtifactPayload,
  sourceCardId: string,
): SessionArtifact {
  const normalized = normalizePayloadForRegistry(payload);
  const version = createVersionEntry(normalized, sourceCardId, 1);
  const kind = payloadToArtifactKind(normalized);
  return {
    id: newSessionArtifactId(),
    title: normalized.title,
    kind,
    versions: [version],
    latestVersionId: version.id,
  };
}

export function appendArtifactVersion(
  artifact: SessionArtifact,
  payload: ArtifactPayload,
  sourceCardId: string,
): { artifact: SessionArtifact; versionId: string } {
  const latest = getLatestVersion(artifact);
  const normalized = normalizePayloadForRegistry(
    payload,
    latest?.payload,
  );
  const isFollowUpEdit = artifact.versions.length > 0;
  const versionPayload = isFollowUpEdit
    ? ({ ...normalized, title: artifact.title } as ArtifactPayload)
    : normalized;
  const nextNum =
    (artifact.versions[artifact.versions.length - 1]?.number ?? 0) + 1;
  const version = createVersionEntry(versionPayload, sourceCardId, nextNum);
  return {
    artifact: {
      ...artifact,
      title: isFollowUpEdit
        ? artifact.title
        : normalized.title || artifact.title,
      kind: payloadToArtifactKind(normalized),
      versions: [...artifact.versions, version],
      latestVersionId: version.id,
    },
    versionId: version.id,
  };
}

export function resolveThreadArtifactId(
  cards: Record<string, Card>,
  connections: Connection[],
  cardOrder: string[],
  threadId: string,
): string | null {
  const chain = getThreadCardChain(
    { cards, connections, cardOrder, threads: {}, threadOrder: [] },
    threadId,
  );
  for (let i = chain.length - 1; i >= 0; i--) {
    const c = cards[chain[i]];
    if (c?.outputArtifactId) return c.outputArtifactId;
  }
  return null;
}

/** Walk the parent chain (then thread) to find an artifact a follow-up should edit. */
export function resolveInheritedArtifactIdForParent(
  parentId: string,
  cards: Record<string, Card>,
  connections: Connection[],
  cardOrder: string[],
): string | undefined {
  let pid: string | null | undefined = parentId;
  while (pid) {
    const c = cards[pid];
    if (!c) break;
    if (c.outputArtifactId) return c.outputArtifactId;
    if (c.inheritedArtifactId) return c.inheritedArtifactId;
    pid = c.parentCardId ?? null;
  }
  const parent = cards[parentId];
  if (!parent) return undefined;
  return (
    resolveThreadArtifactId(cards, connections, cardOrder, parent.threadId) ??
    undefined
  );
}

export function resolveEditingArtifactId(
  card: Card,
  cards: Record<string, Card>,
  connections: Connection[],
  cardOrder: string[],
): string | null {
  if (card.attachedArtifacts?.[0]?.artifactId) {
    return card.attachedArtifacts[0].artifactId;
  }
  if (card.inheritedArtifactId) {
    return card.inheritedArtifactId;
  }

  let pid = card.parentCardId;
  while (pid) {
    const parent = cards[pid];
    if (!parent) break;
    if (parent.outputArtifactId) return parent.outputArtifactId;
    pid = parent.parentCardId ?? null;
  }

  return resolveThreadArtifactId(
    cards,
    connections,
    cardOrder,
    card.threadId,
  );
}

/** True when a new payload should append to an existing artifact (same kind). */
export function canAppendArtifactVersion(
  artifact: SessionArtifact | undefined,
  payload: ArtifactPayload,
): boolean {
  if (!artifact) return false;
  const normalized = normalizePayloadForRegistry(payload);
  return artifact.kind === payloadToArtifactKind(normalized);
}

/**
 * Resolve which session artifact should receive a new payload version.
 * Prefers attached/inherited/thread context so follow-ups update in place.
 */
export function resolveArtifactTargetId(
  card: Card,
  payload: ArtifactPayload,
  sessionArtifacts: Record<string, SessionArtifact>,
  cards: Record<string, Card>,
  connections: Connection[],
  cardOrder: string[],
): string | null {
  const editingId = resolveEditingArtifactId(
    card,
    cards,
    connections,
    cardOrder,
  );
  if (
    editingId &&
    canAppendArtifactVersion(sessionArtifacts[editingId], payload)
  ) {
    return editingId;
  }

  const kind = payloadToArtifactKind(normalizePayloadForRegistry(payload));
  if (kind === "map" || kind === "streetview") {
    const threadArtId = resolveThreadArtifactId(
      cards,
      connections,
      cardOrder,
      card.threadId,
    );
    const threadArt = threadArtId ? sessionArtifacts[threadArtId] : undefined;
    if (threadArt && canAppendArtifactVersion(threadArt, payload)) {
      return threadArtId;
    }
  }

  if (
    card.outputArtifactId &&
    canAppendArtifactVersion(sessionArtifacts[card.outputArtifactId], payload)
  ) {
    return card.outputArtifactId;
  }

  return null;
}

export function listSessionArtifacts(
  artifacts: Record<string, SessionArtifact>,
): SessionArtifact[] {
  return Object.values(artifacts).sort((a, b) => {
    const bCreated = getLatestVersion(b)?.createdAt ?? 0;
    const aCreated = getLatestVersion(a)?.createdAt ?? 0;
    return bCreated - aCreated;
  });
}
