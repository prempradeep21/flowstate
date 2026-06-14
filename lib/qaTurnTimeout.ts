import { cancelCardAsk } from "@/lib/cardAskRegistry";
import { findGeneratingPreviewNode } from "@/lib/canvasArtifacts";
import {
  notifyArtifactFailureForCard,
  pushArtifactErrorUpdate,
} from "@/lib/artifactUpdateNotify";
import { isCustomUiWork } from "@/lib/artifactIntent";
import { resolveEditingPayloadForApi } from "@/lib/artifactGeneration";
import { isQaTurnInProgress } from "@/lib/qaStreamDisplay";
import {
  QA_TURN_TIMEOUT_ENABLED,
  QA_TURN_TIMEOUT_MS_ACTIVE,
} from "@/lib/qaTurnLimits";
import { useCanvasStore } from "@/lib/store";

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function qaTurnTimeoutMessage(cardId: string): string {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) {
    return "⚠️ This request timed out after 3 minutes.";
  }
  const editing = resolveEditingPayloadForApi(cardId);
  const editingPayload = editing?.payload as { type?: string } | null;
  const customWork = isCustomUiWork(card.question, editingPayload);
  const existingCustom =
    editingPayload?.type === "custom" ||
    (card.outputArtifactId != null &&
      state.sessionArtifacts[card.outputArtifactId]?.kind === "custom");
  if (customWork && existingCustom) {
    return "⚠️ The request timed out after 3 minutes. Your existing artifact on the canvas is unchanged — try again.";
  }
  return "⚠️ This request timed out after 3 minutes. Nothing was saved for this turn — use Try again or simplify the request.";
}

function clearCardTurnPreviews(cardId: string): void {
  const store = useCanvasStore.getState();
  store.removeGeneratingArtifactPreview(cardId);
  for (const node of Object.values(store.canvasArtifactNodes)) {
    if (node.sourceCardId !== cardId) continue;
    if (node.permissionPreview) {
      store.removeCanvasArtifact(node.id);
    }
  }
}

/** Force-fail a card turn that exceeded the hard timeout. */
export function expireQaTurn(cardId: string): void {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return;
  if (!isQaTurnInProgress(card, state.canvasArtifactNodes)) return;

  cancelCardAsk(cardId);
  const previewNode = findGeneratingPreviewNode(
    state.canvasArtifactNodes,
    cardId,
  );
  clearCardTurnPreviews(cardId);

  useCanvasStore.getState().updateCard(cardId, {
    status: "done",
    answer: qaTurnTimeoutMessage(cardId),
    thinkingLabel: undefined,
    artifactPayload: undefined,
    pendingEmittedArtifacts: undefined,
    pendingFiles: undefined,
  });

  if (previewNode?.generatingPreview) {
    pushArtifactErrorUpdate({
      cardId,
      kind: previewNode.generatingPreview.kind,
      title: previewNode.generatingPreview.title,
      detail: "Timed out",
      nodeId: previewNode.id,
    });
  } else {
    notifyArtifactFailureForCard(cardId);
  }
}

export function startQaTurnTimeout(cardId: string): void {
  if (!QA_TURN_TIMEOUT_ENABLED || QA_TURN_TIMEOUT_MS_ACTIVE <= 0) return;
  clearQaTurnTimeout(cardId);
  timers.set(
    cardId,
    setTimeout(() => {
      timers.delete(cardId);
      expireQaTurn(cardId);
    }, QA_TURN_TIMEOUT_MS_ACTIVE),
  );
}

export function clearQaTurnTimeout(cardId: string): void {
  const timer = timers.get(cardId);
  if (timer === undefined) return;
  clearTimeout(timer);
  timers.delete(cardId);
}
