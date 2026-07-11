import type { Card, CardImage } from "@/lib/store";

/** User-attached reference images on a question (not model output images). */
export function getQuestionAttachedImages(
  card: Pick<Card, "attachedImages" | "images" | "responseType">,
): CardImage[] {
  if (card.attachedImages?.length) return card.attachedImages;
  // Legacy cards stored input images in `images` before attachedImages existed.
  if (
    card.images?.length &&
    card.responseType !== "image" &&
    card.responseType !== "images"
  ) {
    return card.images;
  }
  return [];
}

export function cardHasQuestionAttachments(
  card: Pick<
    Card,
    | "attachedImages"
    | "images"
    | "responseType"
    | "attachedArtifacts"
    | "attachedAssets"
    | "attachedSkills"
    | "pendingFiles"
  >,
): boolean {
  return !!(
    getQuestionAttachedImages(card).length ||
    card.attachedArtifacts?.length ||
    card.attachedAssets?.length ||
    card.attachedSkills?.length ||
    card.pendingFiles?.length
  );
}
