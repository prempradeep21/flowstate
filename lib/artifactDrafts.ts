"use client";

import { create } from "zustand";
import {
  emittedToPayload,
  payloadToArtifactKind,
  type ArtifactKind,
  type ArtifactPayload,
  type EmittedArtifact,
} from "@/lib/artifactTypes";
import type { ArtifactDraftEvent } from "@/lib/llm/artifactDraftStream";
import { resolveEditingArtifactId } from "@/lib/sessionArtifacts";
import { useCanvasStore, type CanvasArtifactNode } from "@/lib/store";

/**
 * Live partial payloads for the skeletons a turn pops onto the canvas, keyed
 * by canvas node id. Kept out of the canvas store so streaming updates never
 * mark the canvas dirty or ride along in snapshots and undo history.
 */
interface ArtifactDraftState {
  drafts: Record<string, ArtifactPayload>;
  setDraft: (nodeId: string, payload: ArtifactPayload) => void;
  clearDraft: (nodeId: string) => void;
}

export const useArtifactDraftStore = create<ArtifactDraftState>((set) => ({
  drafts: {},
  setDraft: (nodeId, payload) =>
    set((state) => ({ drafts: { ...state.drafts, [nodeId]: payload } })),
  clearDraft: (nodeId) =>
    set((state) => {
      if (!(nodeId in state.drafts)) return state;
      const next = { ...state.drafts };
      delete next[nodeId];
      return { drafts: next };
    }),
}));

function draftKind(type: string): ArtifactKind {
  return type === "video" ? "images" : (type as ArtifactKind);
}

function isGeneratingFor(node: CanvasArtifactNode, cardId: string): boolean {
  return node.sourceCardId === cardId && !!node.generatingPreview && !node.artifactId;
}

/** The card is editing an existing artifact of this kind — it updates in place. */
export function isEditingKind(cardId: string, kind: ArtifactKind): boolean {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return false;
  const editingId = resolveEditingArtifactId(
    card,
    state.cards,
    state.connections,
    state.cardOrder,
    {
      artifactPlugConnections: state.artifactPlugConnections,
      canvasArtifactNodes: state.canvasArtifactNodes,
      plugComposerAttachments: state.plugComposerAttachments,
      sessionArtifacts: state.sessionArtifacts,
    },
  );
  return !!editingId && state.sessionArtifacts[editingId]?.kind === kind;
}

/**
 * Find the skeleton for this draft: the one already filling it, else an
 * unclaimed skeleton of the same kind (popped from the user's intent before
 * the model started writing), else pop a new one.
 */
function resolveDraftNode(
  cardId: string,
  draftId: string,
  kind: ArtifactKind,
  title: string,
): string | null {
  const store = useCanvasStore.getState();
  const nodes = Object.values(store.canvasArtifactNodes);
  const claimed = nodes.find(
    (n) => isGeneratingFor(n, cardId) && n.generatingPreview?.draftId === draftId,
  );
  if (claimed) return claimed.id;

  const unclaimed = nodes.find(
    (n) =>
      isGeneratingFor(n, cardId) &&
      n.generatingPreview?.kind === kind &&
      !n.generatingPreview.draftId,
  );
  if (unclaimed) return unclaimed.id;

  return store.spawnGeneratingArtifactPreview(cardId, kind, title);
}

function draftPayload(
  draft: ArtifactDraftEvent,
  title: string,
): ArtifactPayload | null {
  if (!draft.data) return null;
  try {
    return emittedToPayload({
      type: draft.type as EmittedArtifact["type"],
      title,
      description: draft.description,
      data: draft.data,
    });
  } catch {
    // Partial data a normalizer cannot read yet — keep the last good draft.
    return null;
  }
}

/** A chunk of a streamed emit_artifact call arrived. */
export function applyArtifactDraft(cardId: string, draft: ArtifactDraftEvent): void {
  const kind = draftKind(draft.type);
  if (isEditingKind(cardId, kind)) return;

  const card = useCanvasStore.getState().cards[cardId];
  if (!card) return;
  const title = draft.title?.trim() || card.question.slice(0, 48) || kind;

  const nodeId = resolveDraftNode(cardId, draft.id, kind, title);
  if (!nodeId) return;
  useCanvasStore
    .getState()
    .claimGeneratingArtifactPreview(nodeId, { draftId: draft.id, title: draft.title });

  const payload = draftPayload(draft, title);
  if (payload) useArtifactDraftStore.getState().setDraft(nodeId, payload);
}

/**
 * The server validated a streamed call and sent its final payload. Show it in
 * the skeleton right away — the artifact itself is created when the turn ends.
 */
export function applyFinalArtifactToDraft(
  cardId: string,
  draftId: string | undefined,
  emitted: EmittedArtifact,
): void {
  if (!draftId) return;
  const node = Object.values(useCanvasStore.getState().canvasArtifactNodes).find(
    (n) => isGeneratingFor(n, cardId) && n.generatingPreview?.draftId === draftId,
  );
  if (!node) return;
  try {
    const payload = emittedToPayload(emitted);
    if (payloadToArtifactKind(payload) !== node.generatingPreview?.kind) return;
    useArtifactDraftStore.getState().setDraft(node.id, payload);
  } catch {
    // leave the last streamed draft in place
  }
}

/** The server rejected a streamed call — drop the skeleton it was filling. */
export function discardArtifactDraft(cardId: string, draftId: string): void {
  const store = useCanvasStore.getState();
  const node = Object.values(store.canvasArtifactNodes).find(
    (n) => isGeneratingFor(n, cardId) && n.generatingPreview?.draftId === draftId,
  );
  if (!node) return;
  useArtifactDraftStore.getState().clearDraft(node.id);
  store.removeCanvasArtifact(node.id);
}

/** Forget drafts whose skeletons have been filled by real artifacts or removed. */
export function pruneArtifactDrafts(): void {
  const nodes = useCanvasStore.getState().canvasArtifactNodes;
  const { drafts, clearDraft } = useArtifactDraftStore.getState();
  for (const nodeId of Object.keys(drafts)) {
    const node = nodes[nodeId];
    if (!node?.generatingPreview || node.artifactId) clearDraft(nodeId);
  }
}
