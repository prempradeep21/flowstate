/**
 * Demo source for the Conversation → Flowstate playground (admin-only).
 *
 * The source video is a Hindi-language interview (Schoolcast with Avyakt,
 * featuring Vanita Uppal OBE, Director of The British School, New Delhi) —
 * host and guest code-switch between Hindi and English mid-sentence, and
 * the source transcript renders everything, English included, in
 * Devanagari phonetic spelling. This guest speaks largely in English
 * throughout, so unlike the Cazual Talk fixture, most of the source's
 * substance is already available as genuine English clauses.
 *
 * This canvas is authored in English (as requested) and, like the other
 * Hindi-source fixtures, carries no full-transcript source:
 *
 *  - It does not embed any block of the original Hindi transcript.
 *  - Every "verbatim" quote/claim field below is a fragment the speaker
 *    actually said IN ENGLISH mid-sentence (confirmed by re-reading the
 *    source), re-spelled from the transcript's Devanagari phonetic
 *    rendering back into standard English orthography — a script
 *    transliteration of words already spoken in English, not a
 *    translation. Everything else — chapter groupings beyond the source's
 *    own English chapter titles, and every card summary — is this
 *    builder's own paraphrase.
 */

export const SCHOOLCAST_VANITA_UPPAL_VIDEO_URL =
  "https://www.youtube.com/watch?v=65DU7cn-3nA";

export const SCHOOLCAST_CHANNEL_URL =
  "https://www.youtube.com/@schoolcastwithavyakt";

/**
 * The source carries its own English chapter markers (unusual for a Hindi
 * interview) — titles and start times below are the creator's own,
 * curated into nine groups the way the Prashant Kishor and Huberman
 * canvases group a source's finer-grained chapters.
 */
export const SCHOOLCAST_VANITA_UPPAL_CHAPTERS: {
  start: string;
  end: string;
  title: string;
}[] = [
  { start: "1:29", end: "3:10", title: "Intro: Meet Vanita Uppal" },
  { start: "3:10", end: "8:28", title: "Marks vs. Mindset: What Matters More" },
  { start: "8:28", end: "10:57", title: "Education Then vs. Now" },
  { start: "12:31", end: "15:56", title: "How Great Teachers Solve Real Problems" },
  { start: "18:48", end: "24:22", title: "Are International Schools Easier to Teach In?" },
  { start: "26:30", end: "30:38", title: "Are International Teachers Happier?" },
  { start: "35:45", end: "39:08", title: "Myths About International Schools" },
  { start: "42:44", end: "43:17", title: "NEP 2020's Impact" },
  { start: "45:22", end: "54:45", title: "3 Parenting Mistakes Today" },
];

/**
 * Every verbatim-claiming field in the builder is one of these fragments —
 * each a clause the speaker said fully in English, re-spelled from the
 * source's Devanagari phonetic rendering. This constant, not a translated
 * or full transcript, is what transcriptFidelity.test.ts checks quotes
 * against for this canvas.
 */
export const SCHOOLCAST_VANITA_UPPAL_TRANSCRIPT_EXCERPTS = `"A good teacher is a good teacher no matter where you play." — Vanita Uppal

"I think leaders who stop being learners can't be effective leaders either." — Vanita Uppal

"It is definitely, definitely not about grades." — Vanita Uppal, on what excellence in education means

"Excellence has to be defined, success has to be defined by yourself." — Vanita Uppal

"A failed attempt is still an attempt." — Vanita Uppal

"Content is not king." — Vanita Uppal, on what's changed in education

"The teacher in the classroom is your pivot." — Vanita Uppal

"Learning is a social process." — Vanita Uppal

"You can be the best pedagogue in the world." — Vanita Uppal

"A good teacher never runs away from responsibility." — Vanita Uppal

"There is nothing easy in an international school." — Vanita Uppal

"International schools are very demanding on teachers." — Vanita Uppal

"Why do you think teachers in India are so underpaid and overworked?" — Avyakt Sethi

"We never saw teachers as the architects of the nation." — Vanita Uppal

"The young adult today, the 17 year old today, is very different from the 17 year old of 2000." — Vanita Uppal

"We are not a for-profit school." — Vanita Uppal

"Discerning parents understood the value of what's going on inside the classroom, they did not want the granite on the porch." — Vanita Uppal

"Teacher training, assessment and pedagogy — those are the three things that can really add to the good work that's already being done." — Vanita Uppal

"Granite buildings, fancy campus mean nothing if you are not people centric." — Vanita Uppal

"Parents and school, you are not competitors." — Vanita Uppal

"Because when there is no trust in a school where you sent your child, then I am sorry, it's going to be damnation." — Vanita Uppal

"Have faith, have belief in your children, and have belief in yourself if you are an educator." — Vanita Uppal

"Kindness and forgiveness should be our mantra because we are dealing with children." — Vanita Uppal

"One thing teachers do out of habit, not passion?" — Avyakt Sethi

"Take attendance." — Vanita Uppal

"If every teacher followed one golden rule in class, what should it be?" — Avyakt Sethi

"Know your learners." — Vanita Uppal

"In one word, the biggest problem in modern parenting." — Avyakt Sethi

"Helicopter parenting." — Vanita Uppal`;
