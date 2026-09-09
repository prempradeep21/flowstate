import type { SessionArtifact } from "@/lib/sessionArtifacts";
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
  definitionPayload,
  episodePayload,
  linkGroupPayload,
  mechanismPayload,
  quotePayload,
  statPayload,
} from "@/lib/transcriptArtifacts";
import { YC_INTERVIEW_TIPS_VIDEO_URL } from "@/lib/transcriptImport/ycInterviewTips";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";

/** Garry Tan, speaking to camera — "When I was a partner at YCombinator". */
const SPEAKER = "Garry Tan";

export const TIP_THREAD_YC_MAIN = "tip-thread-yc-main";
export const TIP_THREAD_YC_METRICS = "tip-thread-yc-metrics";
export const TIP_THREAD_YC_WEDGE = "tip-thread-yc-wedge";
export const TIP_THREAD_YC_PREP = "tip-thread-yc-prep";

/** YC interview tips conversation graph for the transcript-import playground. */
export function buildYcInterviewCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const threads: Record<string, Thread> = {
    [TIP_THREAD_YC_MAIN]: thread(TIP_THREAD_YC_MAIN, 4),
    [TIP_THREAD_YC_METRICS]: thread(TIP_THREAD_YC_METRICS, 5),
    [TIP_THREAD_YC_WEDGE]: thread(TIP_THREAD_YC_WEDGE, 6),
    [TIP_THREAD_YC_PREP]: thread(TIP_THREAD_YC_PREP, 7),
  };
  const threadOrder = [
    TIP_THREAD_YC_MAIN,
    TIP_THREAD_YC_METRICS,
    TIP_THREAD_YC_WEDGE,
    TIP_THREAD_YC_PREP,
  ];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  // ---- Chapter heads (the main spine) -------------------------------------
  const mainDefs = [
    {
      id: "tip-c-yc-main-1",
      title: "YC interview — 10 minutes",
      summary:
        "Congrats if you got in — unlike any other pitch, you have only ten minutes to land three things partners always look for.",
    },
    {
      id: "tip-c-yc-main-2",
      title: "Three things partners look for",
      summary:
        "Problem → Solution (is it good, are you the team?) → How big can it really be if you succeed?",
    },
    {
      id: "tip-c-yc-main-3",
      title: "Tip 1 — Problem",
      summary:
        "Plain English, no buzzwords: who is it for, how does it work, marketplace sides if applicable — explain like a first-grade teacher.",
    },
    {
      id: "tip-c-yc-main-4",
      title: "Tip 2 — Solution",
      summary:
        "Alternatives and competition, customer proof, revenue and gross margin, growth, burn, pricing, NPS, and cohort retention.",
    },
    {
      id: "tip-c-yc-main-5",
      title: "Tip 3 — Impact",
      summary:
        "How big can this get? A thin edge of the wedge is fine — great companies start solving a small problem for a limited audience.",
    },
  ];

  for (const def of mainDefs) {
    cards[def.id] = convCard(def.id, TIP_THREAD_YC_MAIN, def.title, def.summary);
    cardOrder.push(def.id);
  }

  // ---- Metrics to walk in with (chapter 4) --------------------------------
  const metricsDefs = [
    {
      id: "tip-c-yc-metrics-1",
      title: "Gross margin & take rate",
      summary:
        "Know net and gross revenue — for Uber, the company keeps a percentage of the fare, not the whole amount.",
    },
    {
      id: "tip-c-yc-metrics-2",
      title: "Growth, burn & pricing",
      summary:
        "Week-over-week or month-over-month growth, burn vs revenue, price point rationale, and customer segments willing to pay more or less.",
    },
    {
      id: "tip-c-yc-metrics-3",
      title: "NPS & cohort retention",
      summary:
        "Walk in knowing NPS and retention — 10 weeks out, 20 weeks out, how many people are still using the product?",
    },
  ];
  for (const def of metricsDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_YC_METRICS,
      def.title,
      def.summary,
      "tip-c-yc-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-yc-main-4", "tip-c-yc-metrics-1", "bottom", "top"));
  connections.push(
    conn("tip-c-yc-metrics-1", "tip-c-yc-metrics-2", "right", "left"),
  );
  connections.push(
    conn("tip-c-yc-metrics-2", "tip-c-yc-metrics-3", "right", "left"),
  );

  // ---- The thin wedge (chapter 5) -----------------------------------------
  const wedgeDefs = [
    {
      id: "tip-c-yc-wedge-1",
      title: "Airbnb's thin wedge",
      summary:
        "Airbnb started with conference travel in San Francisco — air beds, breakfast, a very limited wedge.",
    },
    {
      id: "tip-c-yc-wedge-2",
      title: "Marketplace for all housing",
      summary:
        "Later they realized it wasn't just air beds or breakfast — they were the marketplace for space, expandable to all of housing.",
    },
  ];
  for (const def of wedgeDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_YC_WEDGE,
      def.title,
      def.summary,
      "tip-c-yc-main-5",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-yc-main-5", "tip-c-yc-wedge-1", "bottom", "top"));
  connections.push(
    conn("tip-c-yc-wedge-1", "tip-c-yc-wedge-2", "right", "left"),
  );

  // ---- How to prepare (chapter 1) -----------------------------------------
  const prepDefs = [
    {
      id: "tip-c-yc-prep-1",
      title: "Practice with YC alumni",
      summary:
        "Reach out to alumni in adjacent spaces for mock interviews — the YC community is unusually giving even to applicants.",
    },
    {
      id: "tip-c-yc-prep-2",
      title: "Inverted pyramid answers",
      summary:
        "Answer immediately and directly first, then add detail — partners interrupt often; lead with the headline so you won't lose the thread.",
    },
  ];
  for (const def of prepDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_YC_PREP,
      def.title,
      def.summary,
      "tip-c-yc-main-1",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-yc-main-1", "tip-c-yc-prep-1", "bottom", "top"));
  connections.push(
    conn("tip-c-yc-prep-1", "tip-c-yc-prep-2", "right", "left"),
  );

  // ---- Artifacts — each lands in the chapter of its source card -----------
  spawnPayload(
    "tip-art-yc-youtube",
    {
      type: "images",
      title: "3 Tips to Nail the Y Combinator Interview",
      data: {
        items: [
          {
            kind: "youtube",
            url: YC_INTERVIEW_TIPS_VIDEO_URL,
            title: "3 Tips to Nail the Y Combinator Interview",
            thumb: "https://img.youtube.com/vi/rfTgzA6iKZc/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-yc-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "initialized",
    "https://initialized.com",
    "Initialized Capital",
    "tip-c-yc-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "garry-twitter",
    "https://twitter.com/garrytan",
    "Garry Tan on X",
    "tip-c-yc-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-yc-table",
    {
      type: "table",
      title: "Three things in 10 min",
      data: {
        columns: [
          { key: "tip", label: "Tip" },
          { key: "focus", label: "Focus" },
          { key: "example", label: "Example" },
        ],
        rows: [
          {
            tip: "Problem",
            focus: "Plain communication",
            example: "Who, how, marketplace sides",
          },
          {
            tip: "Solution",
            focus: "Proof + metrics",
            example: "Revenue, retention, NPS",
          },
          {
            tip: "Impact",
            focus: "Scale potential",
            example: "Thin wedge → big market",
          },
        ],
      },
    },
    "tip-c-yc-main-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnWebsite(
    "airbnb",
    "https://www.airbnb.com",
    "Airbnb",
    "tip-c-yc-wedge-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-yc-sticky",
    {
      type: "stickynote",
      title: "Inverted pyramid",
      data: {
        text: "Answer the question immediately, then add detail — partners interrupt often.",
        colorId: "chalk",
      },
    },
    "tip-c-yc-prep-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-yc-timeline",
    {
      type: "timeline",
      title: "Interview flow",
      data: {
        scale: "day",
        events: [
          {
            id: "yc1",
            label: "Problem — who & how",
            at: "2020-01-01T12:00:00.000Z",
          },
          {
            id: "yc2",
            label: "Solution — proof & metrics",
            at: "2020-01-01T12:03:00.000Z",
          },
          {
            id: "yc3",
            label: "Impact — wedge & scale",
            at: "2020-01-01T12:07:00.000Z",
            highlight: true,
          },
        ],
      },
    },
    "tip-c-yc-main-5",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );


  /*
   * Extracted artifacts, chapter by chapter, per the transcript-artifacts skill.
   * Every string below is a verbatim lift from YC_INTERVIEW_TIPS_TRANSCRIPT. The
   * transcript carries no timestamps, so no artifact claims one.
   */

  // Chapter 1 — D' stat, H quote, I todo, E mechanism.
  spawnPayload(
    "tip-art-yc-stat-ten",
    statPayload("The whole interview", {
      value: "10",
      unit: "minutes",
      label:
        "Not like any other conversation or pitch you've had — three things have to land inside it",
      speaker: SPEAKER,
    }),
    "tip-c-yc-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-quote-intermediate",
    quotePayload("Investors are not the business", {
      text:
        "Getting success with investors is not building a real business, not solving real problems, so don't get too focused on these intermediate steps.",
      speaker: SPEAKER,
      context: "Opening, to applicants who did not get an interview",
    }),
    "tip-c-yc-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-todo-practice",
    {
      type: "todo",
      title: "How to practice",
      data: {
        items: [
          {
            id: "yc-p1",
            label: "Reach out to YC alumni who run adjacent spaces",
            checked: false,
          },
          {
            id: "yc-p2",
            label: "Ask them to give you a quick mock interview",
            checked: false,
          },
          {
            id: "yc-p3",
            label: "Practice with your friends and loved ones",
            checked: false,
          },
          {
            id: "yc-p4",
            label: "Ask them to interrupt you, and practice being interrupted",
            checked: false,
          },
        ],
      },
    },
    "tip-c-yc-prep-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-mech-pyramid",
    mechanismPayload("Why the inverted pyramid survives interruption", {
      steps: [
        { id: "answer", label: "Answer the question immediately and directly" },
        { id: "detail", label: "Then go into extra information" },
        { id: "stop", label: "If they're done, they'll stop you and ask something else" },
        { id: "safe", label: "You won't get caught", note: "The common pitfall: you get cut off and never return to it" },
      ],
      edges: [
        { from: "answer", to: "detail" },
        { from: "detail", to: "stop" },
        { from: "stop", to: "safe" },
      ],
    }),
    "tip-c-yc-prep-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 2 — B table (already above), H quote.
  spawnPayload(
    "tip-art-yc-quote-three",
    quotePayload("Three things, and no room for more", {
      text:
        "It's so short, so you really have very little time to get across exactly three things that I always look for, when I was doing YC interviews.",
      speaker: SPEAKER,
      context: "Setting up the three-part structure",
    }),
    "tip-c-yc-main-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 3 — H quote, I todo.
  spawnPayload(
    "tip-art-yc-quote-teacher",
    quotePayload("The clarity test", {
      text: "Try to explain it to your first-grade teacher.",
      speaker: SPEAKER,
      context: "On explaining what the product is, without buzzwords",
    }),
    "tip-c-yc-main-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-todo-explain",
    {
      type: "todo",
      title: "Explaining the problem",
      data: {
        items: [
          { id: "yc-e1", label: "Use plain English", checked: false },
          { id: "yc-e2", label: "Don't use buzzwords", checked: false },
          {
            id: "yc-e3",
            label: "Try to be as brief and simple as possible",
            checked: false,
          },
          {
            id: "yc-e4",
            label: "Explain things they might not understand about your industry",
            checked: false,
          },
        ],
      },
    },
    "tip-c-yc-main-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 4 — G definition x2, I todo, H quote.
  spawnPayload(
    "tip-art-yc-def-takerate",
    definitionPayload("Gross margin / take rate", {
      term: "Gross margin, or take rate",
      gloss:
        "How much money does your company actually make, and how much do you have to pay to another entity?",
      example:
        "For instance, for Uber, Uber doesn't get the whole fare. It gets a percentage of the fare.",
      speaker: SPEAKER,
    }),
    "tip-c-yc-metrics-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-def-cohort",
    definitionPayload("Cohort retention", {
      term: "Cohort retention",
      gloss:
        "10 weeks out, 20 weeks out, how many people are still using it?",
      speaker: SPEAKER,
    }),
    "tip-c-yc-metrics-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-todo-numbers",
    {
      type: "todo",
      title: "Numbers to walk in with",
      data: {
        items: [
          { id: "yc-n1", label: "Your net and gross revenue", checked: false },
          {
            id: "yc-n2",
            label: "How fast you're growing week to week or month to month",
            checked: false,
          },
          {
            id: "yc-n3",
            label: "Your burn — what you spend against what you bring in",
            checked: false,
          },
          {
            id: "yc-n4",
            label: "Your price point, and how you arrived at it",
            checked: false,
          },
          { id: "yc-n5", label: "Your NPS", checked: false },
          {
            id: "yc-n6",
            label: "Your retention rate, if you're a consumer product",
            checked: false,
          },
        ],
      },
    },
    "tip-c-yc-metrics-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-quote-retention",
    quotePayload("The number that matters most", {
      text:
        "This is one of the most important numbers for all consumer behavior, and so if you know it and it's great, tell people.",
      speaker: SPEAKER,
      context: "On cohort retention",
    }),
    "tip-c-yc-metrics-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 5 — C timeline (already above), G definition, E mechanism, H quote.
  spawnPayload(
    "tip-art-yc-def-wedge",
    definitionPayload("Thin edge of the wedge", {
      term: "The thin edge of the wedge",
      gloss:
        "It's okay if your start-up idea right now solves a much smaller problem for a more limited set of users.",
      example: "Airbnb is a classic example of this.",
      speaker: SPEAKER,
    }),
    "tip-c-yc-main-5",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-mech-airbnb",
    mechanismPayload("How Airbnb widened its wedge", {
      steps: [
        {
          id: "wedge",
          label: "Conference travel in San Francisco only",
          note: "Air beds, not even real beds, and you had to serve breakfast",
        },
        { id: "realize", label: "It wasn't just air beds or just breakfast" },
        { id: "space", label: "They were the marketplace for space" },
        { id: "housing", label: "It could be all of housing" },
      ],
      edges: [
        { from: "wedge", to: "realize", label: "a lot later" },
        { from: "realize", to: "space" },
        { from: "space", to: "housing" },
      ],
    }),
    "tip-c-yc-wedge-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-quote-small",
    quotePayload("Great things start small", {
      text:
        "Everything that could be truly great starts off as something very small.",
      speaker: SPEAKER,
      context: "On why a narrow initial market is not a weakness",
    }),
    "tip-c-yc-wedge-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  /*
   * The masthead. This video has no creator chapters — the description carries
   * none — so the index uses the derived chapter titles and shows ordinals
   * rather than start times. Its description does carry two real links, which
   * is what "From the description" holds; nothing here is invented.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-yc-episode", "tip-art-yc-links"];

  spawnPayload(
    "tip-art-yc-episode",
    episodePayload("The episode", {
      videoTitle: "3 Tips to Nail the Y Combinator Interview",
      channel: "Garry Tan",
      duration: "7:05",
      url: YC_INTERVIEW_TIPS_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/rfTgzA6iKZc/maxresdefault.jpg",
      description:
        "These were the 3 things I looked for when I was a Y Combinator partner. It's only 10 minutes, so make them count.",
      chapters: mainDefs.map((def, index) => ({
        label: def.title,
        groupId: `tip-yc-chapter-${index + 1}`,
      })),
    }),
    "tip-c-yc-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-yc-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This video", url: YC_INTERVIEW_TIPS_VIDEO_URL },
            { label: "Garry Tan", url: "https://www.youtube.com/@GarryTan" },
          ],
        },
        {
          label: "From the description",
          links: [
            { label: "Garry Tan on X", url: "https://twitter.com/garrytan" },
            { label: "Initialized Capital", url: "https://initialized.com" },
          ],
        },
        {
          label: "Mentioned",
          links: [{ label: "Airbnb", url: "https://www.airbnb.com" }],
        },
      ],
    }),
    "tip-c-yc-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  const layout = layoutChapters({
    mainCardIds: mainDefs.map((def) => def.id),
    cards,
    cardOrder,
    connections,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    mastheadNodeIds: MASTHEAD_NODE_IDS,
    idPrefix: "tip-yc",
  });

  return {
    cards,
    cardOrder,
    connections: layout.connections,
    threads,
    threadOrder,
    groups: layout.groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: layout.contentCenter,
  };
}
