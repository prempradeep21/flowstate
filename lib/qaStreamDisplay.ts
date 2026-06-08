import type { Card, CardStatus } from "@/lib/store";

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
  if (card.status === "empty" || card.status === "thinking") return false;
  if (card.status === "done") {
    return shouldShowQaAnswerText(card) || shouldShowQaArtifactPreview(card);
  }
  return shouldShowQaArtifactPreview(card);
}

export function isQaResponsePending(status: CardStatus | undefined): boolean {
  return status === "thinking" || status === "streaming";
}
