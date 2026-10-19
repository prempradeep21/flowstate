/**
 * Demo source for the Conversation → Flowstate playground (admin-only).
 *
 * Unlike the other transcript-import fixtures, this one does NOT embed the
 * full episode transcript — at ~2h46m it is far longer than the other
 * sources, and reproducing the whole thing verbatim into a committed source
 * file is a different order of copying than a short attributed quote. Every
 * quote/claim/definition artifact in the builder is instead sourced from
 * TRANSCRIPT_EXCERPTS below: a small set of short (under ~20 word) verbatim
 * fragments, each independently attributed, which is what's checked for
 * fidelity in transcriptFidelity.test.ts. Card summaries are paraphrased in
 * this file's own words rather than lifted from the source.
 */

export const HUBERMAN_RAJ_SHAMANI_VIDEO_URL =
  "https://www.youtube.com/watch?v=Y566_T-YlNQ";

export const HUBERMAN_RAJ_SHAMANI_CHANNEL_URL =
  "https://www.youtube.com/@RajShamani";

/**
 * Ten chapters curated from the video's own ~31 creator-authored chapters
 * (see the "Chapter N: Title" markers in the source), grouped thematically.
 * Titles and start times for the ones kept are the creator's own.
 */
export const HUBERMAN_RAJ_SHAMANI_CHAPTERS: {
  start: string;
  end: string;
  title: string;
}[] = [
  { start: "2:55", end: "6:16", title: "Who Is Andrew Huberman?" },
  { start: "6:16", end: "17:37", title: "The Morning Cortisol Hack" },
  { start: "24:08", end: "31:05", title: "The Simple Trick to Stop Overthinking" },
  { start: "31:05", end: "36:51", title: "Yoga Nidra, Sleep & How to Fall Asleep Faster" },
  { start: "44:38", end: "51:51", title: "\"Know Thyself\": The Key to Reaching Your Potential" },
  { start: "51:51", end: "1:02:34", title: "The 3-Stage Career Framework: Grind, Regulate & Master" },
  { start: "1:11:34", end: "1:16:48", title: "Why Fame Can Destroy Performers" },
  { start: "1:24:26", end: "1:32:40", title: "The Neuroscience of Choking Under Pressure" },
  { start: "2:03:42", end: "2:12:13", title: "Winners vs. Losers: How You Respond to Life" },
  { start: "2:41:28", end: "2:46:16", title: "The Cost of Being Andrew Huberman" },
];

/**
 * Every verbatim-claiming field in the builder is a short attributed
 * fragment drawn from one of these excerpts — never a paragraph, never a
 * scene. This constant, not the full transcript, is what
 * transcriptFidelity.test.ts checks quotes against for this canvas.
 */
export const HUBERMAN_RAJ_SHAMANI_TRANSCRIPT_EXCERPTS = `"My real love in life is learning and teaching things that I believe can be useful to people." — Andrew Huberman, introducing himself

"High morning cortisol, low nighttime cortisol... the best thing you can do for your health and well-being and performance." — Andrew Huberman

"It's an energy deploying hormone." — Andrew Huberman, on cortisol

"Is this in the left column or the right column?" — Andrew Huberman, on sorting what you can and can't control

"This is the first critical step in falling asleep that nobody talks about." — Andrew Huberman, on the eye-movement trick

"The oracle said it first, but know thyself." — Andrew Huberman

"Anywhere from 5 to 10 hours of real work per day." — Andrew Huberman, on his sustainable daily capacity

"Attention is a drug if it's misused." — Andrew Huberman

"What causes us to choke is... so much is at stake. If I can't do this, I can't do anything." — Andrew Huberman

"Winners take the things that happen to them, good or bad." — Andrew Huberman

"When have you felt the most powerless in your life?" — Raj Shamani`;
