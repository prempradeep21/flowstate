import type { ArtifactPayload, TableCell } from "@/lib/artifactTypes";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import {
  claimPayload,
  definitionPayload,
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
  KUNAL_SHAH_HIRING_CHAPTERS,
  KUNAL_SHAH_HIRING_TRANSCRIPT,
  KUNAL_SHAH_HIRING_VIDEO_URL,
} from "@/lib/transcriptImport/kunalShahHiring";
import {
  chapterDurations,
  countThemes,
  sliceByAnchors,
} from "@/lib/transcriptImport/transcriptStats";

/*
 * Kunal Shah on hiring and retention — Rainmatter by Zerodha, nine minutes.
 *
 * The shortest fixture in the playground, and the one that tests the budget
 * from the other side. Nine minutes at the derivation formula is three
 * chapters, but the argument is unusually dense — five distinct causal claims
 * about why people join and why they leave — so the spine is cut at five.
 *
 * It is also the fixture the doubled budget (8 primary per chapter) and the
 * variety rule were written against. Nine minutes of two people talking says
 * almost no numbers and no dates, so the first cut came out as a column of
 * quotes. The structure was there all along — the transcript compares (who
 * chooses you, capital versus sacrifice, which hiring channel), sequences (his
 * career from FreeCharge to CRED) and argues (the batchmates line, the
 * leadership-access tactic) — and each of those now gets the kind built for
 * it. The charts are measured from the source rather than spoken in it.
 *
 * Two things the source forces:
 *
 * 1. No speaker labels in the captions, but the turn structure is unambiguous
 *    throughout — the host asks a question, the guest answers at length — and
 *    the host names his guest on the way out. So attribution is asserted where
 *    it is needed: every extracted line here is an answer, and every answer is
 *    Kunal Shah's. The interviewer is never named and nothing is attributed to
 *    him.
 * 2. Mangled proper nouns, and two of them carry weight. "free charge" is
 *    FreeCharge and "Seoa Capital" is Sequoia — the pair the credibility
 *    mechanism is built from — while "credit" is CRED and "Nathan" is Nithin
 *    Kamath. Each resolution appears in a card summary, a mechanism step or a
 *    link, where the context makes it unambiguous, and never inside a verbatim
 *    field.
 */

const KUNAL = "Kunal Shah";

/**
 * Each chapter's opening words in the captions, plus where the last one ends
 * (the thank-you before the outro). Used only to count themes per chapter;
 * sliceByAnchors throws if any of them stops matching the transcript.
 */
const KUNAL_SHAH_CHAPTER_ANCHORS = [
  "One of the question that I get",
  "No but even with people",
  "uh and and you can cause that",
  "M and the last question",
  "Yeah. And and sorry, one last question",
  "Okay. No, thank you so much",
];

/**
 * The themes the theme chart counts. Word families, not synonyms: each pattern
 * matches only words that literally occur in the captions. "Seoa Capital" is
 * the investor, not the money, so it is excluded from capital.
 */
const KUNAL_SHAH_THEMES = [
  { name: "Hiring", pattern: /\bhir(?:e|es|ed|ing)\b/i },
  { name: "Vision & credibility", pattern: /\b(?:vision|credibility|validation)\b/i },
  { name: "Money & capital", pattern: /\b(?:money|wealth|compensation|esops)\b|(?<!Seoa )\bcapital\b/i },
  { name: "Identity & tribe", pattern: /\b(?:identity|tribe|belong|values|purpose)\b/i },
  { name: "Sacrifice", pattern: /\bsacrifice\b/i },
  { name: "Crisis", pattern: /\bcrisis\b/i },
  { name: "Character & culture", pattern: /\b(?:character|cultures?)\b/i },
];

export const TIP_THREAD_KS_MAIN = "tip-thread-ks-main";
export const TIP_THREAD_KS_VISION = "tip-thread-ks-vision";
export const TIP_THREAD_KS_FILTER = "tip-thread-ks-filter";
export const TIP_THREAD_KS_WEALTH = "tip-thread-ks-wealth";
export const TIP_THREAD_KS_ORG = "tip-thread-ks-org";
export const TIP_THREAD_KS_CAPITAL = "tip-thread-ks-capital";
export const TIP_THREAD_KS_SACRIFICE = "tip-thread-ks-sacrifice";
export const TIP_THREAD_KS_BELONG = "tip-thread-ks-belong";
export const TIP_THREAD_KS_CRISIS = "tip-thread-ks-crisis";
export const TIP_THREAD_KS_NETWORK = "tip-thread-ks-network";

/** Canvas memory — one authored gist per thread. See `threadGist`. */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_KS_MAIN]:
    "Kunal Shah on Rainmatter, nine minutes on hiring and retention: selling the vision is the founder's hardest job, people leave when a badly scaled org makes them feel alien, too much capital buys out the grit, identity and purpose hold people better than money, and the first hires should come from your network because character is set before you meet.",
  [TIP_THREAD_KS_VISION]:
    "Everyone who joins had other options, so they must believe in the vision and in the founder's competence. As a philosophy major starting FreeCharge he could not convince tech people to join until Sequoia Capital invested — credibility is a problem you have to solve one way or another.",
  [TIP_THREAD_KS_FILTER]:
    "Hiring your IIT batchmates is not a strategy; hiring is a filtering problem and one of the hard problems the job consists of. A founder who cannot inspire people to join and stay is broadcasting that they cannot solve hiring.",
  [TIP_THREAD_KS_WEALTH]:
    "The first retention check is whether the founder shares adequate wealth so people feel like shareholders, which the newer generation of companies does more willingly. But people who like risk like it for life and always weigh their job against opportunity cost.",
  [TIP_THREAD_KS_ORG]:
    "Retention is a design problem: keep building layers of leadership as the company grows. People leave when an inefficiently scaled org strips their identity and values until they feel alien in their own company; people around their own tribe do not look out.",
  [TIP_THREAD_KS_CAPITAL]:
    "Excessive capital is a classic cause of lost loyalty: problems get solved with money instead of grit until throwing money becomes the default response. He does not exempt his own company.",
  [TIP_THREAD_KS_SACRIFICE]:
    "The best companies are built by senior people who sacrificed a lot, which selects for people who will sacrifice again. The early team is a leading indicator — if they do not show the trait now, they will not develop it later.",
  [TIP_THREAD_KS_BELONG]:
    "Offered a Rainmatter founder's tactic of giving early hires leadership conversations, he declines to generalise it: there is no single playbook, only identity and purpose. Comfort also keeps people, simply because they do not know what a new place would be like.",
  [TIP_THREAD_KS_CRISIS]:
    "Once identity, competence and fitment are established money stops being the lever — a successful company has enough of it and an unsuccessful one runs on hope. Be thankful for an early crisis: it shows who stays, and binds people more reliably than success.",
  [TIP_THREAD_KS_NETWORK]:
    "For the first year, hire people you know or people they refer, not LinkedIn resumes. Competence can be learned but character is established before you meet, and the company becomes its first fifty or hundred hires; the open market risks competing cultures.",
};

export function buildKunalShahHiringCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_KS_MAIN,
    TIP_THREAD_KS_VISION,
    TIP_THREAD_KS_FILTER,
    TIP_THREAD_KS_WEALTH,
    TIP_THREAD_KS_ORG,
    TIP_THREAD_KS_CAPITAL,
    TIP_THREAD_KS_SACRIFICE,
    TIP_THREAD_KS_BELONG,
    TIP_THREAD_KS_CRISIS,
    TIP_THREAD_KS_NETWORK,
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

  // ---- Chapter heads: the five derived chapters --------------------------
  const mainDefs = KUNAL_SHAH_HIRING_CHAPTERS.map((chapter, index) => ({
    id: `tip-c-ks-main-${index + 1}`,
    title: chapter.title,
  }));
  const summaries = [
    "The host's opening problem is that at the earliest stage there are no resources to hire with — compensation does not matter and ESOPs are essentially meaningless — so how do you get good people at all, and then keep them? Kunal Shah's answer is that the hardest role of a founder is to consistently articulate and sell the vision, because time and money both come from people who had other options and chose you. Someone with a prior success gets to demonstrate competence cheaply; he could not, and FreeCharge only became credible to engineers once Sequoia Capital had invested. Hiring, on his reading, is simply one of the increasingly hard problems the job consists of.",
    "The host asks about the people who become core to the business and then leave a year or two in, before it has blossomed — Nithin Kamath's point that a quality business in India takes a while to build. Kunal Shah agrees with the premise and puts the first answer in equity: are you sharing adequate wealth, and do people feel like shareholders rather than employees? The complication is that anyone who likes risk enough to join early likes it for life, and reads their current job through opportunity cost. But the bigger cause of departures, he argues, is an org scaled inefficiently, where people lose identity and values and end up feeling alien in their own company.",
    "The way a company comes to feel alien has a cause he is willing to name: excessive capital. Companies with a lot of money end up solving every problem by spending rather than by sheer grit, and they have fewer loyalists for it — and he does not exempt CRED from the charge. The companies he rates most highly anywhere are built by senior people committing a lot of sacrifice, which in turn selects for people whose instinct is to sacrifice again. So the sign to read is the early team: if they do not show that trait now, they are unlikely to develop it later.",
    "Asked what founders have beyond money — the host offers a Rainmatter portfolio founder who kept early hires by giving them leadership conversations — he declines to generalise the tactic. There is no single playbook, only identity and purpose, and the questions he would ask are whether people belong, whether they are adding value, whether they are adequately challenged, whether they are compounding, and whether they are around great people. Where identity, competence and fitment are all established, people stop looking out and money stops being the driver: a successful company has enough of it anyway, an unsuccessful one is running on hope either way. He adds that crisis binds people together more reliably than success does.",
    "The last question is where to actually look in the first year. His answer is people you know, or people you know referring people they know — your network — and explicitly not LinkedIn resumes. The reason is the ordering of the two things being bought: competence can be learned on the job, while character is established long before you meet, and the company essentially becomes its first fifty or hundred hires. Going to the open market risks importing several different cultures that then compete with each other.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_KS_MAIN,
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

  // ---- Chapter 1 · Solving hiring is the job ------------------------------
  branch(TIP_THREAD_KS_VISION, "tip-c-ks-main-1", [
    {
      id: "tip-c-ks-vision-1",
      title: "Everyone who joins you had options",
      summary:
        "An investor can put money into any company and an employee can work at any company, so choosing you is a choice made against alternatives. What they have to believe is that there is clarity in the vision, that they resonate with something in it, and that there is enough competence in the founder to realise it. Someone who has already had a success gets the competence half for free.",
    },
    {
      id: "tip-c-ks-vision-2",
      title: "A philosophy major pitching a tech company",
      summary:
        "His own first company is the counter-example. Starting FreeCharge as a philosophy major trying to do a tech company, he could not convince anybody in tech to join him. The captions render the company as \"free charge\" throughout.",
    },
    {
      id: "tip-c-ks-vision-3",
      title: "Sequoia's cheque did the arguing",
      summary:
        "What broke the deadlock was an investor rather than an argument. Once Sequoia Capital came in, the validation let them say they were actually a tech company, because the top investor had backed them. He generalises it into a problem statement: you have to think about how to solve the credibility problem one way or the other.",
    },
  ]);
  branch(TIP_THREAD_KS_FILTER, "tip-c-ks-main-1", [
    {
      id: "tip-c-ks-filter-1",
      title: "Hiring your batchmates is not a strategy",
      summary:
        "The shortcut he hears is founders saying they came from IIT so they will just hire their batchmates — treating \"good enough to be around\" as the whole test. He reads hiring as a filtering problem instead, and one of the increasingly hard problems that the job of entrepreneurship actually consists of.",
    },
    {
      id: "tip-c-ks-filter-2",
      title: "What failing at hiring signals",
      summary:
        "If you cannot solve hiring, or inspire people to be with you and to stay with you, you are likely to amount to nothing — the captions garble the line as \"You are amount likely to amount to nothing\". His framing is not that you have a staffing setback but that you are broadcasting an inability to solve hiring, and then asking how you will change the world.",
    },
  ]);

  // ---- Chapter 2 · People leave when the org makes them feel alien --------
  branch(TIP_THREAD_KS_WEALTH, "tip-c-ks-main-2", [
    {
      id: "tip-c-ks-wealth-1",
      title: "Shareholders more than employees",
      summary:
        "The first thing he checks is whether the founder is sharing adequate wealth, and whether the people around them feel like shareholders rather than employees. He reads the newer generation of companies as much more willing to share than the previous one was. It is the part of retention that does not depend on the founder's charisma.",
    },
    {
      id: "tip-c-ks-wealth-2",
      title: "People who like risk like it for life",
      summary:
        "The complication with exactly the people worth keeping is that a taste for risk does not switch off — they want to start up, they want to do certain things of their own. Everyone in that position reads their current job through opportunity cost. Sharing wealth moves the number being weighed; it does not remove the weighing.",
    },
  ]);
  branch(TIP_THREAD_KS_ORG, "tip-c-ks-main-2", [
    {
      id: "tip-c-ks-org-1",
      title: "Layers and layers of leadership",
      summary:
        "His structural answer is that you have to keep building layers and layers of leadership as the company grows. The alternative is an org that has scaled without being organised, which is where the departures come from. It makes retention a design problem rather than a conversation problem.",
    },
    {
      id: "tip-c-ks-org-2",
      title: "Alien in their own company",
      summary:
        "People leave, he says, when the org has been scaled in an inefficient manner and they feel lost: a lack of identity, a lack of values, and eventually the sense of being alien in their own company. That is the point at which they start looking out. The inverse is his retention test — people who are around their own tribe usually do not look out.",
    },
  ]);

  // ---- Chapter 3 · Too much capital buys the grit out --------------------
  branch(TIP_THREAD_KS_CAPITAL, "tip-c-ks-main-3", [
    {
      id: "tip-c-ks-capital-1",
      title: "Money as the default response",
      summary:
        "He names excessive capital as a classic cause of the same problem: companies with a lot of it are likely to have fewer loyalists, because every problem starts being solved with money rather than with sheer grit. What forms is a culture whose natural default response to a problem is to throw money at it. Asked whether that has hit his own company, he does not exempt it.",
    },
  ]);
  branch(TIP_THREAD_KS_SACRIFICE, "tip-c-ks-main-3", [
    {
      id: "tip-c-ks-sacrifice-1",
      title: "Built by people who sacrificed",
      summary:
        "His read on the best companies anywhere is that senior people committed a lot of sacrifice to build them. That in turn selects who stays: the people whose tendency and belief is to sacrifice more to make something come true. Retention and the founding trait turn out to be the same thing seen at two different times.",
    },
    {
      id: "tip-c-ks-sacrifice-2",
      title: "The first sign is already visible",
      summary:
        "Which makes the early team a leading indicator rather than a starting roster. If they are not the type that demonstrates a strong trait of doing sacrifice to achieve something big, they are unlikely to do it later. There is no stage at which the trait arrives on its own.",
    },
  ]);

  // ---- Chapter 4 · Identity and purpose hold people ----------------------
  branch(TIP_THREAD_KS_BELONG, "tip-c-ks-main-4", [
    {
      id: "tip-c-ks-belong-1",
      title: "There is no single playbook",
      summary:
        "The host offers a specific tactic from the Rainmatter portfolio — a founder who enabled leadership conversations for his early hires, so they went into every conversation feeling they were part of the founding team — and notes it cannot survive scale. Kunal Shah declines to generalise it. What he offers instead is identity and purpose, and a short list of questions that test for them.",
    },
    {
      id: "tip-c-ks-belong-2",
      title: "Comfort is also a reason to stay",
      summary:
        "Not all staying is loyalty. Often the comfort of a place keeps someone there simply because they do not know what the new place will be like, and not everybody is excited by new things. It counts as retention even though the founder did nothing to earn it.",
    },
  ]);
  branch(TIP_THREAD_KS_CRISIS, "tip-c-ks-main-4", [
    {
      id: "tip-c-ks-crisis-1",
      title: "Why money stops being the lever",
      summary:
        "Where identity, competence and fitment are all established, he argues money may not always be the driver — and the arithmetic explains why. A successful company has enough money anyway; an unsuccessful one is keeping people on hope anyway. Neither case is won by out-paying, which leaves the tribe as the thing actually holding people.",
    },
    {
      id: "tip-c-ks-crisis-2",
      title: "Be thankful for an early crisis",
      summary:
        "He often tells founders they should be very thankful for a crisis early in the company, because a crisis tests people and identifies who stays — and a lot of people will leave during one. A company that has gone a few years without a crisis does not actually know who would stick around. On his account, crisis keeps people together more reliably than success does.",
    },
  ]);

  // ---- Chapter 5 · Hire from your network --------------------------------
  branch(TIP_THREAD_KS_NETWORK, "tip-c-ks-main-5", [
    {
      id: "tip-c-ks-network-1",
      title: "Your network, essentially",
      summary:
        "For the first year the channel is people you know, or people you know referring people they know. He would not recommend that an early-stage company go looking through LinkedIn resumes and all of that stuff. The network is not a convenience here — it is what carries the information a resume cannot.",
    },
    {
      id: "tip-c-ks-network-2",
      title: "The company becomes its first hires",
      summary:
        "The reason is the ordering of the two things being bought. Competence may be learned on the job, but character is established before you meet, and the company essentially becomes its first fifty or hundred hires. Going to the open market carries the specific risk of bringing in too many different cultures that then compete with each other.",
    },
  ]);

  /*
   * Extracted artifacts, chapter by chapter, per the transcript-artifacts skill
   * at the doubled budget (8 primary · 6 reference · 2 sticky per chapter) and
   * its variety rule — no chapter is allowed to be a column of quotes when the
   * span carries a comparison, a sequence or a chain.
   *
   * Every quote text, claim side and definition gloss below is a verbatim lift
   * from KUNAL_SHAH_HIRING_TRANSCRIPT — transcriptFidelity.test.ts asserts it.
   * Table cells are condensed phrases from the same spans. The captions carry
   * no usable timestamps, so no artifact claims one.
   */

  const stay: TableCell = { tags: [{ label: "Keeps them", tone: "success" }] };
  const go: TableCell = { tags: [{ label: "Pulls them out", tone: "danger" }] };

  // ---- Chapter 1 — 8 primary, 1 sticky, 1 reference ----------------------
  /*
   * Class C with resolved dates. Every event is named in the conversation
   * (his first company, Sequoia "coming in", CRED as "credit", and the episode
   * itself); only the dates are looked up, the same way a website referent is.
   * Sequoia seeded FreeCharge in 2010 and led its Series A in 2011 — the
   * Series A is the investment the credibility story leans on. Year-only
   * dates sit on January 1st, which the year scale renders as just the year.
   */
  spawn(
    "tip-art-ks-timeline-career",
    {
      type: "timeline",
      title: "From FreeCharge to this conversation",
      data: {
        scale: "year",
        events: [
          {
            id: "ks-t-freecharge",
            at: "2010-08-01T12:00:00.000Z",
            label: "Co-founds FreeCharge — a philosophy major doing tech",
            side: "above",
          },
          {
            id: "ks-t-sequoia",
            at: "2011-01-01T12:00:00.000Z",
            label: "Sequoia Capital's Series A lends the credibility",
            side: "below",
          },
          {
            id: "ks-t-cred",
            at: "2018-01-01T12:00:00.000Z",
            label: "Founds CRED",
            side: "above",
          },
          {
            id: "ks-t-episode",
            at: "2026-06-06T12:00:00.000Z",
            label: "This conversation, on Rainmatter by Zerodha",
            side: "below",
            highlight: true,
          },
        ],
      },
    },
    "tip-c-ks-vision-2",
  );
  spawn(
    "tip-art-ks-quote-hardest",
    quotePayload("The founder's hardest job", {
      text:
        "The hardest role of a founder is to consistently be able to articulate and sell their vision",
      speaker: KUNAL,
      context: "Answering how you hire when there is nothing yet to pay with",
    }),
    "tip-c-ks-main-1",
  );
  spawn(
    "tip-art-ks-stat-decade",
    statPayload("His hiring record", {
      value: "A decade and a half",
      label:
        "Of finding and keeping talented people — the experience the host asks him to draw on",
      speaker: "Host",
    }),
    "tip-c-ks-main-1",
  );
  spawn(
    "tip-art-ks-table-options",
    {
      type: "table",
      title: "Everyone who chooses you",
      data: {
        columns: [
          { key: "who", label: "Who" },
          { key: "gives", label: "Gives you" },
          { key: "instead", label: "Could instead" },
        ],
        rows: [
          {
            who: "An investor",
            gives: "Money",
            instead: "Put in any company",
          },
          {
            who: "An employee",
            gives: "Time",
            instead: "Work in any company",
          },
        ],
      },
    },
    "tip-c-ks-vision-1",
  );
  spawn(
    "tip-art-ks-mech-choose",
    mechanismPayload("Why anyone chooses you", {
      steps: [
        { id: "sell", label: "Articulate and sell the vision" },
        { id: "clarity", label: "They see clarity in your vision" },
        { id: "resonate", label: "They see something they resonate with" },
        { id: "competence", label: "They see enough competence in you" },
        { id: "give", label: "They give you their time or money" },
      ],
      edges: [
        { from: "sell", to: "clarity" },
        { from: "clarity", to: "resonate" },
        { from: "resonate", to: "competence" },
        { from: "competence", to: "give", label: "that is how" },
      ],
    }),
    "tip-c-ks-vision-1",
  );
  spawn(
    "tip-art-ks-mech-credibility",
    mechanismPayload("How FreeCharge became credible", {
      steps: [
        {
          id: "philosophy",
          label: "A philosophy major doing a tech company",
          note: "His first company, rendered \"free charge\" in the captions",
        },
        { id: "nobody", label: "Couldn't convince anybody in tech" },
        {
          id: "sequoia",
          label: "Sequoia Capital invests",
          note: "The captions render it \"Seoa Capital\"",
        },
        { id: "proof", label: "\"You guys are actually a tech company\"" },
        { id: "hires", label: "The credibility problem is solved" },
      ],
      edges: [
        { from: "philosophy", to: "nobody" },
        { from: "nobody", to: "sequoia", label: "fortunately for us" },
        { from: "sequoia", to: "proof", label: "that validation" },
        { from: "proof", to: "hires" },
      ],
    }),
    "tip-c-ks-vision-3",
  );
  spawn(
    "tip-art-ks-sticky-borrowed",
    {
      type: "stickynote",
      title: "Borrowed credibility",
      data: {
        text: "The engineers were persuaded by the investor, not the pitch. When you can't demonstrate competence yourself, find someone they already trust who will vouch for it.",
        colorId: "violet",
      },
    },
    "tip-c-ks-vision-3",
  );
  /*
   * Reported-and-rebutted. The batchmates line is framed in the transcript as
   * something "a lot of the people will say", and the rebuttal that follows is
   * the line the cold open lifts as his — so both sides are attributable
   * without guessing which caption turn is whose.
   */
  spawn(
    "tip-art-ks-claim-batchmates",
    claimPayload("Hiring your batchmates", {
      topic: "Whether a strong pedigree means hiring is already solved",
      proposition: {
        speaker: "Commonly said, as reported",
        text: "I've come from IIT I'll just hire my batchmates",
      },
      counter: {
        speaker: KUNAL,
        text:
          "the truth of entrepreneurship is that your job is to consistently solve increasingly hard problems. Hiring is one of them.",
      },
    }),
    "tip-c-ks-filter-1",
  );
  spawn(
    "tip-art-ks-quote-signal",
    quotePayload("The signal you send", {
      text:
        "you are giving the signal to the universe that I can't solve hiring. How will I change this world?",
      speaker: KUNAL,
      context: "On what an unsolved hiring problem says about the founder",
    }),
    "tip-c-ks-filter-2",
  );
  /*
   * FreeCharge points at Wikipedia rather than freecharge.in, because the
   * transcript is talking about the company he founded in 2010, which is not
   * what that domain describes today. Sequoia stays a chip in the link
   * directory rather than a tile: neither its homepage nor its Wikipedia page
   * yields a renderable preview, and a blank globe is a bookmark, not a source.
   */
  site(
    "freecharge",
    "https://en.wikipedia.org/wiki/FreeCharge",
    "FreeCharge",
    "tip-c-ks-vision-2",
  );

  // ---- Chapter 2 — 6 primary, 2 sticky, 1 reference ----------------------
  spawn(
    "tip-art-ks-stat-yearortwo",
    statPayload("When core hires leave", {
      value: "In a year or two",
      label:
        "Core early hires find really cool opportunities — often before the business has even blossomed",
      speaker: "Host",
    }),
    "tip-c-ks-main-2",
  );
  spawn(
    "tip-art-ks-quote-shareholders",
    quotePayload("Shareholders or employees", {
      text: "do they feel like they are shareholders more than employees?",
      speaker: KUNAL,
      context: "The first of the two things he checks when people start leaving",
    }),
    "tip-c-ks-wealth-1",
  );
  spawn(
    "tip-art-ks-quote-generations",
    quotePayload("What changed between generations", {
      text:
        "newer generation of companies are becoming a lot more about sharing than the previous generations were",
      speaker: KUNAL,
      context: "On equity in Indian startups now versus before",
    }),
    "tip-c-ks-wealth-1",
  );
  spawn(
    "tip-art-ks-table-forces",
    {
      type: "table",
      title: "Stay or go",
      data: {
        columns: [
          { key: "force", label: "Force" },
          { key: "pull", label: "Effect" },
          { key: "detail", label: "As he puts it" },
        ],
        rows: [
          {
            force: "Sharing adequate wealth",
            pull: stay,
            detail: "People feel like shareholders",
          },
          {
            force: "A taste for risk",
            pull: go,
            detail: "They like risk way too much, for life",
          },
          {
            force: "Opportunity cost",
            pull: go,
            detail: "Everybody looks at the job from that lens",
          },
          {
            force: "Layers of leadership",
            pull: stay,
            detail: "You have to keep building them",
          },
          {
            force: "An inefficiently scaled org",
            pull: go,
            detail: "People feel lost",
          },
          {
            force: "Their own tribe",
            pull: stay,
            detail: "People usually don't look out",
          },
        ],
      },
    },
    "tip-c-ks-org-1",
  );
  spawn(
    "tip-art-ks-sticky-optcost",
    {
      type: "stickynote",
      title: "The lens doesn't close",
      data: {
        text: "Sharing wealth changes the number an early employee is weighing. It does not stop the weighing — someone who liked risk enough to join you likes it enough to leave.",
        colorId: "chalk",
      },
    },
    "tip-c-ks-wealth-2",
  );
  spawn(
    "tip-art-ks-quote-tribe",
    quotePayload("The tribe test", {
      text: "if they are around their own tribe, people usually don't look out",
      speaker: KUNAL,
      context: "The inverse of the departure he has just described",
    }),
    "tip-c-ks-org-2",
  );
  spawn(
    "tip-art-ks-mech-leaving",
    mechanismPayload("How people end up leaving", {
      steps: [
        { id: "scale", label: "The org is scaled in an inefficient manner" },
        { id: "lost", label: "People feel lost" },
        { id: "identity", label: "Lack of identity, lack of values" },
        { id: "alien", label: "They feel alien in their own company" },
        { id: "out", label: "That's when people start looking out" },
      ],
      // Plainly linear — the normalizer chains them in order.
      edges: [],
    }),
    "tip-c-ks-org-2",
  );
  spawn(
    "tip-art-ks-sticky-nithin",
    {
      type: "stickynote",
      title: "The \"Nathan\" in the captions",
      data: {
        text: "Is Nithin Kamath — whose point that a quality business in India takes a while to build frames this whole chapter. His own episode on moats and risk sits beside this one in the playground.",
        colorId: "turbo",
      },
    },
    "tip-c-ks-main-2",
  );
  site(
    "nithin-kamath",
    "https://en.wikipedia.org/wiki/Nithin_Kamath",
    "Nithin Kamath",
    "tip-c-ks-main-2",
  );

  // ---- Chapter 3 — 4 primary, 2 sticky, 1 reference ----------------------
  spawn(
    "tip-art-ks-table-capital",
    {
      type: "table",
      title: "Capital versus sacrifice",
      data: {
        columns: [
          { key: "dimension", label: "On" },
          { key: "capital", label: "Excessive capital" },
          { key: "sacrifice", label: "Built on sacrifice" },
        ],
        rows: [
          {
            dimension: "Default response to a problem",
            capital: "Throw money at it",
            sacrifice: "Sheer grit of doing things",
          },
          {
            dimension: "Who builds it",
            capital: "—",
            sacrifice: "Senior people committing a lot of sacrifice",
          },
          {
            dimension: "Who it keeps",
            capital: {
              value: "Less loyalists",
              tags: [{ label: "Fewer", tone: "danger" }],
            },
            sacrifice: {
              value: "Those who believe in more sacrifice",
              tags: [{ label: "Self-selecting", tone: "success" }],
            },
          },
        ],
      },
    },
    "tip-c-ks-capital-1",
  );
  spawn(
    "tip-art-ks-mech-capital",
    mechanismPayload("How capital buys out the grit", {
      steps: [
        { id: "capital", label: "Excessive capital" },
        {
          id: "spend",
          label: "You start solving every problem with money",
          note: "Versus sheer grit of doing things",
        },
        {
          id: "culture",
          label: "The natural default response is to throw money at it",
        },
        { id: "loyal", label: "The company is likely to have less loyalists" },
      ],
      // Plainly linear — the normalizer chains them in order.
      edges: [],
    }),
    "tip-c-ks-capital-1",
  );
  spawn(
    "tip-art-ks-sticky-cred",
    {
      type: "stickynote",
      title: "He does not exempt his own",
      data: {
        text: "Having said capital-rich companies lose loyalists, he immediately puts CRED on the list rather than off it. The captions render the company as \"credit\".",
        colorId: "violet",
      },
    },
    "tip-c-ks-capital-1",
  );
  spawn(
    "tip-art-ks-mech-sacrifice",
    mechanismPayload("How sacrifice selects who stays", {
      steps: [
        { id: "senior", label: "Senior people commit a lot of sacrifice" },
        { id: "best", label: "The best companies across the world get built" },
        {
          id: "stay",
          label: "Those who stay believe in doing more sacrifice",
        },
        {
          id: "early",
          label: "An early team without the trait won't grow it later",
        },
      ],
      edges: [
        { from: "senior", to: "best" },
        { from: "best", to: "stay", label: "therefore" },
        { from: "stay", to: "early", label: "so the first sign" },
      ],
    }),
    "tip-c-ks-sacrifice-1",
  );
  spawn(
    "tip-art-ks-quote-earlyteam",
    quotePayload("Reading the early team", {
      text:
        "the first sign I would say is that if your early team is not the type that demonstrates a strong trait of doing sacrifice to achieve something big",
      speaker: KUNAL,
      context: "On what an early team predicts about the later one",
    }),
    "tip-c-ks-sacrifice-2",
  );
  spawn(
    "tip-art-ks-sticky-twosides",
    {
      type: "stickynote",
      title: "Read with chapter 4",
      data: {
        text: "Money can't buy loyalty (chapter 4), but too much of it can still spend loyalty away. The two chapters are one argument seen from both ends.",
        colorId: "haiti",
      },
    },
    "tip-c-ks-sacrifice-1",
  );
  site("cred", "https://cred.club", "CRED", "tip-c-ks-capital-1");

  // ---- Chapter 4 — 7 primary, 1 sticky, 1 reference ----------------------
  /*
   * A real two-sided claim: the host brings a tactic from a Rainmatter
   * portfolio founder, and the answer opens by declining it. The proposition
   * is the host's report of that founder, so it is attributed to the host.
   */
  spawn(
    "tip-art-ks-claim-playbook",
    claimPayload("Is there a retention playbook?", {
      topic: "Whether a tactic like leadership access is how you keep early hires",
      proposition: {
        speaker: "Host, reporting a Rainmatter founder",
        text:
          "just because he enabled leadership conversations for these early hires they stuck around",
      },
      counter: {
        speaker: KUNAL,
        text:
          "I don't think there is a single playbook. What I would say is that everything is about identity and purpose",
      },
    }),
    "tip-c-ks-belong-1",
  );
  spawn(
    "tip-art-ks-todo-questions",
    {
      type: "todo",
      title: "The questions that test for it",
      data: {
        items: [
          { id: "ks-q1", label: "Do they belong?", checked: false },
          {
            id: "ks-q2",
            label: "Do they feel that they are adding value?",
            checked: false,
          },
          {
            id: "ks-q3",
            label: "Do they feel adequately challenged?",
            checked: false,
          },
          {
            id: "ks-q4",
            label: "Do they feel they're adequately compounding?",
            checked: false,
          },
          {
            id: "ks-q5",
            label: "Do they feel they're around great people?",
            checked: false,
          },
        ],
      },
    },
    "tip-c-ks-belong-1",
  );
  spawn(
    "tip-art-ks-sticky-comfort",
    {
      type: "stickynote",
      title: "Comfort counts as retention",
      data: {
        text: "Some of the people who stay are not persuaded, just unsure how the new place would be. It holds the org together and tells the founder nothing.",
        colorId: "turbo",
      },
    },
    "tip-c-ks-belong-2",
  );
  spawn(
    "tip-art-ks-def-tribe",
    definitionPayload("A great tribe", {
      term: "A great tribe",
      gloss:
        "where your identity is well established, your competence is well established, your fitment is well established",
      speaker: KUNAL,
    }),
    "tip-c-ks-crisis-1",
  );
  spawn(
    "tip-art-ks-table-money",
    {
      type: "table",
      title: "Why money is not the driver either way",
      data: {
        columns: [
          { key: "state", label: "If the company is" },
          { key: "money", label: "What money is doing" },
          { key: "holding", label: "What is holding people" },
        ],
        rows: [
          {
            state: { value: "Successful", tags: [{ label: "Success", tone: "success" }] },
            money: "There's enough money anyways",
            holding: "The tribe, not the offer",
          },
          {
            state: { value: "Not successful", tags: [{ label: "Struggling", tone: "warning" }] },
            money: "You're keeping people on hope anyways",
            holding: "Hope, which money cannot top up",
          },
        ],
      },
    },
    "tip-c-ks-crisis-1",
  );
  spawn(
    "tip-art-ks-quote-crisis",
    quotePayload("An early crisis is a gift", {
      text:
        "you should be very thankful if you get crisis early in your company",
      speaker: KUNAL,
      context: "On what he often tells founders",
    }),
    "tip-c-ks-crisis-2",
  );
  spawn(
    "tip-art-ks-quote-together",
    quotePayload("Crisis over success", {
      text: "sometimes crisis keeps people together more than success",
      speaker: KUNAL,
      context: "Why an early crisis is worth being thankful for",
    }),
    "tip-c-ks-crisis-2",
  );
  spawn(
    "tip-art-ks-mech-crisis",
    mechanismPayload("How a crisis sorts the team", {
      steps: [
        { id: "crisis", label: "A crisis early in your company" },
        { id: "test", label: "It tests people" },
        { id: "leave", label: "A lot of people will leave" },
        {
          id: "know",
          label: "You learn who sticks around in crisis",
          note: "Go a few years without one and you truly won't know",
        },
      ],
      edges: [
        { from: "crisis", to: "test", label: "that's when" },
        { from: "test", to: "leave" },
        { from: "leave", to: "know", label: "and identify" },
      ],
    }),
    "tip-c-ks-crisis-2",
  );
  site(
    "rainmatter",
    "https://rainmatter.com",
    "Rainmatter",
    "tip-c-ks-belong-1",
  );

  // ---- Chapter 5 — 5 primary, 1 sticky -----------------------------------
  spawn(
    "tip-art-ks-def-network",
    definitionPayload("Your network", {
      term: "Your network",
      gloss: "people you know or people you know referring people they know",
      speaker: KUNAL,
    }),
    "tip-c-ks-network-1",
  );
  spawn(
    "tip-art-ks-stat-fifty",
    statPayload("What the company becomes", {
      value: "the first 50 or 100 hires",
      label:
        "What the company essentially becomes — so whatever character is in the room early is the character it keeps",
      speaker: KUNAL,
    }),
    "tip-c-ks-network-2",
  );
  spawn(
    "tip-art-ks-table-channels",
    {
      type: "table",
      title: "Where to look in the first year",
      data: {
        columns: [
          { key: "channel", label: "Channel" },
          { key: "call", label: "His call" },
          { key: "why", label: "Why" },
        ],
        rows: [
          {
            channel: "People you know",
            call: { tags: [{ label: "Mostly this", tone: "success" }] },
            why: "You already know the character",
          },
          {
            channel: "Referrals from people you know",
            call: { tags: [{ label: "Yes", tone: "success" }] },
            why: "The character is vouched for",
          },
          {
            channel: "LinkedIn resumes",
            call: { tags: [{ label: "Wouldn't recommend", tone: "danger" }] },
            why: "At least in early-stage companies",
          },
          {
            channel: "The open market",
            call: { tags: [{ label: "Risky", tone: "warning" }] },
            why: "Too many different cultures",
          },
        ],
      },
    },
    "tip-c-ks-network-1",
  );
  spawn(
    "tip-art-ks-quote-character",
    quotePayload("Character and competence", {
      text:
        "you need people who will bring the character may learn the competence on the job but the character is established before",
      speaker: KUNAL,
      context: "On why the first year's hires cannot come from a resume pile",
    }),
    "tip-c-ks-network-2",
  );
  spawn(
    "tip-art-ks-sticky-echo",
    {
      type: "stickynote",
      title: "The same trait, hired for",
      data: {
        text: "Character that is \"established before\" is the sacrifice trait from chapter 3 — the network is how you see it before you hire it.",
        colorId: "haiti",
      },
    },
    "tip-c-ks-network-2",
  );
  spawn(
    "tip-art-ks-mech-openmarket",
    mechanismPayload("The risk of the open market", {
      steps: [
        { id: "market", label: "Getting people from the open market" },
        { id: "cultures", label: "Too many different cultures" },
        { id: "compete", label: "Trying to compete with each other" },
      ],
      // Plainly linear — the normalizer chains them in order.
      edges: [],
    }),
    "tip-c-ks-network-2",
  );

  /*
   * The masthead: what the video is, an index into the five chapter groups,
   * two measured charts, and the link directory. The chapter rows carry the
   * group ids layoutChapters generates (`${idPrefix}-chapter-${n}`), so
   * clicking one frames that chapter.
   *
   * The start times are the derived boundaries rather than a creator's — this
   * description carries no timestamp list — but they are real positions in the
   * video, read off the captions.
   *
   * Both charts are class D* (measured series): computed from the chapter
   * stamps and the caption text at build time, never typed in, so they cannot
   * say anything the source does not. The theme counts include both speakers —
   * the captions do not separate them.
   */
  const MASTHEAD_NODE_IDS = [
    "tip-art-ks-episode",
    "tip-art-ks-chart-airtime",
    "tip-art-ks-chart-themes",
    "tip-art-ks-links",
  ];
  const CHAPTER_SHORT_NAMES = [
    "Hiring is the job",
    "Feeling alien",
    "Capital vs grit",
    "Identity & purpose",
    "Your network",
  ];

  spawn(
    "tip-art-ks-episode",
    episodePayload("The episode", {
      videoTitle:
        "Kunal Shah's (Cred) playbook for hiring & retaining great talent.",
      channel: "Rainmatter by Zerodha",
      duration: "8:58",
      url: KUNAL_SHAH_HIRING_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/0fxTjJ9jVpg/maxresdefault.jpg",
      description:
        "Kunal Shah on the hardest problem every founder faces: hiring and retaining great people when there is nothing to pay them with — why credibility comes before candidates, why excessive capital costs you loyalists, and why character is established long before the interview.",
      chapters: KUNAL_SHAH_HIRING_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-ks-chapter-${index + 1}`,
      })),
    }),
    "tip-c-ks-main-1",
  );
  const durations = chapterDurations(KUNAL_SHAH_HIRING_CHAPTERS);
  spawn(
    "tip-art-ks-chart-airtime",
    {
      type: "chart",
      title: "Where the nine minutes went",
      data: {
        chartType: "pie",
        slices: CHAPTER_SHORT_NAMES.map((name, index) => ({
          name,
          value: durations[index]!,
        })),
        unit: "seconds",
        source: "Chapter boundaries read off the captions",
      },
    },
    "tip-c-ks-main-1",
  );
  spawn(
    "tip-art-ks-chart-themes",
    {
      type: "chart",
      title: "Themes by chapter",
      data: {
        chartType: "bar",
        stacked: true,
        categories: CHAPTER_SHORT_NAMES,
        series: countThemes(
          sliceByAnchors(KUNAL_SHAH_HIRING_TRANSCRIPT, KUNAL_SHAH_CHAPTER_ANCHORS),
          KUNAL_SHAH_THEMES,
        ),
        unit: "mentions",
        source: "Word counts per chapter in the captions, both speakers",
      },
    },
    "tip-c-ks-main-1",
  );
  spawn(
    "tip-art-ks-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: KUNAL_SHAH_HIRING_VIDEO_URL },
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
          label: "His companies",
          links: [
            { label: "CRED", url: "https://cred.club" },
            {
              label: "FreeCharge",
              url: "https://en.wikipedia.org/wiki/FreeCharge",
            },
          ],
        },
        {
          label: "Mentioned",
          links: [
            { label: "Sequoia Capital", url: "https://www.sequoiacap.com" },
            { label: "Zerodha", url: "https://zerodha.com" },
          ],
        },
      ],
    }),
    "tip-c-ks-main-1",
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
    idPrefix: "tip-ks",
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
