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
  PRASHANT_KISHOR_CHANNEL_URL,
  PRASHANT_KISHOR_CHAPTERS,
  PRASHANT_KISHOR_VIDEO_URL,
} from "@/lib/transcriptImport/prashantKishorInterview";

/*
 * Prashant Kishor on Unfiltered by Samdish, a day inside Jan Suraaj's Padyatra
 * in Begusarai, Bihar — roughly 68 minutes.
 *
 * The source carries about fifty of its own fine-grained "Chapter N: to ..."
 * navigation points — far too many to spine a canvas on directly, so this
 * builder groups them into nine thematic chapters. Each chapter's title and
 * start time is still the source's own (see PRASHANT_KISHOR_CHAPTERS); only
 * the grouping is authored.
 *
 * Two caveats the source forces, both general to ASR-style captions:
 *
 * 1. No speaker labels. Attribution is read from the turn structure and is
 *    only asserted where that structure is unambiguous.
 * 2. The raw export interleaved each line's timestamp with a duplicated,
 *    word-form duration (a copy-paste artefact of the YouTube transcript
 *    panel's tooltip) — e.g. "10:2210 minutes, 22 secondsHave you written
 *    it?". That noise is stripped in prashantKishorInterview.ts; the spoken
 *    text itself, disfluencies and on-screen hashtags included, is untouched.
 */

const PK = "Prashant Kishor";
const SAMDISH = "Samdish";

export const TIP_THREAD_PK_MAIN = "tip-thread-pk-main";
export const TIP_THREAD_PK_PADYATRA = "tip-thread-pk-padyatra";
export const TIP_THREAD_PK_MEETING = "tip-thread-pk-meeting";
export const TIP_THREAD_PK_VOTING = "tip-thread-pk-voting";
export const TIP_THREAD_PK_CANVAS = "tip-thread-pk-canvas";
export const TIP_THREAD_PK_SHOES = "tip-thread-pk-shoes";
export const TIP_THREAD_PK_MOTIVE = "tip-thread-pk-motive";
export const TIP_THREAD_PK_FEE = "tip-thread-pk-fee";
export const TIP_THREAD_PK_SOUTHVOTES = "tip-thread-pk-southvotes";
export const TIP_THREAD_PK_ASPIRATIONS = "tip-thread-pk-aspirations";
export const TIP_THREAD_PK_GANDHI = "tip-thread-pk-gandhi";
export const TIP_THREAD_PK_PARENTS = "tip-thread-pk-parents";
export const TIP_THREAD_PK_UNETHICAL = "tip-thread-pk-unethical";
export const TIP_THREAD_PK_INSTITUTIONS = "tip-thread-pk-institutions";
export const TIP_THREAD_PK_TALENT = "tip-thread-pk-talent";
export const TIP_THREAD_PK_GARLANDS = "tip-thread-pk-garlands";
export const TIP_THREAD_PK_NITISH = "tip-thread-pk-nitish";
export const TIP_THREAD_PK_LEGACY = "tip-thread-pk-legacy";

/**
 * Canvas memory for this canvas — one gist per thread.
 *
 * On a canvas the user built, /api/gist writes these after each exchange. An
 * imported canvas has no exchanges, so the builder authors them: same ~40-word
 * shape, so a branch asked later gets the same faint sibling awareness it would
 * have had if the conversation had actually happened here.
 */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_PK_MAIN]:
    "Prashant Kishor, unfiltered: his mission in a Bihar at the bottom of India's HDI rankings, speeches composed on the spot, who funds the yatra, his history with Nitish Kumar, how elections are won in India, and his critique of Modi and the BJP.",
  [TIP_THREAD_PK_PADYATRA]:
    "Introducing himself to a village crowd as holding no post — not MLA, MP, minister, Mukhiya or Sarpanch — just a son of Bihar repaying a debt to its soil.",
  [TIP_THREAD_PK_MEETING]:
    "The small negotiation before the interview over where to sit — ground, gamcha or chair — because anything unusual draws a curious crowd.",
  [TIP_THREAD_PK_VOTING]:
    "Why he rejects the comparison to a protest movement: no revolution has benefited a civilisation the way a slow, deliberate awakening does.",
  [TIP_THREAD_PK_CANVAS]:
    "The job has not changed since his strategist years, only its target — where he once told parties how to organise and message, he now tries to speak to society itself.",
  [TIP_THREAD_PK_SHOES]:
    "Sixteen months on foot through four pairs of the same Asics, around Rs. 12,000–13,000 each, none lasting more than four months on Bihar's broken village roads.",
  [TIP_THREAD_PK_MOTIVE]:
    "His stated ambition, blunt: to see Bihar among India's leading states in his own lifetime, from a current rank of 28th — having turned down government posts he could have taken.",
  [TIP_THREAD_PK_FEE]:
    "He says he has never taken a professional fee, only campaign expenses — never payment for the relationship itself, the way a vendor would charge.",
  [TIP_THREAD_PK_SOUTHVOTES]:
    "The south as evidence that development changes voting behaviour: no chief minister there has lasted more than a decade, because rising expectations make voters harder to satisfy.",
  [TIP_THREAD_PK_ASPIRATIONS]:
    "Why some politicians would rather not deliver visible development — it raises expectations they would then have to manage, so keeping people grateful for a small ration is sometimes the strategy.",
  [TIP_THREAD_PK_GANDHI]:
    "No films in twenty years and never a selfie with a leader he has worked with — sitting beside a chief minister, he says, is self-esteem, not power.",
  [TIP_THREAD_PK_PARENTS]:
    "Growing up with no fixed village, his father's transferable government job keeping the family moving — he calls himself and his siblings born nomads with no lasting school friendships.",
  [TIP_THREAD_PK_UNETHICAL]:
    "He does not claim to be clean: everyone in the profession routinely overspends the legal election expenditure limit, by his estimate fifty times over, with regulators looking away.",
  [TIP_THREAD_PK_INSTITUTIONS]:
    "Asked to compare Mamata Banerjee's and Narendra Modi's authoritarian tendencies he redirects — any sufficiently powerful, popular leader anywhere will try to overpower institutions, so the institutions are what need strengthening.",
  [TIP_THREAD_PK_TALENT]:
    "The talent show the Padyatris run before he arrives at each stop — poets reciting verse about the journey, singers setting his speeches to music.",
  [TIP_THREAD_PK_GARLANDS]:
    "No security ring, unlike other padyatras — anyone can push through to garland him or take a photo, which means bruises from bangles and badly-aimed garlands.",
  [TIP_THREAD_PK_NITISH]:
    "Despite calling him “Paltu Ram” for switching sides, he describes real personal intimacy with Nitish Kumar — living together, a father-son dynamic.",
  [TIP_THREAD_PK_LEGACY]:
    "Having inherited no legacy, leaving one matters enormously to him — and he argues a political leader needs a working dose of narcissism to believe the world is watching.",
};

export function buildPrashantKishorCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_PK_MAIN,
    TIP_THREAD_PK_PADYATRA,
    TIP_THREAD_PK_MEETING,
    TIP_THREAD_PK_VOTING,
    TIP_THREAD_PK_CANVAS,
    TIP_THREAD_PK_SHOES,
    TIP_THREAD_PK_MOTIVE,
    TIP_THREAD_PK_FEE,
    TIP_THREAD_PK_SOUTHVOTES,
    TIP_THREAD_PK_ASPIRATIONS,
    TIP_THREAD_PK_GANDHI,
    TIP_THREAD_PK_PARENTS,
    TIP_THREAD_PK_UNETHICAL,
    TIP_THREAD_PK_INSTITUTIONS,
    TIP_THREAD_PK_TALENT,
    TIP_THREAD_PK_GARLANDS,
    TIP_THREAD_PK_NITISH,
    TIP_THREAD_PK_LEGACY,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 30 + index);
  });
  const threadGists = Object.fromEntries(
    threadIds.map((id) => [id, threadGist(THREAD_GISTS[id]!, 1)]),
  );

  // ---- Chapter heads: nine curated groups over the source's own fine-grained
  // chapter markers (see PRASHANT_KISHOR_CHAPTERS) ---------------------------
  const mainDefs = [
    { id: "tip-c-pk-main-1", title: "Introduction" },
    { id: "tip-c-pk-main-2", title: "PK's Mission" },
    { id: "tip-c-pk-main-3", title: "Speeches and Messaging" },
    { id: "tip-c-pk-main-4", title: "Who is Funding the Yatra" },
    { id: "tip-c-pk-main-5", title: "Nitish Kumar, Democracy, Ideologies" },
    { id: "tip-c-pk-main-6", title: "Family Time and Workaholic PK" },
    { id: "tip-c-pk-main-7", title: "How to Win Elections in India" },
    { id: "tip-c-pk-main-8", title: "Realities of Bihar" },
    { id: "tip-c-pk-main-9", title: "Modi and BJP's Ideology" },
  ];
  const summaries = [
    "Bihar sits at the bottom of India's Human Development Index rankings, and out of that setting a new political figure has emerged since 2014: Prashant Kishor, who has never contested an election himself but has been central to winning many. Padyatra — a walking journey to reach people directly, in the tradition of Gandhi — is the vehicle; sixteen months in, cameras follow one day of it in Begusarai.",
    "Ten years at the United Nations preceded ten more spent as what people here call a political consultant or strategist; that accumulated experience is now aimed at Bihar, the country's poorest and most backward state. His diagnosis: people know exactly what is missing — education, jobs, water, drains, housing — but when they actually vote, caste and religion take over instead.",
    "He writes nothing down — every speech is composed on the spot and refined against the crowd's reaction, sentence by sentence, until sixteen months in it reads eighty percent different from where it began. Even so, a bad mic or a low mood can throw off an otherwise practiced delivery.",
    "The money, he says, comes from people he helped win elsewhere over the past decade — industrialists and politicians in Bengal, Tamil Nadu and Andhra Pradesh who saw what he could do and are now repaying that social capital. Not one rupee, he insists, has come from Bihar itself, and no government is involved.",
    "He helped Nitish Kumar win in 2014 and 2015 and takes the criticism for it in stride — the Nitish Kumar of that time, he argues, is not the Nitish Kumar of today, and switching allegiance when someone stops delivering is democracy working correctly, not betrayal. What he refuses is blind, lifelong loyalty to a party on ideology alone.",
    "He is candid that he has little time for family and that his wife, a doctor from Assam, has simply adjusted to it — he calls himself the hard worker to her smart worker. His son, in eighth grade, has visited the Padyatra only once in a year and a half.",
    "His answer is simple: listening, the most underrated virtue in politics, because a leader isolated on a chair stops hearing what is actually happening below him. He compares it to the old cliché of a king going out in disguise at night — only in disguise does anyone tell him the truth.",
    "Numbers understate it, he says — Bihar's poverty is scarier felt in person than read as a statistic. Per capita income in most districts runs a fifth of the national average, seventy to eighty percent of people here don't earn even Rs. 100 a day, and half the youth have migrated for work elsewhere.",
    "His work for Modi in 2012 and 2014 is on the record, he says, same as his later role in a BJP loss in Bengal — the ledger runs both ways. His real critique of the BJP isn't that it wins, but that it wants more than a vote: an ideological and psychological hold over how people live once they've voted.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_PK_MAIN,
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

  // ---- Chapter 1 · Introduction --------------------------------------------
  branch(TIP_THREAD_PK_PADYATRA, "tip-c-pk-main-1", [
    {
      id: "tip-c-pk-padyatra-1",
      title: "Padyatra",
      summary:
        "Introducing himself to a village crowd, he insists he holds no post — not MLA, MP, minister, Mukhiya or Sarpanch — and calls himself simply a son of Bihar repaying a debt to its soil. He asks for a show of hands on whether the attempt to make Bihar better should go on, and the crowd answers with raised hands and cries of \"Jai Bihar.\"",
    },
  ]);
  branch(TIP_THREAD_PK_MEETING, "tip-c-pk-main-1", [
    {
      id: "tip-c-pk-meeting-1",
      title: "Meeting PK",
      summary:
        "Before the interview starts, there's a small negotiation over where to sit — ground, gamcha, or chair — since anything unusual will draw a curious crowd. Kishor has never seen the show before and gives the crew twenty to twenty-five minutes on the road before a longer sit-down in the evening.",
    },
  ]);

  // ---- Chapter 2 · PK's Mission ---------------------------------------------
  branch(TIP_THREAD_PK_VOTING, "tip-c-pk-main-2", [
    {
      id: "tip-c-pk-voting-1",
      title: "Voting for the right reasons",
      summary:
        "He rejects the comparison to a protest movement outright, arguing no revolution has ever benefited a civilisation the way a slow, deliberate awakening does — Gandhi didn't call for fighting the British before rebuilding character at home. His own version: asking a father to put his hand on his child's head and say he voted for education. So far, in Bihar, nobody has said yes.",
    },
  ]);

  // ---- Chapter 3 · Speeches and Messaging -----------------------------------
  branch(TIP_THREAD_PK_CANVAS, "tip-c-pk-main-3", [
    {
      id: "tip-c-pk-canvas-1",
      title: "Influencing a larger canvas",
      summary:
        "The job hasn't changed since his strategist years, he says — only its target has. Where he once told leaders and parties how to organise and message, he now tries to speak to society directly, hoping twenty good people per block, multiplied across Bihar, add up to a political force in themselves.",
    },
  ]);
  branch(TIP_THREAD_PK_SHOES, "tip-c-pk-main-3", [
    {
      id: "tip-c-pk-shoes-1",
      title: "Shoes for the yatra",
      summary:
        "Sixteen months on foot has gone through four pairs of the same Asics shoes, each around Rs. 12,000–13,000 and none lasting more than four months on Bihar's broken village roads — worn through from the back, not the sole.",
    },
  ]);

  // ---- Chapter 4 · Who is Funding the Yatra ---------------------------------
  branch(TIP_THREAD_PK_MOTIVE, "tip-c-pk-main-4", [
    {
      id: "tip-c-pk-motive-1",
      title: "Selfish motive and holding office of power",
      summary:
        "His stated ambition is blunt: to see Bihar among India's leading states in his own lifetime, from a state currently ranked 28th. He says he had every chance to take a government post after the 2015 Bihar win — cabinet formation, portfolios, all of it went through him — but chose not to, because society itself hadn't changed.",
    },
  ]);
  branch(TIP_THREAD_PK_FEE, "tip-c-pk-main-4", [
    {
      id: "tip-c-pk-fee-1",
      title: "Professional fee",
      summary:
        "He says he has never taken a professional fee in his life — only campaign expenses, never a payment for the relationship itself, the way a vendor would charge. What he wants instead, he says, is proximity and relationships: a seat next to the chief minister, not money in an account.",
    },
  ]);

  // ---- Chapter 5 · Nitish Kumar, Democracy, Ideologies ----------------------
  branch(TIP_THREAD_PK_SOUTHVOTES, "tip-c-pk-main-5", [
    {
      id: "tip-c-pk-southvotes-1",
      title: "Different voting patterns",
      summary:
        "He points to the south as evidence that development changes behaviour: no chief minister there has lasted more than a decade, because rising expectations make voters harder to satisfy, not easier. Long, unbroken rule of the kind seen in Odisha, Madhya Pradesh or Bihar, he suggests, is a marker of stalled development, not stability.",
    },
  ]);
  branch(TIP_THREAD_PK_ASPIRATIONS, "tip-c-pk-main-5", [
    {
      id: "tip-c-pk-aspirations-1",
      title: "Managing aspirations and development",
      summary:
        "Some politicians, he says, understand perfectly well that visible development raises expectations they'd rather not manage — so keeping people grateful for a small ration is sometimes the easier path, whether or not anyone admits it out loud.",
    },
  ]);

  // ---- Chapter 6 · Family Time and Workaholic PK ----------------------------
  branch(TIP_THREAD_PK_GANDHI, "tip-c-pk-main-6", [
    {
      id: "tip-c-pk-gandhi-1",
      title: "Films, actors, status and Gandhi",
      summary:
        "He hasn't watched a film in twenty years and has never taken a selfie with a leader he's worked with — sitting beside a chief minister, he says, is self-esteem, not power, and he refuses to be anyone's vendor or fanboy. The one exception is Gandhi, whom he calls a hero he never got the chance to work with, only to read.",
    },
  ]);
  branch(TIP_THREAD_PK_PARENTS, "tip-c-pk-main-6", [
    {
      id: "tip-c-pk-parents-1",
      title: "PK's parents and changing houses",
      summary:
        "He grew up with no fixed village — his father's transferable government job kept the family moving, so he calls himself and his siblings \"born nomads\" with no lasting school friends to return to. His mother, who died in 2017, was his blind supporter; his Congressman father, a doctor by trade, was someone he argued with far more.",
    },
  ]);

  // ---- Chapter 7 · How to Win Elections in India ----------------------------
  branch(TIP_THREAD_PK_UNETHICAL, "tip-c-pk-main-7", [
    {
      id: "tip-c-pk-unethical-1",
      title: "Unethical and dirty in Indian politics",
      summary:
        "He doesn't pretend to be clean: everyone in the profession routinely overspends past the legal election expenditure limit — by his estimate fifty times over — with regulators and rivals alike aware and complicit. He stops short of claiming outright criminality but won't rule it out either.",
    },
  ]);
  branch(TIP_THREAD_PK_INSTITUTIONS, "tip-c-pk-main-7", [
    {
      id: "tip-c-pk-institutions-1",
      title: "Comparing politicians, the need to strengthen institutions",
      summary:
        "Asked to compare Mamata Banerjee's and Narendra Modi's authoritarian tendencies, he redirects: any sufficiently powerful, popular leader anywhere will try to overpower institutions, so the fix is building stronger institutions and frameworks, not relitigating which leader is worse.",
    },
  ]);

  // ---- Chapter 8 · Realities of Bihar ---------------------------------------
  branch(TIP_THREAD_PK_TALENT, "tip-c-pk-main-8", [
    {
      id: "tip-c-pk-talent-1",
      title: "Talent show at the Padyatra",
      summary:
        "Before he arrives at each stop, Padyatris — the walkers who've joined the march — run their own talent show: poets reciting verse about the journey, singers setting his speeches to song, none of it his idea, all of it something he says genuinely impressed him.",
    },
  ]);
  branch(TIP_THREAD_PK_GARLANDS, "tip-c-pk-main-8", [
    {
      id: "tip-c-pk-garlands-1",
      title: "Garlands and Padyatra",
      summary:
        "Unlike other padyatras, he keeps no security ring around himself — anyone can push through, garland him, take a photo — which means bruises from bangles and badly-aimed garlands are routine. He'd rather sleep in a tent a dog could wander into than perform danger he doesn't feel.",
    },
  ]);

  // ---- Chapter 9 · Modi and BJP's Ideology -----------------------------------
  branch(TIP_THREAD_PK_NITISH, "tip-c-pk-main-9", [
    {
      id: "tip-c-pk-nitish-1",
      title: "Nitish Kumar",
      summary:
        "Despite calling him \"Paltu Ram\" for switching sides repeatedly, Kishor describes a real personal intimacy with Nitish Kumar — living together, a father-son dynamic where Nitish wouldn't let him get up in winter without socks on. He also lived with Punjab's Captain Amarinder Singh, who offered him a cabinet rank he never accepted.",
    },
  ]);
  branch(TIP_THREAD_PK_LEGACY, "tip-c-pk-main-9", [
    {
      id: "tip-c-pk-legacy-1",
      title: "Legacy and narcissism",
      summary:
        "Having inherited no legacy of his own, he says leaving one matters enormously to him. He argues a political leader needs a working dose of narcissism — believing the world is watching, the way an actor has to believe in their own face — just not so much that it curdles into something worse.",
    },
  ]);

  /*
   * Artifacts, chapter by chapter, per the transcript-artifacts skill. Every
   * quote, claim side and definition gloss below is a verbatim lift from
   * PRASHANT_KISHOR_INTERVIEW_TRANSCRIPT — enforced by
   * transcriptFidelity.test.ts.
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

  // Chapter 1 — H quote, D' stat, G definition, three site links.
  spawn(
    "tip-art-pk-video",
    {
      type: "images",
      title: "The Prashant Kishor Interview | Samdish x PK",
      data: {
        items: [
          {
            kind: "youtube",
            url: PRASHANT_KISHOR_VIDEO_URL,
            title: "The Prashant Kishor Interview | Samdish x PK",
            thumb: "https://img.youtube.com/vi/fPP_3XCXbPQ/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-pk-main-1",
  );
  spawn(
    "tip-art-pk-quote-notpolitician",
    quotePayload("\"I am not a politician\"", {
      text:
        "I am not a politician. I am not a MLA, MP or minister. I am not even the Mukhiya or Sarpanch.",
      speaker: PK,
      timestamp: "3:11",
      context: "Introducing himself to a village crowd on the Padyatra",
    }),
    "tip-c-pk-padyatra-1",
  );
  spawn(
    "tip-art-pk-stat-hdi",
    statPayload("Bihar's HDI ranking", {
      value: "Lowest",
      label:
        "Bihar's rank on the Human Development Index, as the show's cold open frames it",
      speaker: "Narrator",
    }),
    "tip-c-pk-main-1",
  );
  spawn(
    "tip-art-pk-def-padyatra",
    definitionPayload("Padyatra", {
      term: "Padyatra",
      gloss:
        "The journey that one does on foot to deliver his message to the people",
      speaker: "Narrator",
    }),
    "tip-c-pk-main-1",
  );
  site(
    "pk-wiki",
    "https://en.wikipedia.org/wiki/Prashant_Kishor",
    "Prashant Kishor",
    "tip-c-pk-main-1",
  );
  site(
    "jansuraaj-wiki",
    "https://en.wikipedia.org/wiki/Jan_Suraaj",
    "Jan Suraaj",
    "tip-c-pk-main-1",
  );
  site(
    "begusarai-wiki",
    "https://en.wikipedia.org/wiki/Begusarai",
    "Begusarai",
    "tip-c-pk-padyatra-1",
  );

  // Chapter 2 — H quote, F claim, H quote.
  spawn(
    "tip-art-pk-quote-frame",
    quotePayload("Twenty years, one frame", {
      text:
        "I have gathered that experience and put it together in Bihar, which is the poorest and most backward state in the country.",
      speaker: PK,
      timestamp: "6:18",
      context: "On why Bihar, after ten years at the UN and ten as a strategist",
    }),
    "tip-c-pk-main-2",
  );
  spawn(
    "tip-art-pk-claim-awareness",
    claimPayload("Does Bihar know it deserves better?", {
      topic: "Whether people here know they can have a better life",
      proposition: {
        speaker: SAMDISH,
        text: "do they know that they can get a better life than this?",
      },
      counter: {
        speaker: PK,
        text: "there is awareness that it should be better.",
      },
    }),
    "tip-c-pk-main-2",
  );
  spawn(
    "tip-art-pk-quote-education",
    quotePayload("Nobody has voted for education", {
      text: "have you ever voted for education?",
      speaker: PK,
      timestamp: "8:59",
      context: "The question he asks fathers on the campaign trail",
    }),
    "tip-c-pk-voting-1",
  );

  // Chapter 3 — H quote, D' stat, H quote, D' stat.
  spawn(
    "tip-art-pk-quote-nowrite",
    quotePayload("Nothing written down", {
      text: "No, I don't write anything.",
      speaker: PK,
      timestamp: "10:22",
      context: "On whether his speeches are scripted",
    }),
    "tip-c-pk-main-3",
  );
  spawn(
    "tip-art-pk-stat-speechdrift",
    statPayload("How much a speech evolves", {
      value: "80%",
      label:
        "How different his first speech on the journey now reads next to a recent one, by his own estimate",
      speaker: PK,
    }),
    "tip-c-pk-main-3",
  );
  spawn(
    "tip-art-pk-quote-canvas",
    quotePayload("Enlarging the canvas", {
      text: "Now I have enlarged my canvas.",
      speaker: PK,
      timestamp: "12:35",
      context: "On moving from advising parties to addressing society itself",
    }),
    "tip-c-pk-canvas-1",
  );
  spawn(
    "tip-art-pk-stat-shoes",
    statPayload("Shoes retired on the Padyatra", {
      value: "4",
      unit: "pairs of Asics",
      label:
        "Worn through in 16 months of walking Bihar's village roads, at Rs. 12,000–13,000 a pair, none lasting more than 4 months",
      speaker: PK,
    }),
    "tip-c-pk-shoes-1",
  );

  // Chapter 4 — H quote, F claim, H quote, H quote.
  spawn(
    "tip-art-pk-quote-norupee",
    quotePayload("Not one rupee from Bihar", {
      text: "I have never taken a single rupee from anyone in Bihar.",
      speaker: PK,
      timestamp: "15:11",
      context: "On who funds the Yatra",
    }),
    "tip-c-pk-main-4",
  );
  spawn(
    "tip-art-pk-claim-rich",
    claimPayload("Is he rich from this work?", {
      topic: "Whether the campaign has made him personally wealthy",
      proposition: {
        speaker: SAMDISH,
        text: "You must be very rich from this work.",
      },
      counter: {
        speaker: PK,
        text: "I am not rich.",
      },
    }),
    "tip-c-pk-main-4",
  );
  spawn(
    "tip-art-pk-quote-leading",
    quotePayload("The stated ambition", {
      text: "I want to see Bihar in the leading states in my lifetime.",
      speaker: PK,
      timestamp: "16:30",
      context: "His motive for the whole campaign, stated plainly",
    }),
    "tip-c-pk-motive-1",
  );
  spawn(
    "tip-art-pk-quote-nofee",
    quotePayload("No professional fee, ever", {
      text: "I have never taken professional fees from anyone.",
      speaker: PK,
      timestamp: "22:33",
      context: "Distinguishing campaign expenses from a personal fee",
    }),
    "tip-c-pk-fee-1",
  );

  // Chapter 5 — G definition, H quote, F claim, H quote.
  spawn(
    "tip-art-pk-def-democracy",
    definitionPayload("Democracy, his working definition", {
      term: "Democracy",
      gloss: "there is no lifelong bonded labour",
      speaker: PK,
    }),
    "tip-c-pk-main-5",
  );
  spawn(
    "tip-art-pk-quote-blinddevotee",
    quotePayload("Not a blind devotee of ideology", {
      text: "I don't want to become a blind devotee of ideology.",
      speaker: PK,
      timestamp: "20:17",
      context: "On why he backs and drops leaders rather than parties",
    }),
    "tip-c-pk-main-5",
  );
  spawn(
    "tip-art-pk-claim-southrule",
    claimPayload("Is long, unbroken rule a good sign?", {
      topic: "Whether a Chief Minister ruling for decades signals good governance",
      proposition: {
        speaker: "The southern-states comparison, as he frames it",
        text: "no one has been the Chief Minister for more than 10 years",
      },
      counter: {
        speaker: PK,
        text: "as the aspirations rise, people expect more from the government",
      },
    }),
    "tip-c-pk-southvotes-1",
  );
  spawn(
    "tip-art-pk-quote-manageaspiration",
    quotePayload("Managing aspiration is difficult", {
      text: "if you show too much of development then managing aspiration is difficult",
      speaker: PK,
      timestamp: "18:59",
      context: "On why some politicians prefer voters to expect less",
    }),
    "tip-c-pk-aspirations-1",
  );

  // Chapter 6 — H quote, H quote, H quote, H quote.
  spawn(
    "tip-art-pk-quote-smartworker",
    quotePayload("Hard worker, smart worker", {
      text: "My wife is a smart worker. I'm a hard worker.",
      speaker: PK,
      timestamp: "24:45",
      context: "On his wife, a doctor from Assam",
    }),
    "tip-c-pk-main-6",
  );
  spawn(
    "tip-art-pk-quote-hero",
    quotePayload("The one hero worship he admits to", {
      text: "I hero worship him.",
      speaker: PK,
      timestamp: "23:58",
      context: "On Gandhi, the one figure he calls himself a fanboy of",
    }),
    "tip-c-pk-gandhi-1",
  );
  spawn(
    "tip-art-pk-quote-nomads",
    quotePayload("\"We were born nomads\"", {
      text: "We were born nomads.",
      speaker: PK,
      timestamp: "28:10",
      context: "On growing up with no fixed village, his father's job transferable",
    }),
    "tip-c-pk-parents-1",
  );
  spawn(
    "tip-art-pk-quote-blindsupporter",
    quotePayload("His mother, described", {
      text: "She was my blind supporter.",
      speaker: PK,
      timestamp: "26:57",
      context: "On his mother, who died in 2017",
    }),
    "tip-c-pk-parents-1",
  );

  // Chapter 7 — H quote, E mechanism, H quote, F claim.
  spawn(
    "tip-art-pk-quote-listening",
    quotePayload("The most underrated virtue", {
      text: "Listening to people. This is the most underrated virtue.",
      speaker: PK,
      timestamp: "32:33",
      context: "His one-line answer on how to win elections in India",
    }),
    "tip-c-pk-main-7",
  );
  spawn(
    "tip-art-pk-mech-disguise",
    mechanismPayload("Why leaders stop hearing the truth", {
      steps: [
        { id: "chair", label: "A leader sits on top, in power" },
        {
          id: "isolated",
          label: "Bad news travels up slowly and gets softened at every step",
          note: "\"They keep getting isolated\"",
        },
        {
          id: "disguise",
          label: "Only a king who goes out in disguise hears the truth",
        },
      ],
      edges: [
        { from: "chair", to: "isolated" },
        { from: "isolated", to: "disguise" },
      ],
    }),
    "tip-c-pk-main-7",
  );
  spawn(
    "tip-art-pk-quote-overspend",
    quotePayload("Fifty times the legal limit", {
      text: "It's more than 50 times more.",
      speaker: PK,
      timestamp: "30:02",
      context: "On how far campaigns overspend the legal election expenditure limit",
    }),
    "tip-c-pk-unethical-1",
  );
  spawn(
    "tip-art-pk-claim-institutions",
    claimPayload("Who's more authoritarian — Modi or Mamata?", {
      topic: "Comparing Narendra Modi's and Mamata Banerjee's authoritarian tendencies",
      proposition: {
        speaker: SAMDISH,
        text:
          "People compare Mamata Banerjee and Narendra Modi in terms of their dictatorial tendencies",
      },
      counter: {
        speaker: PK,
        text: "the democratic institutions in India, they need to be strengthened",
      },
    }),
    "tip-c-pk-institutions-1",
  );

  // Chapter 8 — D' stat, D' stat, H quote, H quote.
  spawn(
    "tip-art-pk-stat-percapita",
    statPayload("Per capita income, Bihar vs. India", {
      value: "1/5",
      label:
        "Per capita income in most Bihar districts (Rs. 25,000–30,000) against the national average of Rs. 1,35,000",
      speaker: PK,
    }),
    "tip-c-pk-main-8",
  );
  spawn(
    "tip-art-pk-stat-under100",
    statPayload("Living under Rs. 100 a day", {
      value: "70–80%",
      label: "Share of people here who don't earn even Rs. 100 a day, by his estimate",
      speaker: PK,
    }),
    "tip-c-pk-main-8",
  );
  spawn(
    "tip-art-pk-quote-poets",
    quotePayload("Amazing poets among the Padyatris", {
      text: "You have amazing poets among Padyatris.",
      speaker: SAMDISH,
      timestamp: "36:06",
      context: "On the talent show the walkers run among themselves",
    }),
    "tip-c-pk-talent-1",
  );
  spawn(
    "tip-art-pk-quote-noring",
    quotePayload("No ring around him", {
      text: "unlike other padyatras, I don't make a ring.",
      speaker: PK,
      timestamp: "37:57",
      context: "On walking without a security cordon",
    }),
    "tip-c-pk-garlands-1",
  );

  // Chapter 9 — H quote, F claim, H quote, H quote, H quote.
  spawn(
    "tip-art-pk-quote-imprint",
    quotePayload("More than your vote", {
      text: "They want to leave an ideological imprint on you.",
      speaker: PK,
      timestamp: "45:47",
      context: "His core critique of the BJP",
    }),
    "tip-c-pk-main-9",
  );
  spawn(
    "tip-art-pk-claim-bjpproblem",
    claimPayload("What's actually wrong with the BJP winning?", {
      topic: "Whether the BJP's dominance itself is the democratic problem",
      proposition: {
        speaker: PK,
        text: "The problem is not that they are winning.",
      },
      counter: {
        speaker: PK,
        text: "The problem is that BJP wants more than your vote.",
      },
    }),
    "tip-c-pk-main-9",
  );
  spawn(
    "tip-art-pk-quote-fatherson",
    quotePayload("\"Like father-son\"", {
      text: "we are like father-son.",
      speaker: PK,
      timestamp: "43:31",
      context: "On his personal relationship with Nitish Kumar",
    }),
    "tip-c-pk-nitish-1",
  );
  spawn(
    "tip-art-pk-quote-paltu",
    quotePayload("\"Paltu Ram\"", {
      text: "Why is Nitish Kumar called the Paltu Ram?",
      speaker: SAMDISH,
      timestamp: "43:02",
      context: "The nickname for Nitish Kumar's repeated side-switching",
    }),
    "tip-c-pk-nitish-1",
  );
  spawn(
    "tip-art-pk-quote-legacy",
    quotePayload("No legacy inherited, one to leave", {
      text: "I have not inherited a legacy, so I would like to leave a legacy.",
      speaker: PK,
      timestamp: "52:59",
      context: "On why being remembered matters so much to him",
    }),
    "tip-c-pk-legacy-1",
  );
  site(
    "gandhi-wiki",
    "https://en.wikipedia.org/wiki/Mahatma_Gandhi",
    "Mahatma Gandhi",
    "tip-c-pk-gandhi-1",
  );
  site(
    "nitish-wiki",
    "https://en.wikipedia.org/wiki/Nitish_Kumar",
    "Nitish Kumar",
    "tip-c-pk-nitish-1",
  );

  /*
   * The masthead: what the video is, a clickable index into the nine chapter
   * groups, and the link directory.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-pk-episode", "tip-art-pk-links"];

  spawn(
    "tip-art-pk-episode",
    episodePayload("The episode", {
      videoTitle: "The Prashant Kishor Interview | Samdish x PK",
      channel: "Unfiltered by Samdish",
      duration: "1:08:10",
      url: PRASHANT_KISHOR_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/fPP_3XCXbPQ/maxresdefault.jpg",
      description:
        "Samdish spends a day with Prashant Kishor's Jan Suraaj Padyatra in Begusarai, Bihar — walking the yatra, then sitting for an unfiltered interview on money, ideology, family and the case for a new kind of politics.",
      chapters: PRASHANT_KISHOR_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-pk-chapter-${index + 1}`,
      })),
    }),
    "tip-c-pk-main-1",
  );
  spawn(
    "tip-art-pk-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: PRASHANT_KISHOR_VIDEO_URL },
            { label: "Unfiltered by Samdish", url: PRASHANT_KISHOR_CHANNEL_URL },
          ],
        },
        {
          label: "People and parties",
          links: [
            { label: "Prashant Kishor", url: "https://en.wikipedia.org/wiki/Prashant_Kishor" },
            { label: "Jan Suraaj", url: "https://en.wikipedia.org/wiki/Jan_Suraaj" },
            { label: "Nitish Kumar", url: "https://en.wikipedia.org/wiki/Nitish_Kumar" },
          ],
        },
        {
          label: "Places",
          links: [
            { label: "Begusarai", url: "https://en.wikipedia.org/wiki/Begusarai" },
          ],
        },
      ],
    }),
    "tip-c-pk-main-1",
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
    idPrefix: "tip-pk",
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
