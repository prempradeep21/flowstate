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
  FRESHMENU_CHAPTER_ANCHORS,
  FRESHMENU_CHAPTERS,
  FRESHMENU_TRANSCRIPT,
  FRESHMENU_VIDEO_URL,
} from "@/lib/transcriptImport/freshMenuStruggle";
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
  chapterDurations,
  countThemes,
  sliceByAnchors,
} from "@/lib/transcriptImport/transcriptStats";

/*
 * Why is FreshMenu Struggling to Survive? — Backstage with Millionaires, eight
 * minutes. A narrated business explainer rather than an interview: one voice,
 * no guest, and a story told in order from the 2014 founding to the 2026
 * distress sale.
 *
 * The chapter spine is the creator's own — the six headed sections of the video
 * description, in the order the video tells them — plus the cold open, which
 * carries facts nothing later repeats. See FRESHMENU_CHAPTERS.
 *
 * Two things the source forces, both general to ASR captions:
 *
 * 1. One unnamed voice. The narrator never says his name, so every quote and
 *    stat is attributed to the show rather than to a person.
 * 2. Mangled proper nouns, resolved against the creator's description rather
 *    than guessed: "Matthew Criak" is Mathew Cyriac, "Ink42" is Inc42, "AITA" is
 *    EBITDA, and FreshMenu arrives in five spellings. Resolutions live in card
 *    summaries, stat labels and links, never in a verbatim field.
 *
 * This is the most numerate fixture in the playground — the narrator reads out
 * funding rounds, order volumes, commission rates and price thresholds — so it
 * leans on tables, charts, a timeline and stats rather than quotes. The only
 * resolved date is Inc42's report, which the episode places "in July" and the
 * article dates to 10 July 2026 (inc42.com/buzz/dil-foods-in-talks-to-acquire-
 * cloud-kitchen-pioneer-freshmenu). "This year" is 2026: the video was
 * published on 14 October 2026.
 *
 * Deliberately not extracted: the cold open's "90% of its LPG imports", which
 * the captions cut off before the claim completes, and the remainder of the
 * ₹200 order — the episode says "the remaining 50%" while its own figures sum
 * to 49%, so no pie is drawn that would force one number over the other.
 */

const SHOW = "Backstage with Millionaires";

export const TIP_THREAD_FM_MAIN = "tip-thread-fm-main";
export const TIP_THREAD_FM_LPG = "tip-thread-fm-lpg";
export const TIP_THREAD_FM_FALL = "tip-thread-fm-fall";
export const TIP_THREAD_FM_THESIS = "tip-thread-fm-thesis";
export const TIP_THREAD_FM_SCALE = "tip-thread-fm-scale";
export const TIP_THREAD_FM_SHIFT = "tip-thread-fm-shift";
export const TIP_THREAD_FM_ISSUES = "tip-thread-fm-issues";
export const TIP_THREAD_FM_MARGIN = "tip-thread-fm-margin";
export const TIP_THREAD_FM_GROWTH = "tip-thread-fm-growth";
export const TIP_THREAD_FM_COVID = "tip-thread-fm-covid";
export const TIP_THREAD_FM_LIFELINE = "tip-thread-fm-lifeline";
export const TIP_THREAD_FM_AOV = "tip-thread-fm-aov";
export const TIP_THREAD_FM_FEE = "tip-thread-fm-fee";
export const TIP_THREAD_FM_FIX = "tip-thread-fm-fix";
export const TIP_THREAD_FM_FUNDING = "tip-thread-fm-funding";
export const TIP_THREAD_FM_BLOW = "tip-thread-fm-blow";
export const TIP_THREAD_FM_OFFLINE = "tip-thread-fm-offline";
export const TIP_THREAD_FM_LESSON = "tip-thread-fm-lesson";

/** Canvas memory — one authored gist per thread. See `threadGist`. */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_FM_MAIN]:
    "Backstage with Millionaires on FreshMenu: founded in 2014, it lost its customers and half of each order to Swiggy and Zomato; COVID halved revenue and Mathew Cyriac's $6.5M was only a lifeline; Swiggy's ₹199 free-delivery line broke the meal for one; investors walked away; the 2026 LPG spike shut it. Lesson: online builds a brand, offline builds a business.",
  [TIP_THREAD_FM_LPG]:
    "In early 2026 the US-Iran war drove India's LPG crisis: a 19 kg cylinder went from around ₹1,900 to close to ₹6,000 in a few months. FreshMenu was already struggling with a cash crunch, and the crisis was the final nail in its coffin.",
  [TIP_THREAD_FM_FALL]:
    "Switching to electric cooking needed only ₹50,000–60,000 per kitchen, and a brand that had raised more than $30 million could not afford it. It suspended nationwide operations, and Dil Foods is now trying to acquire it in a distress sale.",
  [TIP_THREAD_FM_THESIS]:
    "Rashmi Daga started FreshMenu in Bengaluru in 2014 on a simple thesis: once enough people order food online, there is room for brands making fresh food with consistent quality. 2014 was a good time — many food companies were getting funded.",
  [TIP_THREAD_FM_SCALE]:
    "In under two years FreshMenu raised a seed round, a $5M Series A and a $17M Series B. By 2017 it had 27 kitchens, 12,000 orders a day and around 700 delivery partners of its own, controlling food, ordering and delivery end to end.",
  [TIP_THREAD_FM_SHIFT]:
    "Around 2018 Zomato and Swiggy became where people ordered, and FreshMenu had no option but to join them. About 70% of its 2018 revenue had come through its own website and app, per Rashmi Daga.",
  [TIP_THREAD_FM_ISSUES]:
    "FreshMenu hit the same issues as every Indian cloud kitchen company, Rebel Foods included: high aggregator commissions, dependence on aggregators for demand, low average order value, and fixed costs to balance against volume.",
  [TIP_THREAD_FM_MARGIN]:
    "Per a company executive, FreshMenu paid roughly 24% of order value in commissions and another 25% on platform advertising. On a ₹200 order, ₹100 went to the platforms, and food, salaries and rent had to come out of the rest.",
  [TIP_THREAD_FM_GROWTH]:
    "It was burning money but growing fast: by 2020 revenue had passed ₹100 crore and it was losing only around ₹11 crore a year.",
  [TIP_THREAD_FM_COVID]:
    "COVID took FreshMenu's biggest customer base — office-goers — and revenue halved in a year, leaving the company close to bankruptcy.",
  [TIP_THREAD_FM_LIFELINE]:
    "Mathew Cyriac invested $6.5 million for a 40% stake and saved it from bankruptcy — but it was just a lifeline; the structural issues in the business model stayed.",
  [TIP_THREAD_FM_AOV]:
    "FreshMenu was positioned as an affordable meal for one, mostly items under ₹199. In 2024 Swiggy, source of 60% of its business, raised the free-delivery minimum from ₹149 to ₹199.",
  [TIP_THREAD_FM_FEE]:
    "A single ₹179 item now carried a delivery fee, which put psychological pressure on customers; getting free delivery meant adding items, which made the order expensive.",
  [TIP_THREAD_FM_FIX]:
    "Price rises and bundles to clear ₹199 did not work: the meal-for-one appeal went away and customers left. More advertising to win them back only lost more money.",
  [TIP_THREAD_FM_FUNDING]:
    "By the end of 2025 nothing was working and FreshMenu urgently needed funding, but no one invested: cash burn was high, the cloud kitchen model had failed in India even for multi-brand Rebel Foods, and FreshMenu was essentially one brand.",
  [TIP_THREAD_FM_BLOW]:
    "Early 2026 LPG prices finished it: unable to afford the switch to electric, FreshMenu suspended all operations by April, and in July Inc42 reported talks with Dil Foods for a distress acquisition that would at least keep the brand alive.",
  [TIP_THREAD_FM_OFFLINE]:
    "The episode's answer to what FreshMenu could have done: what Rebel Foods and Curefoods are doing — opening physical stores. Offline is high margin; a successful Indian QSR chain runs at 15–20% EBITDA once it scales.",
  [TIP_THREAD_FM_LESSON]:
    "The same holds outside food: the edtech companies that survived were present both online and offline. Online builds your brand; offline is where you build a business.",
};

/** Short chapter names for the masthead's measured charts. */
const CHAPTER_SHORT_NAMES = [
  "Cold open",
  "The rise",
  "Aggregator trap",
  "COVID",
  "₹199 problem",
  "Final blow",
  "What it could have done",
];

/*
 * Word families counted per chapter for the theme chart. Each pattern matches
 * only words that occur in the captions; "Fresh Menu" itself is excluded from
 * every family because it is the subject of every sentence.
 */
const FRESHMENU_THEMES = [
  { name: "Aggregators", pattern: /\b(swiggy|zomato|aggregators?)\b/i },
  {
    name: "Money",
    pattern: /\b(money|funding|funded|invest(ed|ors)?|cash|raised?)\b/i,
  },
  { name: "Customers", pattern: /\bcustomers?\b/i },
  { name: "Cooking gas", pattern: /\b(lpg|cylinder)\b/i },
];

export function buildFreshMenuCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_FM_MAIN,
    TIP_THREAD_FM_LPG,
    TIP_THREAD_FM_FALL,
    TIP_THREAD_FM_THESIS,
    TIP_THREAD_FM_SCALE,
    TIP_THREAD_FM_SHIFT,
    TIP_THREAD_FM_ISSUES,
    TIP_THREAD_FM_MARGIN,
    TIP_THREAD_FM_GROWTH,
    TIP_THREAD_FM_COVID,
    TIP_THREAD_FM_LIFELINE,
    TIP_THREAD_FM_AOV,
    TIP_THREAD_FM_FEE,
    TIP_THREAD_FM_FIX,
    TIP_THREAD_FM_FUNDING,
    TIP_THREAD_FM_BLOW,
    TIP_THREAD_FM_OFFLINE,
    TIP_THREAD_FM_LESSON,
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

  // ---- Chapter heads: the cold open plus the creator's six sections -------
  const mainDefs = FRESHMENU_CHAPTERS.map((chapter, index) => ({
    id: `tip-c-fm-main-${index + 1}`,
    title: chapter.title,
  }));
  const summaries = [
    "The episode opens at the end of the story. India's LPG crisis, driven by the US-Iran war, pushed a 19 kg cylinder from around ₹1,900 to close to ₹6,000 in a few months, and FreshMenu — already short of cash — could not find the ₹50,000–60,000 per kitchen it needed to switch to electric cooking. It suspended nationwide operations, and Dil Foods is now trying to buy it in a distress sale. The narrator sets up the two questions the rest of the episode answers: how it ran out of money, and why its investors did not save it.",
    "Rashmi Daga started FreshMenu in Bengaluru in 2014 on a simple thesis: as online ordering grew, there would be room for brands cooking fresh food with consistent quality. Money was easy that year, and in under two years it raised a seed round, a $5M Series A and a $17M Series B. By 2017 it ran 27 kitchens, 12,000 orders a day and around 700 delivery partners of its own — the food, the ordering and the delivery all under one roof.",
    "Around 2018 Zomato and Swiggy became where India ordered food, and FreshMenu had no choice but to join them, though about 70% of its revenue had come through its own app and website that year. On the platforms it met the problems every cloud kitchen met: high commissions, dependence for demand, low order values and fixed costs against volume. It paid roughly 24% of order value in commissions and another 25% on platform ads — half of a ₹200 order gone before food, salaries or rent.",
    "The burn was tolerable while growth was fast: by 2020 revenue had passed ₹100 crore with losses of only around ₹11 crore a year. Then COVID emptied the offices that were its biggest customer base, revenue halved within a year, and the company came close to bankruptcy. Mathew Cyriac stepped in with $6.5 million for a 40% stake — but the narrator is clear it was only a lifeline, not a fix for the business model.",
    "FreshMenu sold an affordable meal for one, mostly single items under ₹199. In 2024 Swiggy — 60% of its business — raised the free-delivery minimum from ₹149 to ₹199, so a lone ₹179 order now carried a delivery fee. Raising prices and bundling to clear the line did not work: the meal-for-one appeal faded and customers left. Spending more on ads to win them back only lost more money.",
    "By the end of 2025 nothing was working and FreshMenu urgently needed money, but no one would invest: the cash burn was high, the cloud kitchen model had failed in India even for multi-brand Rebel Foods, and FreshMenu was essentially one brand. Early 2026 brought the LPG spike, and with no money for electric kitchens it suspended all operations by April. In July Inc42 reported Dil Foods was in talks for a distress acquisition, which would at least keep the brand alive.",
    "The narrator's answer to what could have saved it is what Rebel Foods and Curefoods are already doing: opening physical stores. Offline is a high-margin business — a successful Indian QSR chain runs at 15–20% EBITDA once it scales — and even in edtech, the survivors were present both online and offline. Online builds your brand; offline is where you build a business.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_FM_MAIN,
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

  // ---- Chapter 1 · Cold open ----------------------------------------------
  branch(TIP_THREAD_FM_LPG, "tip-c-fm-main-1", [
    {
      id: "tip-c-fm-lpg-1",
      title: "A cylinder at three times the price",
      summary:
        "In early 2026 the US-Iran war set off an LPG crisis in India. The price of a 19 kg cylinder went from around ₹1,900 to close to ₹6,000 in just a few months, and it hit food businesses very badly.",
    },
    {
      id: "tip-c-fm-lpg-2",
      title: "Already short of cash",
      summary:
        "FreshMenu was one of the businesses hit, and it was already struggling with a cash crunch before the gas price moved. The narrator calls the crisis the last straw rather than the cause.",
    },
  ]);
  branch(TIP_THREAD_FM_FALL, "tip-c-fm-main-1", [
    {
      id: "tip-c-fm-fall-1",
      title: "The switch it could not pay for",
      summary:
        "Moving a kitchen to electric cooking needed only ₹50,000 to ₹60,000. FreshMenu could not afford even that — a contrast the narrator stops on, since this was one of India's biggest fresh food brands and had raised more than $30 million.",
    },
    {
      id: "tip-c-fm-fall-2",
      title: "Suspended, then up for sale",
      summary:
        "Immediately after the crisis it suspended its nationwide operations for lack of cash, and Dil Foods is now trying to acquire it in a distress sale. The narrator closes the cold open on two questions: how it ran out of money, and why its existing investors did not save it.",
    },
  ]);

  // ---- Chapter 2 · The rise of FreshMenu ---------------------------------
  branch(TIP_THREAD_FM_THESIS, "tip-c-fm-main-2", [
    {
      id: "tip-c-fm-thesis-1",
      title: "Fresh food, consistent quality",
      summary:
        "Rashmi Daga started FreshMenu in Bengaluru in 2014. Online food delivery was just starting in India, and the bet was that once enough people ordered online there would be room for brands making fresh food with consistent quality.",
    },
    {
      id: "tip-c-fm-thesis-2",
      title: "A good year to start a food brand",
      summary:
        "2014 was a very good time to build a food brand in India — many companies were getting funded by investors, and FreshMenu was one of them.",
    },
  ]);
  branch(TIP_THREAD_FM_SCALE, "tip-c-fm-main-2", [
    {
      id: "tip-c-fm-scale-1",
      title: "Three rounds in under two years",
      summary:
        "In less than two years FreshMenu raised a seed round, a Series A of $5 million and a Series B of $17 million. All that money bought it a very good initial response.",
    },
    {
      id: "tip-c-fm-scale-2",
      title: "27 kitchens by 2017",
      summary:
        "By 2017 the company had 27 kitchens, was processing 12,000 orders a day, and had around 700 delivery partners of its own.",
    },
    {
      id: "tip-c-fm-scale-3",
      title: "The whole journey, in-house",
      summary:
        "That meant FreshMenu controlled the entire journey: the food, the ordering experience and the delivery. The next chapter is about losing two of the three.",
    },
  ]);

  // ---- Chapter 3 · The aggregator trap -----------------------------------
  branch(TIP_THREAD_FM_SHIFT, "tip-c-fm-main-3", [
    {
      id: "tip-c-fm-shift-1",
      title: "Customers moved to the platforms",
      summary:
        "Around 2018 Zomato and Swiggy got more popular and most customers moved to them to order food. Brands like FreshMenu struggled to get customers onto their own apps, and had no option but to list on Swiggy and Zomato.",
    },
    {
      id: "tip-c-fm-shift-2",
      title: "70% had come through its own app",
      summary:
        "According to an interview by Rashmi Daga, around 70% of FreshMenu's revenue in 2018 had come through its own website and app. Competition from the aggregators pushed it onto their platforms anyway, and that is where its troubles started.",
    },
  ]);
  branch(TIP_THREAD_FM_ISSUES, "tip-c-fm-main-3", [
    {
      id: "tip-c-fm-issues-1",
      title: "The cloud kitchen problem set",
      summary:
        "FreshMenu faced the same issues as other Indian cloud kitchen companies, Rebel Foods among them: high aggregator commissions, high dependence on aggregators for demand, low average order value, and balancing fixed costs against volumes.",
    },
  ]);
  branch(TIP_THREAD_FM_MARGIN, "tip-c-fm-main-3", [
    {
      id: "tip-c-fm-margin-1",
      title: "24% in commission, 25% in ads",
      summary:
        "According to an executive from the company, FreshMenu paid roughly 24% of order value in aggregator commissions and another 25% on advertising on those platforms — close to half of every order before anything else.",
    },
    {
      id: "tip-c-fm-margin-2",
      title: "A ₹200 order, worked through",
      summary:
        "On an average order of ₹200, ₹100 went to commissions and advertising. Cost of goods, salaries, rent and everything else had to be covered from the remaining half.",
    },
  ]);

  // ---- Chapter 4 · COVID and the lifeline --------------------------------
  branch(TIP_THREAD_FM_GROWTH, "tip-c-fm-main-4", [
    {
      id: "tip-c-fm-growth-1",
      title: "Burning, but growing fast",
      summary:
        "The company was burning money, but that was fine while it grew quickly. By 2020 revenue had passed ₹100 crore, and losses were in control at only around ₹11 crore a year.",
    },
  ]);
  branch(TIP_THREAD_FM_COVID, "tip-c-fm-main-4", [
    {
      id: "tip-c-fm-covid-1",
      title: "The office-goers disappeared",
      summary:
        "Office-going people were one of FreshMenu's biggest customer bases, and the lockdown made that base disappear completely.",
    },
    {
      id: "tip-c-fm-covid-2",
      title: "Revenue halved in a year",
      summary:
        "As a result, revenue was cut in half in just one year, and FreshMenu came very close to going bankrupt.",
    },
  ]);
  branch(TIP_THREAD_FM_LIFELINE, "tip-c-fm-main-4", [
    {
      id: "tip-c-fm-lifeline-1",
      title: "$6.5 million for 40%",
      summary:
        "Mathew Cyriac — \"Matthew Criak\" in the captions — came in as an angel and invested $6.5 million for a 40% stake. That saved FreshMenu from bankruptcy.",
    },
    {
      id: "tip-c-fm-lifeline-2",
      title: "A lifeline, not a fix",
      summary:
        "The narrator is careful about what the money did. It kept the company alive, but the structural issues in its business model were still there — and the next chapter is one of them.",
    },
  ]);

  // ---- Chapter 5 · The ₹199 problem --------------------------------------
  branch(TIP_THREAD_FM_AOV, "tip-c-fm-main-5", [
    {
      id: "tip-c-fm-aov-1",
      title: "An affordable meal for one",
      summary:
        "FreshMenu's average order value was too small. It was positioned as an affordable meal for one person, and most of its business came from single items under ₹199 — a ₹149 bowl, a ₹169 wrap, something in that range.",
    },
    {
      id: "tip-c-fm-aov-2",
      title: "Swiggy moved the line",
      summary:
        "In 2024 Swiggy raised the minimum order value for free delivery from ₹149 to ₹199 — just above where most of FreshMenu's menu sat.",
    },
    {
      id: "tip-c-fm-aov-3",
      title: "60% from one platform",
      summary:
        "At the time 60% of FreshMenu's business came from Swiggy alone, so one platform's policy change proved very costly.",
    },
  ]);
  branch(TIP_THREAD_FM_FEE, "tip-c-fm-main-5", [
    {
      id: "tip-c-fm-fee-1",
      title: "A delivery fee on a single item",
      summary:
        "A customer ordering one ₹179 item now had to pay a delivery fee on it, which put psychological pressure on customers' minds.",
    },
    {
      id: "tip-c-fm-fee-2",
      title: "Free delivery meant a bigger basket",
      summary:
        "To get free delivery, customers had to add more items to the basket, which made the whole process very expensive for someone who wanted one meal.",
    },
  ]);
  branch(TIP_THREAD_FM_FIX, "tip-c-fm-main-5", [
    {
      id: "tip-c-fm-fix-1",
      title: "Higher prices, then bundles",
      summary:
        "FreshMenu tried raising prices and offering bundles to get orders over the ₹199 mark. It did not work out.",
    },
    {
      id: "tip-c-fm-fix-2",
      title: "The appeal went with it",
      summary:
        "Crossing ₹199 meant giving up the one thing it was known for — an affordable meal for one person — and it started losing customers.",
    },
    {
      id: "tip-c-fm-fix-3",
      title: "More ads, more losses",
      summary:
        "Once it was losing customers, it spent more on advertising to keep them coming back. That just meant losing more money.",
    },
  ]);

  // ---- Chapter 6 · The final blow ----------------------------------------
  branch(TIP_THREAD_FM_FUNDING, "tip-c-fm-main-6", [
    {
      id: "tip-c-fm-funding-1",
      title: "No one would invest",
      summary:
        "By the end of 2025 nothing was working, and FreshMenu was urgently looking for funding. No one invested, because of its high cash burn.",
    },
    {
      id: "tip-c-fm-funding-2",
      title: "The model had failed everywhere",
      summary:
        "Investors also stayed away because the cloud kitchen model had failed completely in India. Even Rebel Foods, with a whole bunch of food brands, had failed to become profitable and raise funding.",
    },
    {
      id: "tip-c-fm-funding-3",
      title: "One brand, not a portfolio",
      summary:
        "FreshMenu had it harder still: most of its business came from a single brand, which made raising money even more difficult.",
    },
  ]);
  branch(TIP_THREAD_FM_BLOW, "tip-c-fm-main-6", [
    {
      id: "tip-c-fm-blow-1",
      title: "Early 2026: the gas price",
      summary:
        "The final blow came in early 2026, when the war in West Asia pushed LPG prices in India up dramatically. FreshMenu needed around ₹50,000–60,000 per kitchen to move to electric cooking, and could not afford it.",
    },
    {
      id: "tip-c-fm-blow-2",
      title: "April: operations suspended",
      summary:
        "By April 2026 FreshMenu had suspended all its operations in India.",
    },
    {
      id: "tip-c-fm-blow-3",
      title: "July: Dil Foods in talks",
      summary:
        "In July, Inc42 reported that the company was in talks with Dil Foods for a distress acquisition. If it happens, the narrator says, at least the FreshMenu brand survives in the market.",
    },
  ]);

  // ---- Chapter 7 · What could FreshMenu have done? -----------------------
  branch(TIP_THREAD_FM_OFFLINE, "tip-c-fm-main-7", [
    {
      id: "tip-c-fm-offline-1",
      title: "Rebel Foods and Curefoods go offline",
      summary:
        "The narrator looks for the answer in what Rebel Foods and Curefoods are doing: both are moving offline and opening physical stores of their brands.",
    },
    {
      id: "tip-c-fm-offline-2",
      title: "Offline is the high-margin business",
      summary:
        "Offline is a high-margin business. According to many reports, a successful QSR chain in India runs at 15–20% EBITDA — \"AITA\" in the captions — which is very good once you scale enough.",
    },
  ]);
  branch(TIP_THREAD_FM_LESSON, "tip-c-fm-main-7", [
    {
      id: "tip-c-fm-lesson-1",
      title: "Edtech learned it too",
      summary:
        "It is not only true of food. In edtech as well, the companies that survived were the ones present both online and offline.",
    },
    {
      id: "tip-c-fm-lesson-2",
      title: "Brand online, business offline",
      summary:
        "The episode's closing line splits the two jobs: online builds your brand, and offline is where you build a business. The narrator calls it a big lesson for everyone.",
    },
  ]);

  /*
   * Extracted artifacts, chapter by chapter, per the transcript-artifacts skill.
   * Every quote text below is a verbatim lift from FRESHMENU_TRANSCRIPT — the
   * fidelity test in transcriptFidelity.test.ts asserts it.
   *
   * Emit order is reading order inside a chapter's bento, and short tiles fuse
   * into two-high columns, so quotes, stats and stickies are emitted adjacent
   * and the tables, charts and mechanisms after them.
   */

  // ---- Chapter 1 — 1 stat, 2 quotes, 1 mechanism, 1 reference ------------
  spawn(
    "tip-art-fm-stat-lpg",
    statPayload("Commercial LPG", {
      value: "~₹6,000",
      delta: { from: "₹1,900", to: "₹6,000" },
      label:
        "A 19 kg cylinder, from around 1,900 rupees to close to 6,000 rupees in a span of a few months — early 2026",
      speaker: SHOW,
    }),
    "tip-c-fm-lpg-1",
  );
  spawn(
    "tip-art-fm-quote-nail",
    quotePayload("The last straw", {
      text: "this LPG crisis proved to be the final nail in its coffin",
      speaker: SHOW,
      timestamp: "0:36",
      context: "FreshMenu was already struggling because of the cash crunch",
    }),
    "tip-c-fm-lpg-2",
  );
  spawn(
    "tip-art-fm-quote-afford",
    quotePayload("$30 million against ₹60,000", {
      text:
        "One of India's biggest fresh food brands, a brand which has raised more than $30 million in funding is not able to afford 50 to 60,000 worth of equipment",
      speaker: SHOW,
      timestamp: "0:53",
      context: "On the cost of switching one kitchen to electric cooking",
    }),
    "tip-c-fm-fall-1",
  );
  spawn(
    "tip-art-fm-mech-collapse",
    mechanismPayload("How the gas price shut it down", {
      steps: [
        { id: "crunch", label: "Already struggling with a cash crunch" },
        {
          id: "lpg",
          label: "LPG crisis hits food businesses",
          note: "19 kg cylinder: ~₹1,900 → ~₹6,000",
        },
        {
          id: "electric",
          label: "Can't afford ₹50,000–60,000 per kitchen to go electric",
        },
        { id: "suspend", label: "Suspends nationwide operations" },
        { id: "sale", label: "Dil Foods tries to acquire it in a distress sale" },
      ],
      // Plainly linear — the normalizer chains them in order.
      edges: [],
    }),
    "tip-c-fm-fall-2",
  );
  site("fm-dilfoods", "https://www.dilfoods.in", "Dil Foods", "tip-c-fm-fall-2");

  // ---- Chapter 2 — 1 mechanism, 1 stat, 1 quote, 1 table -----------------
  spawn(
    "tip-art-fm-stat-orders",
    statPayload("FreshMenu in 2017", {
      value: "12,000",
      unit: "orders a day",
      label:
        "Across 27 kitchens, with around 700 delivery partners of its own",
      speaker: SHOW,
    }),
    "tip-c-fm-scale-2",
  );
  spawn(
    "tip-art-fm-quote-journey",
    quotePayload("Owning the whole journey", {
      text:
        "Fresh menu was controlling the entire journey. Food, the ordering experience and also the delivery",
      speaker: SHOW,
      timestamp: "2:18",
      context: "FreshMenu in 2017, before the aggregators took over ordering",
    }),
    "tip-c-fm-scale-3",
  );
  spawn(
    "tip-art-fm-mech-thesis",
    mechanismPayload("The founding thesis", {
      steps: [
        { id: "start", label: "Online food delivery is just starting up in India" },
        { id: "enough", label: "Enough people are ordering food online" },
        {
          id: "space",
          label: "Space for brands preparing fresh food with consistent quality",
        },
      ],
      edges: [],
    }),
    "tip-c-fm-thesis-1",
  );
  spawn(
    "tip-art-fm-table-rounds",
    {
      type: "table",
      title: "Funding in the first two years",
      data: {
        columns: [
          { key: "round", label: "Round" },
          { key: "amount", label: "Amount" },
        ],
        rows: [
          { round: "Seed", amount: "—" },
          { round: "Series A", amount: "5 million" },
          { round: "Series B", amount: "$17 million" },
        ],
      },
    },
    "tip-c-fm-scale-1",
  );

  // ---- Chapter 3 — 1 stat, 1 quote, 1 sticky, 2 tables, 3 references -----
  spawn(
    "tip-art-fm-stat-ownapp",
    statPayload("Own website and app, 2018", {
      value: "70%",
      label:
        "Of FreshMenu's revenue came through its own channels in 2018, according to an interview by Rashmi Daga",
      speaker: SHOW,
    }),
    "tip-c-fm-shift-2",
  );
  spawn(
    "tip-art-fm-quote-margins",
    quotePayload("Half the margin to the platforms", {
      text:
        "The company was spending close to 50% of its margins just on commissions and advertisements",
      speaker: SHOW,
      timestamp: "3:26",
      context: "After 24% in aggregator commissions and another 25% on platform ads",
    }),
    "tip-c-fm-margin-1",
  );
  spawn(
    "tip-art-fm-sticky-order",
    {
      type: "stickynote",
      title: "Paid twice for the same customer",
      data: {
        text: "The commission pays the platform for the order; the ads pay it again to be seen. Together they took about as much of the order as the kitchen kept.",
        colorId: "turbo",
      },
    },
    "tip-c-fm-margin-2",
  );
  spawn(
    "tip-art-fm-table-order",
    {
      type: "table",
      title: "Where a ₹200 order went",
      data: {
        columns: [
          { key: "line", label: "Line" },
          { key: "share", label: "Share of order value" },
        ],
        rows: [
          {
            line: "Aggregator commissions",
            share: {
              value: "Roughly 24%",
              tags: [{ label: "Platform", tone: "danger" }],
            },
          },
          {
            line: "Advertising on those platforms",
            share: {
              value: "Another 25%",
              tags: [{ label: "Platform", tone: "danger" }],
            },
          },
          {
            line: "Together",
            share: "100 rupees just went to commissions and advertising",
          },
          {
            line: "COGS, salaries, rent and everything else",
            share: {
              value: "The remaining 50%",
              tags: [{ label: "FreshMenu", tone: "warning" }],
            },
          },
        ],
      },
    },
    "tip-c-fm-margin-2",
  );
  spawn(
    "tip-art-fm-table-issues",
    {
      type: "table",
      title: "The cloud kitchen problem set",
      data: {
        columns: [
          { key: "issue", label: "Issue every cloud kitchen faced" },
          { key: "freshmenu", label: "How it showed up at FreshMenu" },
        ],
        rows: [
          {
            issue: "High commissions of aggregators",
            freshmenu: "Roughly 24% of order value",
          },
          {
            issue: "High dependence on them for demand",
            freshmenu: {
              value: "60% of the business from Swiggy alone",
              tags: [{ label: "Ch. 5", tone: "neutral" }],
            },
          },
          {
            issue: "Low average order value",
            freshmenu: {
              value: "Most items priced under 199 rupees",
              tags: [{ label: "Ch. 5", tone: "neutral" }],
            },
          },
          {
            issue: "Balancing fixed cost against volumes",
            freshmenu: {
              value: "Revenue reduced to half in one year in COVID",
              tags: [{ label: "Ch. 4", tone: "neutral" }],
            },
          },
        ],
      },
    },
    "tip-c-fm-issues-1",
  );
  site("fm-zomato", "https://www.zomato.com", "Zomato", "tip-c-fm-shift-1");
  site("fm-swiggy", "https://www.swiggy.com", "Swiggy", "tip-c-fm-shift-1");
  site(
    "fm-rebelfoods",
    "https://www.rebelfoods.com",
    "Rebel Foods",
    "tip-c-fm-issues-1",
  );

  // ---- Chapter 4 — 2 stats, 1 quote, 1 mechanism, 1 chart ----------------
  spawn(
    "tip-art-fm-stat-revenue",
    statPayload("Revenue by 2020", {
      value: "₹100 cr+",
      label:
        "And losses in control — losing only around 11 crore rupees a year, while growing really fast",
      speaker: SHOW,
    }),
    "tip-c-fm-growth-1",
  );
  spawn(
    "tip-art-fm-stat-cyriac",
    statPayload("The angel round", {
      value: "$6.5M",
      unit: "for a 40% stake",
      label:
        "Mathew Cyriac's investment after COVID, which saved FreshMenu from bankruptcy",
      speaker: SHOW,
    }),
    "tip-c-fm-lifeline-1",
  );
  spawn(
    "tip-art-fm-quote-lifeline",
    quotePayload("Saved, not fixed", {
      text:
        "But the problem was it was just a lifeline. The company still had some structural issues in its business model",
      speaker: SHOW,
      timestamp: "4:33",
      context: "Right after Mathew Cyriac's $6.5 million",
    }),
    "tip-c-fm-lifeline-2",
  );
  spawn(
    "tip-art-fm-mech-covid",
    mechanismPayload("How COVID nearly ended it", {
      steps: [
        { id: "office", label: "Office-going people: one of the biggest customer bases" },
        { id: "lockdown", label: "Lockdown — that customer base completely disappears" },
        { id: "half", label: "Revenue reduced to half in just one year" },
        { id: "brink", label: "Very close to going bankrupt" },
        {
          id: "angel",
          label: "$6.5 million for a 40% stake — a lifeline",
          note: "Mathew Cyriac",
        },
      ],
      edges: [],
    }),
    "tip-c-fm-covid-2",
  );
  spawn(
    "tip-art-fm-chart-money",
    {
      type: "chart",
      title: "The money in, round by round",
      data: {
        chartType: "bar",
        categories: ["Series A", "Series B", "Mathew Cyriac"],
        series: [{ name: "Invested", data: [5, 17, 6.5] }],
        unit: "$ million",
        source:
          "Amounts as the episode states them; the seed round's size is not given",
      },
    },
    "tip-c-fm-lifeline-1",
  );

  // ---- Chapter 5 — 2 stats, 1 quote, 1 chart, 1 mechanism, 1 table -------
  spawn(
    "tip-art-fm-stat-minimum",
    statPayload("Swiggy's free-delivery minimum", {
      value: "₹199",
      delta: { from: "₹149", to: "₹199" },
      label: "Raised in 2024 — above the price of most of FreshMenu's menu",
      speaker: SHOW,
    }),
    "tip-c-fm-aov-2",
  );
  spawn(
    "tip-art-fm-stat-swiggy",
    statPayload("Dependence on one platform", {
      value: "60%",
      label: "Of FreshMenu's business came from Swiggy alone, at the time",
      speaker: SHOW,
    }),
    "tip-c-fm-aov-3",
  );
  spawn(
    "tip-art-fm-quote-appeal",
    quotePayload("What crossing ₹199 cost", {
      text:
        "The entire appeal that fresh menu had which was affordable meal for one person started to go away",
      speaker: SHOW,
      timestamp: "5:51",
      context: "After raising prices and offering bundles did not work out",
    }),
    "tip-c-fm-fix-2",
  );
  spawn(
    "tip-art-fm-chart-prices",
    {
      type: "chart",
      title: "A meal for one, under the line",
      data: {
        chartType: "bar",
        categories: ["Bowl", "Wrap", "Single item"],
        series: [{ name: "Price", data: [149, 169, 179] }],
        unit: "₹",
        source:
          "Example prices the episode gives; Swiggy's free-delivery minimum rose to ₹199 in 2024",
      },
    },
    "tip-c-fm-aov-1",
  );
  spawn(
    "tip-art-fm-mech-fee",
    mechanismPayload("How ₹50 broke the meal for one", {
      steps: [
        { id: "line", label: "Swiggy raises free delivery from ₹149 to ₹199" },
        { id: "fee", label: "A single ₹179 item now pays a delivery fee" },
        {
          id: "pressure",
          label: "Psychological pressure on customers' minds",
        },
        { id: "basket", label: "Add more items for free delivery — too expensive" },
        { id: "lose", label: "FreshMenu starts losing customers" },
      ],
      edges: [],
    }),
    "tip-c-fm-fee-1",
  );
  spawn(
    "tip-art-fm-table-fixes",
    {
      type: "table",
      title: "What FreshMenu tried",
      data: {
        columns: [
          { key: "move", label: "Move" },
          { key: "aim", label: "Aim" },
          { key: "result", label: "Result" },
        ],
        rows: [
          {
            move: "Raising prices",
            aim: "Cross that 199 rupees mark",
            result: {
              value: "Did not work out",
              tags: [{ label: "Failed", tone: "danger" }],
            },
          },
          {
            move: "Offering bundles",
            aim: "Cross that 199 rupees mark",
            result: {
              value: "The affordable-meal-for-one appeal went away",
              tags: [{ label: "Failed", tone: "danger" }],
            },
          },
          {
            move: "More money on advertising",
            aim: "Keep these customers coming back",
            result: {
              value: "The company just lost more money",
              tags: [{ label: "Failed", tone: "danger" }],
            },
          },
        ],
      },
    },
    "tip-c-fm-fix-3",
  );

  // ---- Chapter 6 — 1 quote, 1 sticky, 1 table, 1 timeline, 1 reference ---
  spawn(
    "tip-art-fm-quote-survives",
    quotePayload("What a sale would save", {
      text:
        "if this happens, it will at least make sure that the fresh menu brand survives in the market",
      speaker: SHOW,
      timestamp: "7:09",
      context: "On Inc42's report of talks with Dil Foods for a distress acquisition",
    }),
    "tip-c-fm-blow-3",
  );
  spawn(
    "tip-art-fm-sticky-investors",
    {
      type: "stickynote",
      title: "The cold open's question, answered",
      data: {
        text: "Why didn't the investors save it? Cash burn, a model that had already failed for Rebel Foods, and a company that was really one brand.",
        colorId: "violet",
      },
    },
    "tip-c-fm-funding-1",
  );
  spawn(
    "tip-art-fm-table-investors",
    {
      type: "table",
      title: "Why no one would invest",
      data: {
        columns: [
          { key: "reason", label: "Reason" },
          { key: "detail", label: "What the episode says" },
        ],
        rows: [
          {
            reason: {
              value: "High cash burn",
              tags: [{ label: "FreshMenu", tone: "danger" }],
            },
            detail: "No one invested in the company because of its high cash burn",
          },
          {
            reason: {
              value: "The model failed in India",
              tags: [{ label: "Industry", tone: "warning" }],
            },
            detail:
              "Even Rebel Foods, with a bunch of food brands, failed to become profitable and raise funding",
          },
          {
            reason: {
              value: "One single brand",
              tags: [{ label: "FreshMenu", tone: "danger" }],
            },
            detail: "Most of its business came from just one single brand",
          },
        ],
      },
    },
    "tip-c-fm-funding-3",
  );
  spawn(
    "tip-art-fm-timeline-end",
    {
      type: "timeline",
      title: "The last ten months",
      data: {
        scale: "month",
        events: [
          {
            id: "fm-t1",
            label: "Urgently looking for funding; no one invests",
            at: "2025-12-01T12:00:00.000Z",
          },
          {
            id: "fm-t2",
            label: "LPG prices in India increase dramatically",
            at: "2026-01-15T12:00:00.000Z",
          },
          {
            id: "fm-t3",
            label: "All operations in India suspended",
            at: "2026-04-01T12:00:00.000Z",
            highlight: true,
          },
          {
            // Resolved: the Inc42 story is dated 10 July 2026.
            id: "fm-t4",
            label: "Inc42: in talks with Dil Foods",
            at: "2026-07-10T12:00:00.000Z",
          },
          {
            id: "fm-t5",
            label: "This episode",
            at: "2026-10-14T12:00:00.000Z",
          },
        ],
      },
    },
    "tip-c-fm-blow-2",
  );
  site(
    "fm-inc42",
    "https://inc42.com/buzz/dil-foods-in-talks-to-acquire-cloud-kitchen-pioneer-freshmenu/",
    "Exclusive: Dil Foods In Talks To Acquire Cloud Kitchen Pioneer FreshMenu",
    "tip-c-fm-blow-3",
  );

  // ---- Chapter 7 — 1 stat, 1 quote, 1 table -------------------------------
  spawn(
    "tip-art-fm-stat-ebitda",
    statPayload("A successful QSR chain in India", {
      value: "15–20%",
      unit: "EBITDA",
      label:
        "According to many reports — really good once you scale enough. The captions render EBITDA as \"AITA\"",
      speaker: SHOW,
    }),
    "tip-c-fm-offline-2",
  );
  spawn(
    "tip-art-fm-quote-offline",
    quotePayload("Brand and business", {
      text:
        "online allows you to build your brand and offline is where you build a business",
      speaker: SHOW,
      timestamp: "7:53",
      context: "The episode's closing lesson, from food and edtech alike",
    }),
    "tip-c-fm-lesson-2",
  );
  spawn(
    "tip-art-fm-table-channels",
    {
      type: "table",
      title: "Online and offline",
      data: {
        columns: [
          { key: "channel", label: "Channel" },
          { key: "builds", label: "What it builds" },
          { key: "who", label: "Who the episode names" },
        ],
        rows: [
          {
            channel: "Online",
            builds: "Your brand",
            who: "FreshMenu — one single brand, mostly through Swiggy",
          },
          {
            channel: {
              value: "Offline",
              tags: [{ label: "High margin", tone: "success" }],
            },
            builds: "A business",
            who: "Rebel Foods and Curefoods, opening physical stores",
          },
          {
            channel: {
              value: "Both",
              tags: [{ label: "Survived", tone: "success" }],
            },
            builds: "—",
            who: "The edtech companies which have survived",
          },
        ],
      },
    },
    "tip-c-fm-offline-1",
  );
  // Curefoods resolves neither an og:image nor a favicon, so it would render
  // as an empty globe; it lives in the link directory instead.

  /*
   * The masthead: what the video is, an index into the seven chapter groups,
   * the link directory, and the two measured series — airtime and themes —
   * computed from the transcript rather than spoken in it.
   */
  const MASTHEAD_NODE_IDS = [
    "tip-art-fm-episode",
    "tip-art-fm-links",
    "tip-art-fm-chart-airtime",
    "tip-art-fm-chart-themes",
  ];

  spawn(
    "tip-art-fm-episode",
    episodePayload("The episode", {
      videoTitle: "Why is FreshMenu Struggling to Survive?",
      channel: "Backstage with Millionaires",
      duration: "8:12",
      url: FRESHMENU_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/yDTDGxw0BM4/maxresdefault.jpg",
      description:
        "How one of India's best-known online food brands ran out of money: from a 2014 Bengaluru founding and $30M+ in funding, through the aggregator squeeze, COVID, Swiggy's ₹199 free-delivery line and investors walking away, to the 2026 LPG crisis that shut its kitchens — and what Rebel Foods and Curefoods are doing differently.",
      chapters: FRESHMENU_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-fm-chapter-${index + 1}`,
      })),
    }),
    "tip-c-fm-main-1",
  );
  spawn(
    "tip-art-fm-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: FRESHMENU_VIDEO_URL },
            {
              label: "Backstage with Millionaires",
              url: "https://www.youtube.com/@backstagewithmillionaires",
            },
          ],
        },
        {
          label: "The companies named",
          links: [
            { label: "FreshMenu", url: "https://www.freshmenu.in" },
            { label: "Swiggy", url: "https://www.swiggy.com" },
            { label: "Zomato", url: "https://www.zomato.com" },
            { label: "Rebel Foods", url: "https://www.rebelfoods.com" },
            { label: "Curefoods", url: "https://www.curefoods.in" },
            { label: "Dil Foods", url: "https://www.dilfoods.in" },
          ],
        },
        {
          label: "The reporting",
          links: [
            {
              label: "Inc42 — Dil Foods in talks to acquire FreshMenu",
              url: "https://inc42.com/buzz/dil-foods-in-talks-to-acquire-cloud-kitchen-pioneer-freshmenu/",
            },
          ],
        },
      ],
    }),
    "tip-c-fm-main-1",
  );
  spawn(
    "tip-art-fm-chart-airtime",
    {
      type: "chart",
      title: "Where the eight minutes went",
      data: {
        chartType: "bar",
        categories: CHAPTER_SHORT_NAMES,
        series: [
          { name: "Airtime", data: chapterDurations(FRESHMENU_CHAPTERS) },
        ],
        unit: "seconds",
        source: "Chapter boundaries read off the captions",
      },
    },
    "tip-c-fm-main-1",
  );
  spawn(
    "tip-art-fm-chart-themes",
    {
      type: "chart",
      title: "Themes by chapter",
      data: {
        chartType: "bar",
        stacked: true,
        categories: CHAPTER_SHORT_NAMES,
        series: countThemes(
          sliceByAnchors(FRESHMENU_TRANSCRIPT, FRESHMENU_CHAPTER_ANCHORS),
          FRESHMENU_THEMES,
        ),
        unit: "mentions",
        source: "Word counts per chapter in the captions",
      },
    },
    "tip-c-fm-main-1",
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
    idPrefix: "tip-fm",
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
