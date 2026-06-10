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
    "artifactPayload" | "outputArtifactId" | "images" | "responseType"
  >,
): boolean {
  const type = card.responseType ?? "text";
  return !!(
    card.artifactPayload ||
    card.outputArtifactId ||
    (type !== "text" && STRUCTURED_RESPONSE_TYPES.has(type)) ||
    (card.images &&
      card.images.length > 0 &&
      (type === "image" || type === "images"))
  );
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

type QaResponseCard = Pick<
  Card,
  | "status"
  | "answer"
  | "artifactPayload"
  | "outputArtifactId"
  | "images"
  | "responseType"
>;

/** Turn finished but nothing was rendered (timeout, dropped stream, or bad persist). */
export function isQaResponseMissing(card: QaResponseCard): boolean {
  if (card.status !== "done") return false;
  if (hasQaResponseError(card)) return false;
  return !shouldShowQaAnswerText(card) && !shouldShowQaArtifactPreview(card);
}

/** Show artifact/image preview once structured payload is parsed. */
export function shouldShowQaArtifactPreview(
  card: Pick<
    Card,
    "status" | "artifactPayload" | "outputArtifactId" | "images" | "responseType"
  >,
): boolean {
  if (card.status === "empty") return false;
  return hasStructuredContent(card);
}

/** Show answer text only after the stream completes to avoid height growth. */
export function shouldShowQaAnswerText(
  card: Pick<Card, "status" | "answer">,
): boolean {
  return card.status === "done" && !!card.answer.trim();
}

/** Whether the answer section should render content instead of a placeholder. */
export function shouldShowQaAnswerSection(
  card: Pick<
    Card,
    | "status"
    | "answer"
    | "artifactPayload"
    | "outputArtifactId"
    | "images"
    | "responseType"
  >,
): boolean {
  if (card.status === "empty") return false;
  if (card.status === "thinking") {
    return shouldShowQaArtifactPreview(card);
  }
  if (card.status === "done") {
    return (
      shouldShowQaAnswerText(card) ||
      shouldShowQaArtifactPreview(card) ||
      isQaResponseMissing(card)
    );
  }
  return shouldShowQaArtifactPreview(card);
}

export function isQaResponsePending(status: CardStatus | undefined): boolean {
  return status === "thinking" || status === "streaming";
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
  >,
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>,
): boolean {
  if (card.status === "empty") return false;
  if (card.status === "thinking" || card.status === "streaming") return true;
  if ((card.pendingEmittedArtifacts?.length ?? 0) > 0) return true;
  if (hasGeneratingPreviewNode(card.id, canvasArtifactNodes)) return true;
  return false;
}

/** Human-readable status while a card is still generating. */
export function formatPendingStatusLabel(thinkingLabel?: string): string {
  const trimmed = thinkingLabel?.trim();
  if (!trimmed) return "Thinking…";
  return trimmed.endsWith("…") ? trimmed : `${trimmed}…`;
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
    return `Building ${payload.type}…`;
  }
  const pending = card.pendingEmittedArtifacts?.[0];
  if (pending) {
    return `Building ${pending.type}…`;
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
  if (hasQaResponseError(card)) {
    return "Request failed";
  }

  if (card.thinkingLabel?.trim()) {
    return formatPendingStatusLabel(card.thinkingLabel);
  }

  if (card.status === "thinking") {
    return "Thinking…";
  }

  if (card.status === "streaming") {
    if (isStreamingArtifactWork(card)) {
      return artifactBuildingLabel(card) ?? "Parsing response…";
    }
    return "Responding…";
  }

  if ((card.pendingEmittedArtifacts?.length ?? 0) > 0) {
    return artifactBuildingLabel(card) ?? "Creating artifacts…";
  }

  if (hasGeneratingPreviewNode(card.id, canvasArtifactNodes)) {
    return artifactBuildingLabel(card) ?? "Building artifact…";
  }

  return "Finishing up…";
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
  if (label === "Request failed") return "Failed";
  return label.replace(/…$/, "");
}
