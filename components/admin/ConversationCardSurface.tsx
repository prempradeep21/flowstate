"use client";

import {
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import type { Card } from "@/lib/store";
import type { ConversationZoomDisplay } from "@/lib/zoomDisplay";
import { CONVERSATION_CARD_LAYOUT_H } from "@/lib/transcriptImport/playgroundLayout";

/** Temporary conversation-import card chrome (admin playground only). */
export function ConversationCardSurface({
  card,
  accent,
  zoom,
}: {
  card: Card;
  accent: string | undefined;
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
      <QaQuestionSection
        accentColour={accent}
        accentBandVariant="header"
        style={{ padding: "14px 18px 10px" }}
      >
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
          {card.question}
        </div>
      </QaQuestionSection>
      {zoom.showSummary && (
        <>
          <div className="mx-5 shrink-0 h-px bg-canvas-border" />
          <div className="line-clamp-6 flex-1 overflow-hidden px-[18px] py-3 text-canvas-body-sm leading-relaxed text-canvas-ink">
            {card.answer}
          </div>
        </>
      )}
    </QaTranslucentSurface>
  );
}
