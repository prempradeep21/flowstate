"use client";

import type { MutableRefObject } from "react";
import {
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import type { Card } from "@/lib/store";
import {
  CONVERSATION_CARD_LAYOUT_H,
  conversationBody,
  conversationTitle,
} from "@/lib/conversationCard";

/**
 * Chrome for a conversation card: an imported transcript beat, rendered as a
 * heading over body prose.
 *
 * The content itself is read-only. Questions come off it the same way they do
 * any card: pull a branch from a side plug, or select body text and ask.
 */
export function ConversationCardSurface({
  card,
  bodyRef,
}: {
  card: Card;
  /** The card's answer-text root, so body selections open the ask menu. */
  bodyRef?: MutableRefObject<HTMLDivElement | null>;
}) {
  // One fixed type scale at every zoom: the card shrinks geometrically with
  // the viewport and never re-lays its text out on settle.
  return (
    // Height comes from the layout constant so the rendered card and the box the
    // chapter engine reserves for it cannot drift apart.
    <QaTranslucentSurface
      className="conversation-card-surface group/body flex min-w-0 flex-col overflow-hidden"
      style={{ height: CONVERSATION_CARD_LAYOUT_H }}
    >
      <QaQuestionSection style={{ padding: "17.5px 22.5px 12.5px" }}>
        <div
          data-selectable-text
          className="qa-question-text w-full min-w-0 cursor-text overflow-hidden break-words font-semibold text-canvas-ink"
          style={{
            fontSize: 18,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
          }}
        >
          {conversationTitle(card)}
        </div>
      </QaQuestionSection>
      <div className="mx-[22.5px] shrink-0 h-px bg-canvas-border" />
      <div
        ref={bodyRef}
        data-selectable-text
        className="line-clamp-6 flex-1 cursor-text overflow-hidden px-[22.5px] py-[15px] text-canvas-body-sm leading-relaxed text-canvas-ink"
      >
        {conversationBody(card)}
      </div>
    </QaTranslucentSurface>
  );
}
