import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import {
  episodePayload,
  linkGroupPayload,
  mechanismPayload,
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
  threadGist,
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";
import {
  NITHIN_KAMATH_RISK_CHAPTERS,
  NITHIN_KAMATH_RISK_VIDEO_URL,
} from "@/lib/transcriptImport/nithinKamathRisk";

/*
 * Nithin Kamath on moats and risk — Rainmatter by Zerodha, nine and a half
 * minutes. The second fixture from The Startup Blueprint, after Kunal Shah.
 *
 * The show's format does the chaptering for you: the host says up front that he
 * will ask three questions, and then asks exactly three. The spine is four
 * rather than three because the risk question is asked twice and the second ask
 * changes the subject from the company's money to his own — see
 * NITHIN_KAMATH_RISK_CHAPTERS for the cut and the budget arithmetic behind it.
 *
 * Two things the source forces, both general to ASR captions:
 *
 * 1. No speaker labels, but the turn structure is unambiguous throughout — three
 *    questions, three long answers — and the host names his guest in the opening
 *    line. So attribution is asserted: Nithin Kamath for the answers,
 *    "Rainmatter host" for the questions, since the interviewer is never named.
 * 2. Mangled proper nouns, and one of them costs an artifact. The line the video
 *    leads with — "if you want to bin you have to bet and if you lose all your
 *    chips you can't bet" — garbles win as "bin", and a quote cannot be tidied
 *    up without breaking the verbatim rule. So the quote lifts the clean half
 *    and the first half is carried in its context line instead. "Zerodola",
 *    "growers", "the modes" and "innovative is the dilemma" are resolved only in
 *    card summaries and links, never in a verbatim field.
 *
 * One span is deliberately left unextracted. "not everything goes bad at the
 * same time" is the best formulation of the portfolio argument in the episode,
 * but it lands in an ASR run-on where the guest's answer and the host's
 * agreement collide, and there is no way to tell which of them said it.
 */

const NITHIN = "Nithin Kamath";

export const TIP_THREAD_NK_MAIN = "tip-thread-nk-main";
export const TIP_THREAD_NK_PRICE = "tip-thread-nk-price";
export const TIP_THREAD_NK_ERAS = "tip-thread-nk-eras";
export const TIP_THREAD_NK_MOAT = "tip-thread-nk-moat";
export const TIP_THREAD_NK_PRIMARY = "tip-thread-nk-primary";
export const TIP_THREAD_NK_DAYS = "tip-thread-nk-days";
export const TIP_THREAD_NK_BET = "tip-thread-nk-bet";
export const TIP_THREAD_NK_FD = "tip-thread-nk-fd";
export const TIP_THREAD_NK_SPLIT = "tip-thread-nk-split";
export const TIP_THREAD_NK_HOURS = "tip-thread-nk-hours";
export const TIP_THREAD_NK_LIFE = "tip-thread-nk-life";

/** Canvas memory — one authored gist per thread. See `threadGist`. */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_NK_MAIN]:
    "Nithin Kamath on Rainmatter: Zerodha's differentiator moved from low cost and referrals to products around 2015 and to trust from 2018-19, so moats must keep evolving; thinking about risk is his primary job, with ten percent provisioned since day one and his own downside taken off the table in 2016-17; and the first two hours of every day are his.",
  [TIP_THREAD_NK_PRICE]:
    "With neither tech nor money, Zerodha's only pitch was low-cost trading, and with no ad budget it paid referral fees instead — which meant no acquisition cost and no pressure on anyone to trade. Nobody copied it because nobody thought the pricing would work.",
  [TIP_THREAD_NK_ERAS]:
    "The differentiator was handed over deliberately: products once they had the tech around 2015, then credibility and trust from 2018-19 as the customer base grew. He notes Groww won the other way, by advertising heavily.",
  [TIP_THREAD_NK_MOAT]:
    "Whatever the moat is on day one has to change by year three or four. Fresh from The Innovator's Dilemma, he says there is no status quo and everyone will be disrupted, so moats must keep evolving.",
  [TIP_THREAD_NK_PRIMARY]:
    "Thinking about risk is not a daily activity but his primary job, because customers trade for more money than they have. Since day one, ten percent has been set aside as money bound to go back.",
  [TIP_THREAD_NK_DAYS]:
    "The provision has been cashed: about fifty crores lost on the day gold suddenly dropped, and thirty or forty crores when crude went negative during Covid. Such incidents are going to happen to the business.",
  [TIP_THREAD_NK_BET]:
    "Minimising risk is not an option in a risky business — you have to be willing to take it. The other half of his policy is that the risk must never be able to bring you down.",
  [TIP_THREAD_NK_FD]:
    "Making peace with the worst case did not come naturally. The tipping point was 2016-17, when he moved enough money to sustain his lifestyle into a bank fixed deposit, and he has thought about risk differently since.",
  [TIP_THREAD_NK_SPLIT]:
    "Half the capital is blocked for working capital and never at risk; the other half is split across private, public and gold. About ten percent of everything sits in private investing, the riskiest bucket, held on the assumption it can disappear — a basket of risk rather than a bet.",
  [TIP_THREAD_NK_HOURS]:
    "For three or four years he has been up at five and spent 5:30 to 7:30 on workouts, stretching and yoga. It is his time, and without it the rest of the day goes for a toss.",
  [TIP_THREAD_NK_LIFE]:
    "He volunteers that he has no real social life: he is either at the office or at home, with nothing in between.",
};

export function buildNithinKamathRiskCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_NK_MAIN,
    TIP_THREAD_NK_PRICE,
    TIP_THREAD_NK_ERAS,
    TIP_THREAD_NK_MOAT,
    TIP_THREAD_NK_PRIMARY,
    TIP_THREAD_NK_DAYS,
    TIP_THREAD_NK_BET,
    TIP_THREAD_NK_FD,
    TIP_THREAD_NK_SPLIT,
    TIP_THREAD_NK_HOURS,
    TIP_THREAD_NK_LIFE,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 4 + index);
  });
  const threadGists = Object.fromEntries(
    threadIds.map((id) => [id, threadGist(THREAD_GISTS[id]!, 1)]),
  );

  /** Local sugar — every artifact in this file spawns into the same three records. */
  function spawn(nodeId: string, payload: ArtifactPayload, cardId: string) {
    spawnPayload(
      nodeId,
      payload,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  }

  function site(id: string, url: string, title: string, cardId: string) {
    spawnWebsite(
      id,
      url,
      title,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  }

  // ---- Chapter heads: the four derived chapters --------------------------
  const mainDefs = NITHIN_KAMATH_RISK_CHAPTERS.map((chapter, index) => ({
    id: `tip-c-nk-main-${index + 1}`,
    title: chapter.title,
  }));
  const summaries = [
    "Asked what a founder starting today should differentiate on, he refuses to give advice and describes what worked for Zerodha instead. With no tech and no money they went out on low cost, and because they could not afford to advertise they paid a referral fee — which became the differentiation for the first three to five years. Around 2015, once they had the tech, it became about better products; from 2018-19 onwards it became credibility and trust. His conclusion is that finding the differentiator is a permanent job, not a founding decision, and that the moats themselves have to keep evolving.",
    "The host extends the question to risk: everybody is prone to disruption, and a founder with two years of money in the bank can feel safe right up until the event that ruins the business. Nithin Kamath's answer is that thinking about risk is his primary job, from the day they started, because the business itself involves risk — customers trade for more money than they have. He has demarcated ten percent since day one as money bound to go back, and names two days that cashed that provision: a sudden drop in gold, and crude oil going negative during Covid. You have to be willing to take risk, he says, and also ensure it cannot bring you down.",
    "Asked whether making peace with the worst case comes naturally, he says no, and dates the change. In 2016-17 he took enough money out of the business to sustain his lifestyle and put it in a bank fixed deposit, and from then on he thought about risk very differently. The structure that followed is arithmetic: half the capital blocked for working capital, the other half divided across private, public and gold, with about ten percent of everything in private — the riskiest bucket, held on the assumption that it can disappear at any time. Divide the risk and it becomes a portfolio rather than a bet.",
    "The last question is about the stress every founder they meet is carrying, and what he does outside work. For the last three or four years the answer is the first two hours of the day: up at five, then 5:30 to 7:30 on workouts, stretching and yoga. It is his time, and without it he feels the rest of the day goes for a toss. He adds, unprompted, that he does not really have a social life — he is either at work or in his house, with nothing in between.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_NK_MAIN,
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

  // ---- Chapter 1 · The differentiator has to be replaced -----------------
  branch(TIP_THREAD_NK_PRICE, "tip-c-nk-main-1", [
    {
      id: "tip-c-nk-price-1",
      title: "Neither tech nor money to start with",
      summary:
        "He opens by declining to sound like he is giving advice, and narrows the answer to what actually worked for Zerodha — rendered \"Zerodola\" in the captions. Back when they started they had neither tech nor money, so the pitch was the only thing left: come trade with us for a low cost. That was the whole of the differentiation for the first three to five years.",
    },
    {
      id: "tip-c-nk-price-2",
      title: "A referral fee instead of an ad budget",
      summary:
        "The referral model was a consequence of the same shortage. Because they had no money to advertise they had to pay a referral fee instead, and that became a model rather than a stopgap. The side effect is the one he keeps coming back to: with no advertising there was no cost of acquisition, so they never had to push anybody to trade.",
    },
    {
      id: "tip-c-nk-price-3",
      title: "Nobody thought the pricing would work",
      summary:
        "Luckily for them, he says, people back then did not really think the pricing model would work — which is why nobody moved to copy it. Brokers were stuck in an offline way of working even where they were nominally online. Zerodha broke the mold by being online in how it operated, not only in what it sold.",
    },
  ]);
  branch(TIP_THREAD_NK_ERAS, "tip-c-nk-main-1", [
    {
      id: "tip-c-nk-eras-1",
      title: "2015: once they had the tech",
      summary:
        "The first differentiator did not survive the company getting good. Around 2015, once they had built the tech, the thing that set them apart stopped being the price and became the products. He marks it as a deliberate handover rather than a drift.",
    },
    {
      id: "tip-c-nk-eras-2",
      title: "2018-19: credibility and trust",
      summary:
        "From around 2018-19 onwards it changed again, to credibility and trust — because by then there were so many customers trading with them that trust was the thing being bought. His framing of the whole sequence is that throughout the journey there had to be some kind of differentiating factor for them to be able to sell.",
    },
    {
      id: "tip-c-nk-eras-3",
      title: "Groww went the other way",
      summary:
        "He is explicit that this is not the only way to build it. Groww — the captions render it \"growers\" — has done it brilliantly by going out and advertising to customers and saying they are much better. That is their way of differentiating; his worked because they did the opposite, and paid no acquisition cost for it.",
    },
  ]);
  branch(TIP_THREAD_NK_MOAT, "tip-c-nk-main-1", [
    {
      id: "tip-c-nk-moat-1",
      title: "It has to change",
      summary:
        "The host reads the pattern back to him: whatever your moat is on day one can change by year three or four. He agrees without qualification — it has to change. The follow-up turns the three eras from a company history into a rule.",
    },
    {
      id: "tip-c-nk-moat-2",
      title: "The Innovator's Dilemma, the night before",
      summary:
        "He had been listening to The Innovator's Dilemma the previous day, which the captions render as \"innovative is the dilemma\". His reading of it is that there is no status quo in today's world and everyone is going to get disrupted, so the moats themselves have to keep evolving over time.",
    },
  ]);

  // ---- Chapter 2 · Risk is the primary job -------------------------------
  branch(TIP_THREAD_NK_PRIMARY, "tip-c-nk-main-2", [
    {
      id: "tip-c-nk-primary-1",
      title: "Not a daily activity — the job itself",
      summary:
        "The host asks whether thinking about risk is a daily-basis activity after sixteen years. He reframes it rather than answers it: if you were to ask what his primary job is, it is to think about the risk, and it has been from the day they started. The reason is structural — the business involves risk because customers are trading for more money than they have with them.",
    },
    {
      id: "tip-c-nk-primary-2",
      title: "Ten percent, watched since day one",
      summary:
        "So he has always demarcated ten percent — the captions garble the mechanism as \"we're creating the watches\" — as money that is bound to go back. That provision has been in place since day one of starting the business, not added after a loss. Risk is priority, he says, and the most important priority for him is risk.",
    },
  ]);
  branch(TIP_THREAD_NK_DAYS, "tip-c-nk-main-2", [
    {
      id: "tip-c-nk-days-1",
      title: "A day on gold, a day on crude",
      summary:
        "He gives two examples of the provision being cashed. Recently, when gold suddenly dropped, they lost fifty crores on that day; when crude oil went to negative during Covid they lost thirty or forty crores on that day. His point is not the size of either number but that these incidents are going to happen to the business.",
    },
  ]);
  branch(TIP_THREAD_NK_BET, "tip-c-nk-main-2", [
    {
      id: "tip-c-nk-bet-1",
      title: "You still have to be willing to take it",
      summary:
        "The obvious conclusion — minimise risk — is one he rules out. If you have to work in a risky environment then as a business you have to be willing to take the risk, because there are people who are unwilling to, and it cannot really work out that way. Being at risk is a condition of being in this business at all.",
    },
    {
      id: "tip-c-nk-bet-2",
      title: "But it cannot bring you down",
      summary:
        "The constraint sits on the other side: take the risk, but ensure the risk cannot bring you down. He puts it through a line he keeps about betting and chips, which is also the line the video leads with. Together the two halves are the whole of his risk policy.",
    },
  ]);

  // ---- Chapter 3 · He took his own downside off the table ----------------
  branch(TIP_THREAD_NK_FD, "tip-c-nk-main-3", [
    {
      id: "tip-c-nk-fd-1",
      title: "The tipping point was 2016-17",
      summary:
        "Asked whether making peace with the worst case comes naturally, he says no and gives it a date. The tipping point in the journey was 2016-17, when he took out enough money to sustain his lifestyle and put it in a bank fixed deposit. From that time onwards, he says, the way he thinks about risk is very different from before.",
    },
  ]);
  branch(TIP_THREAD_NK_SPLIT, "tip-c-nk-main-3", [
    {
      id: "tip-c-nk-split-1",
      title: "Half the capital never moves",
      summary:
        "What replaced the instinct is an allocation. As a business, fifty percent of the capital is blocked for working capital and does not get to be at risk at all. The other fifty percent is divided across private, public, gold and so on.",
    },
    {
      id: "tip-c-nk-split-2",
      title: "The private slice is the riskiest one",
      summary:
        "Inside that second half, the most riskiest thing for him is the private investing. In his head he has settled on about ten percent of all their capital being in private. The way he makes peace with it is by knowing that this private money is something that can disappear anytime.",
    },
    {
      id: "tip-c-nk-split-3",
      title: "A basket rather than a bet",
      summary:
        "He thinks that is the right way to approach it: ensure the risk is divided so that what you hold is a portfolio — a basket of risk — rather than a single exposure. Hopefully something works and something does not. The one formulation of this in the episode that the captions attribute cleanly is his own.",
    },
  ]);

  // ---- Chapter 4 · The first two hours -----------------------------------
  branch(TIP_THREAD_NK_HOURS, "tip-c-nk-main-4", [
    {
      id: "tip-c-nk-hours-1",
      title: "Up at 5, and 5:30 to 7:30",
      summary:
        "For the last three or four years the answer to what keeps him going is the first two hours of the day. He gets up at five and spends 5:30 to 7:30 on workouts, stretching, yoga and things like that. He calls it his time, which is the only claim he makes for it.",
    },
    {
      id: "tip-c-nk-hours-2",
      title: "Or the day goes for a toss",
      summary:
        "The two hours are not a preference but a dependency. If he does not get that time he feels the rest of the day goes for a toss. It is the reason the block sits before work rather than after it.",
    },
  ]);
  branch(TIP_THREAD_NK_LIFE, "tip-c-nk-main-4", [
    {
      id: "tip-c-nk-life-1",
      title: "Either here or in my house",
      summary:
        "He volunteers the other half without being asked: unfortunately or fortunately, he does not really have a social life. He is either at the office or in his house, and there is nothing in between. The host had assumed founders were failing to take time out for themselves; the answer is that this one took the time out of everything else.",
    },
  ]);

  /*
   * Extracted artifacts, chapter by chapter, per the transcript-artifacts skill.
   * Every quote text below is a verbatim lift from NITHIN_KAMATH_RISK_TRANSCRIPT
   * — the fidelity test in transcriptFidelity.test.ts asserts it. The captions
   * do carry usable timestamps, so each quote claims one.
   *
   * Emit order is reading order inside a chapter's bento, and short tiles fuse
   * into two-high columns, so the quotes, stats and stickies are emitted
   * adjacent and the tables and mechanisms after them.
   */

  // ---- Chapter 1 — 2 quotes, 1 table, 1 mechanism, 3 references ----------
  spawn(
    "tip-art-nk-quote-mold",
    quotePayload("Online all the way through", {
      text:
        "we broke the mold and we said we'll be both online in the way we operate and the way we work also",
      speaker: NITHIN,
      timestamp: "1:49",
      context:
        "On what the incumbents were missing while nominally being online too",
    }),
    "tip-c-nk-price-3",
  );
  spawn(
    "tip-art-nk-quote-statusquo",
    quotePayload("Why a moat cannot sit still", {
      text:
        "there's no status quo in today's world right like everyone's going to get disrupted",
      speaker: NITHIN,
      timestamp: "3:41",
      context: "After a day spent listening to The Innovator's Dilemma",
    }),
    "tip-c-nk-moat-2",
  );
  spawn(
    "tip-art-nk-sticky-moat",
    {
      type: "stickynote",
      title: "Three answers, same question",
      data: {
        text: "Price, then product, then trust — roughly five years apart. The interesting part is that he names the replacement as the job rather than as a pivot.",
        colorId: "turbo",
      },
    },
    "tip-c-nk-moat-1",
  );
  spawn(
    "tip-art-nk-table-eras",
    {
      type: "table",
      title: "The differentiator, by era",
      data: {
        columns: [
          { key: "period", label: "Period" },
          { key: "moat", label: "What set them apart" },
          { key: "why", label: "Why that, then" },
        ],
        rows: [
          {
            period: "The first 3 to 5 years",
            moat: {
              value: "Low cost, and a referral model",
              tags: [{ label: "No ad spend", tone: "info" }],
            },
            why: "No tech and no money — and nobody thought the pricing model would really work",
          },
          {
            period: "Around 2015",
            moat: "Better products",
            why: "Once we got the tech",
          },
          {
            period: "Around 2018-19 onwards",
            moat: {
              value: "Credibility and trust",
              tags: [{ label: "Current", tone: "success" }],
            },
            why: "So many customers who are trading with us by then",
          },
        ],
      },
    },
    "tip-c-nk-eras-2",
  );
  spawn(
    "tip-art-nk-mech-referral",
    mechanismPayload("Why there was never an acquisition cost", {
      steps: [
        { id: "nothing", label: "No tech, no money" },
        { id: "lowcost", label: "Come trade with us for a low cost" },
        {
          id: "referral",
          label: "Pay a referral fee instead",
          note: "We created a referral model",
        },
        { id: "nocac", label: "There was no cost of acquisition" },
        { id: "nopush", label: "Never had to push any customers to trade" },
      ],
      edges: [
        { from: "nothing", to: "lowcost" },
        {
          from: "lowcost",
          to: "referral",
          label: "because we didn't have money to advertise",
        },
        { from: "referral", to: "nocac" },
        { from: "nocac", to: "nopush" },
      ],
    }),
    "tip-c-nk-price-2",
  );
  site("nk-zerodha", "https://zerodha.com", "Zerodha", "tip-c-nk-price-1");
  site("nk-groww", "https://groww.in", "Groww", "tip-c-nk-eras-3");
  site(
    "nk-innovators-dilemma",
    "https://en.wikipedia.org/wiki/The_Innovator%27s_Dilemma",
    "The Innovator's Dilemma",
    "tip-c-nk-moat-2",
  );

  // ---- Chapter 2 — 1 stat, 2 quotes, 1 table, 1 sticky -------------------
  spawn(
    "tip-art-nk-stat-provision",
    statPayload("The standing provision", {
      value: "10%",
      label:
        "Demarcated from day one as money that is bound to go back — because customers trade for more money than they have",
      speaker: NITHIN,
    }),
    "tip-c-nk-primary-2",
  );
  spawn(
    "tip-art-nk-quote-bringdown",
    quotePayload("The one constraint on taking risk", {
      text: "ensure that the risk can't bring you down",
      speaker: NITHIN,
      timestamp: "6:06",
      context:
        "Immediately after saying a business in this line has to be willing to take risk",
    }),
    "tip-c-nk-bet-2",
  );
  spawn(
    "tip-art-nk-quote-chips",
    quotePayload("Betting and chips", {
      text: "if you lose all your chips you can't bet",
      speaker: NITHIN,
      timestamp: "6:18",
      context:
        "The second half of a line he keeps — the first half is that to win, you have to bet",
    }),
    "tip-c-nk-bet-2",
  );
  spawn(
    "tip-art-nk-sticky-priced",
    {
      type: "stickynote",
      title: "Priced in, not insured against",
      data: {
        text: "The ten percent is not a reserve built up after a bad year. It has been carved out since day one, because the business is people trading money they do not have.",
        colorId: "violet",
      },
    },
    "tip-c-nk-primary-1",
  );
  spawn(
    "tip-art-nk-table-losses",
    {
      type: "table",
      title: "Two days that went against them",
      data: {
        columns: [
          { key: "event", label: "What happened" },
          { key: "when", label: "When" },
          { key: "cost", label: "What it cost that day" },
        ],
        rows: [
          {
            event: "Gold suddenly dropped",
            when: "Recently",
            cost: "We lost 50 crores on that day",
          },
          {
            event: "Crude oil went to negative",
            when: "During Covid",
            cost: "We lost like 30 40 crores on that day",
          },
        ],
      },
    },
    "tip-c-nk-days-1",
  );

  // ---- Chapter 3 — 1 stat, 1 quote, 1 sticky, 1 mechanism ---------------
  spawn(
    "tip-art-nk-stat-private",
    statPayload("The riskiest bucket", {
      value: "10% of all capital",
      label:
        "In private — the most riskiest thing he invests in, and the part he holds on the assumption it can disappear anytime",
      speaker: NITHIN,
    }),
    "tip-c-nk-split-2",
  );
  spawn(
    "tip-art-nk-quote-divided",
    quotePayload("Dividing the risk", {
      text: "you basically ensure that your risk is divided",
      speaker: NITHIN,
      timestamp: "7:34",
      context: "On why the allocation is a portfolio rather than a position",
    }),
    "tip-c-nk-split-3",
  );
  spawn(
    "tip-art-nk-sticky-downside",
    {
      type: "stickynote",
      title: "His own downside went first",
      data: {
        text: "The lifestyle went into a fixed deposit in 2016-17. Everything risky after that date is money he had already decided he could afford to lose.",
        colorId: "haiti",
      },
    },
    "tip-c-nk-fd-1",
  );
  spawn(
    "tip-art-nk-mech-peace",
    mechanismPayload("How he made peace with the worst case", {
      steps: [
        {
          id: "takeout",
          label: "Took out enough money to sustain the lifestyle",
          note: "2016-17 — the tipping point in this journey",
        },
        { id: "fd", label: "Put it as a bank fixed deposit" },
        { id: "different", label: "From that time onwards he thinks about risk differently" },
        {
          id: "split",
          label: "50% blocked for working capital, 50% across private, public, gold",
        },
        {
          id: "private",
          label: "About 10% of all capital sits in private",
          note: "The most riskiest thing for me is the private one",
        },
        { id: "peace", label: "Hold it knowing it can disappear anytime" },
      ],
      // Plainly linear — the normalizer chains them in order.
      edges: [],
    }),
    "tip-c-nk-fd-1",
  );

  // ---- Chapter 4 — 1 stat, 2 quotes, 1 sticky ---------------------------
  spawn(
    "tip-art-nk-stat-hours",
    statPayload("The block he will not move", {
      value: "5:30 to 7:30",
      label:
        "Up at 5, then workouts, stretching and yoga — the first two hours of the day, for the last three or four years",
      speaker: NITHIN,
    }),
    "tip-c-nk-hours-1",
  );
  spawn(
    "tip-art-nk-quote-toss",
    quotePayload("What happens without it", {
      text:
        "if I don't get that time I feel the rest of the day goes for a toss",
      speaker: NITHIN,
      timestamp: "8:44",
      context: "On the two hours before work, asked what keeps him going",
    }),
    "tip-c-nk-hours-2",
  );
  spawn(
    "tip-art-nk-quote-social",
    quotePayload("What it costs", {
      text: "I don't really have a social life",
      speaker: NITHIN,
      timestamp: "8:55",
      context: "Volunteered straight after the routine — either here or in my house",
    }),
    "tip-c-nk-life-1",
  );
  spawn(
    "tip-art-nk-sticky-between",
    {
      type: "stickynote",
      title: "Nothing in between",
      data: {
        text: "The host expected founders who forget to look after themselves. The answer is a founder who protects two hours and has cut almost everything else that is not work.",
        colorId: "chalk",
      },
    },
    "tip-c-nk-life-1",
  );

  /*
   * The masthead: what the video is, an index into the four chapter groups, and
   * the link directory. The chapter rows carry the group ids layoutChapters
   * generates (`${idPrefix}-chapter-${n}`), so clicking one frames that chapter.
   *
   * The start times are the derived boundaries rather than a creator's — this
   * description carries no timestamp list, only prose and the show's form link —
   * but they are real positions in the video, read off the captions.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-nk-episode", "tip-art-nk-links"];

  spawn(
    "tip-art-nk-episode",
    episodePayload("The episode", {
      videoTitle:
        "Nithin Kamath's guide to how startups should think of risks | Zerodha's framework on building moats",
      channel: "Rainmatter by Zerodha",
      duration: "9:39",
      url: NITHIN_KAMATH_RISK_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/eZdrpChV0C4/maxresdefault.jpg",
      description:
        "Three questions on The Startup Blueprint: how an early-stage founder should think about differentiation, how much of a founder's time belongs to risk, and what he does outside work to keep going. Zerodha's moat changed three times in sixteen years, and he treats replacing it as the job.",
      chapters: NITHIN_KAMATH_RISK_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-nk-chapter-${index + 1}`,
      })),
    }),
    "tip-c-nk-main-1",
  );
  spawn(
    "tip-art-nk-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: NITHIN_KAMATH_RISK_VIDEO_URL },
            {
              label: "Rainmatter by Zerodha",
              url: "https://www.youtube.com/@rainmatterin",
            },
            { label: "Rainmatter", url: "https://rainmatter.com" },
          ],
        },
        {
          label: "From the description",
          links: [
            {
              label: "Ask a question on The Startup Blueprint",
              url: "https://forms.gle/X8gVawopVpaFd2mx8",
            },
          ],
        },
        {
          label: "The companies named",
          links: [
            { label: "Zerodha", url: "https://zerodha.com" },
            { label: "Groww", url: "https://groww.in" },
          ],
        },
        {
          label: "Mentioned",
          links: [
            {
              label: "The Innovator's Dilemma",
              url: "https://en.wikipedia.org/wiki/The_Innovator%27s_Dilemma",
            },
          ],
        },
      ],
    }),
    "tip-c-nk-main-1",
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
    idPrefix: "tip-nk",
  });

  return {
    cards,
    cardOrder,
    connections: layout.connections,
    threads,
    threadOrder: threadIds,
    threadGists,
    groups: layout.groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: layout.contentCenter,
  };
}
