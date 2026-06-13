import { isCardAskInFlight } from "@/lib/cardAskRegistry";
import { detectUserRequestedArtifactKind } from "@/lib/artifactIntent";
import type { CanvasArtifactNode, Card, CardStatus } from "@/lib/store";

const STRUCTURED_RESPONSE_TYPES = new Set([
  "table",
  "code",
  "video",
  "custom",
  "3d",
  "images",
  "image",
  "map",
  "todo",
]);

/** Max scroll height for the Q&A answer text region (artifacts sit above this). */
export const QA_ANSWER_HEIGHT_PX = 650;

function hasStructuredContent(
  card: Pick<
    Card,
    | "status"
    | "artifactPayload"
    | "outputArtifactId"
    | "images"
    | "responseType"
    | "pendingEmittedArtifacts"
  >,
): boolean {
  const type = card.responseType ?? "text";
  if (card.artifactPayload || card.outputArtifactId) return true;
  if (
    card.images &&
    card.images.length > 0 &&
    (type === "image" || type === "images")
  ) {
    return true;
  }
  if ((card.pendingEmittedArtifacts?.length ?? 0) > 0) return true;
  // responseType alone is not enough once the turn finishes — avoid empty preview chrome.
  if (card.status === "thinking" || card.status === "streaming") {
    return type !== "text" && STRUCTURED_RESPONSE_TYPES.has(type);
  }
  return false;
}

function hasCommittedArtifactForCard(
  card: Pick<Card, "id" | "outputArtifactId" | "images" | "responseType">,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (card.outputArtifactId) return true;
  const type = card.responseType ?? "text";
  if (
    card.images &&
    card.images.length > 0 &&
    (type === "image" || type === "images")
  ) {
    return true;
  }
  if (!canvasArtifactNodes) return false;
  for (const node of Object.values(canvasArtifactNodes)) {
    if (
      node.sourceCardId === card.id &&
      node.artifactId &&
      !node.permissionPreview &&
      !node.generatingPreview
    ) {
      return true;
    }
  }
  return false;
}

function hasGeneratingPreviewNode(
  cardId: string,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (!canvasArtifactNodes) return false;
  for (const node of Object.values(canvasArtifactNodes)) {
    if (node.sourceCardId === cardId && node.generatingPreview) return true;
  }
  return false;
}

function hasPermissionPreviewNode(
  cardId: string,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (!canvasArtifactNodes) return false;
  for (const node of Object.values(canvasArtifactNodes)) {
    if (node.sourceCardId === cardId && node.permissionPreview) return true;
  }
  return false;
}

function hasPendingArtifactMaterialization(
  card: Pick<Card, "artifactPayload" | "outputArtifactId" | "images" | "responseType">,
): boolean {
  if (card.artifactPayload) return true;
  if (
    card.images &&
    card.images.length > 0 &&
    (card.responseType === "image" || card.responseType === "images") &&
    !card.outputArtifactId
  ) {
    return true;
  }
  return false;
}

function isStreamingArtifactWork(
  card: Pick<
    Card,
    | "status"
    | "artifactPayload"
    | "outputArtifactId"
    | "pendingEmittedArtifacts"
    | "images"
    | "responseType"
  >,
): boolean {
  if (card.status !== "thinking" && card.status !== "streaming") return false;
  if ((card.pendingEmittedArtifacts?.length ?? 0) > 0) return true;
  if (card.artifactPayload && !card.outputArtifactId) return true;
  if (
    card.images &&
    card.images.length > 0 &&
    (card.responseType === "image" || card.responseType === "images") &&
    !card.outputArtifactId
  ) {
    return true;
  }
  return false;
}

/** Whether the card answer contains a surfaced API / transport error. */
export function hasQaResponseError(
  card: Pick<Card, "answer">,
): boolean {
  const answer = card.answer.trim();
  return answer.startsWith("⚠️") || /^Error:/i.test(answer);
}

/** Human-readable error copy for the answer area (strips transport prefixes). */
export function formatQaResponseErrorMessage(answer: string): string {
  const trimmed = answer.trim();
  let msg = trimmed;
  if (trimmed.startsWith("⚠️")) msg = trimmed.slice(1).trim();
  else if (/^Error:/i.test(trimmed)) msg = trimmed.replace(/^Error:\s*/i, "");

  if (/timed out|504|no response received/i.test(msg)) {
    if (/previous artifact|unchanged|still on the canvas/i.test(msg)) return msg;
    if (/custom ui|custom component/i.test(msg)) {
      return `${msg} Your previous artifact on the canvas is unchanged.`;
    }
    return `${msg} Nothing was saved for this card — use Try again or simplify the request.`;
  }
  return msg;
}

/** Copy when a turn finished without any answer or artifact. */
export function formatQaResponseMissingMessage(
  card: Pick<Card, "question" | "parentCardId">,
): string {
  const q = card.question.toLowerCase();
  if (
    /\b(theme|color|styling|black\s+and\s+white|dark\s+mode|light\s+mode)\b/.test(q)
  ) {
    return "The theme update did not finish. Your existing custom UI on the canvas is unchanged — try again.";
  }
  if (/\bcustom\b|\bui\b|\bcomponent\b|\bhtml\b|\bwith this code\b/i.test(q)) {
    return "The custom UI build did not finish — the assistant replied in text but no artifact was saved. Try again or paste a smaller snippet.";
  }
  return "No response came through. The connection may have timed out.";
}

type QaProgressCard = Pick<
  Card,
  | "id"
  | "status"
  | "answer"
  | "thinkingLabel"
  | "artifactPayload"
  | "pendingEmittedArtifacts"
  | "images"
  | "responseType"
>;

/** Error surfaced only after the turn fully finishes — not while still working. */
export function isQaResponseFinalError(
  card: QaProgressCard,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (card.status !== "done") return false;
  if (!hasQaResponseError(card)) return false;
  return !isQaTurnInProgress(card, canvasArtifactNodes);
}

/** Missing response only after the turn fully finishes — not while artifacts materialize. */
export function isQaResponseFinalMissing(
  card: QaResponseCard,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (!isQaResponseMissing(card, canvasArtifactNodes)) return false;
  return !isQaTurnInProgress(card, canvasArtifactNodes);
}

type QaResponseCard = Pick<
  Card,
  | "id"
  | "status"
  | "answer"
  | "question"
  | "artifactPayload"
  | "outputArtifactId"
  | "images"
  | "responseType"
  | "pendingEmittedArtifacts"
>;

/** Turn finished but nothing was rendered (timeout, dropped stream, or bad persist). */
export function isQaResponseMissing(
  card: QaResponseCard,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (card.status !== "done") return false;
  if (hasQaResponseError(card)) return false;

  const requestedKind = detectUserRequestedArtifactKind(card.question);
  if (requestedKind) {
    return !hasCommittedArtifactForCard(card, canvasArtifactNodes);
  }

  return (
    !shouldShowQaAnswerText(card) &&
    !shouldShowQaArtifactPreview(card)
  );
}

/** Show artifact/image preview once structured payload is parsed. */
export function shouldShowQaArtifactPreview(
  card: Pick<
    Card,
    | "status"
    | "artifactPayload"
    | "outputArtifactId"
    | "images"
    | "responseType"
    | "pendingEmittedArtifacts"
  >,
): boolean {
  if (card.status === "empty") return false;
  return hasStructuredContent(card);
}

/** Show answer text only after the stream completes to avoid height growth. */
export function shouldShowQaAnswerText(
  card: Pick<Card, "status" | "answer">,
): boolean {
  return (
    card.status === "done" &&
    !!card.answer.trim() &&
    !hasQaResponseError(card)
  );
}

/** Show surfaced error copy only once the turn is fully finished. */
export function shouldShowQaAnswerError(
  card: QaProgressCard,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  return isQaResponseFinalError(card, canvasArtifactNodes);
}

/** Whether the answer section should render content instead of a placeholder. */
export function shouldShowQaAnswerSection(
  card: QaProgressCard,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (card.status === "empty") return false;
  if (card.status === "thinking") {
    return true;
  }
  if (card.status === "done") {
    return (
      shouldShowQaAnswerText(card) ||
      shouldShowQaArtifactPreview(card) ||
      isQaResponseFinalMissing(card, canvasArtifactNodes) ||
      isQaResponseFinalError(card, canvasArtifactNodes)
    );
  }
  return shouldShowQaArtifactPreview(card);
}

export function isQaResponsePending(status: CardStatus | undefined): boolean {
  return status === "thinking" || status === "streaming";
}

/**
 * True from question submit until the answer outcome is known (success or failure).
 * Artifact materialization after the stream finishes is excluded.
 */
export function isChatAnswerInProgress(
  card: Pick<Card, "id" | "status">,
): boolean {
  if (card.status === "empty") return false;
  if (isCardAskInFlight(card.id)) return true;
  return card.status === "thinking" || card.status === "streaming";
}

/**
 * True while the LLM turn is still in flight or artifacts are still being
 * parsed / materialized. Keeps status chrome visible until the card is fully ready.
 */
export function isQaTurnInProgress(
  card: Pick<
    Card,
    | "id"
    | "status"
    | "artifactPayload"
    | "outputArtifactId"
    | "pendingEmittedArtifacts"
    | "images"
    | "responseType"
    | "thinkingLabel"
  >,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (card.status === "empty") return false;
  if (isCardAskInFlight(card.id)) return true;
  if (card.status === "thinking" || card.status === "streaming") return true;
  if ((card.pendingEmittedArtifacts?.length ?? 0) > 0) return true;
  if (hasPendingArtifactMaterialization(card)) return true;
  if (hasGeneratingPreviewNode(card.id, canvasArtifactNodes)) return true;
  if (hasPermissionPreviewNode(card.id, canvasArtifactNodes)) return true;
  return false;
}

const ARTIFACT_LOADING_LABELS: Partial<Record<string, string>> = {
  map: "Plotting markers…",
  table: "Laying out rows…",
  chart: "Drawing the chart…",
  calendar: "Blocking time…",
  timeline: "Lining up events…",
  todo: "Checking boxes…",
  code: "Writing code…",
  custom: "Building the view…",
  video: "Cueing playback…",
  "3d": "Rendering shapes…",
};

/** Human-readable status while a card is still generating. */
export function formatPendingStatusLabel(thinkingLabel?: string): string {
  const trimmed = thinkingLabel?.trim();
  if (!trimmed) return "Sketching an answer…";
  return trimmed.endsWith("…") ? trimmed : `${trimmed}…`;
}

function engagingThinkingLabel(thinkingLabel?: string): string | null {
  const trimmed = thinkingLabel?.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (/building\s+map/i.test(lower)) return "Plotting markers…";
  if (/preparing\s+map/i.test(lower)) return "Loading the map…";
  if (/building\s+table/i.test(lower)) return "Laying out rows…";
  if (/building\s+custom/i.test(lower)) return "Assembling the view…";
  if (/request failed/i.test(lower)) return null;
  return formatPendingStatusLabel(trimmed);
}

/** Badge label for the corner pending indicator. */
export function formatPendingBadgeLabel(
  status: CardStatus,
  thinkingLabel?: string,
): string {
  if (thinkingLabel?.trim()) {
    return thinkingLabel.trim().replace(/…$/, "");
  }
  if (status === "thinking") return "Thinking";
  return "Responding";
}

function artifactBuildingLabel(
  card: Pick<Card, "artifactPayload" | "pendingEmittedArtifacts">,
): string | null {
  const payload = card.artifactPayload;
  if (payload) {
    return (
      ARTIFACT_LOADING_LABELS[payload.type] ?? `Building ${payload.type}…`
    );
  }
  const pending = card.pendingEmittedArtifacts?.[0];
  if (pending) {
    return (
      ARTIFACT_LOADING_LABELS[pending.type] ?? `Building ${pending.type}…`
    );
  }
  return null;
}

/** Unified status copy for badges and in-answer placeholders. */
export function resolveQaStatusLabel(
  card: Pick<
    Card,
    | "id"
    | "status"
    | "answer"
    | "thinkingLabel"
    | "artifactPayload"
    | "pendingEmittedArtifacts"
    | "images"
    | "responseType"
  >,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): string {
  if (isQaResponseFinalError(card, canvasArtifactNodes)) {
    return "Couldn't finish";
  }

  const engaging = engagingThinkingLabel(card.thinkingLabel);
  if (engaging) return engaging;

  if (card.status === "thinking") {
    return "Sketching an answer…";
  }

  if (card.status === "streaming") {
    if (isStreamingArtifactWork(card)) {
      return artifactBuildingLabel(card) ?? "Unpacking the response…";
    }
    return "Writing the answer…";
  }

  if ((card.pendingEmittedArtifacts?.length ?? 0) > 0) {
    return artifactBuildingLabel(card) ?? "Creating artifacts…";
  }

  if (hasGeneratingPreviewNode(card.id, canvasArtifactNodes)) {
    return artifactBuildingLabel(card) ?? "Building artifact…";
  }

  if (card.status === "done" && isQaTurnInProgress(card, canvasArtifactNodes)) {
    return artifactBuildingLabel(card) ?? "Putting it together…";
  }

  return "Almost there…";
}

/** Badge variant for the corner pending indicator. */
export function resolveQaStatusBadgeLabel(
  card: Pick<
    Card,
    | "id"
    | "status"
    | "answer"
    | "thinkingLabel"
    | "artifactPayload"
    | "pendingEmittedArtifacts"
    | "images"
    | "responseType"
  >,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): string {
  const label = resolveQaStatusLabel(card, canvasArtifactNodes);
  if (label === "Couldn't finish") return "Failed";
  return label.replace(/…$/, "");
}
