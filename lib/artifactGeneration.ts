import type { EmittedArtifact } from "@/lib/artifactTypes";
import { commitCardArtifact } from "@/lib/commitCardArtifact";
import { findCanvasNodeByArtifactId } from "@/lib/canvasArtifacts";
import { applyEmittedArtifact } from "@/lib/dummyLLM";
import {
  getLatestVersion,
  getVersionById,
  resolveEditingArtifactId,
} from "@/lib/sessionArtifacts";
import { useCanvasStore } from "@/lib/store";

export function handleStreamArtifact(cardId: string, emitted: EmittedArtifact) {
  const applied = applyEmittedArtifact(emitted);
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  const payload = applied.artifactPayload;

  if (payload?.type === "table" && card?.outputArtifactId) {
    const art = state.sessionArtifacts[card.outputArtifactId];
    if (art?.kind === "table") {
      const { versionId } = state.createArtifactVersion(
        card.outputArtifactId,
        payload,
        cardId,
      );
      const node = findCanvasNodeByArtifactId(
        state.canvasArtifactNodes,
        card.outputArtifactId,
      );
      if (node) {
        state.setCanvasArtifactVersion(node.id, versionId);
      }
      state.updateCard(cardId, {
        responseType: applied.responseType,
        artifactPayload: payload,
        outputArtifactVersionId: versionId,
      });
      return;
    }
  }

  state.updateCard(cardId, {
    responseType: applied.responseType,
    artifactPayload: payload,
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
