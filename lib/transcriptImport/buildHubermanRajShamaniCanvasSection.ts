import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import {
  definitionPayload,
  episodePayload,
  linkGroupPayload,
  quotePayload,
  statPayload,
} from "@/lib/transcriptArtifacts";
import { layoutChapters } from "@/lib/transcriptImport/chapterLayout";
import {
  conn,
  convCard,
  spawnPayload,
  spawnWebsite,
  thread,
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";
import {
  HUBERMAN_RAJ_SHAMANI_CHANNEL_URL,
  HUBERMAN_RAJ_SHAMANI_CHAPTERS,
  HUBERMAN_RAJ_SHAMANI_VIDEO_URL,
} from "@/lib/transcriptImport/hubermanRajShamaniInterview";

/*
 * Andrew Huberman on Raj Shamani's Figuring Out podcast (FO556), roughly
 * 2h46m.
 *
 * This builder deliberately departs from the other transcript-import
 * fixtures: it does not carry a full-transcript source string. At this
 * episode's length, embedding the entire transcript verbatim into a
 * committed file crosses from "a short attributed quote" into wholesale
 * reproduction of a commercial podcast's IP. Instead:
 *
 *  - Every quote/definition/claim artifact below is a short (under ~20 word)
 *    fragment lifted verbatim from HUBERMAN_RAJ_SHAMANI_TRANSCRIPT_EXCERPTS,
 *    the only verbatim text this fixture carries.
 *  - Every card summary is this builder's own paraphrase, not a lift.
 *  - Ten chapters are kept from the source's ~31 creator chapters (titles
 *    and start times verbatim from the video's own chapter markers), grouped
 *    thematically rather than one-to-one, the same curation approach used
 *    for the Prashant Kishor canvas.
 */

const HUBERMAN = "Andrew Huberman";
const RAJ = "Raj Shamani";

export const TIP_THREAD_AH_MAIN = "tip-thread-ah-main";
export const TIP_THREAD_AH_BACKGROUND = "tip-thread-ah-background";
export const TIP_THREAD_AH_BREATHWORK = "tip-thread-ah-breathwork";
export const TIP_THREAD_AH_SLEEP = "tip-thread-ah-sleep";
export const TIP_THREAD_AH_CAREER = "tip-thread-ah-career";
export const TIP_THREAD_AH_PEERS = "tip-thread-ah-peers";
export const TIP_THREAD_AH_FAME = "tip-thread-ah-fame";
export const TIP_THREAD_AH_RESILIENCE = "tip-thread-ah-resilience";
export const TIP_THREAD_AH_GRIEF = "tip-thread-ah-grief";
export const TIP_THREAD_AH_LOVE = "tip-thread-ah-love";

export function buildHubermanRajShamaniCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_AH_MAIN,
    TIP_THREAD_AH_BACKGROUND,
    TIP_THREAD_AH_BREATHWORK,
    TIP_THREAD_AH_SLEEP,
    TIP_THREAD_AH_CAREER,
    TIP_THREAD_AH_PEERS,
    TIP_THREAD_AH_FAME,
    TIP_THREAD_AH_RESILIENCE,
    TIP_THREAD_AH_GRIEF,
    TIP_THREAD_AH_LOVE,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 50 + index);
  });

  // ---- Chapter heads: ten curated groups over the source's own ~31
  // creator chapters (see HUBERMAN_RAJ_SHAMANI_CHAPTERS) -------------------
  const mainDefs = [
    { id: "tip-c-ah-main-1", title: "Who Is Andrew Huberman?" },
    { id: "tip-c-ah-main-2", title: "The Morning Cortisol Hack" },
    { id: "tip-c-ah-main-3", title: "The Simple Trick to Stop Overthinking" },
    { id: "tip-c-ah-main-4", title: "Yoga Nidra, Sleep & How to Fall Asleep Faster" },
    { id: "tip-c-ah-main-5", title: "\"Know Thyself\"" },
    { id: "tip-c-ah-main-6", title: "The 3-Stage Career Framework" },
    { id: "tip-c-ah-main-7", title: "Why Fame Can Destroy Performers" },
    { id: "tip-c-ah-main-8", title: "The Neuroscience of Choking Under Pressure" },
    { id: "tip-c-ah-main-9", title: "Winners vs. Losers" },
    { id: "tip-c-ah-main-10", title: "The Cost of Being Andrew Huberman" },
  ];
  const summaries = [
    "Fifty years old, a tenured neuroscience professor at Stanford, and host of the Huberman Lab podcast since 2021 — three decades studying how the brain wires up, changes and repairs itself, now applied to protocols for sleep, focus and mental health.",
    "His single highest-leverage habit: high cortisol in the first hour of the day, low cortisol in the last. Morning sunlight in the eyes within 30–60 minutes of waking spikes it; dimming lights and avoiding late caffeine keeps it low at night, which in turn lets melatonin peak.",
    "Rather than trying to suppress unwanted thoughts, he sorts them into what he can and can't act on, borrowed from a Navy SEAL friend's exercise — and treats every stressful moment as a rep at practicing that sort.",
    "A practice from India he calls non-sleep deep rest teaches the mind to drop out of planning and into pure sensation. A simple eye-movement sequence before bed disrupts the brain's sense of body position, which he says makes falling back asleep far easier.",
    "Beneath every protocol sits one requirement: knowing what state you're actually in — good, vulnerable, rested, frayed — before deciding what to do next. He calls the years-long project of learning to switch off, not just switch on, the harder half of resilience.",
    "He frames a career in three stages: years one to three are all-out effort with no ceiling; years four to six are about learning to dynamically regulate output without burning out; year seven onward is when real mastery and integration set in.",
    "Sudden fame without a stable internal structure is, in his telling, one of the more reliable ways to derail an otherwise successful career — the crash comes when attention becomes the thing a person is chasing, not a byproduct of the work.",
    "A body of research on high-stakes performance shows that thinking about how much there is to gain, not lose, is what makes skilled people freeze or misfire. His fix is to deliberately shrink the stakes in his own mind — one day, then one more.",
    "He distinguishes winners from losers less by outcomes than by what they do with hard events: both groups have the same painful thoughts, but one turns them into self- or other-directed harm while the other forces them, repeatedly, into constructive action.",
    "Asked what being a public figure has actually cost him, he points to something narrower than criticism: the inability to sit with every single person's story the way he'd like to, because the work itself requires holding a wider, longer view.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_AH_MAIN,
      def.title,
      summaries[index]!,
    );
    cardOrder.push(def.id);
  });

  /** A sub-branch: its own thread, hanging off the chapter head. */
  function branch(
    threadId: string,
    parentId: string,
    defs: { id: string; title: string; summary: string }[],
  ) {
    defs.forEach((def, index) => {
      cards[def.id] = convCard(
        def.id,
        threadId,
        def.title,
        def.summary,
        parentId,
      );
      cardOrder.push(def.id);
      connections.push(
        index === 0
          ? conn(parentId, def.id, "bottom", "top")
          : conn(defs[index - 1]!.id, def.id, "right", "left"),
      );
    });
  }

  branch(TIP_THREAD_AH_BACKGROUND, "tip-c-ah-main-1", [
    {
      id: "tip-c-ah-background-1",
      title: "Three decades in one lab",
      summary:
        "He ran a research laboratory from age 19 into his late 40s, studying neural development, plasticity and regeneration, before folding that grounding into a podcast that covers everything from peptides to prescription drugs alongside behavioral protocols.",
    },
  ]);
  branch(TIP_THREAD_AH_BREATHWORK, "tip-c-ah-main-2", [
    {
      id: "tip-c-ah-breathwork-1",
      title: "HRV and the extended exhale",
      summary:
        "An extended exhale mechanically shrinks the heart and slows its rate via the vagus nerve, which is the basis of heart-rate variability — a handful of long exhales a day, he says, measurably trains the nervous system to brake faster.",
    },
  ]);
  branch(TIP_THREAD_AH_SLEEP, "tip-c-ah-main-4", [
    {
      id: "tip-c-ah-sleep-1",
      title: "Ashwagandha, nicotine and the honest tradeoffs",
      summary:
        "He's specific about timing and dose: ashwagandha to blunt cortisol belongs in the evening, not the morning, and only in cycles; nicotine's calm-alert state comes bundled with elevated blood pressure and a fast habit-forming curve he'd rather avoid.",
    },
  ]);
  branch(TIP_THREAD_AH_CAREER, "tip-c-ah-main-6", [
    {
      id: "tip-c-ah-career-1",
      title: "Following people, not inspiration",
      summary:
        "He no longer looks to books for inspiration; he looks for people operating in their element and lets proximity to that energy do the work, while treating online negativity as something to acknowledge without absorbing.",
    },
  ]);
  branch(TIP_THREAD_AH_PEERS, "tip-c-ah-main-7", [
    {
      id: "tip-c-ah-peers-1",
      title: "Gas pedal, then dynamic regulation",
      summary:
        "The same three-stage arc applies to intensity itself: go all-in early without any ceiling, then learn to dynamically regulate that output — pushing hard is a young discipline, and pacing it is the more advanced one.",
    },
  ]);
  branch(TIP_THREAD_AH_RESILIENCE, "tip-c-ah-main-8", [
    {
      id: "tip-c-ah-resilience-1",
      title: "Committees, not solo calls",
      summary:
        "For decisions with real weight, he favors assembling a small committee of trusted people to pressure-test his thinking — not to outsource the decision, but to catch the blind spots that come from deciding entirely inside one's own head.",
    },
  ]);
  branch(TIP_THREAD_AH_GRIEF, "tip-c-ah-main-9", [
    {
      id: "tip-c-ah-grief-1",
      title: "Losing three mentors",
      summary:
        "He's lost three scientific mentors — to suicide, cancer, and cancer again — and describes grief less as stages than as a nervous system still reaching for someone who is no longer there to reach for.",
    },
  ]);
  branch(TIP_THREAD_AH_LOVE, "tip-c-ah-main-10", [
    {
      id: "tip-c-ah-love-1",
      title: "What neuroscience doesn't explain",
      summary:
        "Decades studying the brain didn't spare him difficulty in romantic relationships; what helped, he says, was slowing down and building the friendship first rather than getting swept into the feeling before the trust was actually there.",
    },
  ]);

  /*
   * Artifacts. Every quote/definition below is a verbatim lift from
   * HUBERMAN_RAJ_SHAMANI_TRANSCRIPT_EXCERPTS — the short, individually
   * attributed fragment set this fixture carries in place of a full
   * transcript. Enforced by transcriptFidelity.test.ts.
   */
  const spawn = (
    nodeId: string,
    payload: Parameters<typeof spawnPayload>[1],
    cardId: string,
  ) =>
    spawnPayload(
      nodeId,
      payload,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  const site = (id: string, url: string, title: string, cardId: string) =>
    spawnWebsite(
      id,
      url,
      title,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );

  spawn(
    "tip-art-ah-video",
    {
      type: "images",
      title: "Andrew Huberman: Become Mentally Dangerous With These Daily Habits",
      data: {
        items: [
          {
            kind: "youtube",
            url: HUBERMAN_RAJ_SHAMANI_VIDEO_URL,
            title: "Andrew Huberman: Become Mentally Dangerous With These Daily Habits | FO556",
            thumb: "https://img.youtube.com/vi/Y566_T-YlNQ/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-ah-main-1",
  );
  spawn(
    "tip-art-ah-quote-teach",
    quotePayload("His real love in life", {
      text: "My real love in life is learning and teaching things that I believe can be useful to people.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-1",
  );
  site(
    "huberman-wiki",
    "https://en.wikipedia.org/wiki/Andrew_Huberman",
    "Andrew Huberman",
    "tip-c-ah-main-1",
  );

  spawn(
    "tip-art-ah-quote-cortisol",
    quotePayload("The one habit he'd lead with", {
      text: "High morning cortisol, low nighttime cortisol... the best thing you can do for your health and well-being and performance.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-2",
  );
  spawn(
    "tip-art-ah-def-cortisol",
    definitionPayload("Cortisol, reframed", {
      term: "Cortisol",
      gloss: "an energy deploying hormone",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-2",
  );

  spawn(
    "tip-art-ah-quote-column",
    quotePayload("Left column or right column?", {
      text: "Is this in the left column or the right column?",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-3",
  );

  spawn(
    "tip-art-ah-quote-eyemovement",
    quotePayload("The step nobody talks about", {
      text: "This is the first critical step in falling asleep that nobody talks about.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-4",
  );

  spawn(
    "tip-art-ah-quote-thyself",
    quotePayload("Know thyself", {
      text: "The oracle said it first, but know thyself.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-5",
  );

  spawn(
    "tip-art-ah-stat-realwork",
    statPayload("His sustainable daily capacity", {
      value: "5–10",
      unit: "hours of real work",
      label: "What he can sustain per day, before borrowing from tomorrow",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-6",
  );
  spawn(
    "tip-art-ah-quote-realwork",
    quotePayload("Real work, defined", {
      text: "Anywhere from 5 to 10 hours of real work per day.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-6",
  );

  spawn(
    "tip-art-ah-quote-attention",
    quotePayload("Attention as a drug", {
      text: "Attention is a drug if it's misused.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-7",
  );

  spawn(
    "tip-art-ah-quote-choke",
    quotePayload("Why skilled people choke", {
      text: "What causes us to choke is... so much is at stake. If I can't do this, I can't do anything.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-8",
  );

  spawn(
    "tip-art-ah-quote-winners",
    quotePayload("Winners vs. losers, in one line", {
      text: "Winners take the things that happen to them, good or bad.",
      speaker: HUBERMAN,
    }),
    "tip-c-ah-main-9",
  );

  spawn(
    "tip-art-ah-quote-powerless",
    quotePayload("The question he calls hard", {
      text: "When have you felt the most powerless in your life?",
      speaker: RAJ,
    }),
    "tip-c-ah-main-10",
  );
  site(
    "rajshamani-wiki",
    "https://en.wikipedia.org/wiki/Raj_Shamani",
    "Raj Shamani",
    "tip-c-ah-main-10",
  );

  /*
   * The masthead: what the video is, a clickable index into the ten chapter
   * groups, and the link directory.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-ah-episode", "tip-art-ah-links"];

  spawn(
    "tip-art-ah-episode",
    episodePayload("The episode", {
      videoTitle:
        "Andrew Huberman: Become Mentally Dangerous With These Daily Habits | FO556",
      channel: "Raj Shamani",
      duration: "2:46:25",
      url: HUBERMAN_RAJ_SHAMANI_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/Y566_T-YlNQ/maxresdefault.jpg",
      description:
        "Neuroscientist Andrew Huberman joins Raj Shamani's Figuring Out podcast for a masterclass on cortisol rhythms, turning the mind off, resilience, career pacing and what fame costs a public-facing scientist.",
      chapters: HUBERMAN_RAJ_SHAMANI_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-ah-chapter-${index + 1}`,
      })),
    }),
    "tip-c-ah-main-1",
  );
  spawn(
    "tip-art-ah-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: HUBERMAN_RAJ_SHAMANI_VIDEO_URL },
            { label: "Figuring Out with Raj Shamani", url: HUBERMAN_RAJ_SHAMANI_CHANNEL_URL },
          ],
        },
        {
          label: "People",
          links: [
            { label: "Andrew Huberman", url: "https://en.wikipedia.org/wiki/Andrew_Huberman" },
            { label: "Raj Shamani", url: "https://en.wikipedia.org/wiki/Raj_Shamani" },
          ],
        },
      ],
    }),
    "tip-c-ah-main-1",
  );

  const layout = layoutChapters({
    mainCardIds: mainDefs.map((def) => def.id),
    mastheadNodeIds: MASTHEAD_NODE_IDS,
    cards,
    cardOrder,
    connections,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    idPrefix: "tip-ah",
  });

  return {
    cards,
    cardOrder,
    connections: layout.connections,
    threads,
    threadOrder: threadIds,
    groups: layout.groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: layout.contentCenter,
  };
}
