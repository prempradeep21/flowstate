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
  SCHOOLCAST_CHANNEL_URL,
  SCHOOLCAST_VANITA_UPPAL_CHAPTERS,
  SCHOOLCAST_VANITA_UPPAL_VIDEO_URL,
} from "@/lib/transcriptImport/schoolCastVanitaUppalInterview";

/*
 * Vanita Uppal OBE, Director of The British School, New Delhi, on Schoolcast
 * with Avyakt, roughly 55 minutes — a Hindi-language interview (the guest
 * answers almost entirely in English) on what separates a good teacher from
 * a good school, and how Indian and international curricula compare.
 *
 * This builder follows the same approach as the other Hindi-source fixtures
 * (see schoolCastVanitaUppalInterview.ts): no block of the source's Hindi
 * transcript is embedded anywhere, and every quote/claim artifact is a
 * clause the speaker said fully in English mid-sentence, re-spelled from
 * the source's Devanagari phonetic rendering back to English — not
 * translated. Card summaries are this builder's own paraphrase.
 *
 * The source carries its own English chapter titles; the nine-chapter spine
 * here curates the source's ~20 chapters down the same way the Prashant
 * Kishor and Huberman canvases group a source's finer-grained chapters.
 */

const VANITA = "Vanita Uppal";
const AVYAKT = "Avyakt Sethi";

export const TIP_THREAD_SC_MAIN = "tip-thread-sc-main";
export const TIP_THREAD_SC_RESILIENCE = "tip-thread-sc-resilience";
export const TIP_THREAD_SC_CONTENT = "tip-thread-sc-content";
export const TIP_THREAD_SC_REALITY = "tip-thread-sc-reality";
export const TIP_THREAD_SC_BECOMING = "tip-thread-sc-becoming";
export const TIP_THREAD_SC_ADVANTAGE = "tip-thread-sc-advantage";
export const TIP_THREAD_SC_LEARN = "tip-thread-sc-learn";
export const TIP_THREAD_SC_SPOILING = "tip-thread-sc-spoiling";
export const TIP_THREAD_SC_RAPIDFIRE = "tip-thread-sc-rapidfire";
export const TIP_THREAD_SC_ADVICE = "tip-thread-sc-advice";

/**
 * Canvas memory for this canvas — one gist per thread.
 *
 * On a canvas the user built, /api/gist writes these after each exchange. An
 * imported canvas has no exchanges, so the builder authors them: same ~40-word
 * shape, so a branch asked later gets the same faint sibling awareness it would
 * have had if the conversation had actually happened here.
 */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_SC_MAIN]:
    "Vanita Uppal on forty years in education: marks versus mindset, how education has shifted since content stopped being king, what makes a great teacher, whether international schools are easier to teach in, NEP 2020, and three parenting mistakes.",
  [TIP_THREAD_SC_RESILIENCE]:
    "Why Gen Z lacks resilience: judgment starts at home, with parents insisting they apply no pressure while the child absorbs constant comparison and quietly concludes they must be failing.",
  [TIP_THREAD_SC_CONTENT]:
    "Teachers as more than content deliverers — with knowledge a click away, the value has shifted to relationship: first responder, counselor, sometimes the one emotionally available adult in a child's life.",
  [TIP_THREAD_SC_REALITY]:
    "Teaching reality in Indian schools: changing a culture is the hardest change there is, and a five-student-per-teacher international classroom and a village school teaching five age groups in one room are solving different problems.",
  [TIP_THREAD_SC_BECOMING]:
    "Becoming an international school teacher — the same B.Ed qualification as anywhere, plus continuous professional development to absorb the school's pedagogy, which is part of why salaries run higher.",
  [TIP_THREAD_SC_ADVANTAGE]:
    "The global advantage IB students carry from a 4,000-word extended essay or Theory of Knowledge piece — real analytical skills, though she resists generalising it as superiority over other boards.",
  [TIP_THREAD_SC_LEARN]:
    "What Indian schools can learn from international curricula: concept-based inquiry learning in the national framework, sustained teacher training, and assessment treated as an ongoing process.",
  [TIP_THREAD_SC_SPOILING]:
    "Whether facilities spoil children — she argues it has nothing to do with curriculum, since her own school ran with plain classrooms and blackboards for years and kept its standards.",
  [TIP_THREAD_SC_RAPIDFIRE]:
    "A quickfire round on habits versus passion, what parents should stop asking their children, and the one golden rule she would want every teacher to follow.",
  [TIP_THREAD_SC_ADVICE]:
    "Her closing message: don't lose hope when times get rough, and default to kindness — an unkind word can change how a student sees themselves.",
};

export function buildSchoolCastVanitaUppalCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_SC_MAIN,
    TIP_THREAD_SC_RESILIENCE,
    TIP_THREAD_SC_CONTENT,
    TIP_THREAD_SC_REALITY,
    TIP_THREAD_SC_BECOMING,
    TIP_THREAD_SC_ADVANTAGE,
    TIP_THREAD_SC_LEARN,
    TIP_THREAD_SC_SPOILING,
    TIP_THREAD_SC_RAPIDFIRE,
    TIP_THREAD_SC_ADVICE,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 90 + index);
  });
  const threadGists = Object.fromEntries(
    threadIds.map((id) => [id, threadGist(THREAD_GISTS[id]!, 1)]),
  );

  const mainDefs = [
    { id: "tip-c-sc-main-1", title: "Intro: Meet Vanita Uppal" },
    { id: "tip-c-sc-main-2", title: "Marks vs. Mindset: What Matters More" },
    { id: "tip-c-sc-main-3", title: "Education Then vs. Now" },
    { id: "tip-c-sc-main-4", title: "How Great Teachers Solve Real Problems" },
    { id: "tip-c-sc-main-5", title: "Are International Schools Easier to Teach In?" },
    { id: "tip-c-sc-main-6", title: "Are International Teachers Happier?" },
    { id: "tip-c-sc-main-7", title: "Myths About International Schools" },
    { id: "tip-c-sc-main-8", title: "NEP 2020's Impact" },
    { id: "tip-c-sc-main-9", title: "3 Parenting Mistakes Today" },
  ];
  const summaries = [
    "Forty years into education, she still calls herself a teacher at heart, drawing her greatest inspiration from students rather than titles — and argues that leaders who stop being learners stop being effective leaders.",
    "Excellence, she insists, was never about grades or content — it comes from a mindset that treats failure and success as points on the same spectrum, and success has to be defined by the individual, not by college admissions or marks.",
    "The biggest shift in decades of teaching: a realization that content isn't king anymore, that learning has to be personalized because no two children learn the same way, and that a teacher's connection with a student matters more than technique alone.",
    "Real school problems don't get solved until they're properly named — she describes watching a business coach earn a room's buy-in simply by naming their problem back to them accurately, and applies the same discipline to teacher and leadership training.",
    "An international school isn't an easier place to teach: expectations run higher from both leadership and parents, class sizes are smaller which raises the personalization bar rather than lowering the workload, and no new teacher is left to sink or swim alone.",
    "She won't accept that an exam board dictates what kind of teacher someone becomes — a CBSE-trained teacher in a 40-student classroom can know every child as well as any international-school counterpart, given the will to do it.",
    "The idea that international schools erode Indian values or exist mainly to send children abroad, she says, are both stereotypes: her own school builds Indian culture into its taught curriculum and is independently audited on exactly that by an international accrediting body.",
    "India's National Education Policy is already visible in international curricula adapting toward it — she points to MOUs between the IB and state governments as early signs of the two systems converging rather than staying parallel.",
    "Today's parents are more aspirational and more anxious at once — access to more resources doesn't have to mean providing more, and unchecked social media exposure is creating pressures no previous generation of parents had to manage.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_SC_MAIN,
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

  branch(TIP_THREAD_SC_RESILIENCE, "tip-c-sc-main-2", [
    {
      id: "tip-c-sc-resilience-1",
      title: "Why Gen Z lacks resilience",
      summary:
        "Resilience isn't taught because judgment starts at home and gets reinforced everywhere else — parents insist they put no pressure on their child while that child absorbs constant comparison to what everyone else is achieving, quietly concluding they must be failing.",
    },
  ]);
  branch(TIP_THREAD_SC_CONTENT, "tip-c-sc-main-3", [
    {
      id: "tip-c-sc-content-1",
      title: "Teachers are more than content deliverers",
      summary:
        "With knowledge a click away, a teacher's value has shifted entirely to relationship — first responder, counselor, sometimes the one emotionally available adult in a child's life, especially for students who came out of pandemic-era online learning gaps precisely because they lacked human connection.",
    },
  ]);
  branch(TIP_THREAD_SC_REALITY, "tip-c-sc-main-4", [
    {
      id: "tip-c-sc-reality-1",
      title: "Teaching reality in Indian schools",
      summary:
        "Changing an organization's culture is the hardest change there is, she says, and it won't happen overnight or the same way in a five-student-per-teacher international classroom as in a village school teaching five age groups in one room — different contexts are solving different problems.",
    },
  ]);
  branch(TIP_THREAD_SC_BECOMING, "tip-c-sc-main-5", [
    {
      id: "tip-c-sc-becoming-1",
      title: "Becoming an international school teacher",
      summary:
        "The formal qualifications are the same as any other school — a B.Ed is still required — but new hires, many trained entirely within the Indian system, go through continuous professional development to absorb the school's own pedagogy, which is also why international-school salaries tend to run higher worldwide.",
    },
  ]);
  branch(TIP_THREAD_SC_ADVANTAGE, "tip-c-sc-main-6", [
    {
      id: "tip-c-sc-advantage-1",
      title: "The global advantage international students carry",
      summary:
        "An IB student who has written a 4,000-word extended essay or a 2,000-word Theory of Knowledge piece arrives at university with real analytical and hypothesis-building skills — but she resists generalizing that as superiority, since students from other boards excel at university too, just on a different timeline.",
    },
  ]);
  branch(TIP_THREAD_SC_LEARN, "tip-c-sc-main-7", [
    {
      id: "tip-c-sc-learn-1",
      title: "What Indian schools can learn from international curricula",
      summary:
        "Three things top her list: building concept-based inquiry learning into the national curriculum framework, sustained investment in teacher training, and treating assessment as an ongoing process rather than a single end-of-term event — testing a fish's ability to climb a tree guarantees it fails, every time.",
    },
  ]);
  branch(TIP_THREAD_SC_SPOILING, "tip-c-sc-main-8", [
    {
      id: "tip-c-sc-spoiling-1",
      title: "Spoiling or shaping kids?",
      summary:
        "The perception that fancy facilities spoil children has nothing to do with curriculum, she argues — her own school ran with plain classrooms and blackboards for years and still kept a long waiting list, because discerning parents valued what happened inside the classroom over what the building looked like from outside.",
    },
  ]);
  branch(TIP_THREAD_SC_RAPIDFIRE, "tip-c-sc-main-9", [
    {
      id: "tip-c-sc-rapidfire-1",
      title: "Rapid fire",
      summary:
        "A quickfire round on habits versus passion, what parents should stop asking their kids, and the single golden rule she'd want every teacher to follow in class.",
    },
  ]);
  branch(TIP_THREAD_SC_ADVICE, "tip-c-sc-main-9", [
    {
      id: "tip-c-sc-advice-1",
      title: "Final advice",
      summary:
        "Her closing message to the audience: don't lose hope when times get rough, and when nothing else is possible, default to kindness — because an unkind word can change how a student understands their own destiny.",
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
    "tip-art-sc-video",
    {
      type: "images",
      title: "Teaching Reality: Indian vs International School Boards | British School Director",
      data: {
        items: [
          {
            kind: "youtube",
            url: SCHOOLCAST_VANITA_UPPAL_VIDEO_URL,
            title: "Teaching Reality: Indian vs International School Boards | British School Director",
            thumb: "https://img.youtube.com/vi/65DU7cn-3nA/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-sc-main-1",
  );
  spawn(
    "tip-art-sc-quote-goodteacher",
    quotePayload("A good teacher, wherever she is", {
      text: "A good teacher is a good teacher no matter where you play.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-1",
  );
  spawn(
    "tip-art-sc-quote-leaders",
    quotePayload("Leaders who stop learning", {
      text: "I think leaders who stop being learners can't be effective leaders either.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-1",
  );
  site(
    "britishschool-wiki",
    "https://en.wikipedia.org/wiki/The_British_School,_New_Delhi",
    "The British School, New Delhi",
    "tip-c-sc-main-1",
  );

  spawn(
    "tip-art-sc-quote-notgrades",
    quotePayload("Not about grades", {
      text: "It is definitely, definitely not about grades.",
      speaker: VANITA,
      context: "On what excellence in education actually means",
    }),
    "tip-c-sc-main-2",
  );
  spawn(
    "tip-art-sc-quote-defineyourself",
    quotePayload("Define success yourself", {
      text: "Excellence has to be defined, success has to be defined by yourself.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-2",
  );
  spawn(
    "tip-art-sc-quote-failedattempt",
    quotePayload("A failed attempt is still an attempt", {
      text: "A failed attempt is still an attempt.",
      speaker: VANITA,
    }),
    "tip-c-sc-resilience-1",
  );

  spawn(
    "tip-art-sc-quote-notking",
    quotePayload("Content is not king", {
      text: "Content is not king.",
      speaker: VANITA,
      context: "On the biggest shift in education over her career",
    }),
    "tip-c-sc-main-3",
  );
  spawn(
    "tip-art-sc-quote-pivot",
    quotePayload("The teacher as pivot", {
      text: "The teacher in the classroom is your pivot.",
      speaker: VANITA,
    }),
    "tip-c-sc-content-1",
  );
  spawn(
    "tip-art-sc-quote-socialprocess",
    quotePayload("Learning is social", {
      text: "Learning is a social process.",
      speaker: VANITA,
    }),
    "tip-c-sc-content-1",
  );

  spawn(
    "tip-art-sc-quote-pedagogue",
    quotePayload("Best pedagogue in the world", {
      text: "You can be the best pedagogue in the world.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-4",
  );
  spawn(
    "tip-art-sc-quote-responsibility",
    quotePayload("Never runs from responsibility", {
      text: "A good teacher never runs away from responsibility.",
      speaker: VANITA,
    }),
    "tip-c-sc-reality-1",
  );

  spawn(
    "tip-art-sc-quote-nothingeasy",
    quotePayload("Nothing easy about it", {
      text: "There is nothing easy in an international school.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-5",
  );
  spawn(
    "tip-art-sc-quote-demanding",
    quotePayload("Very demanding on teachers", {
      text: "International schools are very demanding on teachers.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-5",
  );

  spawn(
    "tip-art-sc-claim-underpaid",
    claimPayload("Why are Indian teachers underpaid and overworked?", {
      topic: "Why teachers in India are underpaid and overworked relative to their role",
      proposition: {
        speaker: AVYAKT,
        text: "Why do you think teachers in India are so underpaid and overworked?",
      },
      counter: {
        speaker: VANITA,
        text: "We never saw teachers as the architects of the nation.",
      },
    }),
    "tip-c-sc-main-6",
  );
  spawn(
    "tip-art-sc-quote-17yearold",
    quotePayload("A different 17-year-old", {
      text: "The young adult today, the 17 year old today, is very different from the 17 year old of 2000.",
      speaker: VANITA,
    }),
    "tip-c-sc-advantage-1",
  );

  spawn(
    "tip-art-sc-quote-notforprofit",
    quotePayload("Not a for-profit school", {
      text: "We are not a for-profit school.",
      speaker: VANITA,
      context: "On why the school invests heavily in infrastructure",
    }),
    "tip-c-sc-main-7",
  );
  spawn(
    "tip-art-sc-quote-granite",
    quotePayload("Not the granite on the porch", {
      text: "Discerning parents understood the value of what's going on inside the classroom, they did not want the granite on the porch.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-7",
  );

  spawn(
    "tip-art-sc-quote-threethings",
    quotePayload("Teacher training, assessment, pedagogy", {
      text: "Teacher training, assessment and pedagogy — those are the three things that can really add to the good work that's already being done.",
      speaker: VANITA,
    }),
    "tip-c-sc-learn-1",
  );

  spawn(
    "tip-art-sc-quote-spoiling",
    quotePayload("Granite buildings mean nothing", {
      text: "Granite buildings, fancy campus mean nothing if you are not people centric.",
      speaker: VANITA,
    }),
    "tip-c-sc-spoiling-1",
  );

  spawn(
    "tip-art-sc-quote-notcompetitors",
    quotePayload("Not competitors", {
      text: "Parents and school, you are not competitors.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-9",
  );
  spawn(
    "tip-art-sc-quote-notrust",
    quotePayload("When there's no trust", {
      text: "Because when there is no trust in a school where you sent your child, then I am sorry, it's going to be damnation.",
      speaker: VANITA,
    }),
    "tip-c-sc-main-9",
  );

  spawn(
    "tip-art-sc-claim-habit",
    claimPayload("Habit, not passion", {
      topic: "One thing teachers do out of habit rather than passion",
      proposition: {
        speaker: AVYAKT,
        text: "One thing teachers do out of habit, not passion?",
      },
      counter: {
        speaker: VANITA,
        text: "Take attendance.",
      },
    }),
    "tip-c-sc-rapidfire-1",
  );
  spawn(
    "tip-art-sc-claim-goldenrule",
    claimPayload("The one golden rule", {
      topic: "The one golden rule every teacher should follow in class",
      proposition: {
        speaker: AVYAKT,
        text: "If every teacher followed one golden rule in class, what should it be?",
      },
      counter: {
        speaker: VANITA,
        text: "Know your learners.",
      },
    }),
    "tip-c-sc-rapidfire-1",
  );
  spawn(
    "tip-art-sc-claim-helicopter",
    claimPayload("The biggest problem in modern parenting", {
      topic: "The single biggest problem in modern parenting, in one word",
      proposition: {
        speaker: AVYAKT,
        text: "In one word, the biggest problem in modern parenting.",
      },
      counter: {
        speaker: VANITA,
        text: "Helicopter parenting.",
      },
    }),
    "tip-c-sc-rapidfire-1",
  );

  spawn(
    "tip-art-sc-quote-havefaith",
    quotePayload("Have faith", {
      text: "Have faith, have belief in your children, and have belief in yourself if you are an educator.",
      speaker: VANITA,
    }),
    "tip-c-sc-advice-1",
  );
  spawn(
    "tip-art-sc-quote-kindness",
    quotePayload("Kindness as the mantra", {
      text: "Kindness and forgiveness should be our mantra because we are dealing with children.",
      speaker: VANITA,
    }),
    "tip-c-sc-advice-1",
  );

  const MASTHEAD_NODE_IDS = ["tip-art-sc-episode", "tip-art-sc-links"];

  spawn(
    "tip-art-sc-episode",
    episodePayload("The episode", {
      videoTitle: "Teaching Reality: Indian vs International School Boards | British School Director",
      channel: "Schoolcast With Avyakt",
      duration: "54:50",
      url: SCHOOLCAST_VANITA_UPPAL_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/65DU7cn-3nA/maxresdefault.jpg",
      description:
        "Avyakt Sethi sits down with Vanita Uppal OBE, Director of The British School, New Delhi, on what actually separates a good teacher from a good school, and how Indian and international curricula compare.",
      chapters: SCHOOLCAST_VANITA_UPPAL_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-sc-chapter-${index + 1}`,
      })),
    }),
    "tip-c-sc-main-1",
  );
  spawn(
    "tip-art-sc-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: SCHOOLCAST_VANITA_UPPAL_VIDEO_URL },
            { label: "Schoolcast With Avyakt", url: SCHOOLCAST_CHANNEL_URL },
          ],
        },
        {
          label: "Institutions",
          links: [
            { label: "The British School, New Delhi", url: "https://en.wikipedia.org/wiki/The_British_School,_New_Delhi" },
          ],
        },
      ],
    }),
    "tip-c-sc-main-1",
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
    idPrefix: "tip-sc",
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
