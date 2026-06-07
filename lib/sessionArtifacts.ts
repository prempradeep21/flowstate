import type { ArtifactPayload, ArtifactKind } from "@/lib/artifactTypes";
import {
  imagesPayloadFromCardImages,
  payloadToArtifactKind,
  videoPayloadToImages,
} from "@/lib/artifactTypes";
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
): ArtifactPayload {
  if (payload.type === "video") {
    return videoPayloadToImages(payload);
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
  const normalized = normalizePayloadForRegistry(payload);
  const nextNum =
    (artifact.versions[artifact.versions.length - 1]?.number ?? 0) + 1;
  const version = createVersionEntry(normalized, sourceCardId, nextNum);
  return {
    artifact: {
      ...artifact,
      title: normalized.title || artifact.title,
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

export function listSessionArtifacts(
  artifacts: Record<string, SessionArtifact>,
): SessionArtifact[] {
  return Object.values(artifacts).sort((a, b) => {
    const bCreated = getLatestVersion(b)?.createdAt ?? 0;
    const aCreated = getLatestVersion(a)?.createdAt ?? 0;
    return bCreated - aCreated;
  });
}
