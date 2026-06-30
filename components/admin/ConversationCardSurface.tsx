"use client";

import { CardQuestionText } from "@/components/cards/CardQuestionText";
import {
  QaQuestionHeaderRow,
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";
import type { Card } from "@/lib/store";

/** Temporary conversation-import card chrome (admin playground only). */
export function ConversationCardSurface({
  card,
  accent,
  scale,
}: {
  card: Card;
  accent: string | undefined;
  scale: number;
}) {
  return (
    <QaTranslucentSurface className="group/body flex h-[200px] min-w-0 flex-col overflow-hidden">
      <QaQuestionSection
        accentColour={accent}
        accentWidth={compensatedStrokeWidth(3, scale, 3)}
        accentBandVariant="header"
        style={{ padding: "14px 18px 10px" }}
      >
        <QaQuestionHeaderRow
          collaborators={
            <span className="rounded-full bg-canvas-bg px-2 py-0.5 text-canvas-micro font-medium uppercase tracking-wider text-canvas-muted">
              Conversation
            </span>
          }
          controls={null}
        />
        <CardQuestionText question={card.question} collapsed={false} />
      </QaQuestionSection>
      <div className="mx-5 shrink-0 h-px bg-canvas-border" />
      <div className="line-clamp-4 flex-1 overflow-hidden px-[18px] py-3 text-canvas-body-sm leading-relaxed text-canvas-ink">
        {card.answer}
      </div>
    </QaTranslucentSurface>
  );
}
