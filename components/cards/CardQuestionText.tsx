"use client";

import { memo } from "react";

import { QA_COLLAPSED_QUESTION_TEXT_MAX_WIDTH_PX } from "@/lib/design/canvasInsets";

/** Max height for expanded question text (4 lines at heading scale). */
const QUESTION_MAX_HEIGHT = Math.ceil(18 * 1.375 * 4);

/**
 * Question copy isolated from answer-stream re-renders. Without this, every
 * thinking label / answer token update recomposites the blur accent and
 * translucent fill over the question and it visibly flickers.
 */
export const CardQuestionText = memo(function CardQuestionText({
  question,
  collapsed,
}: {
  question: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <div
        data-selectable-text
        className="qa-question-text min-w-0 cursor-text break-words whitespace-pre-wrap text-canvas-heading font-semibold leading-snug text-canvas-ink line-clamp-2 overflow-hidden"
        style={{
          maxWidth: QA_COLLAPSED_QUESTION_TEXT_MAX_WIDTH_PX,
        }}
      >
        {question}
      </div>
    );
  }

  return (
    <div
      data-selectable-text
      className="qa-question-text w-full min-w-0 cursor-text overflow-y-auto break-words whitespace-pre-wrap text-canvas-heading font-semibold leading-snug text-canvas-ink"
      style={{ maxHeight: QUESTION_MAX_HEIGHT }}
    >
      {question}
    </div>
  );
});
