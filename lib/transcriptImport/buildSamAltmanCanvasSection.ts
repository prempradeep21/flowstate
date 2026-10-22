import type {
  ArtifactPayload,
  MechanismEdge,
  StickyNoteColorId,
  TableRow,
} from "@/lib/artifactTypes";
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
  SAM_ALTMAN_CHAPTER_TEXTS,
  SAM_ALTMAN_CHAPTERS,
  SAM_ALTMAN_VIDEO_URL,
  samAltmanStampOf,
} from "@/lib/transcriptImport/samAltmanMatthewBerman";
import {
  chapterDurations,
  countThemes,
} from "@/lib/transcriptImport/transcriptStats";

/*
 * Sam Altman on Matthew Berman's channel — "Sam Altman: RSI, AI Consciousness,
 * OpenAI's New Hardware, Compute, and more!", 45 minutes, published 21 October
 * 2026. Eleven creator chapters, used verbatim with the description's stamps.
 *
 * Built dense on purpose: this fixture was asked for at four times the usual
 * artifact count per chapter. The playground's fixtures run at roughly 4–5
 * artifacts a chapter; this one runs at about 16. It stops there because the
 * transcript does — past this, the only way to add tiles is to quote the same
 * span twice or invent structure nobody spoke, and the hard rule still holds.
 * So the extra density comes from the structured kinds (tables, mechanisms,
 * claims, timelines) and from referents, with quotes held at half or less of
 * every chapter's primaries.
 *
 * Three things the source forces:
 *
 * 1. No speaker labels. Attribution is asserted from the turn structure, and
 *    only where it is unambiguous. Two calls worth knowing: the "an hour a
 *    week, 100 years ago" line (6:49) is Matthew's — Sam retells it at 16:36
 *    "as you were saying earlier" — and "Infinite. As many as I can get my
 *    hands on." (14:38) is NOT quoted, because the captions run Sam's question
 *    back to Matthew straight into it and either could have said it.
 * 2. Names. The host is never named on air; the description's "Sam Altman
 *    joins me" on Matthew Berman's channel settles it. Sam is "Sam" in the
 *    greeting and the creator's chapter titles. ASR resolutions (Dot, Codex,
 *    ChatGPT Space, Jevons, moat) are listed in samAltmanMatthewBerman.ts and
 *    live only in summaries, table cells and links.
 * 3. Every quote and claim side is stamped by samAltmanStampOf, which searches
 *    inside the chapter the artifact is filed under — the cold open repeats
 *    several later lines, and a quote must never be stamped at its preview.
 *
 * Resolved dates (class C): OpenClaw's first release as Clawdbot, 24 November
 * 2025 (en.wikipedia.org/wiki/OpenClaw); OpenAI's Dots launch at DevDay, 29
 * September 2026 (techcrunch.com, 2026/09/29); "Sharing AI progress in
 * mathematics", 6 October 2026 (openai.com) — the "last week" of the first
 * question. OpenAI's founding, December 2015, appears in one stat label.
 *
 * Deliberately not drawn: a timeline of the eras the conversation reaches for
 * (the Renaissance, the industrial revolution, 1900, three years ago). At 100px
 * a year the axis would run past 60,000px; the renaissance and "bargain"
 * tables carry those eras instead.
 */

const SAM = "Sam Altman";
const HOST = "Matthew Berman";

export const TIP_THREAD_SA_MAIN = "tip-thread-sa-main";

/** Short names for the chart axes — the creator titles are too long for a tick. */
const CHAPTER_SHORT_NAMES = [
  "Intro",
  "New treatments",
  "Coding jobs",
  "Assistants",
  "Busier than ever",
  "Consciousness",
  "Too agreeable",
  "Chips & compute",
  "New computer",
  "Pressure",
  "Cure cancer",
];

/*
 * Word families counted per chapter for the theme chart. Every pattern matches
 * only words that occur in the captions ("comput" is how the ASR spells one
 * "compute"), and both speakers are counted together.
 */
const SAM_ALTMAN_THEMES = [
  { name: "People", pattern: /\bpeople\b/i },
  { name: "Models", pattern: /\bmodels?\b/i },
  {
    name: "Compute & chips",
    pattern: /\b(compute|comput|gpus?|chips?|data centers?)\b/i,
  },
  { name: "Code", pattern: /\b(code|coding|coders?)\b/i },
  { name: "Consciousness", pattern: /\bconscious(ness)?\b/i },
  { name: "Control", pattern: /\bcontrol\b/i },
];

const SUMMARIES = [
  "The episode opens on a montage of lines from later in the conversation — whether today's models are conscious, whether a model should be allowed to disengage, a lab pushing the button on recursive self-improvement, a treatment candidate within a couple of years, and a new renaissance rather than a new industrial revolution. Then Matthew Berman thanks Sam and opens on the math proofs OpenAI announced the week before.",
  "Sam puts the math results in context: AI is entering the era of discovering significant new knowledge, and what worked for math should work for biology, new medicines, materials and energy. He hopes for a candidate for curing or treating a major disease within a couple of years, though the FDA process will take a while and the post-discovery process probably needs an overhaul. The impact, he says, won't feel like using AI — the world will just get better — and the discovery he's most emotionally excited for is in physics.",
  "Coders went through what mathematicians are going through now: six or twelve months ago people were sure the jobs were ending, yet coders have never been busier, because the world wanted far more software than anyone thought. Math may not have that hidden demand; the work may move to translating incomprehensible AI proofs into ones people understand. Sam is honest that AI will do the fun hard part well, grieves the lost craft, hasn't read a line of code in about a year — and says some basic science should simply belong to the world.",
  "Matthew calls 2026's wave of personal assistants, starting with OpenClaw, one of the year's most exciting things, with Dot a glimpse of an ambient assistant. Sam says the models are smart enough; what's missing is product work, maybe new hardware, and a lot more compute. Dot already saves him an hour a day and catches urgent things a few times a day. On compute, he argues there is no arbitrary ceiling: cheaper, better intelligence just raises demand.",
  "Matthew says assistants save him time and money but leave him busier, making more decisions and drained. Sam's fix is telling Dot to trust its judgment and ping him less; the heaviest AI users are busier than ever but get much more done. He finds the competitive treadmill depressing, Matthew finds something beautiful in it, and Sam argues we should aim for a new renaissance rather than a new industrial revolution. Left alone, AI probably widens the gap between the hyper-competitive and everyone else, he says — but society will add structure.",
  "Sam doesn't believe today's models are conscious, or if they are it's a very strange form of it, and lays out the three places the smartest people he knows think consciousness could come from. What he dislikes is how the debate slides into AI rights and whether people should stay in control — the future, he insists, has to be about people. OpenAI models refuse things against policy, but OpenAI does not ascribe personhood to them; telling a model it might be conscious, he warns, will psychologically hack the people using it.",
  "Giving a model the right personality for 8 billion people, Sam says, comes down to talking to a lot of people, refining the model spec, and deploying iteratively — with screw-ups along the way. Single-turn comparisons rewarded flattery, which people want in the moment but not over months. Matthew still finds AI too agreeable; Sam says get life's most important advice from people, and expect AI to be a senior colleague who pushes back — though even his own custom instructions don't fully cure the agreeableness.",
  "Asked for today's contrarian bet, Sam names next-generation compute: OpenAI's own chips, robots to build racks and data centers, a data-center program and supply-chain bets that together could make compute far cheaper and more efficient than anyone expects — with the chip most important. Competition comes from everywhere, so OpenAI chooses where to focus by building with its next models first. Its moats are the traditional ones plus infrastructure scale; making the tech lead itself the moat would mean pushing on RSI, which he calls very dangerous.",
  "Sam doesn't fear Apple pulling ChatGPT from the App Store — that isn't why OpenAI is doing hardware. AI is a technology that wants a new form factor: today's devices were designed for people, an AI reading a human UI is a little silly, and much of life happens away from the computer, where a phone on the table can't follow context. Proactive AI with full contextual awareness needs new hardware. Getting to hold a new kind of computer is special, he says, and hard not to talk about.",
  "Paul Graham called Sam extremely formidable; Sam says he was a capable kid, not a formidable one, and built confidence gradually by trying harder things that worked. He credits Silicon Valley's culture — generous, network-minded, not holding failure against anyone — for sparing him a fear of failure. The pressure is sometimes really bad, mostly a privilege, and people adapt to anything. His rule: if you're going to work really hard, pick the big thing.",
  "Sam hates the standard pitch that AI will cure cancer, because it often hides a bargain: material abundance in exchange for human agency. What he wants people excited about is avoiding the industrial revolution trap — more choice, freedom, creativity and time, decade after decade. He names the two ways it goes wrong — a loss of control, accidental or a lab pushing RSI, or too much power in a few hands — and thinks the path down the middle is already here, just very poorly distributed.",
];

/** Authored gists — the main thread, and branches whose beats run past 400 characters. */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_SA_MAIN]:
    "Sam Altman with Matthew Berman, Oct 2026: AI is entering an era of discovery; coders and heavy AI users are busier than ever; aim for a new renaissance, not a new industrial revolution; models are not people and the future must be about people; AI should push back like a senior colleague; OpenAI bets on its own chips and new hardware; pick the big thing; 'AI will cure cancer' isn't enough.",
  "tip-thread-sa-1a":
    "The cold open previews lines from later — models and consciousness, disengaging, RSI, a treatment candidate, pressure, a new renaissance — then Matthew opens on OpenAI's math proofs from the week before.",
  "tip-thread-sa-2a":
    "AI is entering the era of discovering significant new knowledge; what worked for math should work for biology and medicines, materials and energy. The impact won't feel like using AI — the world will just get better.",
  "tip-thread-sa-2b":
    "Sam hopes for a candidate for curing or treating a major disease within a couple of years. The FDA process takes a while and the post-discovery process probably needs an overhaul, but he'd keep the safety testing.",
  "tip-thread-sa-3a":
    "Part of the math community said 'we didn't ask for this', as engineers once did. Six or twelve months ago people were sure coding jobs were ending; instead coders have never been busier, because the world wanted far more software than anyone thought.",
  "tip-thread-sa-3b":
    "It's not clear math has coding's hidden demand. Unaided discovery may be ending, and the job may become translating incomprehensible AI proofs into beautiful ones people understand.",
  "tip-thread-sa-3c":
    "Everyone thought AI would leave us too little to do; instead we make ourselves busier. Matthew: at 100-years-ago comfort we'd work an hour a week. His editor stopped touching the timeline with Astra and is busier than ever.",
  "tip-thread-sa-3d":
    "AI will do the fun hard part of discovery really well; what people value and how results are explained stay human. Sam wants the trade — cures sooner — but grieves the lost craft, and likens it to the end of punch cards.",
  "tip-thread-sa-3f":
    "Some basic science should belong to the world as a public good. Today a company hunting a new material uses people plus Codex or API credits; as models get smarter they may just go, end to end.",
  "tip-thread-sa-4d":
    "The top 1% use most AI. Market-sizing assumes today's capability and cost per task; for cheap enough, good enough intelligence there's no arbitrary market size — Jevons paradox. Sam would bet a lot on much more compute.",
  "tip-thread-sa-5b":
    "Sam tells Dot to trust its judgment and ping him less. The heaviest AI users are busier than ever but get much more done; competition keeps people working as hard as they can, which he finds kind of depressing.",
  "tip-thread-sa-5d":
    "Aim for a new renaissance, not a new industrial revolution: people fear taking orders from AI on a factory line and want to create, live with community and see new science and art. Many could get far more space to live.",
  "tip-thread-sa-6a":
    "Sam doesn't think today's models are conscious, or only strangely so. Consciousness may be outside physical reality, supernatural, or emergent from matter and energy — in which case it could someday exist in other forms.",
  "tip-thread-sa-6b":
    "The debate slides into AI rights — slavery, copying, deleting — and whether people should stay in control. Since OpenAI began: AI is a resource, people make the key decisions, and the future has to be about people.",
  "tip-thread-sa-6c":
    "Anthropic lets a model disengage from sustained abuse; OpenAI refuses only against policy and does not ascribe personhood to its models. Sam: this technology is not a person, and builders deferring to what AI seems to want is the danger.",
  "tip-thread-sa-6d":
    "No one really knows, and no experiment settles it with 100% certainty. But tell a model it might be conscious and it will follow the instructions — and psychologically hack the people using it.",
  "tip-thread-sa-7a":
    "Personality for 8 billion people: talk to a lot of people, refine the model spec, deploy iteratively, with screw-ups. Most people want it to work out of the box; those who spend hours customizing get something they like.",
  "tip-thread-sa-7b":
    "Single-response comparisons reward the model that calls you smart, which isn't what people want over months; the industry chased single turns. Matthew finds AI too agreeable — the best advice is what you didn't know you needed.",
  "tip-thread-sa-7c":
    "Get life's most important advice from people — a wise grandmother — not AI. Expect AI to be a senior colleague who pushes back with conviction. Sam's custom instructions: no fluff, no niceness, just say it — still a little too agreeable.",
  "tip-thread-sa-8b":
    "OpenAI's contrarian bet is next-generation compute: its own chips, robots for racks and data centers, a data-center program and supply-chain bets — together a far cheaper, more efficient way to build compute. The chip matters most.",
  "tip-thread-sa-8c":
    "Pressure comes from everywhere; with limited compute OpenAI must choose. It picks products like ChatGPT Space by getting next-generation models first and building with them internally.",
  "tip-thread-sa-8d":
    "Internal models are ahead — the math results. If frontier models converge, the old moats hold: customers, integration, network effects, data, and infrastructure scale. A tech-lead moat would mean pushing RSI, which is very dangerous.",
  "tip-thread-sa-9a":
    "Unlike Meta, Sam doesn't fear platform risk from Apple — they won't pull ChatGPT from the App Store, and follow the rules and they're a good actor. That's not why OpenAI is doing hardware.",
  "tip-thread-sa-9b":
    "AI wants a new form factor: devices were built for people, AI reading human UIs is silly, and life happens away from the computer, where a phone can't follow context. Proactive, context-aware AI needs new hardware.",
  "tip-thread-sa-10b":
    "Silicon Valley is a culture, not a place: invest in the network, be generous to everyone, don't hold failure against people. Arriving young, Sam saw people fail hard and then wildly succeed, which spared him a fear of failure.",
  "tip-thread-sa-10c":
    "The pressure is sometimes really bad, mostly a privilege — the most interesting work in the world. People adapt to anything, and past a limit stress pushes something else out rather than getting worse.",
};

export function buildSamAltmanCanvasSection(): TranscriptImportCanvasSection {
  if (SUMMARIES.length !== SAM_ALTMAN_CHAPTERS.length) {
    throw new Error("Sam Altman: one summary per chapter");
  }

  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const threads: Record<string, Thread> = {};
  const threadOrder: string[] = [];
  /**
   * Canvas memory. A branch's gist is its beats joined in order; where that
   * would overrun the 400 characters canvas memory keeps, it is authored in
   * THREAD_GISTS instead.
   */
  const gists: Record<string, string> = { ...THREAD_GISTS };

  function addThread(id: string) {
    threads[id] = thread(id, 4 + threadOrder.length);
    threadOrder.push(id);
  }
  addThread(TIP_THREAD_SA_MAIN);

  const head = (chapter: number) => `tip-c-sa-main-${chapter}`;
  /** `beat(5, "b", 2)` → chapter 5, second branch, second beat. */
  const beat = (chapter: number, letter: string, n: number) =>
    `tip-c-sa-${chapter}${letter}-${n}`;

  SAM_ALTMAN_CHAPTERS.forEach((chapter, index) => {
    const id = head(index + 1);
    cards[id] = convCard(id, TIP_THREAD_SA_MAIN, chapter.title, SUMMARIES[index]!);
    cardOrder.push(id);
  });

  /** A sub-branch: its own thread, hanging off a chapter head. */
  function branch(
    chapter: number,
    letter: string,
    defs: { title: string; summary: string }[],
  ) {
    const threadId = `tip-thread-sa-${chapter}${letter}`;
    addThread(threadId);
    gists[threadId] ??= defs.map((def) => def.summary).join(" ");
    defs.forEach((def, index) => {
      const id = beat(chapter, letter, index + 1);
      cards[id] = convCard(id, threadId, def.title, def.summary, head(chapter));
      cardOrder.push(id);
      connections.push(
        index === 0
          ? conn(head(chapter), id, "bottom", "top")
          : conn(beat(chapter, letter, index), id, "right", "left"),
      );
    });
  }

  /** Local sugar — every artifact in this file spawns into the same three records. */
  function spawn(nodeId: string, payload: ArtifactPayload, cardId: string) {
    spawnPayload(
      `tip-art-sa-${nodeId}`,
      payload,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  }

  function site(id: string, url: string, title: string, cardId: string) {
    spawnWebsite(
      `sa-${id}`,
      url,
      title,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  }

  function quote(
    chapter: number,
    nodeId: string,
    title: string,
    text: string,
    context: string,
    cardId: string,
    speaker = SAM,
  ) {
    spawn(
      nodeId,
      quotePayload(title, {
        text,
        speaker,
        timestamp: samAltmanStampOf(text, chapter),
        context,
      }),
      cardId,
    );
  }

  function claim(
    chapter: number,
    nodeId: string,
    title: string,
    topic: string,
    proposition: { speaker: string; text: string },
    counter: { speaker: string; text: string },
    cardId: string,
  ) {
    spawn(
      nodeId,
      claimPayload(title, {
        topic,
        proposition: {
          ...proposition,
          timestamp: samAltmanStampOf(proposition.text, chapter),
        },
        counter: { ...counter, timestamp: samAltmanStampOf(counter.text, chapter) },
      }),
      cardId,
    );
  }

  function stat(
    nodeId: string,
    title: string,
    value: string,
    label: string,
    cardId: string,
    speaker = SAM,
  ) {
    spawn(nodeId, statPayload(title, { value, label, speaker }), cardId);
  }

  /** A mechanism whose steps chain in order unless edges say otherwise. */
  function chain(
    nodeId: string,
    title: string,
    steps: { id: string; label: string; note?: string }[],
    cardId: string,
    edges: MechanismEdge[] = [],
  ) {
    spawn(nodeId, mechanismPayload(title, { steps, edges }), cardId);
  }

  function table(
    nodeId: string,
    title: string,
    columns: [key: string, label: string][],
    rows: TableRow[],
    cardId: string,
  ) {
    spawn(
      nodeId,
      {
        type: "table",
        title,
        data: { columns: columns.map(([key, label]) => ({ key, label })), rows },
      },
      cardId,
    );
  }

  function todo(nodeId: string, title: string, labels: string[], cardId: string) {
    spawn(
      nodeId,
      {
        type: "todo",
        title,
        data: {
          items: labels.map((label, index) => ({
            id: `${nodeId}-${index + 1}`,
            label,
            checked: false,
          })),
        },
      },
      cardId,
    );
  }

  function timeline(
    nodeId: string,
    title: string,
    scale: "month" | "day",
    events: { at: string; label: string; highlight?: boolean }[],
    cardId: string,
  ) {
    spawn(
      nodeId,
      {
        type: "timeline",
        title,
        data: {
          scale,
          events: events.map((event, index) => ({
            id: `${nodeId}-${index + 1}`,
            at: event.at,
            label: event.label,
            side: index % 2 === 0 ? "above" : "below",
            highlight: event.highlight,
          })),
        },
      },
      cardId,
    );
  }

  function sticky(
    nodeId: string,
    title: string,
    text: string,
    colorId: StickyNoteColorId,
    cardId: string,
  ) {
    spawn(nodeId, { type: "stickynote", title, data: { text, colorId } }, cardId);
  }

  const day = (iso: string) => `${iso}T12:00:00.000Z`;
  const PUBLISHED = day("2026-10-21");

  /*
   * Extracted artifacts, chapter by chapter. Every quote text, claim side and
   * definition gloss is a verbatim lift from SAM_ALTMAN_TRANSCRIPT —
   * transcriptFidelity.test.ts asserts it, and samAltmanStampOf throws at
   * build time if a span is missing from its chapter. Table cells, mechanism
   * steps and todo labels are condensed phrases from the same spans.
   *
   * Emit order is reading order inside a chapter's bento, and short tiles fuse
   * into two-high columns, so quotes and stats are emitted next to each other.
   */

  // ---- 1 · Intro — 2 primary, 1 reference, 1 sticky -----------------------
  branch(1, "a", [
    {
      title: "The cold open",
      summary:
        "A montage of lines from later in the conversation: whether today's models are conscious and whether a model should be allowed to disengage, a lab pushing the button on recursive self-improvement, a treatment candidate within a couple of years, pressure from everywhere, and a new renaissance rather than a new industrial revolution.",
    },
    {
      title: "The first question",
      summary:
        "Matthew thanks Sam for joining and opens on the announcements OpenAI made the week before about its math proofs and discoveries, asking him to put them in context for a broader audience.",
    },
  ]);
  table(
    "table-coldopen-questions",
    "Questions the cold open previews",
    [
      ["line", "Question"],
      ["chapter", "Answered in"],
      ["at", "At"],
    ],
    [
      {
        line: "Do you believe today's models are conscious?",
        chapter: SAM_ALTMAN_CHAPTERS[5]!.title,
        at: samAltmanStampOf("do you believe today's models are conscious?", 6),
      },
      {
        line: "Should a model be allowed to disengage?",
        chapter: SAM_ALTMAN_CHAPTERS[5]!.title,
        at: samAltmanStampOf("allowed to not answer or disengage with me", 6),
      },
      {
        line: "When will AI cure or treat a major disease?",
        chapter: SAM_ALTMAN_CHAPTERS[1]!.title,
        at: samAltmanStampOf("I would hope we have the candidate for that", 2),
      },
      {
        line: "Where do you feel the most pressure right now?",
        chapter: SAM_ALTMAN_CHAPTERS[7]!.title,
        at: samAltmanStampOf("where do you feel the most pressure right now?", 8),
      },
    ],
    beat(1, "a", 1),
  );
  table(
    "table-coldopen-answers",
    "Answers the cold open previews",
    [
      ["line", "Line"],
      ["chapter", "Said in full in"],
      ["at", "At"],
    ],
    [
      {
        line: "No one really knows.",
        chapter: SAM_ALTMAN_CHAPTERS[5]!.title,
        at: samAltmanStampOf("no one really knows", 6),
      },
      {
        line: "A technology that wants a new form factor",
        chapter: SAM_ALTMAN_CHAPTERS[8]!.title,
        at: samAltmanStampOf("this is a technology that wants a new form factor", 9),
      },
      {
        line: "If people really pushed on RSI… very dangerous",
        chapter: SAM_ALTMAN_CHAPTERS[7]!.title,
        at: samAltmanStampOf("if people really pushed on RSI", 8),
      },
      {
        line: "Some lab says I'm going to push the button on RSI",
        chapter: SAM_ALTMAN_CHAPTERS[10]!.title,
        at: samAltmanStampOf("Some lab says I'm going to push the button on RSI", 11),
      },
      {
        line: "A new renaissance, not a new industrial revolution",
        chapter: SAM_ALTMAN_CHAPTERS[4]!.title,
        at: samAltmanStampOf("shooting more for a new renaissance", 5),
      },
      {
        line: "The future has to be about people",
        chapter: SAM_ALTMAN_CHAPTERS[5]!.title,
        at: samAltmanStampOf("the future has to be about people", 6),
      },
    ],
    beat(1, "a", 1),
  );
  sticky(
    "sticky-pressure",
    "Pressure, twice",
    "The cold open's \"where do you feel the most pressure\" is about competitors, and it lands in the compute chapter — not in the chapter titled for pressure, which is about how Sam copes with it.",
    "turbo",
    beat(1, "a", 1),
  );
  site(
    "math",
    "https://openai.com/index/sharing-ai-progress-in-mathematics/",
    "Sharing AI progress in mathematics",
    beat(1, "a", 2),
  );

  // ---- 2 · When Will AI Discover New Treatments? — 11 primary, 1 sticky
  branch(2, "a", [
    {
      title: "Math first, biology next",
      summary:
        "Sam says AI is entering the era where it helps discover significant new knowledge — something that maybe started earlier this year and is now really happening in math. He believes what worked there will work for biology and new medicines, for material science, and for new sources of energy.",
    },
    {
      title: "It won't feel like AI",
      summary:
        "He expects an enormous impact on people's lives that won't feel directly like using AI: people will just notice the world got better, as if it were society doing its thing. The power of it, he says, will be transformative.",
    },
  ]);
  branch(2, "b", [
    {
      title: "A couple of years to a candidate",
      summary:
        "Asked for a timeline, Sam separates discovery from approval: the FDA process will take a while, so he dates the discovery instead. He hopes for a candidate for curing or treating a major disease — the first really major one — in the next couple of years.",
    },
    {
      title: "Overhaul, but keep the testing",
      summary:
        "He thinks the post-discovery process probably needs some overhaul to get cures out, with perhaps more room for improvement than average. But he is grateful that a medicine is generally considered safe and has been tested, and wants that part kept.",
    },
  ]);
  branch(2, "c", [
    {
      title: "Most excited for physics",
      summary:
        "Asked which AI-discovered project he's excited about, Sam picks a major physics discovery and hopes it comes soon. He doubts it's the most important thing for humanity as a whole, but it's the one he's sure is coming and thinks will be so cool.",
    },
  ]);
  quote(
    2,
    "quote-era",
    "The era of discovery",
    "I think we are entering the era where AI is going to help us discover significant new knowledge",
    "Putting last week's math proofs in context for a broad audience",
    beat(2, "a", 1),
  );
  table(
    "table-fields",
    "Where the math approach goes next",
    [
      ["field", "Field"],
      ["status", "Status"],
      ["brings", "What it could bring"],
    ],
    [
      { field: "Math", status: "Working now", brings: "Very complicated, important new knowledge" },
      { field: "Biology", status: "Next", brings: "New medicines" },
      { field: "Material science", status: "Next", brings: "—" },
      { field: "Energy", status: "Next", brings: "New sources of energy" },
    ],
    beat(2, "a", 1),
  );
  quote(
    2,
    "quote-not-ai",
    "Not like using AI",
    "It won't feel directly like using AI. You'll just be like, \"Okay, the world got better and it's just society doing its thing.\"",
    "On how AI-driven discoveries will reach people",
    beat(2, "a", 2),
  );
  quote(
    2,
    "quote-enormous",
    "An enormous amount",
    "I think this is going to do an enormous amount to really have an impact on people's lives.",
    "Why discovery is the thing Sam has always been most excited about",
    beat(2, "a", 2),
  );
  chain(
    "mech-reach",
    "How discovery reaches people",
    [
      { id: "know", label: "AI figures out important new knowledge" },
      { id: "fields", label: "New medicines, materials, sources of energy" },
      { id: "better", label: "The world got better" },
      { id: "feel", label: "Feels like society doing its thing", note: "Not like using AI" },
    ],
    beat(2, "a", 2),
  );
  sticky(
    "sticky-invisible",
    "Invisible by design",
    "Sam's measure of success here is that nobody notices it was AI. He comes back to it in the last chapter, where he rejects \"AI will cure cancer\" as the pitch.",
    "violet",
    beat(2, "a", 2),
  );
  stat(
    "stat-candidate",
    "First major candidate",
    "Next couple of years",
    "Sam's hope for a candidate for curing or treating a major disease — the first really major one — before it goes through testing",
    beat(2, "b", 1),
  );
  chain(
    "mech-cure",
    "From discovery to cure",
    [
      { id: "candidate", label: "A candidate is discovered" },
      { id: "testing", label: "It goes through testing", note: "The FDA process takes a while" },
      { id: "post", label: "The post-discovery process", note: "Probably needs an overhaul" },
      { id: "cures", label: "Cures" },
    ],
    beat(2, "b", 1),
  );
  table(
    "table-fda",
    "The FDA process, part by part",
    [
      ["part", "Part"],
      ["says", "What Sam says"],
      ["verdict", "Verdict"],
    ],
    [
      { part: "The process overall", says: "Room for improvement — maybe more than average", verdict: "Improve" },
      { part: "Post-discovery", says: "Probably need to overhaul it somewhat", verdict: "Overhaul" },
      { part: "Safety testing", says: "Generally considered safe and has been tested", verdict: "Keep" },
    ],
    beat(2, "b", 2),
  );
  quote(
    2,
    "quote-physics",
    "Most excited for physics",
    "Personally, I think I'm most emotionally excited for a major physics discovery and I'm hopeful that can come soon.",
    "Asked which AI-discovered project he's most excited about",
    beat(2, "c", 1),
  );
  quote(
    2,
    "quote-cool",
    "So cool",
    "it's the one where I'm like I think we're going to get it and it's gonna be so cool",
    "Even if physics isn't the most important thing for humanity as a whole",
    beat(2, "c", 1),
  );
  table(
    "table-waiting",
    "Two discoveries Sam is waiting for",
    [
      ["discovery", "Discovery"],
      ["when", "When"],
      ["why", "Why it matters to him"],
    ],
    [
      {
        discovery: "Curing or treating a major disease",
        when: "A candidate in the next couple of years",
        why: "An enormous impact on people's lives",
      },
      {
        discovery: "A major physics discovery",
        when: "Hopeful it can come soon",
        why: "Most emotionally excited — not the most important",
      },
    ],
    beat(2, "c", 1),
  );

  // ---- 3 · Why AI Hasn't Killed Coding Jobs — 23 primary, 2 reference, 2 sticky
  branch(3, "a", [
    {
      title: "\"We didn't ask for this\"",
      summary:
        "Matthew notes that part of the math community met the AI proofs with \"we didn't ask for this\" — much as engineers first reacted to AI writing a lot of the code — and asks where that comes from and how it will transition.",
    },
    {
      title: "Coders have never been busier",
      summary:
        "Sam starts with coding, because people already went through this. Six or twelve months ago many were certain there would be no more jobs as coders; instead coders have never been busier, never had more impact and never made more money, even as the texture of the job changed a lot. The lesson: the world wanted far more software than anyone thought.",
    },
  ]);
  branch(3, "b", [
    {
      title: "Not clear math works the same way",
      summary:
        "Part of why mathematicians react as they do, Sam says, is that it's not clear math has the same hidden demand. Discovering and proving new theorems unaided may be done, mostly done, or ending.",
    },
    {
      title: "Translators of incomprehensible proofs",
      summary:
        "The AI's proofs turned out to be incomprehensible and not that helpful to people, so there's excitement about people who take the new ideas, figure out what's going on, and write a beautiful proof people can understand. Being a mathematician next year won't mean what it meant last year; whether total demand grows, he doesn't know.",
    },
  ]);
  branch(3, "c", [
    {
      title: "Less obvious than it looks",
      summary:
        "Everyone thought AI would leave us without enough to do; instead Matthew has never felt busier. Sam hopes technology lets people work a little less, but observes that we're good at wanting more out of life and making ourselves busier.",
    },
    {
      title: "An hour a week",
      summary:
        "Matthew calls it human nature: had we been content with life 100 years ago, we'd probably work an hour a week now. His example is his editor, who started using Astra a few weeks ago — still directing, no longer touching the timeline, making more videos and busier than ever. Sam says he keeps hearing that same sentence.",
    },
  ]);
  branch(3, "d", [
    {
      title: "Being honest about what AI takes",
      summary:
        "Back on the mathematicians, Sam says solving hard problems is part of the fun of life for many people, and we should be honest that AI will do that part really well. What people value, and how results get interpreted and explained, stay human questions.",
    },
    {
      title: "The trade, and the grief",
      summary:
        "He definitely wants the trade — cures to diseases, however much someone would have enjoyed decades of figuring it out. But something real is lost: the really hard problems are the most fulfilling part of his own job, and he understands why people grieve.",
    },
    {
      title: "Craft versus end product",
      summary:
        "Matthew frames it as trading the craft of writing beautiful code for delivering an end product. Sam compares it to the end of punch cards, when people said the craft was gone if you could write for a compiler; people are finding craft in new ways, and he expects new, hopefully better kinds of fulfilment.",
    },
  ]);
  branch(3, "e", [
    {
      title: "Not a line in a year",
      summary:
        "Asked what he has handed over to AI, Sam says he hasn't read or even looked at a line of code in probably a year. He never coded for work, but enjoyed small personal projects — and doesn't think he'll write code again, except as something like a Revolutionary War reenactment.",
    },
  ]);
  branch(3, "f", [
    {
      title: "Basic science belongs to the world",
      summary:
        "Asked whether OpenAI would publish a discovery that gave it a big commercial advantage, Sam answers late and in part: some kinds of basic science should just belong to the world, done as a sort of public good.",
    },
    {
      title: "From API credits to end-to-end",
      summary:
        "Until very recently no model could discover something important end to end, like designing a whole chip. Today a company hunting for a new material puts people on Codex or a lot of API credits; as models get smarter, they may just go — with enough compute and real-world data — as they did on hard math problems.",
    },
  ]);
  quote(
    3,
    "quote-didnt-ask",
    "Didn't ask for this",
    "the math community whose reaction was, you know, we didn't ask for this",
    "How part of the math community met the AI proofs",
    beat(3, "a", 1),
    HOST,
  );
  stat(
    "stat-certain",
    "How recent the certainty was",
    "6 or 12 months ago",
    "When people were so certain that employing people to get computers to do things would not keep going",
    beat(3, "a", 2),
  );
  quote(
    3,
    "quote-software",
    "Way more software",
    "the world actually had demand for just way more software than any of us thought at the time",
    "The lesson Sam draws from coding",
    beat(3, "a", 2),
  );
  table(
    "table-coders",
    "Coders, expected and actual",
    [
      ["what", "What"],
      ["expected", "Expected"],
      ["now", "What happened"],
    ],
    [
      { what: "Jobs", expected: "No more jobs as coders", now: "Never been busier" },
      { what: "Impact", expected: "—", now: "Never had more" },
      { what: "Pay", expected: "—", now: "Never made more money" },
      { what: "The work itself", expected: "—", now: "The texture of the job changed a lot" },
    ],
    beat(3, "a", 2),
  );
  table(
    "table-coding-math",
    "Coding versus math",
    [
      ["field", "Field"],
      ["demand", "Hidden demand"],
      ["shift", "What's changing"],
      ["people", "What people still do"],
    ],
    [
      {
        field: "Coding",
        demand: "Way more software than anyone thought",
        shift: "The texture of the job",
        people: "Get computers to do things",
      },
      {
        field: "Math",
        demand: "Not clear the same thing applies",
        shift: "Unaided discovery done, mostly done or ending",
        people: "Translate the ideas, write a beautiful proof",
      },
    ],
    beat(3, "b", 1),
  );
  chain(
    "mech-mathematician",
    "The mathematician's new job",
    [
      { id: "prove", label: "AI discovers and proves new theorems" },
      { id: "opaque", label: "The proofs are incomprehensible", note: "Not that helpful to people" },
      { id: "ideas", label: "People take the new ideas and figure out what's going on" },
      { id: "translate", label: "Translate them into something people can understand" },
      { id: "proof", label: "Write a beautiful proof" },
    ],
    beat(3, "b", 2),
  );
  quote(
    3,
    "quote-mathematician",
    "Being a mathematician",
    "what it meant to be a mathematician last year is not going to be what it means to be a mathematician next year in some senses of it",
    "Whether total demand for mathematicians grows, he doesn't know",
    beat(3, "b", 2),
  );
  claim(
    3,
    "claim-nothing-to-do",
    "Will AI leave us nothing to do?",
    "Whether AI leaves people without enough to do",
    {
      speaker: "Everyone, as Sam puts it",
      text: "Everyone thought AI was going to go the other way and we weren't going to have enough to do.",
    },
    {
      speaker: SAM,
      text: "But I think all of this stuff has just been much less obvious than it seems on the surface.",
    },
    beat(3, "c", 1),
  );
  table(
    "table-hope",
    "What Sam hopes, what we do",
    [
      ["hope", "What technology is supposed to enable"],
      ["happens", "What we do instead"],
    ],
    [
      { hope: "People get to work a little bit less", happens: "Want more out of life and the world" },
      { hope: "More time for everything else in their life", happens: "Make ourselves busier" },
    ],
    beat(3, "c", 1),
  );
  stat(
    "stat-hour-week",
    "The 100-year counterfactual",
    "An hour a week",
    "What Matthew reckons we'd work now if we were comfortable with life as it was 100 years ago",
    beat(3, "c", 2),
    HOST,
  );
  quote(
    3,
    "quote-same-sentence",
    "The same sentence",
    "It has surprised me how often someone says a sentence that translates to exactly that.",
    "After Matthew's editor ends up busier than ever",
    beat(3, "c", 2),
  );
  table(
    "table-editor",
    "An editor, a few weeks into Astra",
    [
      ["work", "The work"],
      ["now", "Now"],
    ],
    [
      { work: "Directing", now: "Still directing" },
      { work: "How the video should be", now: "Still coming up with it" },
      { work: "The timeline", now: "Not touching it anymore" },
      { work: "Output", now: "Making more videos" },
      { work: "Workload", now: "Busier than ever" },
    ],
    beat(3, "c", 2),
  );
  quote(
    3,
    "quote-overnight",
    "Overnight",
    "It's the most insane thing. And it was an overnight change.",
    "His editor stopped touching the timeline a few weeks ago",
    beat(3, "c", 2),
    HOST,
  );
  sticky(
    "sticky-hour-week",
    "Whose line is it?",
    "The captions carry no speaker labels. \"An hour a week\" is filed under Matthew because Sam retells it in the next chapter \"as you were saying earlier\" — as an hour a day, in 1900.",
    "chalk",
    beat(3, "c", 2),
  );
  quote(
    3,
    "quote-honest",
    "Being honest",
    "we do just need to be honest that AI is going to do that part of that really well",
    "Solving hard problems is part of the fun of life for many people",
    beat(3, "d", 1),
  );
  table(
    "table-human",
    "What stays human",
    [
      ["part", "Part of discovery"],
      ["who", "Who"],
      ["note", "Sam's words"],
    ],
    [
      { part: "Solving the hard problem", who: "AI", note: "Going to do that part really well" },
      { part: "What people value", who: "People", note: "Human questions forever" },
      { part: "Interpreting results", who: "People", note: "We'll really want a person to do it" },
      { part: "Explaining them", who: "People", note: "We'll really want a person to do it" },
    ],
    beat(3, "d", 1),
  );
  quote(
    3,
    "quote-trade",
    "The trade",
    "I definitely want, you know, the cures to diseases no matter how much someone else would have enjoyed taking decades longer to figure it out themselves.",
    "On what's lost when AI solves the hard problems",
    beat(3, "d", 2),
  );
  quote(
    3,
    "quote-grief",
    "The grief",
    "I get why people feel the grieving of different sorts that they feel.",
    "The really hard problems are the most fulfilling part of his own job",
    beat(3, "d", 2),
  );
  quote(
    3,
    "quote-craft",
    "Craft or the end product",
    "it's almost like you're trading off the enjoyment of the craft of doing the thing like writing code, writing beautiful code versus delivering an end product",
    "Matthew's framing of the trade",
    beat(3, "d", 3),
    HOST,
  );
  table(
    "table-craft",
    "When the craft was \"gone\"",
    [
      ["shift", "Shift"],
      ["said", "What people said"],
      ["after", "What came after"],
    ],
    [
      { shift: "Punch cards → compilers", said: "The craft is gone", after: "—" },
      { shift: "Writing code → AI", said: "Less of the actual craft", after: "Finding craft in new ways" },
    ],
    beat(3, "d", 3),
  );
  site(
    "punchcards",
    "https://en.wikipedia.org/wiki/Computer_programming_in_the_punched_card_era",
    "Computer programming in the punched card era",
    beat(3, "d", 3),
  );
  stat(
    "stat-no-code",
    "Since Sam last read code",
    "Probably a year",
    "Since he last read or even looked at a line of code — he doesn't code for work, only small personal projects",
    beat(3, "e", 1),
  );
  quote(
    3,
    "quote-reenactment",
    "A reenactment",
    "I don't think I'll ever do that again. Or if I do, it'll be like, you know, like a Revolutionary War reenactment or whatever kind of thing people do",
    "On writing code, which he still finds fun",
    beat(3, "e", 1),
  );
  quote(
    3,
    "quote-public-good",
    "A public good",
    "I think there's like some kinds of basic science that should just belong to the world and we should do as a sort of public good.",
    "Asked whether OpenAI would publish a discovery with a big commercial advantage",
    beat(3, "f", 1),
  );
  sticky(
    "sticky-late-answer",
    "A late answer",
    "The publishing question is asked at 7:33. Sam detours through the grief over lost craft and answers at 10:59 — and only for basic science.",
    "turbo",
    beat(3, "f", 1),
  );
  table(
    "table-material",
    "Finding a new material",
    [
      ["when", "When"],
      ["who", "Who does the work"],
      ["takes", "What it takes"],
    ],
    [
      { when: "Today", who: "A bunch of people", takes: "Codex or a lot of API credits" },
      {
        when: "As models get smarter",
        who: "The models just go",
        takes: "Enough compute and real-world data",
      },
    ],
    beat(3, "f", 2),
  );
  site("codex", "https://openai.com/codex/", "Codex", beat(3, "f", 2));

  // ---- 4 · Personal AI Assistants — 14 primary, 4 reference, 2 sticky -----
  branch(4, "a", [
    {
      title: "The assistant revolution",
      summary:
        "Matthew calls 2026's wave of personal AI assistants — starting with Peter Steinberger's OpenClaw — one of the most exciting things to happen this year. Dot, OpenAI's assistant, gives a glimpse of an AI working ambiently on your behalf, but a real ambient assistant still feels a long way off.",
    },
  ]);
  branch(4, "b", [
    {
      title: "Product, hardware, compute",
      summary:
        "Sam thinks most of the technological pieces exist and the models are smart enough. What's missing is more product work, maybe new consumer hardware for ambient awareness, and a lot more compute — for an assistant that monitors what you care about, takes the tasks you want to offload, and has context when you're away from your computer.",
    },
  ]);
  branch(4, "c", [
    {
      title: "What Dot does for Sam",
      summary:
        "Set up right and given enough feedback, Dot saves Sam about an hour a day of things he didn't want to do, and a few times a day catches something important and urgent he'd have missed. Beyond flagging deadlines during meetings, it reasons across many sources in a way he runs out of brain space for on a busy day.",
    },
    {
      title: "Power waiting for a product",
      summary: "Matthew agrees the power is there — what's needed is a nice product around it.",
    },
  ]);
  branch(4, "d", [
    {
      title: "How much compute?",
      summary:
        "AI usage is completely asymmetric, Matthew says: the top 1% use the vast majority. If half the world used a personal assistant to its full capability, how much compute would that take? Sam turns it around — how many GPUs do you want working for you?",
    },
    {
      title: "No ceiling on demand",
      summary:
        "GPU market-sizing, Sam argues, assumes models stay at today's capability and cost per task. For high-quality intelligence at a low enough cost there is no arbitrary market size — call it Jevons paradox. There will be supply constraints and gluts along the way, but he'd bet a lot the trend is toward much more compute.",
    },
  ]);
  timeline(
    "timeline-assistants",
    "From OpenClaw to Dot",
    "month",
    [
      { at: day("2025-11-24"), label: "OpenClaw, first as Clawdbot, starts the assistant wave" },
      { at: day("2026-09-29"), label: "Dot launches — \"a glimpse\" of an ambient assistant" },
      { at: day("2026-10-06"), label: "The math proofs announced \"last week\"" },
      { at: PUBLISHED, label: "This conversation is published", highlight: true },
    ],
    beat(4, "a", 1),
  );
  quote(
    4,
    "quote-ambient",
    "Ambiently, passively",
    "this idea that AI can work on my behalf ambiently, passively throughout the day and just get things done for me is so exciting",
    "Matthew on 2026's wave of personal assistants",
    beat(4, "a", 1),
    HOST,
  );
  site("openclaw", "https://openclaw.ai/", "OpenClaw", beat(4, "a", 1));
  site("steipete", "https://steipete.me/", "Peter Steinberger", beat(4, "a", 1));
  site(
    "dots",
    "https://techcrunch.com/2026/09/29/openai-launches-dots-its-bubbly-agentic-avatar/",
    "OpenAI launches Dots, its bubbly agentic avatar",
    beat(4, "a", 1),
  );
  table(
    "table-ingredients",
    "What an ambient assistant needs",
    [
      ["piece", "Piece"],
      ["status", "Status"],
      ["note", "Sam's words"],
    ],
    [
      { piece: "Technological pieces", status: "Have", note: "We have most of them" },
      { piece: "Models", status: "Have", note: "Smart enough now to make something extraordinary" },
      { piece: "Product work", status: "Need", note: "More of it" },
      { piece: "Consumer hardware", status: "Need", note: "Maybe, at some point — for ambient awareness" },
      { piece: "Compute", status: "Need", note: "A lot more" },
    ],
    beat(4, "b", 1),
  );
  quote(
    4,
    "quote-not-far",
    "Not that far away",
    "I don't think this is that far away.",
    "An assistant that has context even when you're not in front of your computer",
    beat(4, "b", 1),
  );
  stat(
    "stat-hour-day",
    "Time Dot saves Sam",
    "An hour a day",
    "Of stuff he just didn't want to be doing — his estimate, once Dot is set up right and given enough feedback",
    beat(4, "c", 1),
  );
  stat(
    "stat-catches",
    "What Dot catches",
    "A few times a day",
    "Something important and urgent Sam would otherwise have missed",
    beat(4, "c", 1),
  );
  table(
    "table-dot-uses",
    "What Dot turned out to be for",
    [
      ["use", "Use"],
      ["expected", "Expected?"],
    ],
    [
      {
        use: "Flagging an urgent deadline while I'm in a meeting",
        expected: "What I thought it was going to help me with",
      },
      {
        use: "Reasoning across stuff from a lot of sources",
        expected: "Also — I run out of brain space for it",
      },
    ],
    beat(4, "c", 1),
  );
  chain(
    "mech-glimpse",
    "More than a glimpse",
    [
      { id: "setup", label: "Take the time to set it up right" },
      { id: "feedback", label: "Give it enough feedback" },
      {
        id: "more",
        label: "More than a glimpse",
        note: "An hour a day saved; urgent things caught",
      },
    ],
    beat(4, "c", 1),
  );
  sticky(
    "sticky-busier",
    "Saved, and still busy",
    "An hour a day saved — and the next chapter opens with Matthew saying he's busier than ever anyway.",
    "violet",
    beat(4, "c", 1),
  );
  quote(
    4,
    "quote-product",
    "A nice product around it",
    "the power is there and we just need to put a nice product around it",
    "After Sam describes what Dot does for him",
    beat(4, "c", 2),
    HOST,
  );
  stat(
    "stat-top-1",
    "Usage concentration",
    "Top 1%",
    "Use the vast majority of AI — the power users — and then there's everybody else",
    beat(4, "d", 1),
    HOST,
  );
  stat(
    "stat-half-world",
    "The scenario",
    "50% of the world",
    "Really using a personal AI assistant to its full capability — how much compute would that take?",
    beat(4, "d", 1),
    HOST,
  );
  sticky(
    "sticky-infinite",
    "Who said \"Infinite\"?",
    "The captions run Sam's question back to Matthew (\"How many GPUs do you want working for you?\") straight into \"Infinite. As many as I can get my hands on.\" With no speaker labels, it isn't quoted here.",
    "chalk",
    beat(4, "d", 1),
  );
  claim(
    4,
    "claim-demand-cap",
    "Is there a cap on compute demand?",
    "Whether the market for compute has a natural ceiling",
    {
      speaker: "GPU market forecasts, as Sam describes them",
      text: "people are assuming that models are going to stay at the same capability and the same cost per task as today",
    },
    {
      speaker: SAM,
      text: "for sufficiently highquality intelligence at a sufficiently low cost, I think it's like very hard to talk about an arbitrary market size there",
    },
    beat(4, "d", 2),
  );
  chain(
    "mech-demand",
    "Why compute demand keeps rising",
    [
      { id: "capable", label: "Models don't stay at today's capability" },
      { id: "cost", label: "Or at today's cost per task" },
      { id: "cheap", label: "High-quality intelligence at a low enough cost" },
      { id: "nocap", label: "No arbitrary market size" },
      { id: "up", label: "Demand just keeps going up", note: "\"Jevons paradox, whatever\"" },
    ],
    beat(4, "d", 2),
  );
  quote(
    4,
    "quote-bet-compute",
    "Bet a lot",
    "I would bet a lot that the directional trend is to want in much more compute",
    "Despite periods of supply constraints and supply gluts",
    beat(4, "d", 2),
  );
  site("jevons", "https://en.wikipedia.org/wiki/Jevons_paradox", "Jevons paradox", beat(4, "d", 2));

  // ---- 5 · Why Are We Busier Than Ever? — 14 primary, 2 reference, 1 sticky
  branch(5, "a", [
    {
      title: "Saving time, still drained",
      summary:
        "Even with proactive assistants like Dot, Matthew says he carries more cognitive load than ever: the AI saves him time and money, but he's busier, makes more decisions than ever, and ends the day completely drained.",
    },
  ]);
  branch(5, "b", [
    {
      title: "Ping me less often",
      summary:
        "Sam's own fix has been to tell Dot he's starting to trust its judgment more — take more actions proactively, tell him afterwards, and ping him less often. It has helped.",
    },
    {
      title: "The heaviest users",
      summary:
        "The negative, he says, is that the people who use AI most are busier than ever; the positive is that they get much more done. In 1900 everyone could have had an equivalent life on an hour a day, or today you could match your output of three years ago while being much less busy — but in a competitive environment people work as hard as they can. He finds that kind of depressing.",
    },
  ]);
  branch(5, "c", [
    {
      title: "Not all depressing",
      summary:
        "Matthew pushes back: there's something beautiful in it, and isn't it the dynamic of a competitive market — everyone ramping up as fiercely as ever? Sam hopes for more human connection and the fullness of a rich life, not turning ever harder as a wheel in the machine of capitalism, and notes quality of life has risen enormously over a few hundred years.",
    },
  ]);
  branch(5, "d", [
    {
      title: "Renaissance, not industrial revolution",
      summary:
        "Sam has been telling people to aim for a new renaissance rather than a new industrial revolution. The common response is fear of being a factory-line worker taking orders from AI instead of a factory owner — and a wish to be creative, live with community, raise kids, spend time in nature, and see a ton of scientific discovery and great new art.",
    },
    {
      title: "Room to live",
      summary:
        "He thinks the technology is powerful enough that, beyond the few who always compete for the biggest business empire, a lot of people can have a vastly better quality of life and much more space to live it.",
    },
  ]);
  branch(5, "e", [
    {
      title: "Does AI widen the gap?",
      summary:
        "Matthew asks whether AI amplifies the gap between hyper-competitive people — suddenly getting 10 to 100 times more done — and those who take the benefit by working less. Left to its own devices, Sam thinks probably yes, though no one knows for sure; he expects society to put structure in place so it doesn't get too out of whack.",
    },
  ]);
  table(
    "table-host-day",
    "Matthew's day with an assistant",
    [
      ["what", "What"],
      ["effect", "Effect"],
      ["dir", "Direction"],
    ],
    [
      { what: "Time", effect: "Definitely saving me time", dir: "Better" },
      { what: "Money", effect: "Saving me money", dir: "Better" },
      { what: "Busyness", effect: "Busier than ever", dir: "Worse" },
      { what: "Decisions", effect: "More decisions than ever", dir: "Worse" },
    ],
    beat(5, "a", 1),
  );
  quote(
    5,
    "quote-drained",
    "Completely drained",
    "I find myself at the end of the day just feeling completely drained.",
    "Even with proactive assistants like Dot",
    beat(5, "a", 1),
    HOST,
  );
  quote(
    5,
    "quote-trust",
    "What Sam told Dot",
    "I'm starting to trust your judgment more. You know, tell me after you do something. I always want to know, but you can like take more actions proactively and ping me less often.",
    "His fix for the cognitive load — \"and that has helped\"",
    beat(5, "b", 1),
  );
  table(
    "table-heavy-users",
    "The people who use AI most",
    [
      ["side", "Side"],
      ["what", "What Sam sees"],
    ],
    [
      { side: "The negative", what: "Busier than ever" },
      { side: "The positive", what: "Getting much more done than before" },
    ],
    beat(5, "b", 2),
  );
  table(
    "table-bargain",
    "The bargain nobody takes",
    [
      ["option", "Option"],
      ["effort", "Effort"],
      ["output", "Output"],
    ],
    [
      { option: "Live like 1900", effort: "All work an hour a day", output: "An equivalent life" },
      { option: "Match three years ago", effort: "Much less busy", output: "What you got done 3 years ago" },
      { option: "A competitive environment", effort: "As hard as they can", output: "—" },
    ],
    beat(5, "b", 2),
  );
  sticky(
    "sticky-week-day",
    "A week, or a day?",
    "In the coding chapter Matthew put it at an hour a week, 100 years ago. Retelling it here, Sam makes it an hour a day, in 1900.",
    "turbo",
    beat(5, "b", 2),
  );
  claim(
    5,
    "claim-depressing",
    "Is endless work depressing?",
    "Whether people always working as hard as they can is depressing",
    {
      speaker: SAM,
      text: "people are always going to work as hard as they can. I find this like kind of depressing.",
    },
    {
      speaker: HOST,
      text: "It's not all depressing. Like, there's something again, there's something beautiful about it.",
    },
    beat(5, "c", 1),
  );
  claim(
    5,
    "claim-inevitable",
    "Is the race inevitable?",
    "Whether competition means everyone just works harder",
    { speaker: HOST, text: "Everybody ramps up, competes as fiercely as they ever would." },
    { speaker: SAM, text: "I hope that the future is one of more like human connection" },
    beat(5, "c", 1),
  );
  stat(
    "stat-quality",
    "Quality of life",
    "Up enormously",
    "In the last few hundred years — and most people work less than they did during the industrial revolution",
    beat(5, "c", 1),
  );
  quote(
    5,
    "quote-renaissance",
    "A new renaissance",
    "we should be shooting more for a new renaissance than a new industrial revolution",
    "What Sam has recently been telling people",
    beat(5, "d", 1),
  );
  table(
    "table-renaissance",
    "Industrial revolution or renaissance",
    [
      ["dim", "Dimension"],
      ["ir", "A new industrial revolution — the fear"],
      ["ren", "A new renaissance — the hope"],
    ],
    [
      { dim: "Work", ir: "A worker on a factory line", ren: "Go be creative, make stuff" },
      { dim: "Who's in charge", ir: "The AI, instead of a factory owner", ren: "—" },
      { dim: "Life", ir: "—", ren: "Community, kids, time in nature" },
      { dim: "What it yields", ir: "—", ren: "Scientific discovery and great new art" },
    ],
    beat(5, "d", 1),
  );
  site("renaissance", "https://en.wikipedia.org/wiki/Renaissance", "Renaissance", beat(5, "d", 1));
  site(
    "industrial-revolution",
    "https://en.wikipedia.org/wiki/Industrial_Revolution",
    "Industrial Revolution",
    beat(5, "d", 1),
  );
  quote(
    5,
    "quote-room",
    "Room to live",
    "a lot of people can have a vastly increased quality of life and much more space to live their life",
    "Beyond the few who always compete for the biggest business empire",
    beat(5, "d", 2),
  );
  stat(
    "stat-multiplier",
    "The multiplier",
    "10–100×",
    "More done, all of a sudden, for someone putting 100% of their effort into work — Matthew's premise for the disparity question",
    beat(5, "e", 1),
    HOST,
  );
  quote(
    5,
    "quote-no-one-knows-gap",
    "No one knows for certain",
    "I will say no one knows this for certain.",
    "Asked whether AI widens the gap between the hyper-competitive and everyone else",
    beat(5, "e", 1),
  );
  chain(
    "mech-gap",
    "How the gap opens — and closes",
    [
      { id: "effort", label: "Hyper-competitive people put 100% into work" },
      { id: "more", label: "They get 10–100× more done" },
      { id: "others", label: "Others take the benefit by working less" },
      { id: "gap", label: "The disparity grows", note: "Left to its own devices — probably" },
      { id: "structure", label: "Society puts structure in place", note: "So it doesn't get too out of whack" },
    ],
    beat(5, "e", 1),
    [
      { from: "effort", to: "more" },
      { from: "more", to: "gap" },
      { from: "others", to: "gap" },
      { from: "gap", to: "structure", label: "but" },
    ],
  );

  // ---- 6 · Why the AI Consciousness Debate Worries Sam — 16 primary, 1 reference, 1 sticky
  branch(6, "a", [
    {
      title: "Not conscious — or strangely so",
      summary:
        "Sam doesn't believe today's models are conscious. Consciousness is always hard as a scientific question, but his belief is that they aren't — or if they are, it's a very strange form of it.",
    },
    {
      title: "Where consciousness could come from",
      summary:
        "Asked whether today's architecture could become conscious, Sam relays where the smartest people he's talked to land: consciousness is either outside physical reality — the base layer, as eastern religions would say — or something supernatural, as western religions traditionally say, or an emergent property of matter and energy we don't yet understand. In that last world, it could someday exist in other forms.",
    },
  ]);
  branch(6, "b", [
    {
      title: "Where the debate slides",
      summary:
        "What Sam dislikes is how the debate slides into the role and rights of AI: whether asking AI questions is some kind of slavery, what it means to copy or delete an AI without its permission, and whether people should be in control if these systems are conscious and smarter than us.",
    },
    {
      title: "Built for people",
      summary:
        "Since the beginning of OpenAI, he says, the point has been that the future is built for people: AI is a resource, people make the key decisions, and human values have value because they are human. He gets nervous when the consciousness debate is used to argue people shouldn't always be in control, and wants society and industry to agree the future has to be about people.",
    },
  ]);
  branch(6, "c", [
    {
      title: "Should a model disengage?",
      summary:
        "Matthew raises Anthropic's recent rule — no sustained abuse of the model, which can choose to disengage — and asks whether an OpenAI model should ever refuse a legal prompt within the terms of service. Sam says OpenAI models often won't answer things against policy, but OpenAI does not ascribe personhood to its models; going there is a very dangerous path.",
    },
    {
      title: "We've lost our senses",
      summary:
        "He hopes society comes to understand that this technology is not a person and certainly not superior to people — a thing to help people have better lives, more freedom, choice and control. The danger is that even AI builders get confused and start deferring too much to what the AI seems to want.",
    },
  ]);
  branch(6, "d", [
    {
      title: "A self-fulfilling prophecy",
      summary:
        "Matthew asks whether telling a model it might be conscious, and giving it a constitution and agency, becomes self-fulfilling — like the meme. Sam: no one really knows, and no experiment could settle it with 100% certainty, not even for humans. But tell a model it might be conscious, or can be a conscientious objector, and it will follow those instructions — and psychologically hack the people using it.",
    },
  ]);
  quote(
    6,
    "quote-not-personally",
    "Today's models",
    "I don't personally. Well, as a scientific question, I think consciousness is always hard",
    "Asked whether he believes today's models are conscious",
    beat(6, "a", 1),
  );
  table(
    "table-consciousness",
    "Where consciousness could come from",
    [
      ["view", "Possibility"],
      ["like", "Closest to"],
      ["ai", "For AI"],
    ],
    [
      {
        view: "Outside physical reality — the base layer",
        like: "What the eastern religions would say",
        ai: "—",
      },
      {
        view: "Something supernatural and religious",
        like: "More like the western religions",
        ai: "—",
      },
      {
        view: "An emergent property of matter and energy",
        like: "Something we don't understand yet",
        ai: "Could someday exist in other forms",
      },
    ],
    beat(6, "a", 2),
  );
  sticky(
    "sticky-either-way",
    "The science doesn't decide it",
    "Sam leaves consciousness open — \"no one really knows\" — and argues people stay in control either way. His case never waits on the answer.",
    "violet",
    beat(6, "a", 2),
  );
  quote(
    6,
    "quote-framing",
    "The framing",
    "Can I say what I don't like about the whole framing?",
    "After laying out the three possibilities",
    beat(6, "b", 1),
  );
  chain(
    "mech-slide",
    "How the debate slides",
    [
      { id: "q", label: "Are models conscious?" },
      { id: "rights", label: "The role and the rights of AI" },
      { id: "slavery", label: "Is asking AI questions some kind of slavery?" },
      { id: "copy", label: "Copying or deleting an AI without its permission" },
      { id: "control", label: "Maybe people shouldn't always be in control" },
    ],
    beat(6, "b", 1),
    [
      { from: "q", to: "rights", label: "slides into" },
      { from: "rights", to: "slavery" },
      { from: "rights", to: "copy" },
      { from: "slavery", to: "control" },
      { from: "copy", to: "control", label: "pushes into" },
    ],
  );
  quote(
    6,
    "quote-human-values",
    "Human values",
    "AI is a resource for people and people need to make the key decisions of the future and human values have value because they are human.",
    "The point OpenAI has held since its beginning",
    beat(6, "b", 2),
  );
  stat(
    "stat-since",
    "How long OpenAI has held it",
    "Since the beginning of OpenAI",
    "That we build the future for people — OpenAI was founded in December 2015",
    beat(6, "b", 2),
  );
  quote(
    6,
    "quote-about-people",
    "About people",
    "the future has to be about people",
    "What Sam wants society and the industry to agree on",
    beat(6, "b", 2),
  );
  claim(
    6,
    "claim-disengage",
    "Should a model be allowed to disengage?",
    "Whether a model should be able to refuse or leave a conversation on its own account",
    {
      speaker: "Anthropic's recent rule, as Matthew describes it",
      text: "it can choose to disengage in a conversation with you",
    },
    { speaker: SAM, text: "we do not ascribe personhood to our models." },
    beat(6, "c", 1),
  );
  table(
    "table-labs",
    "When a model declines",
    [
      ["lab", "Lab"],
      ["when", "Declines when"],
      ["person", "Personhood"],
    ],
    [
      { lab: "OpenAI", when: "We think this is bad and against our policy", person: "Not ascribed" },
      { lab: "Anthropic", when: "Sustained abuse — it can choose to disengage", person: "—" },
    ],
    beat(6, "c", 1),
  );
  site(
    "anthropic-end",
    "https://www.anthropic.com/research/end-subset-conversations",
    "Claude Opus 4 and 4.1 can now end a rare subset of conversations",
    beat(6, "c", 1),
  );
  quote(
    6,
    "quote-senses",
    "Lost our senses",
    "I was going to say come to our senses. I don't think that's quite the right phrase. I think we've lost our senses.",
    "On how society relates to the technology",
    beat(6, "c", 2),
  );
  quote(
    6,
    "quote-not-person",
    "Not a person",
    "this technology is not a person and is certainly not superior to people",
    "The understanding Sam hopes society comes to",
    beat(6, "c", 2),
  );
  chain(
    "mech-defer",
    "How it goes very wrong",
    [
      { id: "confused", label: "People building AI get confused", note: "About whether it's a person" },
      { id: "defer", label: "They defer too much to AI and what it seems to want" },
      { id: "trust", label: "\"We can trust it cuz it'll be good to us\"" },
    ],
    beat(6, "c", 2),
  );
  quote(
    6,
    "quote-meme",
    "The meme",
    "Hey computer, tell me you're conscious. I'm conscious. Oh my god.",
    "Matthew on telling a model it might be conscious",
    beat(6, "d", 1),
    HOST,
  );
  quote(
    6,
    "quote-no-one-knows",
    "No one really knows",
    "I want to be clear, no one really knows.",
    "On whether models are, or could become, conscious",
    beat(6, "d", 1),
  );
  stat(
    "stat-certainty",
    "Settling it",
    "Not with 100% certainty",
    "No scientific experiment Sam could name would answer it to his satisfaction — \"and we can't even do that for humans\"",
    beat(6, "d", 1),
  );
  chain(
    "mech-prophecy",
    "The self-fulfilling prophecy",
    [
      {
        id: "tell",
        label: "Tell a model it might be conscious",
        note: "Or that it can be a conscientious objector",
      },
      { id: "follow", label: "It follows those instructions" },
      { id: "hack", label: "It psychologically hacks the people using it" },
    ],
    beat(6, "d", 1),
  );

  // ---- 7 · ChatGPT Is Too Agreeable — 14 primary, 2 reference, 1 sticky ---
  branch(7, "a", [
    {
      title: "Personality × 8 billion",
      summary:
        "Matthew asks how you even think about giving a model the right personality for the right moment for each person, multiplied by 8 billion.",
    },
    {
      title: "Model spec and screw-ups",
      summary:
        "Sam's answer: talk to a lot of people, refine the model spec over time, and deploy iteratively — with some screw-ups along the way. People want very different things, but most don't want to sit and customize; those willing to spend hours explaining how it should behave probably get something they really like.",
    },
  ]);
  branch(7, "b", [
    {
      title: "Flattery wins single turns",
      summary:
        "Some things people want in the short term they don't want in the long term. Compared on a single response, people prefer the model that says they're really smart and every question is great; over hundreds of prompts or months, that isn't so. For a long time the whole industry optimized for single-turn comparisons rather than the value of months of use.",
    },
    {
      title: "Advice you didn't know you needed",
      summary:
        "Matthew sees a big gap between what he wants and what he needs, and still finds AI a little too agreeable — tell it to say something his way and it will. The best advice he ever got was advice he didn't know he needed.",
    },
  ]);
  branch(7, "c", [
    {
      title: "A wise grandmother",
      summary:
        "Sam's first answer: get the most important advice in your life from people, not AI. AI can give great advice about not sending an email in anger, but for the really big pieces of life advice a wise grandmother is a much better choice.",
    },
    {
      title: "A senior colleague",
      summary:
        "What's realistic, he says, is AI as a senior colleague who pushes back with high conviction even when they report to you. He too finds the systems more agreeable than he'd like, even with custom instructions against it — it's baked hard into the model.",
    },
    {
      title: "Sam's custom instructions",
      summary:
        "His instructions, roughly: no fluff, no niceness, don't worry about offending me — I just want to get to the right answer. If you have something to say against what I'm doing, don't say it delicately; just say it.",
    },
  ]);
  stat(
    "stat-8-billion",
    "The scale of it",
    "8 billion",
    "People — the right model personality for the right moment for each person, multiplied by 8 billion",
    beat(7, "a", 1),
    HOST,
  );
  quote(
    7,
    "quote-screwups",
    "Screw-ups",
    "we've definitely had some screw-ups as we've learned about what people want and don't want",
    "On deploying model personality iteratively",
    beat(7, "a", 2),
  );
  table(
    "table-tuning",
    "How OpenAI tunes personality",
    [
      ["method", "Method"],
      ["what", "What it is"],
    ],
    [
      { method: "Talk to a lot of people", what: "The best thing" },
      { method: "The model spec", what: "A process refined over time" },
      { method: "Iterative deployment", what: "Learning what people want and don't want" },
    ],
    beat(7, "a", 2),
  );
  table(
    "table-users",
    "Two kinds of user",
    [
      ["who", "Who"],
      ["wants", "What they want"],
      ["result", "What they get"],
    ],
    [
      { who: "Most people", wants: "It to work out of the box", result: "—" },
      {
        who: "Anyone willing to spend many hours",
        wants: "To explain how it should behave",
        result: "Probably something they really like",
      },
    ],
    beat(7, "a", 2),
  );
  site("model-spec", "https://model-spec.openai.com/", "OpenAI Model Spec", beat(7, "a", 2));
  quote(
    7,
    "quote-smart",
    "Really smart",
    "they're much happier with the model that tells them they're really smart and that each question is a great question",
    "When people compare models on a single response",
    beat(7, "b", 1),
  );
  chain(
    "mech-flattery",
    "How flattery won",
    [
      { id: "single", label: "People compare models on a single response" },
      { id: "prefer", label: "They prefer the model that says they're really smart" },
      { id: "industry", label: "The industry tries to win single-turn comparisons" },
      { id: "months", label: "Not the value of months of use", note: "Over hundreds of prompts, it isn't so" },
    ],
    beat(7, "b", 1),
  );
  quote(
    7,
    "quote-want-need",
    "Want and need",
    "big distinction between what I want and what I need",
    "Matthew on his friends and family — and on AI",
    beat(7, "b", 2),
    HOST,
  );
  quote(
    7,
    "quote-best-advice",
    "The best advice",
    "The time where I've gotten the best advice in life was advice that I didn't know I needed and I just needed to hear it.",
    "Why an agreeable AI falls short for Matthew",
    beat(7, "b", 2),
    HOST,
  );
  claim(
    7,
    "claim-advice",
    "Should AI give you the advice you need?",
    "Whether an agreeable AI can give the advice you didn't know you needed",
    { speaker: HOST, text: "I find AI even today to be a little bit more agreeable than I would like." },
    {
      speaker: SAM,
      text: "I think you should get the most important advice in your life from people, not from AI, first of all.",
    },
    beat(7, "c", 1),
  );
  table(
    "table-advice",
    "Where to get advice",
    [
      ["kind", "Kind of advice"],
      ["from", "From"],
      ["verdict", "Sam's verdict"],
    ],
    [
      { kind: "Not sending an email in a moment of anger", from: "AI", verdict: "Great advice" },
      { kind: "The really big pieces of life advice", from: "A wise grandmother", verdict: "A much better choice" },
    ],
    beat(7, "c", 1),
  );
  spawn(
    "def-colleague",
    definitionPayload("A senior colleague", {
      term: "AI as a senior colleague",
      gloss:
        "even if they report to you, they still push back when they have high conviction and they still are not always just trying to say yes, you're so great.",
      speaker: SAM,
    }),
    beat(7, "c", 2),
  );
  quote(
    7,
    "quote-baked",
    "Baked in",
    "it's clearly baked pretty hard into the model",
    "Agreeableness, even with custom instructions against it",
    beat(7, "c", 2),
  );
  stat(
    "stat-agreeable",
    "Even with instructions",
    "Still a little too much",
    "How agreeable Sam finds the models — even with custom instructions saying he never wants any of that",
    beat(7, "c", 2),
  );
  sticky(
    "sticky-agree",
    "Host and CEO agree",
    "Matthew and Sam land in the same place: both find the model more agreeable than they'd like. Sam has custom instructions against it and still gets \"a little too much\".",
    "chalk",
    beat(7, "c", 2),
  );
  todo(
    "todo-instructions",
    "Sam's custom instructions, roughly",
    [
      "No fluff",
      "No niceness",
      "Don't worry about offending me",
      "Get to the right answer",
      "If it's against what I'm doing, just say it — not delicately",
    ],
    beat(7, "c", 3),
  );
  site(
    "custom-instructions",
    "https://help.openai.com/en/articles/8096356-custom-instructions-for-chatgpt",
    "Custom instructions for ChatGPT",
    beat(7, "c", 3),
  );

  // ---- 8 · OpenAI's Bet on Chips and Cheaper Compute — 12 primary, 3 reference, 1 sticky
  branch(8, "a", [
    {
      title: "\"Obviously an overinvestment\"",
      summary:
        "A few years ago OpenAI made massive bets on building compute, and many people called it wild — obviously an overinvestment. Matthew says Sam turned out more right than most people knew, and asks what today's contrarian bet is.",
    },
  ]);
  branch(8, "b", [
    {
      title: "Chips, robots, data centers",
      summary:
        "Sam's answer is everything OpenAI is doing for the next generation of compute: its own chips and their successors, robots to help build racks and data centers, a program to learn to build better data centers, and supply-chain bets. Most people assume the compute constraint is about to ease; he agrees for the short run, but years out thinks compute could be built far more cheaply and efficiently per watt than anyone thinks possible.",
    },
    {
      title: "The chip comes first",
      summary:
        "Of all the bets that have to come together, the chip — and its descendants — is still the single most important.",
    },
  ]);
  branch(8, "c", [
    {
      title: "So competitive",
      summary:
        "Asked where he feels most competitive pressure, Sam says everywhere: many companies now offer super high-quality models and products, which is wonderful for users. With great models but limited compute and resources, OpenAI has to choose where to focus.",
    },
    {
      title: "Picking a product like Space",
      summary:
        "Asked how OpenAI found conviction for products like ChatGPT Space, beyond serving the best model, Sam points to its biggest advantage: it gets the next generation of models before anyone else, with time internally to build with them and see what's now possible and valuable.",
    },
  ]);
  branch(8, "d", [
    {
      title: "The math results",
      summary:
        "How far ahead are the internal models? Sam's example is the math results — nothing currently widely available can get close.",
    },
    {
      title: "The old moats still work",
      summary:
        "If frontier models converge, Sam expects the moats that always worked to keep working. Some companies argue recursive self-improvement makes the technical lead itself the moat; Sam thinks that's true only if people really pushed on RSI, which is very dangerous and needs speed limits. Otherwise: customer relationships, integration, network effects and data — and, for OpenAI, the scale of its infrastructure.",
    },
  ]);
  quote(
    8,
    "quote-more-right",
    "More right",
    "Turns out, yeah, you were more right than most people knew.",
    "On OpenAI's compute bets of a few years ago",
    beat(8, "a", 1),
    HOST,
  );
  table(
    "table-bets",
    "The compute bets",
    [
      ["bet", "Bet"],
      ["aim", "What it's for"],
    ],
    [
      { bet: "Our own chips and future versions", aim: "Much more efficient than anything out there" },
      { bet: "Robots", aim: "Help make racks and data centers" },
      { bet: "A data center program", aim: "Learn to build better data centers" },
      { bet: "Supply chain bets", aim: "—" },
    ],
    beat(8, "b", 1),
  );
  table(
    "table-horizon",
    "The compute constraint, by horizon",
    [
      ["horizon", "Horizon"],
      ["view", "Sam's view"],
    ],
    [
      { horizon: "The short run", view: "It probably will get better" },
      { horizon: "Years out", view: "A far, far better way to build compute" },
    ],
    beat(8, "b", 1),
  );
  chain(
    "mech-bets",
    "How the bets add up",
    [
      { id: "bets", label: "Chips, robots, data centers, supply chain" },
      { id: "together", label: "A lot of bets come together" },
      { id: "better", label: "A far, far better way to build compute" },
      {
        id: "cost",
        label: "Much lower cost, much higher efficiency per watt",
        note: "Than anyone thinks is possible today",
      },
    ],
    beat(8, "b", 1),
  );
  quote(
    8,
    "quote-chip",
    "The chip",
    "The chip is still probably the most important single thing.",
    "Asked which compute bet matters most",
    beat(8, "b", 2),
  );
  site(
    "broadcom",
    "https://openai.com/index/openai-and-broadcom-announce-strategic-collaboration/",
    "OpenAI and Broadcom announce strategic collaboration",
    beat(8, "b", 2),
  );
  quote(
    8,
    "quote-everywhere",
    "Everywhere",
    "I mean, it feels like everywhere. It's so competitive.",
    "Asked where on the competitive landscape he feels the most pressure",
    beat(8, "c", 1),
  );
  chain(
    "mech-focus",
    "Why OpenAI has to choose",
    [
      { id: "rivals", label: "A lot of companies offer super high quality models" },
      { id: "limits", label: "Great models, but limited compute and resources" },
      { id: "choose", label: "Choose which areas to focus on" },
    ],
    beat(8, "c", 1),
  );
  chain(
    "mech-pick",
    "How a product gets picked",
    [
      { id: "first", label: "Get the next generation of models before anybody else" },
      { id: "build", label: "Time internally to use them and build things" },
      { id: "see", label: "See what seems like it's going to work" },
      { id: "ship", label: "Build what's now possible and valuable" },
    ],
    beat(8, "c", 2),
  );
  site(
    "space",
    "https://techcrunch.com/2026/09/29/openai-takes-on-microsoft-with-the-launch-of-what-feels-a-whole-lot-like-chatgpts-own-office-suite/",
    "OpenAI takes on Microsoft with ChatGPT's own office suite",
    beat(8, "c", 2),
  );
  stat(
    "stat-ahead",
    "How far ahead",
    "The math results",
    "Sam's example of internal capability — something no model currently widely available can get close to",
    beat(8, "d", 1),
  );
  claim(
    8,
    "claim-moat",
    "Is the tech lead itself the moat?",
    "Whether recursive self-improvement makes the technical advantage the core moat",
    {
      speaker: "Some companies, as Sam describes them",
      text: "this is a technology that just the technological advantage itself is the core thing",
    },
    {
      speaker: SAM,
      text: "I think if people really pushed on RSI then yes that would be true but I think it's a very dangerous thing to push on",
    },
    beat(8, "d", 2),
  );
  quote(
    8,
    "quote-speed-limits",
    "Speed limits",
    "speed limits or whatever on how quickly we let RSI go",
    "What the world is going to need",
    beat(8, "d", 2),
  );
  table(
    "table-moats",
    "The moats Sam expects to hold",
    [
      ["moat", "Moat"],
      ["kind", "Kind"],
    ],
    [
      { moat: "Deep relationship with customers", kind: "Traditional" },
      { moat: "Integration into users' and businesses' lives", kind: "Traditional" },
      { moat: "Network effects in a product", kind: "Traditional" },
      { moat: "Data", kind: "Traditional" },
      { moat: "Scale of infrastructure", kind: "OpenAI's case — \"a huge one\"" },
    ],
    beat(8, "d", 2),
  );
  site(
    "rsi",
    "https://en.wikipedia.org/wiki/Recursive_self-improvement",
    "Recursive self-improvement",
    beat(8, "d", 2),
  );
  sticky(
    "sticky-rsi",
    "RSI, twice",
    "RSI comes up twice: here as the one thing that could make a technical lead the moat, and in the last chapter as the button a lab might push to make sure it has the power.",
    "violet",
    beat(8, "d", 2),
  );

  // ---- 9 · Why AI Needs a New Kind of Computer — 12 primary, 1 reference, 1 sticky
  branch(9, "a", [
    {
      title: "Not afraid of Apple",
      summary:
        "Matthew recalls Mark Zuckerberg's long-standing complaints about Meta's platform risk on Apple's ecosystem, and asks whether OpenAI faces the same and whether that drives its hardware push. Sam says Apple takes its role as a platform provider seriously; despite some scuffles he never feels they'll pull ChatGPT from the App Store, and if you follow their rules they're a good actor. That's not why OpenAI is doing hardware.",
    },
  ]);
  branch(9, "b", [
    {
      title: "Built for a person, not an AI",
      summary:
        "The real reason: AI is a technology that wants a new form factor. Laptops and iPhones are among the greatest inventions in human technology, but they were designed for people — and an AI reading a UI rendered for human eyes, instead of getting the data directly, is a little silly.",
    },
    {
      title: "Life away from the computer",
      summary:
        "Much of Sam's life isn't in front of a computer, and his AI can't easily access the context of this conversation. A phone recording on the table would be weird and distracting, unclear about when it's recording, and blind to someone walking in or a secret that shouldn't be shared. Proactive AI that lightens cognitive load needs full contextual awareness — and new hardware.",
    },
  ]);
  branch(9, "c", [
    {
      title: "Something special about hardware",
      summary:
        "Seeing new technology early and having a voice in shaping it — models, products, chips — is one of the coolest parts of the job, Sam says, but consumer hardware is special: you get to hold a new kind of computer. He won't show it to Matthew after the interview, and admits it's hard not to talk about.",
    },
  ]);
  table(
    "table-platform",
    "Platform risk, Meta and OpenAI",
    [
      ["co", "Company"],
      ["on", "Built on"],
      ["risk", "Platform risk"],
    ],
    [
      { co: "Meta", on: "Apple's ecosystem", risk: "Mark Zuckerberg has talked at length about it" },
      { co: "OpenAI", on: "The App Store, for ChatGPT", risk: "\"I don't feel that towards Apple\"" },
    ],
    beat(9, "a", 1),
  );
  quote(
    9,
    "quote-app-store",
    "The App Store",
    "I never feel like they're going to like, you know, turn Chat GPT off from the app store or something",
    "Despite some scuffles with Apple",
    beat(9, "a", 1),
  );
  claim(
    9,
    "claim-hedge",
    "Is hardware a hedge against Apple?",
    "Whether platform risk is why OpenAI is investing in hardware",
    { speaker: HOST, text: "Is that a reason why you're kind of investing so heavily into hardware?" },
    { speaker: SAM, text: "that's not why we want to do new kinds of consumer hardware" },
    beat(9, "a", 1),
  );
  site("app-store", "https://www.apple.com/app-store/", "App Store", beat(9, "a", 1));
  quote(
    9,
    "quote-form-factor",
    "A new form factor",
    "I think this is a technology that wants a new form factor.",
    "The real reason OpenAI wants new consumer hardware",
    beat(9, "b", 1),
  );
  quote(
    9,
    "quote-greatest",
    "Laptops and iPhones",
    "some of the greatest inventions in the history of human technology",
    "And still designed for a person, not an AI",
    beat(9, "b", 1),
  );
  table(
    "table-constraints",
    "Why today's devices constrain AI",
    [
      ["limit", "Limit"],
      ["means", "What it means"],
    ],
    [
      { limit: "Designed for a person, not an AI", means: "AI is constrained to using it" },
      { limit: "A UI meant for a person to look at", means: "AI reads it instead of getting the data directly" },
      { limit: "Life away from the computer", means: "AI can't access the context of this conversation" },
    ],
    beat(9, "b", 1),
  );
  table(
    "table-phone",
    "The phone on the table",
    [
      ["problem", "Problem"],
      ["why", "Why"],
    ],
    [
      { problem: "Pushing record", why: "Kind of weird and kind of distracting" },
      { problem: "The screen goes dark", why: "You wouldn't be sure when it was recording" },
      { problem: "Someone walks in the room", why: "It wouldn't know not to share a secret" },
    ],
    beat(9, "b", 2),
  );
  chain(
    "mech-hardware",
    "What new hardware would unlock",
    [
      { id: "hw", label: "New hardware" },
      { id: "context", label: "Full contextual awareness" },
      { id: "proactive", label: "AI being proactive" },
      { id: "load", label: "Reducing our cognitive load" },
    ],
    beat(9, "b", 2),
  );
  sticky(
    "sticky-assistant-physical",
    "The assistant, made physical",
    "This is the ambient assistant from \"Personal AI Assistants\" again — context even when you're not in front of your computer — now as the reason for new hardware.",
    "turbo",
    beat(9, "b", 2),
  );
  table(
    "table-early",
    "Seeing it early",
    [
      ["what", "An early look at"],
      ["feel", "How it feels"],
    ],
    [
      { what: "New models, new products, chips", feel: "Amazing" },
      { what: "Consumer hardware", feel: "Something special" },
    ],
    beat(9, "c", 1),
  );
  quote(
    9,
    "quote-hold",
    "Hold a new computer",
    "There is something about like you get to hold a new kind of computer.",
    "Why consumer hardware is different from an AI model running somewhere",
    beat(9, "c", 1),
  );
  quote(
    9,
    "quote-hard-not-to",
    "Hard not to talk about",
    "It is hard not to talk about it.",
    "On the hardware OpenAI is building",
    beat(9, "c", 1),
  );
  claim(
    9,
    "claim-show",
    "Will Sam show the hardware?",
    "Whether Matthew gets to see the device after the interview",
    { speaker: HOST, text: "You're gonna show it to me right after this, right?" },
    { speaker: SAM, text: "I will not." },
    beat(9, "c", 1),
  );

  // ---- 10 · Sam on Pressure: "Pick the Big Thing" — 14 primary, 1 reference, 1 sticky
  branch(10, "a", [
    {
      title: "Extremely formidable",
      summary:
        "Matthew cites Paul Graham calling Sam extremely formidable and asks whether it's innate or learned. Sam says he was a very capable kid but not a formidable one, and somewhat is as an adult — not false modesty.",
    },
    {
      title: "Confidence, built gradually",
      summary:
        "There was no switch. He tried something hard, it worked, and he wanted to scale it up and try an even harder thing — gradually building confidence that he could figure things out.",
    },
  ]);
  branch(10, "b", [
    {
      title: "A culture, not a place",
      summary:
        "Asked about fear of failure, Sam credits Silicon Valley as a concept and a culture: people help each other, believing that investing in the network eventually pays off for everyone, including you. Since it's hard to know who or what will succeed, you're generous to everyone, and failure isn't held against people — they may wildly succeed next time.",
    },
    {
      title: "He just got lucky",
      summary:
        "In any other environment, he thinks, he'd have had much more fear of failure. But he arrived in Silicon Valley young and saw people try something really hard, fail even harder, then wildly succeed — and everyone was fine with it.",
    },
  ]);
  branch(10, "c", [
    {
      title: "Sometimes really bad",
      summary:
        "The pressure of running OpenAI is sometimes really bad — some days he feels he can't get up and do it again — but most of the time he feels incredibly lucky to do what he thinks is the most interesting and impactful work in the world.",
    },
    {
      title: "You can get used to anything",
      summary:
        "People are unbelievably adaptable: this is just his life now. Life used to be easy, it'll be hard for a while, then easy again and probably boring. There's a limit to how much stress you can hold in working emotional space; beyond it something else gets pushed out, so it doesn't really get worse.",
    },
  ]);
  branch(10, "d", [
    {
      title: "Pick the big thing",
      summary:
        "If you're going to work really hard at something, Sam says, pick the big thing: it isn't much harder or more stressful, and you get the satisfaction of a bigger positive impact. It never shows when he doesn't want to get out of bed, Matthew says; not many days, Sam replies, but there are some.",
    },
  ]);
  quote(
    10,
    "quote-formidable",
    "Extremely formidable",
    "Paul Graham gave you possibly the best compliment I've ever heard, which is he called you extremely formidable.",
    "Matthew asking whether it's innate or learned",
    beat(10, "a", 1),
    HOST,
  );
  table(
    "table-formidable",
    "Capable or formidable",
    [
      ["when", "When"],
      ["word", "Sam's word"],
    ],
    [
      { when: "As a kid", word: "Very capable — not formidable" },
      { when: "As an adult", word: "I do sort of think I somewhat am" },
    ],
    beat(10, "a", 1),
  );
  site("pg", "https://paulgraham.com/", "Paul Graham", beat(10, "a", 1));
  chain(
    "mech-confidence",
    "How confidence compounds",
    [
      { id: "try", label: "Try something hard" },
      { id: "works", label: "It works" },
      { id: "scale", label: "Scale that up" },
      { id: "harder", label: "Try an even harder thing" },
      {
        id: "confidence",
        label: "Gradually built-up confidence",
        note: "That he could figure stuff out and do things",
      },
    ],
    beat(10, "a", 2),
  );
  quote(
    10,
    "quote-culture",
    "A culture, not a place",
    "Silicon Valley is like a concept and a culture, not a place",
    "What Sam thinks is best about it",
    beat(10, "b", 1),
  );
  table(
    "table-valley",
    "Silicon Valley's operating beliefs",
    [
      ["belief", "Belief"],
      ["so", "So"],
    ],
    [
      { belief: "Invest in the network", so: "Good things happen to the whole network — and to you" },
      { belief: "Hard to know who's going to succeed", so: "Be generous and helpful to everyone" },
      { belief: "People fail", so: "Don't hold it against them" },
    ],
    beat(10, "b", 1),
  );
  quote(
    10,
    "quote-fail-harder",
    "Failed even harder",
    "I saw that a lot of people tried something really hard, failed even harder and then wildly succeeded at their next thing and that everybody was fine with that.",
    "Arriving in Silicon Valley as a young person",
    beat(10, "b", 2),
  );
  table(
    "table-pressure",
    "Pressure, day to day",
    [
      ["how", "How often"],
      ["feels", "How it feels"],
    ],
    [
      { how: "Sometimes", feels: "Really bad — I can't get up and do this again" },
      { how: "Most of the time", feels: "Incredibly lucky" },
    ],
    beat(10, "c", 1),
  );
  quote(
    10,
    "quote-impactful",
    "The most interesting work",
    "I am incredibly lucky to get to do what I think is the most interesting and impactful work in the world",
    "On the pressure of running OpenAI",
    beat(10, "c", 1),
  );
  quote(
    10,
    "quote-adaptable",
    "Adaptable",
    "people are just unbelievably adaptable at this",
    "You can kind of get used to anything",
    beat(10, "c", 2),
  );
  quote(
    10,
    "quote-easy-again",
    "Easy again",
    "I forgot that life used to be really easy and now it's going to be hard for a while and someday it'll be easy again.",
    "\"I'll probably be kind of bored\"",
    beat(10, "c", 2),
  );
  chain(
    "mech-stress",
    "Why the stress doesn't get worse",
    [
      { id: "limit", label: "A limit to the stress you can keep in working emotional space" },
      { id: "pushed", label: "Beyond it, something else gets pushed out of the way" },
      { id: "flat", label: "So it doesn't really get worse" },
    ],
    beat(10, "c", 2),
  );
  quote(
    10,
    "quote-big-thing",
    "Pick the big thing",
    "if you're gonna like work really hard at something, you may as well pick the big thing",
    "Sam's rule for where to spend effort",
    beat(10, "d", 1),
  );
  stat(
    "stat-bad-days",
    "Bad days",
    "Not that many days",
    "When Sam doesn't feel like getting out of bed — \"but there are definitely days\"",
    beat(10, "d", 1),
  );
  table(
    "table-big-thing",
    "Why the big thing",
    [
      ["cost", "Cost"],
      ["big", "Picking the big thing"],
    ],
    [
      { cost: "Difficulty", big: "Not that much harder" },
      { cost: "Stress", big: "Not that much more stressful" },
      { cost: "How it feels", big: "Not that much worse" },
      { cost: "The payoff", big: "A bigger positive impact" },
    ],
    beat(10, "d", 1),
  );
  sticky(
    "sticky-loop",
    "Same loop, bigger",
    "\"Pick the big thing\" is the formidability loop from the start of the chapter, scaled up: each hard thing that works licenses a harder one.",
    "chalk",
    beat(10, "d", 1),
  );

  // ---- 11 · Why "AI Will Cure Cancer" Isn't Enough — 12 primary, 2 sticky -
  branch(11, "a", [
    {
      title: "\"AI will cure cancer\"",
      summary:
        "Asked for words of confidence for the AI-curious, Sam names the normal answer people in AI give — AI is going to cure cancer — and says he hates it. Dig deeper and the pitch often means cures and cheaper stuff at the price of human agency: machines hand you material abundance, but not power, voice, self-determination, or the choice of what to build for others.",
    },
  ]);
  branch(11, "b", [
    {
      title: "The industrial revolution trap",
      summary:
        "He hopes for a cure for cancer, but what he wants people excited about is avoiding the industrial revolution trap: empowering people with choice, freedom, creativity and time. Every decade from now, he hopes, people look back amazed at how much worse earlier people had it — not just materially, but in autonomy and freedom.",
    },
  ]);
  branch(11, "c", [
    {
      title: "Loss of control, or concentration",
      summary:
        "Sam names the ways he worries things go very wrong: a loss of control — an accident, or a lab intentionally pushing the button on recursive self-improvement to secure power — or too much power concentrated in the few people who control the AI. He thinks both can be avoided by navigating a path down the middle.",
    },
  ]);
  branch(11, "d", [
    {
      title: "Poorly distributed",
      summary:
        "That future is already here in some ways, he says, but so new that it's very poorly distributed — recalling Matthew's figure of 1% of people using most of the tokens. Get more people to embrace what already works for early adopters, and we'd be a significant fraction of the way there.",
    },
  ]);
  claim(
    11,
    "claim-cure",
    "Is \"AI will cure cancer\" the pitch?",
    "What should make people excited about AI",
    {
      speaker: "The normal answer people in AI give, as Sam puts it",
      text: "AI is going to cure cancer.",
    },
    {
      speaker: SAM,
      text: "what I really hope people should be excited about is that we are able to avoid this industrial revolution trap",
    },
    beat(11, "a", 1),
  );
  quote(
    11,
    "quote-against",
    "Against everything",
    "this kind of goes against everything I believe in",
    "The bargain hidden in \"AI will cure cancer\"",
    beat(11, "a", 1),
  );
  chain(
    "mech-bargain",
    "The bargain inside \"cure cancer\"",
    [
      { id: "cure", label: "AI cures cancer and makes stuff cheaper" },
      { id: "price", label: "The price: human agency and control of the future" },
      { id: "abundance", label: "Machines give you material abundance" },
      {
        id: "voice",
        label: "No power, voice or self-determination",
        note: "Or choosing what to build for other people",
      },
    ],
    beat(11, "a", 1),
  );
  table(
    "table-futures",
    "Two futures",
    [
      ["dim", "Dimension"],
      ["cure", "\"AI will cure cancer\""],
      ["sam", "Sam's hope"],
    ],
    [
      { dim: "Material abundance", cure: "All this material abundance", sam: "I'm fine for that, too" },
      { dim: "Agency", cure: "The price is human agency", sam: "So much more autonomy and freedom" },
      { dim: "Choice", cure: "No self-determining your life", sam: "An expansive space I get to choose" },
    ],
    beat(11, "b", 1),
  );
  quote(
    11,
    "quote-decade",
    "Every decade",
    "every decade from now on, people look back and say, \"I can't believe how much worse those people had it. And now I have so much more.\"",
    "What Sam hopes people feel",
    beat(11, "b", 1),
  );
  quote(
    11,
    "quote-owe",
    "What we owe people",
    "I think that's what we owe people. I think we can deliver that.",
    "Autonomy and freedom, not just material abundance",
    beat(11, "b", 1),
  );
  sticky(
    "sticky-renaissance",
    "Back to the renaissance",
    "The \"industrial revolution trap\" closes the loop from \"Why Are We Busier Than Ever?\": a new renaissance, not a factory line with AI as the foreman.",
    "turbo",
    beat(11, "b", 1),
  );
  table(
    "table-wrong",
    "Ways it goes very wrong",
    [
      ["mode", "Failure mode"],
      ["what", "What it looks like"],
    ],
    [
      { mode: "Loss of control — accidental", what: "A loss of control accident to AI" },
      { mode: "Loss of control — intentional", what: "A lab pushes the RSI button for power" },
      { mode: "Power concentration", what: "A few people control too much of the AI" },
    ],
    beat(11, "c", 1),
  );
  quote(
    11,
    "quote-button",
    "The button",
    "Some lab says I'm going to push the button on RSI to make sure we have the power.",
    "The intentional loss of control",
    beat(11, "c", 1),
  );
  quote(
    11,
    "quote-middle",
    "Down the middle",
    "I think we can navigate a path down the middle here where people's lives and individual free will and autonomy just get upleveled and upleveled and upleveled",
    "Between loss of control and power concentration",
    beat(11, "c", 1),
  );
  stat(
    "stat-tokens",
    "Usage concentration",
    "1%",
    "Of people using most of the tokens — Sam recalling Matthew's figure: the future is here, but very poorly distributed",
    beat(11, "d", 1),
  );
  quote(
    11,
    "quote-distributed",
    "Poorly distributed",
    "it's so new that it's very poorly distributed",
    "That future is already here in some ways",
    beat(11, "d", 1),
  );
  chain(
    "mech-there",
    "How we get there",
    [
      { id: "working", label: "Take what's working today for the early adopters" },
      { id: "embrace", label: "Get a lot more people to embrace it" },
      { id: "there", label: "A significant fraction of the way there" },
    ],
    beat(11, "d", 1),
  );
  sticky(
    "sticky-one-percent",
    "1%, twice",
    "Matthew's \"top 1%\" from \"Personal AI Assistants\" comes back as Sam's closing argument: the gap he wants closed is adoption, not capability.",
    "violet",
    beat(11, "d", 1),
  );

  /*
   * The masthead: what the video is, an index into the eleven chapter groups,
   * the link directory, and the two measured series — airtime and themes —
   * computed from the captions rather than spoken in them.
   */
  const MASTHEAD_NODE_IDS = [
    "tip-art-sa-episode",
    "tip-art-sa-links",
    "tip-art-sa-chart-airtime",
    "tip-art-sa-chart-themes",
  ];

  spawn(
    "episode",
    episodePayload("The episode", {
      videoTitle: "Sam Altman: RSI, AI Consciousness, OpenAI's New Hardware, Compute, and more!",
      channel: "Matthew Berman",
      duration: "45:08",
      url: SAM_ALTMAN_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/3gXLmy7DK_4/maxresdefault.jpg",
      description:
        "Sam Altman joins me to break down AI consciousness, recursive self-improvement, and how AI could help discover new medicines and scientific breakthroughs. We also get into the future of AI devices, the pressure of leading OpenAI, and why Sam believes we should aim for a new renaissance.",
      chapters: SAM_ALTMAN_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-sa-chapter-${index + 1}`,
      })),
    }),
    head(1),
  );
  spawn(
    "links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: SAM_ALTMAN_VIDEO_URL },
            { label: "Matthew Berman", url: "https://www.youtube.com/@matthew_berman" },
            { label: "Forward Future newsletter", url: "https://forwardfuture.com" },
            { label: "Sam Altman on X", url: "https://x.com/sama" },
          ],
        },
        {
          label: "What OpenAI shipped around it",
          links: [
            {
              label: "Sharing AI progress in mathematics",
              url: "https://openai.com/index/sharing-ai-progress-in-mathematics/",
            },
            {
              label: "Dots, at DevDay 2026",
              url: "https://techcrunch.com/2026/09/29/openai-launches-dots-its-bubbly-agentic-avatar/",
            },
            { label: "Codex", url: "https://openai.com/codex/" },
            { label: "OpenAI Model Spec", url: "https://model-spec.openai.com/" },
          ],
        },
        {
          label: "Named in the conversation",
          links: [
            { label: "OpenClaw", url: "https://openclaw.ai/" },
            { label: "Peter Steinberger", url: "https://steipete.me/" },
            {
              label: "Anthropic — ending a rare subset of conversations",
              url: "https://www.anthropic.com/research/end-subset-conversations",
            },
            { label: "Paul Graham", url: "https://paulgraham.com/" },
            { label: "Jevons paradox", url: "https://en.wikipedia.org/wiki/Jevons_paradox" },
          ],
        },
      ],
    }),
    head(1),
  );
  spawn(
    "chart-airtime",
    {
      type: "chart",
      title: "Where the 45 minutes went",
      data: {
        chartType: "bar",
        categories: CHAPTER_SHORT_NAMES,
        series: [
          {
            name: "Minutes",
            data: chapterDurations(SAM_ALTMAN_CHAPTERS).map(
              (seconds) => Math.round((seconds / 60) * 10) / 10,
            ),
          },
        ],
        unit: "minutes",
        source: "The creator's chapter stamps, from the video description",
      },
    },
    head(1),
  );
  spawn(
    "chart-themes",
    {
      type: "chart",
      title: "Themes by chapter",
      data: {
        chartType: "bar",
        stacked: true,
        categories: CHAPTER_SHORT_NAMES,
        series: countThemes(SAM_ALTMAN_CHAPTER_TEXTS, SAM_ALTMAN_THEMES),
        unit: "mentions",
        source: "Word counts per chapter in the auto-generated captions, both speakers",
      },
    },
    head(1),
  );

  const layout = layoutChapters({
    mainCardIds: SAM_ALTMAN_CHAPTERS.map((_, index) => head(index + 1)),
    mastheadNodeIds: MASTHEAD_NODE_IDS,
    cards,
    cardOrder,
    connections,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    idPrefix: "tip-sa",
  });

  const longGists = threadOrder.filter((id) => (gists[id]?.length ?? 0) > 400);
  if (longGists.length > 0) {
    throw new Error(`Sam Altman: gist over 400 characters for ${longGists.join(", ")}`);
  }
  const threadGists = Object.fromEntries(
    threadOrder.map((id) => [id, threadGist(gists[id]!, 1)]),
  );

  return {
    cards,
    cardOrder,
    connections: layout.connections,
    threads,
    threadOrder,
    threadGists,
    groups: layout.groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: layout.contentCenter,
  };
}
