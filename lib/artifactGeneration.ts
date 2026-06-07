import type { EmittedArtifact } from "@/lib/artifactTypes";
import { commitCardArtifact } from "@/lib/commitCardArtifact";
import { applyEmittedArtifact } from "@/lib/dummyLLM";
import { getLatestVersion, getVersionById, resolveEditingArtifactId } from "@/lib/sessionArtifacts";
import { useCanvasStore } from "@/lib/store";

export function handleStreamArtifact(cardId: string, emitted: EmittedArtifact) {
  const applied = applyEmittedArtifact(emitted);
  useCanvasStore.getState().updateCard(cardId, {
    responseType: applied.responseType,
    artifactPayload: applied.artifactPayload,
  });
}

export function handleArtifactOnDone(cardId: string): string | null {
  const result = commitCardArtifact(cardId);
  if (result) {
    useCanvasStore
      .getState()
      .spawnCanvasArtifact(result.artifactId, result.versionId, { focus: true });
    return result.artifactId;
  }
  return null;
}

export function resolveEditingPayloadForApi(cardId: string): {
  artifactId: string;
  payload: unknown;
} | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return null;

  const artifactId = resolveEditingArtifactId(
    card,
    state.cards,
    state.connections,
    state.cardOrder,
  );
  if (!artifactId) return null;

  const art = state.sessionArtifacts[artifactId];
  if (!art) return null;

  const attachVid = card.attachedArtifacts?.[0]?.versionId;
  const ver = attachVid
    ? getVersionById(art, attachVid)
    : getLatestVersion(art);
  const latest = ver ?? getLatestVersion(art);

  if (!latest) return null;

  return { artifactId, payload: latest.payload };
}
