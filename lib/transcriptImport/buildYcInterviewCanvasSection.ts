import { CARD_WIDTH } from "@/lib/canvasNodeBounds";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import {
  ARTIFACT_OFFSET_X,
  CARD_STEP_X,
  conn,
  convCard,
  INPUT_ARTIFACT_STEP,
  ORIGIN_X,
  OUTPUT_ARTIFACT_LANE_X,
  PLAYGROUND_SECTION_GAP_Y,
  spawnPayload,
  spawnWebsite,
  thread,
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";
import { YC_INTERVIEW_TIPS_VIDEO_URL } from "@/lib/transcriptImport/ycInterviewTips";
import type {
  BranchGroup,
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";

export const TIP_GROUP_ID_YC = "tip-import-group-yc";
export const TIP_THREAD_YC_MAIN = "tip-thread-yc-main";
export const TIP_THREAD_YC_METRICS = "tip-thread-yc-metrics";
export const TIP_THREAD_YC_WEDGE = "tip-thread-yc-wedge";
export const TIP_THREAD_YC_PREP = "tip-thread-yc-prep";

/** Bottom of design-tools input website strip + approximate artifact height. */
const DESIGN_TOOLS_SECTION_BOTTOM_Y = 2360 + 320;
const YC_SECTION_OFFSET = DESIGN_TOOLS_SECTION_BOTTOM_Y + PLAYGROUND_SECTION_GAP_Y;

const YC_MAIN_Y = YC_SECTION_OFFSET + 720;
const YC_METRICS_Y = YC_SECTION_OFFSET + 80;
const YC_WEDGE_Y = YC_SECTION_OFFSET + 1320;
const YC_PREP_Y = YC_SECTION_OFFSET + 1820;

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

  const mainDefs = [
    {
      id: "tip-c-yc-main-1",
      title: "YC interview — 10 minutes",
      summary:
        "Congrats if you got in — unlike any other pitch, you have only ten minutes to land three things partners always look for.",
      x: ORIGIN_X,
    },
    {
      id: "tip-c-yc-main-2",
      title: "Three things partners look for",
      summary:
        "Problem → Solution (is it good, are you the team?) → How big can it really be if you succeed?",
      x: ORIGIN_X + CARD_STEP_X,
    },
    {
      id: "tip-c-yc-main-3",
      title: "Tip 1 — Problem",
      summary:
        "Plain English, no buzzwords: who is it for, how does it work, marketplace sides if applicable — explain like a first-grade teacher.",
      x: ORIGIN_X + CARD_STEP_X * 2,
    },
    {
      id: "tip-c-yc-main-4",
      title: "Tip 2 — Solution",
      summary:
        "Alternatives and competition, customer proof, revenue and gross margin, growth, burn, pricing, NPS, and cohort retention.",
      x: ORIGIN_X + CARD_STEP_X * 3,
    },
    {
      id: "tip-c-yc-main-5",
      title: "Tip 3 — Impact",
      summary:
        "How big can this get? A thin edge of the wedge is fine — great companies start solving a small problem for a limited audience.",
      x: ORIGIN_X + CARD_STEP_X * 4,
    },
  ];

  for (const def of mainDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_YC_MAIN,
      def.title,
      def.summary,
      { x: def.x, y: YC_MAIN_Y },
    );
    cardOrder.push(def.id);
  }

  for (let i = 0; i < mainDefs.length - 1; i++) {
    connections.push(
      conn(mainDefs[i]!.id, mainDefs[i + 1]!.id, "right", "left"),
    );
  }

  const main1X = ORIGIN_X;
  const main4X = ORIGIN_X + CARD_STEP_X * 3;
  const main5X = ORIGIN_X + CARD_STEP_X * 4;

  const metricsDefs = [
    {
      id: "tip-c-yc-metrics-1",
      title: "Gross margin & take rate",
      summary:
        "Know net and gross revenue — for Uber, the company keeps a percentage of the fare, not the whole amount.",
      x: main4X,
    },
    {
      id: "tip-c-yc-metrics-2",
      title: "Growth, burn & pricing",
      summary:
        "Week-over-week or month-over-month growth, burn vs revenue, price point rationale, and customer segments willing to pay more or less.",
      x: main4X + CARD_STEP_X,
    },
    {
      id: "tip-c-yc-metrics-3",
      title: "NPS & cohort retention",
      summary:
        "Walk in knowing NPS and retention — 10 weeks out, 20 weeks out, how many people are still using the product?",
      x: main4X + CARD_STEP_X * 2,
    },
  ];

  for (const def of metricsDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_YC_METRICS,
      def.title,
      def.summary,
      { x: def.x, y: YC_METRICS_Y },
      "tip-c-yc-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-yc-main-4", "tip-c-yc-metrics-1", "top", "bottom"));
  connections.push(
    conn("tip-c-yc-metrics-1", "tip-c-yc-metrics-2", "right", "left"),
  );
  connections.push(
    conn("tip-c-yc-metrics-2", "tip-c-yc-metrics-3", "right", "left"),
  );

  const wedgeDefs = [
    {
      id: "tip-c-yc-wedge-1",
      title: "Airbnb's thin wedge",
      summary:
        "Airbnb started with conference travel in San Francisco — air beds, breakfast, a very limited wedge.",
      x: main5X,
    },
    {
      id: "tip-c-yc-wedge-2",
      title: "Marketplace for all housing",
      summary:
        "Later they realized it wasn't just air beds or breakfast — they were the marketplace for space, expandable to all of housing.",
      x: main5X + CARD_STEP_X,
    },
  ];

  for (const def of wedgeDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_YC_WEDGE,
      def.title,
      def.summary,
      { x: def.x, y: YC_WEDGE_Y },
      "tip-c-yc-main-5",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-yc-main-5", "tip-c-yc-wedge-1", "bottom", "top"));
  connections.push(
    conn("tip-c-yc-wedge-1", "tip-c-yc-wedge-2", "right", "left"),
  );

  const prepDefs = [
    {
      id: "tip-c-yc-prep-1",
      title: "Practice with YC alumni",
      summary:
        "Reach out to alumni in adjacent spaces for mock interviews — the YC community is unusually giving even to applicants.",
      x: main1X + CARD_STEP_X,
    },
    {
      id: "tip-c-yc-prep-2",
      title: "Inverted pyramid answers",
      summary:
        "Answer immediately and directly first, then add detail — partners interrupt often; lead with the headline so you won't lose the thread.",
      x: main1X + CARD_STEP_X * 2,
    },
  ];

  for (const def of prepDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_YC_PREP,
      def.title,
      def.summary,
      { x: def.x, y: YC_PREP_Y },
      "tip-c-yc-main-1",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-yc-main-1", "tip-c-yc-prep-1", "bottom", "top"));
  connections.push(
    conn("tip-c-yc-prep-1", "tip-c-yc-prep-2", "right", "left"),
  );

  const artifactX = main1X + CARD_WIDTH + ARTIFACT_OFFSET_X;
  const outputX = main5X + CARD_WIDTH + OUTPUT_ARTIFACT_LANE_X;

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
    { x: artifactX, y: YC_MAIN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "initialized",
    "https://initialized.com",
    "Initialized Capital",
    "tip-c-yc-main-1",
    { x: artifactX + INPUT_ARTIFACT_STEP, y: YC_MAIN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "garry-twitter",
    "https://twitter.com/garrytan",
    "Garry Tan on X",
    "tip-c-yc-main-1",
    { x: artifactX + INPUT_ARTIFACT_STEP * 2, y: YC_MAIN_Y },
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
    {
      x: ORIGIN_X + CARD_STEP_X + CARD_WIDTH + ARTIFACT_OFFSET_X,
      y: YC_MAIN_Y,
    },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnWebsite(
    "airbnb",
    "https://www.airbnb.com",
    "Airbnb",
    "tip-c-yc-wedge-1",
    {
      x: wedgeDefs[0]!.x + CARD_WIDTH + ARTIFACT_OFFSET_X,
      y: YC_WEDGE_Y,
    },
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
    {
      x: prepDefs[1]!.x + CARD_WIDTH + ARTIFACT_OFFSET_X,
      y: YC_PREP_Y,
    },
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
    { x: outputX, y: YC_MAIN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  const groups: Record<string, BranchGroup> = {
    [TIP_GROUP_ID_YC]: {
      id: TIP_GROUP_ID_YC,
      label: "YC interview tips import",
      familyRootThreadIds: [TIP_THREAD_YC_MAIN],
      summaryMarkdown: null,
    },
  };

  return {
    cards,
    cardOrder,
    connections,
    threads,
    threadOrder,
    groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: { x: ORIGIN_X + CARD_STEP_X * 2.5, y: YC_MAIN_Y },
  };
}
