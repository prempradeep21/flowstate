import type { Thread } from "@/lib/store";

/**
 * Fixture content for the 15s branching demo video. Trip-planning story:
 * root chat plans a Japan trip, a follow-up chains below, a lateral branch
 * explores budget, and a selection branch digs into "Kyoto and Nara".
 */

export const DEMO_THREAD_MAIN = "demo_thread_main";
export const DEMO_THREAD_BRANCH = "demo_thread_branch";
export const DEMO_THREAD_SELECTION = "demo_thread_selection";

export const ACCENT_MAIN = "#2066EB";
export const ACCENT_BRANCH = "#FF8FA3";
export const ACCENT_SELECTION = "#6FCF97";

export const DEMO_THREADS: Record<string, Thread> = {
  [DEMO_THREAD_MAIN]: { id: DEMO_THREAD_MAIN, accentColour: ACCENT_MAIN },
  [DEMO_THREAD_BRANCH]: { id: DEMO_THREAD_BRANCH, accentColour: ACCENT_BRANCH },
  [DEMO_THREAD_SELECTION]: {
    id: DEMO_THREAD_SELECTION,
    accentColour: ACCENT_SELECTION,
  },
};

export const CARD_R = "demo_r";
export const CARD_B = "demo_b";
export const CARD_C = "demo_c";
export const CARD_D = "demo_d";

export type DemoCardId = typeof CARD_R | typeof CARD_B | typeof CARD_C | typeof CARD_D;

/** The phrase in card B's answer that gets selected. Must render as a single
 *  text node (it's inside a `**bold**` span) so Range measurement is trivial. */
export const SELECTION_PHRASE = "Kyoto and Nara";

// NOTE: copy is vetted against lib/artifactIntent.ts — words like "trip",
// "travel", or "itinerary" make the product expect a map artifact and the
// card would render a "no response" warning without one.
export const QUESTION_R = "10 days in Japan this November — where should we start?";
export const ANSWER_R = `November is one of the best months to go — cool, dry days and peak autumn colour.

- **Fly into Tokyo**, out of Osaka to avoid backtracking
- Book Shinkansen seats early — leaf season fills up
- Pack layers: expect 8–18°C

A good shape: Tokyo → Hakone → Kyoto → Osaka.`;

export const FOLLOW_UP_B = "How should I split the days?";
export const ANSWER_B = `Start with **4 nights in Tokyo** for the city plus a day trip. Then take the Shinkansen to **${SELECTION_PHRASE}** for temples, gardens and the best autumn leaves — three nights is right. Finish with **2 nights in Osaka** for food and a slower pace.`;

export const QUESTION_C = "What's a realistic daily food budget?";
export const ANSWER_C = `Around **¥4,000–6,000 per person**: a konbini breakfast, a ¥1,000 lunch set, and a proper dinner near ¥2,500. Add ¥1,500 on izakaya nights.`;

export const QUESTION_D = "How many days do these two need?";
export const ANSWER_D = `Two full days covers Kyoto's highlights; Nara is an easy half-day trip on the same rail line.`;

export const EXPLAIN_TEXT =
  "Japan's ancient capitals, under an hour apart by train — famous for temples, shrines and autumn foliage.";

/** World positions. Lateral branch offset mirrors the product's spawn rule:
 *  parent.x + cardWidth (420) + branchHorizontalGap (420). Y values are tuned
 *  against measured card heights during preview. */
export const POS_R = { x: 0, y: 0 };
export const POS_B = { x: 0, y: 430 };
export const POS_C = { x: 840, y: 30 };
export const POS_D = { x: -840, y: 460 };

export const CAPTIONS: { t0: number; t1: number; text: string }[] = [
  { t0: 300, t1: 2600, text: "Every chat lives on a canvas" },
  { t0: 2950, t1: 4700, text: "Ask follow-ups — they chain below" },
  { t0: 5000, t1: 8100, text: "Pull a branch to explore a tangent" },
  {
    t0: 8700,
    t1: 12900,
    text: "Select any text — explain it, question it, or reuse it",
  },
  { t0: 13400, t1: 15000, text: "Flowstate — think in branches" },
];
