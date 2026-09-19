import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import {
  claimPayload,
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
  CAZUAL_TALK_CHANNEL_URL,
  CAZUAL_TALK_SAHIL_AGGARWAL_CHAPTERS,
  CAZUAL_TALK_SAHIL_AGGARWAL_VIDEO_URL,
} from "@/lib/transcriptImport/cazualTalkSahilAggarwalInterview";

/*
 * Sahil Aggarwal, CEO of Rishihood University, on Vijender Chauhan's Cazual
 * Talk, roughly 42 minutes — a Hindi-language interview on why India's
 * higher education produces graduates the job market won't absorb.
 *
 * This builder departs from the other transcript-import fixtures in two
 * ways, both explained in cazualTalkSahilAggarwalInterview.ts:
 *
 *  - No block of the source's Hindi transcript is embedded anywhere.
 *  - Every quote/claim artifact is a clause the speaker said fully in
 *    English mid-sentence (Hinglish code-switching is common in this kind
 *    of Indian interview), re-spelled from the source's Devanagari
 *    phonetic rendering back to English — not translated. Card summaries
 *    and chapter titles are this builder's own paraphrase in English of
 *    the (mostly Hindi) surrounding discussion.
 *
 * The source carries no creator chapter markers, so the eight-chapter
 * spine and its timestamps are authored here, the same way the "Design
 * tools history" fixture handles a source with no chapters of its own.
 */

const SAHIL = "Sahil Aggarwal";
const VIJENDER = "Vijender Chauhan";

export const TIP_THREAD_CT_MAIN = "tip-thread-ct-main";
export const TIP_THREAD_CT_BACKGROUND = "tip-thread-ct-background";
export const TIP_THREAD_CT_CURRICULUM = "tip-thread-ct-curriculum";
export const TIP_THREAD_CT_CHINA = "tip-thread-ct-china";
export const TIP_THREAD_CT_RANKINGS = "tip-thread-ct-rankings";
export const TIP_THREAD_CT_UNEVEN = "tip-thread-ct-uneven";
export const TIP_THREAD_CT_RISK = "tip-thread-ct-risk";
export const TIP_THREAD_CT_ACCESS = "tip-thread-ct-access";
export const TIP_THREAD_CT_DEREGULATE = "tip-thread-ct-deregulate";

export function buildCazualTalkSahilAggarwalCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_CT_MAIN,
    TIP_THREAD_CT_BACKGROUND,
    TIP_THREAD_CT_CURRICULUM,
    TIP_THREAD_CT_CHINA,
    TIP_THREAD_CT_RANKINGS,
    TIP_THREAD_CT_UNEVEN,
    TIP_THREAD_CT_RISK,
    TIP_THREAD_CT_ACCESS,
    TIP_THREAD_CT_DEREGULATE,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 70 + index);
  });

  const mainDefs = [
    { id: "tip-c-ct-main-1", title: "The Graduate Unemployment Paradox" },
    { id: "tip-c-ct-main-2", title: "Why Education Fails to Deliver Jobs" },
    { id: "tip-c-ct-main-3", title: "Redesigning Education Around Three Pillars" },
    { id: "tip-c-ct-main-4", title: "The Funding Gap in Indian Education" },
    { id: "tip-c-ct-main-5", title: "The Public vs. Private Perception Gap" },
    { id: "tip-c-ct-main-6", title: "Building a Philanthropic Model for Higher Education" },
    { id: "tip-c-ct-main-7", title: "Designing for Diversity and Access" },
    { id: "tip-c-ct-main-8", title: "Educating for Life, Not Just Livelihood" },
  ];
  const summaries = [
    "India's unemployment rate climbs with each level of schooling completed: roughly 3–3.5% among the illiterate, 15% among those who stopped at school, and 29% among graduates — a pattern he calls a national waste of the country's prime working-age talent.",
    "Colleges are everywhere, yet employers say they can't find people to hire. He traces this to three problems at once: skills that don't match what industry needs, a curriculum still shaped by its colonial-era origins rather than India's own context, and a near-total focus on careers at the expense of preparing people for life.",
    "Rishihood's curriculum rests on three pillars — professional success (industry-relevant skills, built with employers), personal wellbeing (physical and emotional fitness, as rising stress and suicide rates make urgent), and public impact (using one's capability to solve problems for society, not just oneself).",
    "Incentive structures decide outcomes: when rankings like NIRF and NAAC reward research paper counts, institutions optimize for paper counts, sometimes producing more people writing papers than reading them, over hiring people well-versed in what employers actually need.",
    "Private universities are widely assumed to be worse than public ones, or outright degree mills — a perception he says holds some truth for a minority, while good private and public institutions each retain real strengths, faculty stability chief among what public funding buys.",
    "New private universities face funding and land hurdles public ones don't — in Haryana, a private university needs to assemble 20 acres and build 100,000 square feet before even learning whether approval will be granted, while a public university can start operating from rented premises.",
    "Rishihood runs no formal quota system, admitting purely on merit, but treats access as a design problem: a need-based scholarship program funds at least 100 students a year at levels from partial support up to full tuition, aimed at students who couldn't otherwise afford a high-quality program.",
    "Beyond employability, Rishihood requires every first-year student to take a course called Self and Society — covering meditation, yogic principles and understanding one's own social context — on a fully residential campus built around physical fitness, entrepreneurship exposure and resilience-building challenges.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_CT_MAIN,
      def.title,
      summaries[index]!,
    );
    cardOrder.push(def.id);
  });

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

  branch(TIP_THREAD_CT_BACKGROUND, "tip-c-ct-main-1", [
    {
      id: "tip-c-ct-background-1",
      title: "From IIT Delhi to founding a university",
      summary:
        "He studied engineering at IIT Delhi, and it was volunteering to teach in a nearby slum that first surfaced the gap between education's purpose and what it was actually delivering — a question he carried into founding Rishihood soon after graduating, at 22.",
    },
  ]);
  branch(TIP_THREAD_CT_CURRICULUM, "tip-c-ct-main-2", [
    {
      id: "tip-c-ct-curriculum-1",
      title: "A curriculum still shaped by its colonial roots",
      summary:
        "India's modern education system is young relative to the country's independence, and much of its structure was inherited from the British — leaving an open question of how much of today's curriculum actually reflects the needs of Indian society, industry and students.",
    },
  ]);
  branch(TIP_THREAD_CT_CHINA, "tip-c-ct-main-3", [
    {
      id: "tip-c-ct-china-1",
      title: "What China's education bet bought it",
      summary:
        "Starting from a comparable position decades ago, China ran deliberate, named programs — Project 211 to bring 100 universities up to 21st-century standards, Project 985 to push 10 of them into the world's top tier, and a Thousand Talents Plan luring researchers home with large joining bonuses and startup grants — and now files more patents than any other country, three times the United States' count.",
    },
  ]);
  branch(TIP_THREAD_CT_RANKINGS, "tip-c-ct-main-4", [
    {
      id: "tip-c-ct-rankings-1",
      title: "Measuring the wrong things",
      summary:
        "India's own education-spending ambitions have slipped for decades — a target of 10%, then 6% of GDP, has settled below 2% in real terms once inflation is accounted for — even as accreditation and ranking frameworks push institutions to optimize for what gets measured, papers and placement counts, rather than what employers or students actually need.",
    },
  ]);
  branch(TIP_THREAD_CT_UNEVEN, "tip-c-ct-main-5", [
    {
      id: "tip-c-ct-uneven-1",
      title: "One rulebook for public, another for private",
      summary:
        "A public university can start teaching from rented premises while it builds a permanent campus; a private one in Haryana must first acquire at least 20 acres and construct 100,000 square feet, with no guarantee approval follows — a structural head start for public institutions before either enrolls a single student.",
    },
  ]);
  branch(TIP_THREAD_CT_RISK, "tip-c-ct-main-6", [
    {
      id: "tip-c-ct-risk-1",
      title: "Teaching comfort with financial risk",
      summary:
        "Incoming students get a starting balance to trade in financial markets — not to gamble, he says, but to build comfort with both losing and gaining money early, alongside a student venture fund that has already backed some alumni ideas directly, on the theory that an entrepreneurial mindset makes people more employable, not less.",
    },
  ]);
  branch(TIP_THREAD_CT_ACCESS, "tip-c-ct-main-7", [
    {
      id: "tip-c-ct-access-1",
      title: "Built for accessibility from day one",
      summary:
        "With two of the university's own founders themselves living with physical disabilities, accessibility was designed into the campus from the start rather than retrofitted — though he's candid that reaching students held back by other social factors, like awareness of available scholarships, remains a harder, longer-term problem.",
    },
  ]);
  branch(TIP_THREAD_CT_DEREGULATE, "tip-c-ct-main-8", [
    {
      id: "tip-c-ct-deregulate-1",
      title: "Push accountability to the most local level possible",
      summary:
        "Asked for the one change he'd make, he points to layers of bureaucracy between rule-makers and classrooms — contrasting India's centre-to-state-to-district chain with the more locally governed U.S. public school model — and argues that decentralizing authority, not adding more central mandates, is what would let innovation actually happen.",
    },
  ]);

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
    "tip-art-ct-video",
    {
      type: "images",
      title: "Indian Education System Needs a Revolution | Cazual Talk With Sahil Aggarwal",
      data: {
        items: [
          {
            kind: "youtube",
            url: CAZUAL_TALK_SAHIL_AGGARWAL_VIDEO_URL,
            title: "Indian Education System Needs a Revolution | Cazual Talk With Sahil Aggarwal",
            thumb: "https://img.youtube.com/vi/KHvnzVxLRYQ/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-ct-main-1",
  );
  spawn(
    "tip-art-ct-quote-wastage",
    quotePayload("A national wastage of talent", {
      text: "It's like a national wastage of talent.",
      speaker: SAHIL,
      context: "On graduates spending years preparing for a single government exam",
    }),
    "tip-c-ct-main-1",
  );
  spawn(
    "tip-art-ct-stat-unemployment",
    statPayload("Unemployment rises with education", {
      value: "29%",
      label: "Graduate unemployment, versus ~15% at school-leaving level and ~3–3.5% among the illiterate, per an ILO report he cites",
      speaker: SAHIL,
    }),
    "tip-c-ct-main-1",
  );
  site(
    "rishihood-wiki",
    "https://en.wikipedia.org/wiki/Rishihood_University",
    "Rishihood University",
    "tip-c-ct-main-1",
  );

  spawn(
    "tip-art-ct-quote-systemic",
    quotePayload("A systemic reason", {
      text: "There must be some systemic reason why our education is the way it is and it is not the way as you want it to be.",
      speaker: VIJENDER,
    }),
    "tip-c-ct-rankings-1",
  );

  spawn(
    "tip-art-ct-stat-chinapatents",
    statPayload("China's patent output", {
      value: "3x",
      label: "China's annual patent filings versus the United States', after decades of programs like Project 211 and Project 985",
      speaker: SAHIL,
    }),
    "tip-c-ct-china-1",
  );

  spawn(
    "tip-art-ct-stat-budget",
    statPayload("India's education spending target", {
      value: "<2%",
      label: "Real-terms share of GDP India now spends on education, after a target that fell from 10% to 6% over decades",
      speaker: SAHIL,
    }),
    "tip-c-ct-main-4",
  );

  spawn(
    "tip-art-ct-claim-factory",
    claimPayload("Are private universities becoming degree factories?", {
      topic: "Whether higher-education institutions have become factories churning out paper degrees in the name of placements",
      proposition: {
        speaker: VIJENDER,
        text: "Do you believe that a higher education institution has become more of a factory which is churning in the name of placements and delivering only the paper degrees?",
      },
      counter: {
        speaker: SAHIL,
        text: "While it is appreciable, it is not satisfactory.",
      },
    }),
    "tip-c-ct-main-5",
  );

  spawn(
    "tip-art-ct-quote-bias",
    quotePayload("A significant bias", {
      text: "It's a significant bias.",
      speaker: SAHIL,
      context: "On land and approval requirements favoring public over private universities",
    }),
    "tip-c-ct-uneven-1",
  );
  spawn(
    "tip-art-ct-stat-land",
    statPayload("What a new private university needs first", {
      value: "20 acres",
      unit: "of land, plus 100,000 sq ft built",
      label: "Required in Haryana before a private university even learns if it will be approved",
      speaker: SAHIL,
    }),
    "tip-c-ct-uneven-1",
  );

  spawn(
    "tip-art-ct-stat-scholarship",
    statPayload("The Bharat 100 Scholarship", {
      value: "100+",
      unit: "students a year",
      label: "Funded entirely by philanthropy, at levels from partial support up to full tuition",
      speaker: SAHIL,
    }),
    "tip-c-ct-main-6",
  );

  spawn(
    "tip-art-ct-quote-diversity",
    quotePayload("Ensuring diversity without reservations", {
      text: "How do you ensure diversity in your campus and how do you nurture the sense of diversity in the students?",
      speaker: VIJENDER,
    }),
    "tip-c-ct-main-7",
  );

  spawn(
    "tip-art-ct-quote-innovation",
    quotePayload("What innovation actually needs", {
      text: "Innovation always needs, you know, some removal of boundaries.",
      speaker: SAHIL,
      context: "His answer when asked for the one change he'd make to Indian education",
    }),
    "tip-c-ct-deregulate-1",
  );

  const MASTHEAD_NODE_IDS = ["tip-art-ct-episode", "tip-art-ct-links"];

  spawn(
    "tip-art-ct-episode",
    episodePayload("The episode", {
      videoTitle: "Indian Education System Needs a Revolution | Cazual Talk With Sahil Aggarwal",
      channel: "Cazual Talk with Vijender Chauhan",
      duration: "41:45",
      url: CAZUAL_TALK_SAHIL_AGGARWAL_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/KHvnzVxLRYQ/maxresdefault.jpg",
      description:
        "Vijender Chauhan sits down with Sahil Aggarwal, CEO of Rishihood University, on why India's higher education keeps producing graduates the job market won't absorb — and what a holistic, philanthropically funded alternative could look like.",
      chapters: CAZUAL_TALK_SAHIL_AGGARWAL_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-ct-chapter-${index + 1}`,
      })),
    }),
    "tip-c-ct-main-1",
  );
  spawn(
    "tip-art-ct-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: CAZUAL_TALK_SAHIL_AGGARWAL_VIDEO_URL },
            { label: "Cazual Talk with Vijender Chauhan", url: CAZUAL_TALK_CHANNEL_URL },
          ],
        },
        {
          label: "Institutions",
          links: [
            { label: "Rishihood University", url: "https://en.wikipedia.org/wiki/Rishihood_University" },
            { label: "IIT Delhi", url: "https://en.wikipedia.org/wiki/Indian_Institute_of_Technology_Delhi" },
          ],
        },
      ],
    }),
    "tip-c-ct-main-1",
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
    idPrefix: "tip-ct",
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
