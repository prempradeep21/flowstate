/**
 * Demo source for the Conversation → Flowstate playground (admin-only).
 *
 * The source video is a Hindi-language interview (Cazual Talk with Vijender
 * Chauhan, featuring Sahil Aggarwal, CEO of Rishihood University) — the
 * guest and host speak in Hinglish, code-switching between Hindi and
 * English mid-sentence, and the source transcript renders everything,
 * English included, in Devanagari phonetic spelling.
 *
 * This canvas is authored in English (as requested) and, like the
 * Huberman/Raj Shamani fixture, carries no full-transcript source. Two
 * further constraints specific to this source:
 *
 *  - It does not embed any block of the original Hindi transcript — that
 *    would be reproducing a large stretch of someone else's Hindi-language
 *    work, not a short attributed quote.
 *  - Every "verbatim" quote/claim field below is a fragment the speaker
 *    actually said IN ENGLISH mid-sentence (confirmed by re-reading the
 *    source), re-spelled from the transcript's Devanagari phonetic
 *    rendering back into standard English orthography — e.g. "इट्स लाइक अ
 *    नेशनल वेस्टेज ऑफ टैलेंट" back to "It's like a national wastage of
 *    talent". That is a script transliteration of words already spoken in
 *    English, not a translation, so it stays a faithful verbatim quote.
 *    Everything else — chapter titles, card summaries, stats — is this
 *    builder's own English paraphrase of the Hindi portions, clearly not
 *    verbatim.
 */

export const CAZUAL_TALK_SAHIL_AGGARWAL_VIDEO_URL =
  "https://www.youtube.com/watch?v=KHvnzVxLRYQ";

export const CAZUAL_TALK_CHANNEL_URL = "https://www.youtube.com/@PleaseSitDown";

/**
 * Eight chapters authored by this builder — the source carries no creator
 * chapter markers, so both the grouping and the timestamps (read off the
 * transcript's own timing) are this builder's own.
 */
export const CAZUAL_TALK_SAHIL_AGGARWAL_CHAPTERS: {
  start: string;
  end: string;
  title: string;
}[] = [
  { start: "0:56", end: "4:43", title: "The Graduate Unemployment Paradox" },
  { start: "4:43", end: "8:34", title: "Why Education Fails to Deliver Jobs" },
  { start: "8:34", end: "12:20", title: "Redesigning Education Around Three Pillars" },
  { start: "12:20", end: "16:10", title: "The Funding Gap in Indian Education" },
  { start: "16:10", end: "21:07", title: "The Public vs. Private Perception Gap" },
  { start: "21:07", end: "27:06", title: "Building a Philanthropic Model for Higher Education" },
  { start: "27:06", end: "31:04", title: "Designing for Diversity and Access" },
  { start: "31:04", end: "41:38", title: "Educating for Life, Not Just Livelihood" },
];

/**
 * Every verbatim-claiming field in the builder is one of these fragments —
 * each a clause the speaker said fully in English, re-spelled from the
 * source's Devanagari phonetic rendering. This constant, not a translated
 * or full transcript, is what transcriptFidelity.test.ts checks quotes
 * against for this canvas.
 */
export const CAZUAL_TALK_SAHIL_AGGARWAL_TRANSCRIPT_EXCERPTS = `"It's like a national wastage of talent." — Sahil Aggarwal, on years spent solely preparing for one government exam

"There must be some systemic reason why our education is the way it is and it is not the way as you want it to be." — Vijender Chauhan

"Do you believe that a higher education institution has become more of a factory which is churning in the name of placements and delivering only the paper degrees?" — Vijender Chauhan

"While it is appreciable, it is not satisfactory." — Sahil Aggarwal, on placement outcomes at India's better institutions

"It's a significant bias." — Sahil Aggarwal, on land and approval requirements for new private universities

"How do you ensure diversity in your campus and how do you nurture the sense of diversity in the students?" — Vijender Chauhan

"Innovation always needs, you know, some removal of boundaries." — Sahil Aggarwal, asked for the one change he'd make to Indian education`;
