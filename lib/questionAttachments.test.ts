import { describe, expect, it } from "vitest";
import { getQuestionAttachedImages } from "@/lib/questionAttachments";
import type { Card } from "@/lib/store";

function card(partial: Partial<Card>): Card {
  return {
    id: "c1",
    threadId: "t1",
    question: "q",
    answer: "",
    status: "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
    ...partial,
  };
}

describe("getQuestionAttachedImages", () => {
  it("returns attachedImages when present", () => {
    const images = [{ url: "a", thumb: "a", alt: "ref" }];
    expect(
      getQuestionAttachedImages(
        card({ attachedImages: images, images: [{ url: "b", thumb: "b", alt: "out" }] }),
      ),
    ).toEqual(images);
  });

  it("falls back to legacy images on non-image response types", () => {
    const images = [{ url: "a", thumb: "a", alt: "ref" }];
    expect(getQuestionAttachedImages(card({ images, responseType: "text" }))).toEqual(
      images,
    );
  });

  it("does not treat answer images as question attachments", () => {
    const images = [{ url: "a", thumb: "a", alt: "out" }];
    expect(
      getQuestionAttachedImages(card({ images, responseType: "images" })),
    ).toEqual([]);
  });
});
