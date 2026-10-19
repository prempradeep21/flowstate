import type { Card } from "@/lib/store";

/**
 * Fixed layout height so horizontal connectors stay level across a row.
 *
 * Sized for a two-line title plus a six-line summary at 420px wide: the body is
 * 13px text on relaxed leading (~21px a line) across ~384px of usable width, so
 * six lines need ~127px on top of the header, divider and padding. At 200px the
 * card could not fit the four lines its own clamp asked for, and summaries were
 * cut mid-sentence.
 */
export const CONVERSATION_CARD_LAYOUT_H = 300;

/**
 * A conversation card carries imported transcript content rather than a turn
 * the user took: `question` holds its heading and `answer` its body prose.
 *
 * The naming is inherited from `Card` and is a wart, not a defect — `cardKind`
 * is what disambiguates, and every generic reader (thread titles, group
 * transcripts, search) already produces correct output from those two fields.
 * The helpers below exist so call sites read as what they mean.
 */
export function isConversationCard(card: { cardKind?: string } | null | undefined): boolean {
  return card?.cardKind === "conversation";
}

/** The card's heading. */
export function conversationTitle(card: Card): string {
  return card.question;
}

/** The card's body prose. */
export function conversationBody(card: Card): string {
  return card.answer;
}
