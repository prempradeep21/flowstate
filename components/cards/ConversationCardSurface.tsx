"use client";

import {
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import type { Card } from "@/lib/store";
import type { ConversationZoomDisplay } from "@/lib/zoomDisplay";
import {
  CONVERSATION_CARD_LAYOUT_H,
  conversationBody,
  conversationTitle,
} from "@/lib/conversationCard";

/**
 * Chrome for a conversation card: an imported transcript beat, rendered as a
 * heading over body prose.
 *
 * Read-only by design — there is no composer, no ask affordance and no branch
 * plug. The text is selectable so a reader can quote from it.
 */
export function ConversationCardSurface({
  card,
  zoom,
}: {
  card: Card;
  /** Zoom tier resolved by the card (settled scale — never steps mid-pinch). */
  zoom: ConversationZoomDisplay;
}) {

  return (
    // Height comes from the layout constant so the rendered card and the box the
    // chapter engine reserves for it cannot drift apart.
    <QaTranslucentSurface
      className="group/body flex min-w-0 flex-col overflow-hidden"
      style={{ height: CONVERSATION_CARD_LAYOUT_H }}
    >
      <QaQuestionSection style={{ padding: "17.5px 22.5px 12.5px" }}>
        <div
          data-selectable-text
          className="qa-question-text w-full min-w-0 cursor-text overflow-hidden break-words font-semibold text-canvas-ink"
          style={{
            fontSize: zoom.titleFontSize,
            lineHeight: zoom.titleLineHeight,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: zoom.titleLineClamp,
          }}
        >
          {conversationTitle(card)}
        </div>
      </QaQuestionSection>
      {zoom.showSummary && (
        <>
          <div className="mx-[22.5px] shrink-0 h-px bg-canvas-border" />
          <div className="line-clamp-6 flex-1 overflow-hidden px-[22.5px] py-[15px] text-canvas-body-sm leading-relaxed text-canvas-ink">
            {conversationBody(card)}
          </div>
        </>
      )}
    </QaTranslucentSurface>
  );
}
