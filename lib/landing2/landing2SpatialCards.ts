import type { DesignSystemCardSample } from "@/lib/designSystemCardSamples";
import { CARD_WIDTH } from "@/lib/canvasNodeBounds";
import type { Card } from "@/lib/store";

export interface Landing2SpatialPlacement {
  id: string;
  sample: DesignSystemCardSample;
  /** % from left of stage */
  x: number;
  /** % from top of stage */
  y: number;
  scale?: number;
  accentIndex: number;
  rotate?: number;
  /** Drift direction when scroll animates (px) */
  driftX?: number;
  driftY?: number;
}

function card(
  id: string,
  question: string,
  answer: string,
  responseType: Card["responseType"] = "text",
): Card {
  return {
    id,
    threadId: `l2-${id}`,
    question,
    answer,
    status: "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
    responseType,
  };
}

function sample(
  id: string,
  kind: DesignSystemCardSample["kind"],
  question: string,
  answer: string,
  extra?: Partial<DesignSystemCardSample>,
): DesignSystemCardSample {
  return {
    id,
    kind,
    title: question,
    description: "",
    tags: [],
    componentPath: "landing2/spatial",
    card: card(id, question, answer, extra?.card?.responseType),
    ...extra,
  };
}

/** Three isolated chats — different corners of the canvas, different threads */
export const LANDING2_ISOLATED_CHATS: Landing2SpatialPlacement[] = [
  {
    id: "chat-interview",
    sample: sample(
      "l2-interview",
      "text",
      "Prepare me for the Stripe PM interview",
      "Focus on metrics, tradeoffs, and a crisp 'tell me about yourself' — I'll build a question bank.",
    ),
    x: 2,
    y: 6,
    scale: 0.86,
    accentIndex: 0,
    rotate: -2.5,
    driftX: -56,
    driftY: -28,
  },
  {
    id: "chat-market",
    sample: sample(
      "l2-market",
      "text",
      "Compare TAM for three niches",
      "B2B SaaS for dentists, vertical AI for legal, dev tools for data teams — let's score each.",
    ),
    x: 58,
    y: 18,
    scale: 0.9,
    accentIndex: 1,
    rotate: 2,
    driftX: 64,
    driftY: -20,
  },
  {
    id: "chat-trip",
    sample: sample(
      "l2-trip",
      "text",
      "Plan a long weekend in Lisbon",
      "Alfama vs Chiado, day trips to Sintra — let's map it on the canvas.",
    ),
    x: 26,
    y: 62,
    scale: 0.84,
    accentIndex: 2,
    rotate: -1.5,
    driftX: -24,
    driftY: 48,
  },
];

/** Branching canvas preview cards (static positions before real canvas loads) */
export const LANDING2_BRANCH_PLACEMENTS: Landing2SpatialPlacement[] = [
  {
    id: "branch-root",
    sample: sample(
      "l2-root",
      "text",
      "Where should you spend your long weekend?",
      "Lisbon keeps coming up — great food, walkable neighborhoods, easy day trips.",
    ),
    x: 8,
    y: 38,
    scale: 0.75,
    accentIndex: 0,
  },
  {
    id: "branch-alfama",
    sample: sample(
      "l2-alfama",
      "text",
      "Compare Alfama vs Chiado",
      "Alfama is quieter and hillier; Chiado is central with more cafés.",
    ),
    x: 38,
    y: 18,
    scale: 0.7,
    accentIndex: 0,
  },
  {
    id: "branch-porto",
    sample: sample(
      "l2-porto",
      "text",
      "What about Porto instead?",
      "Compact, cheaper, strong on wine culture — fewer crowds.",
    ),
    x: 38,
    y: 52,
    scale: 0.7,
    accentIndex: 1,
  },
];

export const LANDING2_SPATIAL_CARD_WIDTH = CARD_WIDTH;
