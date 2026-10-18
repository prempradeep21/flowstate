import type {
  ArtifactPayload,
  MechanismEdge,
  StickyNoteColorId,
  TableCell,
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
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";
import {
  ALLARI_NARESH_CHAPTERS,
  ALLARI_NARESH_VIDEO_URL,
  allariNareshSpan,
  allariNareshStampOf,
} from "@/lib/transcriptImport/allariNareshInterview";
import {
  chapterDurations,
  countThemes,
} from "@/lib/transcriptImport/transcriptStats";

/*
 * Allari Naresh on Raw Talks with VK — two and a half hours, the longest
 * fixture in the playground by a factor of three.
 *
 * The spine is the creator's: 33 chapters, titles verbatim, with the cold-open
 * "Introduction" dropped (see allariNareshInterview.ts). That makes this the
 * first fixture to test the creator-chapter rule at scale — "a creator list of
 * 40 chapters becomes 40 chapters" — and the first where the titles routinely
 * name a beat that arrives a chapter or two later. Every artifact is placed by
 * the timestamp of its line, never by which title it fits; where a title
 * badly misdescribes its span, a sticky says where the titled topic actually
 * is.
 *
 * Budget. The per-chapter caps (8 primary · 6 reference · 2 sticky) hold in
 * every chapter. The episode total does not: ~80 was set against fixtures of
 * nine to ninety minutes, and spread across 33 chapters it would leave most
 * chapters a single tile. At ~4.6 primaries a chapter this runs to about 150 —
 * the same density as the Kunal Shah fixture, over a conversation fifteen
 * times as long.
 *
 * Three things the source forces:
 *
 * 1. It is a translation. The video is in Telugu; the transcript is the
 *    published English rendering, so every "verbatim" lift is verbatim to that
 *    translation, slips included ("he unit would stay there").
 * 2. No speaker labels. The host's questions are short and the answers long,
 *    so attribution is asserted from the turn structure, and only where it is
 *    unambiguous. Lines Naresh reports someone else saying are attributed to
 *    that person "as he tells it" — the transcript frames them as theirs.
 * 3. Every quote and claim side carries a timestamp measured from the caption
 *    it starts on (allariNareshStampOf), searched for inside its own chapter —
 *    so a line the cold open previews cannot be stamped at the preview.
 */

const NARESH = "Allari Naresh";
const HOST = "Host";
const FATHER = "His father, as he recalls it";

export const TIP_THREAD_AN_MAIN = "tip-thread-an-main";

/** Short names for the chart axes — the creator titles are too long for a tick. */
const CHAPTER_SHORT_NAMES = [
  "Many films a year",
  "EVV's work hack",
  "Kithakithalu",
  "Ravi Babu",
  "Becoming a hero",
  "Allari",
  "New talent",
  "50 films by 33",
  "Comedy's craft",
  "Writing formula",
  "Jabardasth",
  "Comedy running out",
  "PR & politics",
  "Comedy pairings",
  "Cult classics",
  "Amitabh",
  "Losing EVV",
  "Gamyam",
  "EVV's addiction",
  "His brother",
  "Sudden death",
  "Heroes' earnings",
  "Saying no",
  "Advances",
  "Script stories",
  "Sudigadu 2",
  "Set burned",
  "Darkest phase",
  "Remuneration",
  "Theatre politics",
  "After Naandhi",
  "Box office",
  "Regrets",
];

/**
 * The themes the theme chart counts. Word families that literally occur in the
 * translation — no synonyms. "Father" counts the word and E. V. V.'s initials,
 * since he is named both ways throughout.
 */
const ALLARI_NARESH_THEMES = [
  { name: "Comedy", pattern: /\bcom(?:edy|edies|edian|edians|ic)\b/i },
  { name: "His father", pattern: /\b(?:father|dad)\b|E\. V\. V\./i },
  { name: "Money", pattern: /\b(?:money|crores?|lakhs?|remuneration|budgets?|debts?|interest)\b/i },
  { name: "Producers", pattern: /\bproducers?\b/i },
  { name: "Audience", pattern: /\baudiences?\b/i },
  { name: "Theatres", pattern: /\btheatres?\b/i },
  { name: "Serious roles", pattern: /\bserious\b/i },
];

/** Chapter-head summaries, in chapter order — what was said, in our words. */
const SUMMARIES = [
  // 1 · How Allari Naresh Did So Many Movies Every Year
  "Naresh says the release calendar itself changed: in the ’90s and 2000s even major actors needed a release every four months. His eight films of 2008 were a pile-up of financing delays, not a plan. Now quality outranks quantity, and OTT platforms decide release dates alongside producers and distributors.",
  // 2 · EVV's Biggest Work Hack
  "The host notes he started out as a cashier, and Naresh traces his production sense to childhood holidays spent on his father's sets, from the age of eight. He ran the clapboard, kept editing notes and tracked continuity — and at home learned to break every scene into its cost.",
  // 3 · Kithakithalu Controversy
  "His father cast Geetha Singh opposite him in Kithakithalu, and almost everyone objected — to the heroine, to a film without songs, to the risk. Naresh's worry was the money, so he wrote a cost plan. Made for ₹80 lakh, it collected around ₹8 crore.",
  // 4 · Ravi Babu Changed Everything
  "Allari came from Ravi garu, son of his father's friend Chalapathi Rao, whom Naresh got to know in New York at 16. Back in India, Ravi set up the ad agency Flying Frogs in the family's Chennai house — and there, casually, asked why Naresh didn't become a hero.",
  // 5 · How Naresh Became a Hero
  "Ravi cast him in Allari after a photoshoot and told him the story only on the third day of the shoot. His father thought an all-new cast unsafe; Ravi wanted a boy next door. And Ravi kept Naresh's parentage secret until the 100-day poster.",
  // 6 · Allari Changed My Life
  "On release morning he was terrified, the first show was 60% full, and someone at Arjun Theatre gave the film three weeks. He sat outside drinking Thums Up through it. From the matinees it picked up, and it was held into a fourth week.",
  // 7 · Launching New Talent
  "Of the many newcomers he worked with, some narrated brilliantly and couldn't execute, others the reverse — and on film stock there was no cheap way to test them first. The new heroines were about dates, not a mission. His patience with flop debuts comes from his father's own.",
  // 8 · 50 Films by Age 33
  "By his early thirties he had done almost 50 films. Pranam failed, a film he believed in hit election season, and even after Gamyam every distributor brought comedy. His experiments inside comedy, like Laddu Babu's prosthetics, met audiences who now had jokes everywhere.",
  // 9 · Is Comedy the Hardest Genre?
  "From theatre he learned that comedy asks for lost inhibition, total sincerity and timing — room for the house to laugh, and each comedian's own rhythm. He resented being boxed in until his father said those who can make you laugh can do anything. Now he calls it a blessing.",
  // 10 · EVV's Secret Writing Formula
  "E. V. V. used eight or nine writers — the “Nava grahalu” — reading versions aloud and competing into an eighth or ninth draft. On set the comedians improvised more, so a director must know when to say no. His father acted out every scene himself.",
  // 11 · Did Jabardasth Kill Comedy?
  "The host asks whether comedy's abundance on TV wears audiences down; Naresh says comedy only rises and falls. What has shrunk is the space for it: Kithakithalu would be called body-shaming today, and Seema Sastry's religious elements would be a problem.",
  // 12 · Is Comedy Running Out?
  "Writers who succeed at comedy move on to action for budget and fame, leaving a shortage of people who can genuinely write it. His hope is a younger generation writing everyday counters. But jokes now get checked four times, and he won't buy attention with controversy.",
  // 13 · PR & Politics in Tollywood
  "He has a manager but no PR manager, because Allari and Sudigadu found their audiences without one. He turns down comedy drawn from religion or identity. And separate comedy tracks have almost gone — today the hero has to be funny himself.",
  // 14 · His Best Comedy Pairings
  "The hardest timing to match was Krishna Bhagavan's, who dropped lines that weren't in the script with a straight face. His father pointed him at specific actors for specific lessons. And on Seema Sastry, a single word cost Ali 189 takes.",
  // 15 · EVV's Cult Classics
  "From Chennai the family barely registered his father's stardom. Jamba Lakidi Pamba was a story written in 1983 and first titled Reverse Gear, and distributors and senior directors recoiled at it. His father released it himself, and it became a sensation.",
  // 16 · Amitabh's Career Advice
  "Naresh won't remake his father's classics — the artists who made them are gone. Sooryavansham failed in theatres but became a television fixture; his father, nervous about Hindi, made it with an actor-translator and never directed another. At his peak, twenty or thirty cars waited outside.",
  // 17 · Losing EVV Satyanarayana
  "When his father produced Chala Bagundi, a teenage Naresh ended up running the cash. At its 100-day event Amitabh Bachchan told his father to make him a hero; his father sent him to acting classes. Then the talk turns to the illness that began on the Bend Apparao shoot.",
  // 18 · Gamyam Changed My Career
  "The cancer returned after six rounds of chemotherapy, and Naresh was on set even on the day his father died — a choice he still second-guesses. He worked through a year of grief and split the family's responsibilities with his brother. And his father didn't even know about Gamyam.",
  // 19 · The Truth About EVV's Addiction
  "Gamyam's death scene was his one worry: the hero shouldn't take three minutes to die. Hearing Krish's version, he cried. He explains the film's mythic layers, and why he argued that neither the Naxalites nor the police should be shown killing his character.",
  // 20 · Comparison With His Brother
  "The answer was crossfire, so nobody knows whose bullet hit him. The death scene was shot on his birthday, the film was financed ₹5 lakh at a time over 18 months, and his father saw it only when it was finished — and said the decision was right.",
  // 21 · EVV's Sudden Death
  "Nine films with his father gave seven comedy hits and two serious flops, so people assumed his father chose for him. He has stopped minding the criticism. And he is categorical about claims online: his father chain-smoked and drank endless tea, but never alcohol.",
  // 22 · How Much Do Heroes Earn?
  "Asked whether his brother felt the gap between their careers, Naresh says nobody knows whom audiences will accept, and responsibilities fell heavily on Rajesh after their father died. The rest was visibility: Naresh settles into a new unit in two days, Rajesh in five or ten.",
  // 23 · Learning to Say No
  "If you aren't visible people forget you, he tells his brother. Friends openly bet on which of them would make it, which hurt. His father died of multiple organ failure after chemotherapy — and, like Karan Johar's father, left practical instructions, spoken rather than written.",
  // 24 · Why I Never Take Advances
  "At the first diagnosis his father laid out the family's assets, liabilities and rentals. He wanted to sell land to clear the Fitting Master loss; Naresh cleared it with films instead. A round-table at the hospital bed settled the division, and their mother asked for one promise.",
  // 25 · Fake Script Stories 😂
  "They kept that promise even when releasing Bandipotu themselves cost two or three years of Naresh's fees. The property was divided exactly as his father said, with no outsider and no argument. Then Naresh admits he did many films as favours, and saw the cost very late.",
  // 26 · Sudigadu 2 & Fan Wars
  "A first-time director arrives having spent years on a script, expecting a yes. Naresh used to soften his rejections; now he says no directly, so nobody loses a month hoping. And a writer who won't change a single letter loses him, because cinema is collaborative.",
  // 27 · The Set Burned Down!
  "Pressure arrives through assistant directors, relatives and politicians. His firmest rule is about money: he takes payment only when the dates begin, so producers don't pay months of interest on his fee. After Sudigadu he kept the fees he'd agreed — some producers raised them anyway.",
  // 28 · My Darkest Phase
  "With more than 5,000 films at home, he often recognises a pitch as a foreign film, and tells people to buy the rights. Short written pitches can't carry comedy's mechanics — who knows what — so he prefers narrations. Sudigadu itself came from Hot Shots! and Scary Movie.",
  // 29 · Remuneration & Hero Ego
  "A Sudigadu 2 isn't practical now, between fan wars and licensing fees. He corrects the story of a burned set: protesters stopped a Seema Sastry song shoot near Chevella, and his first move was getting the women dancers out. Another protest trapped his unit in Ramoji Film City for three days.",
  // 30 · Theatre Politics Exposed
  "From around 2015 he was still choosing like the old hero, and audiences tired of minimum-guarantee comedies. Maharshi broke the pattern: expecting to be Mahesh Babu's comic friend, he found a role meant to make people cry. Then he took six months off.",
  // 31 · After Nandi... Nothing Worked?
  "Naandhi was 80% done when COVID stopped it; it finished with half a crew and released into half-empty theatres. Word of mouth made it a success and settled the old Pranam regret. Now audiences want comedy back from him — with higher expectations.",
  // 32 · Fake Box Office Collections
  "He wants the character to be visible, not Naresh. On money he calls himself flexible: he keeps the fees he has quoted, charges a supporting role the same as a lead, takes newcomer rates in Tamil, and sometimes lets money go when a schedule overruns.",
  // 33 · Biggest Career Regrets
  "After a flop the whole budget is corrected, and everyone down to the lightmen adjusts. Losing an audience is his real fear, and a hit the only cure. He explains gross versus share and the days-run era, and closes on two roles he turned down: Karthikeya, over snakes, and Gunde Jaari Gallanthayyinde, over romance.",
];

const success = (label: string): TableCell => ({ tags: [{ label, tone: "success" }] });
const warning = (label: string): TableCell => ({ tags: [{ label, tone: "warning" }] });
const danger = (label: string): TableCell => ({ tags: [{ label, tone: "danger" }] });

export function buildAllariNareshCanvasSection(): TranscriptImportCanvasSection {
  if (SUMMARIES.length !== ALLARI_NARESH_CHAPTERS.length) {
    throw new Error("Allari Naresh: one summary per chapter");
  }

  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const threads: Record<string, Thread> = {};
  const threadOrder: string[] = [];

  function addThread(id: string) {
    threads[id] = thread(id, 4 + threadOrder.length);
    threadOrder.push(id);
  }
  addThread(TIP_THREAD_AN_MAIN);

  const head = (chapter: number) => `tip-c-an-main-${chapter}`;

  ALLARI_NARESH_CHAPTERS.forEach((chapter, index) => {
    const id = head(index + 1);
    cards[id] = convCard(id, TIP_THREAD_AN_MAIN, chapter.title, SUMMARIES[index]!);
    cardOrder.push(id);
  });

  /**
   * A sub-branch: its own thread, hanging off a chapter head. Cards are
   * `tip-c-an-<chapter><letter>-<n>`, so `"tip-c-an-5b-1"` reads as chapter 5,
   * second branch, first beat.
   */
  function branch(
    chapter: number,
    letter: string,
    defs: { title: string; summary: string }[],
  ) {
    const threadId = `tip-thread-an-${chapter}${letter}`;
    addThread(threadId);
    const ids = defs.map((_, index) => `tip-c-an-${chapter}${letter}-${index + 1}`);
    defs.forEach((def, index) => {
      const id = ids[index]!;
      cards[id] = convCard(id, threadId, def.title, def.summary, head(chapter));
      cardOrder.push(id);
      connections.push(
        index === 0
          ? conn(head(chapter), id, "bottom", "top")
          : conn(ids[index - 1]!, id, "right", "left"),
      );
    });
  }

  /** Local sugar — every artifact in this file spawns into the same three records. */
  function spawn(nodeId: string, payload: ArtifactPayload, cardId: string) {
    spawnPayload(
      `tip-art-an-${nodeId}`,
      payload,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  }

  function site(id: string, url: string, title: string, cardId: string) {
    spawnWebsite(
      `an-${id}`,
      url,
      title,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  }

  /** Where a verbatim span starts, measured inside the chapter it is filed under. */
  function stamp(chapter: number, text: string): string {
    const { start, end } = ALLARI_NARESH_CHAPTERS[chapter - 1]!;
    return allariNareshStampOf(text, start, end);
  }

  function quote(
    chapter: number,
    nodeId: string,
    title: string,
    text: string,
    context: string,
    cardId: string,
    speaker = NARESH,
  ) {
    spawn(
      nodeId,
      quotePayload(title, { text, speaker, timestamp: stamp(chapter, text), context }),
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
        proposition: { ...proposition, timestamp: stamp(chapter, proposition.text) },
        counter: { ...counter, timestamp: stamp(chapter, counter.text) },
      }),
      cardId,
    );
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
    events: { at: string; label: string; highlight?: boolean }[],
    cardId: string,
  ) {
    spawn(
      nodeId,
      {
        type: "timeline",
        title,
        data: {
          scale: "year",
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

  function map(
    nodeId: string,
    title: string,
    center: { name: string; lat: number; lng: number },
    zoom: number,
    places: { id: string; label: string; lat: number; lng: number }[],
    cardId: string,
  ) {
    spawn(
      nodeId,
      { type: "map", title, data: { place: center, zoom, savedPlaces: places } },
      cardId,
    );
  }

  /** Year-only dates sit on January 1st, which the year scale renders as the year. */
  const year = (y: number) => `${y}-01-01T12:00:00.000Z`;

  /*
   * Extracted artifacts, chapter by chapter. Every quote text, claim side and
   * definition gloss is a verbatim lift from ALLARI_NARESH_TRANSCRIPT —
   * transcriptFidelity.test.ts asserts it, and stamp() throws at build time if
   * a span is missing from its chapter. Table cells, mechanism steps and todo
   * labels are condensed phrases from the same spans.
   */

  // ---- 1 · How Allari Naresh Did So Many Movies Every Year — 7 primary, 1 reference
  branch(1, "a", [
    {
      title: "Eight films in 2008",
      summary:
        "In 2008 he had eight releases, and in some months three of his films came out together — a fan in Warangal called to say all three screens of one complex were playing him. He insists none of it was deliberate. Financing delays held some films back, and when one became a hit, producers sitting on finished films released them to ride the momentum.",
    },
    {
      title: "Another member at the table",
      summary:
        "Release dates used to be settled by the actor, producer and distributor around holidays. Now OTT partners decide too: each takes a few releases a month and needs about a month to promote. With about five major players taking roughly twelve films a year each, a missed slot can mean waiting a year.",
    },
  ]);
  branch(1, "b", [
    {
      title: "No time to sleep",
      summary:
        "Finishing Gamyam, he shot the death scene on his birthday in Rampachodavaram, bathed on set, caught the overnight train from Rajahmundry, and left home again at seven for the Visakha Express shoot. Even now some days run 18 or 19 hours, and Ugram's night shoots ran until six in the morning.",
    },
    {
      title: "Why the cast pushes the hours",
      summary:
        "Film work has no fixed timings: one day the combination needs an actor for an hour, another day for the whole scene. On a fixed budget, finishing in one day instead of spilling into a second saves the producer another round of location charges and transportation. So the cast sometimes pushes itself to keep the producer's costs down.",
    },
  ]);
  spawn(
    "stat-2008",
    statPayload("His 2008", {
      value: "8",
      unit: "films",
      label: "Released in 2008 — in some months, three of them came out together",
      speaker: NARESH,
    }),
    "tip-c-an-1a-1",
  );
  chain(
    "mech-pileup",
    "How eight films landed in a year",
    [
      { id: "delays", label: "Financial delays push some films back" },
      { id: "pile", label: "Finished films pile up" },
      { id: "hit", label: "One film becomes a big hit" },
      {
        id: "momentum",
        label: "Producers release to ride the momentum",
        note: "Many of them new, unsure of the right window",
      },
      { id: "month", label: "Three releases in the same month" },
    ],
    "tip-c-an-1a-1",
    [
      { from: "delays", to: "pile" },
      { from: "pile", to: "momentum" },
      { from: "hit", to: "momentum", label: "then if" },
      { from: "momentum", to: "month" },
    ],
  );
  table(
    "table-release",
    "Who picks the release date",
    [
      ["seat", "Seat"],
      ["then", "Earlier"],
      ["now", "Today"],
    ],
    [
      { seat: "Actor", then: success("At the table"), now: success("At the table") },
      { seat: "Producer", then: success("At the table"), now: success("At the table") },
      { seat: "Distributor", then: success("At the table"), now: success("At the table") },
      {
        seat: "OTT partner",
        then: "—",
        now: { value: "Needs about a month to promote", tags: [{ label: "New seat", tone: "warning" }] },
      },
    ],
    "tip-c-an-1a-2",
  );
  spawn(
    "stat-ott",
    statPayload("OTT capacity", {
      value: "Roughly 12 × 5",
      label:
        "Films a year: about five major OTT players, roughly 12 slots each — once they fill, you wait for the next calendar year",
      speaker: NARESH,
    }),
    "tip-c-an-1a-2",
  );
  spawn(
    "stat-45days",
    statPayload("Ramba Urvasi Menaka", {
      value: "45",
      unit: "days",
      label: "To finish Ramba Urvasi Menaka — so two films a year is about OTT slots, not his pace",
      speaker: NARESH,
    }),
    head(1),
  );
  chain(
    "mech-overnight",
    "From the death scene to the next set",
    [
      { id: "wrap", label: "Death scene wraps in Rampachodavaram", note: "By 6:30 in the evening" },
      { id: "bath", label: "A bath right there near the set" },
      { id: "car", label: "By car to Rajahmundry" },
      { id: "train", label: "The Gautami Godavari train", note: "Around 8:30" },
      { id: "hyd", label: "Hyderabad", note: "Around 5:30 the next morning" },
      { id: "home", label: "Home by 6, ready" },
      { id: "next", label: "Leaves by 7 for the Visakha Express shoot" },
    ],
    "tip-c-an-1b-1",
  );
  // Coordinates are lookups for the three places he names on that night's route.
  map(
    "map-route",
    "Rampachodavaram to Hyderabad",
    { name: "Rajahmundry", lat: 17.0005, lng: 81.804 },
    6,
    [
      { id: "an-rampa", label: "Rampachodavaram — the Gamyam set", lat: 17.4426, lng: 81.7764 },
      { id: "an-rjy", label: "Rajahmundry — the overnight train", lat: 17.0005, lng: 81.804 },
      { id: "an-hyd", label: "Hyderabad — home by 6", lat: 17.385, lng: 78.4867 },
    ],
    "tip-c-an-1b-1",
  );
  quote(
    1,
    "quote-ninetofive",
    "Not a nine-to-five job",
    "Film work doesn’t have fixed timings. It’s not a nine-to-five job.",
    "On why some days still run 18 or 19 hours",
    "tip-c-an-1b-2",
  );

  // ---- 2 · EVV's Biggest Work Hack — 5 primary
  branch(2, "a", [
    {
      title: "A holiday at Central Jail",
      summary:
        "His father's schedules ran 45 or 50 days at a stretch — Vizag, Rajahmundry, Hyderabad — and the unit stayed put even through four-day breaks. So he fought to be taken along. The first shoot he remembers is the film 420 at Rajahmundry Central Jail, where he wasn't scared of the prisoners who sat watching them shoot.",
    },
    {
      title: "Marking the okay takes",
      summary:
        "On later shoots like Jamba Lakidi Pamba he handled the clapboard and kept the editing notes: which take was okay after each shot, and when two were good, “Decide in the edit.” Marking them spares the editor from sitting through every take. He also tracked continuity — what people wore from one scene to the next, and the props.",
    },
  ]);
  branch(2, "b", [
    {
      title: "Two films, one office",
      summary:
        "His father often ran an A unit and a B unit, alternating fifteen days on one film and fifteen on the other — Alluda Majaka and Aame were shot side by side. Both teams worked out of the office next to the guest house, where scene papers came in from each writer to be read and argued over. The lesson he took was that criticising afterwards is easy; making it is the hard part.",
    },
    {
      title: "Pricing a scene",
      summary:
        "The production habit was to break every scene into what it needs: which artists and their timings, and the props — for a wedding, the mangalsutra, jeelakarra-bellam and decorations. Then estimate the cost, and what finishing in a day and a half instead of two would save. That, he says, is how he learned.",
    },
  ]);
  quote(
    2,
    "quote-jail",
    "Barely eight",
    "He took me to Central Jail. I was barely eight years old.",
    "His first shoot — the film 420, at Rajahmundry Central Jail",
    "tip-c-an-2a-1",
  );
  spawn(
    "def-edit",
    definitionPayload("Decide in the edit", {
      term: "Decide in the edit",
      gloss: "We’d mark both as okay and later choose whichever worked best in the edit room.",
      speaker: NARESH,
    }),
    "tip-c-an-2a-2",
  );
  spawn(
    "stat-takes",
    statPayload("Unmarked takes", {
      value: "All 18 takes",
      label:
        "What the editor has to watch without notes — with “Take 11 okay, Take 18 okay” marked, he compares just those two",
      speaker: NARESH,
    }),
    "tip-c-an-2a-2",
  );
  quote(
    2,
    "quote-criticize",
    "Making versus judging",
    "It’s very easy to criticize something after it’s made—to sit here and say, “This is good, that is bad.” Creating it in the first place is the hard part.",
    "On reading the scene papers each writer sent in",
    "tip-c-an-2b-1",
  );
  chain(
    "mech-pricing",
    "Pricing a scene",
    [
      { id: "artists", label: "List the artists required and their timings" },
      {
        id: "props",
        label: "List the props",
        note: "A wedding: the mangalsutra, jeelakarra-bellam, decorations",
      },
      { id: "cost", label: "Calculate the cost" },
      { id: "two", label: "Two days costs this much" },
      { id: "save", label: "One or one-and-a-half days saves this much" },
    ],
    "tip-c-an-2b-2",
    [
      { from: "artists", to: "props" },
      { from: "props", to: "cost" },
      { from: "cost", to: "two", label: "if it takes" },
      { from: "cost", to: "save", label: "if we can finish it in" },
    ],
  );

  // ---- 3 · Kithakithalu Controversy — 5 primary, 1 reference
  branch(3, "a", [
    {
      title: "Everyone had a doubt",
      summary:
        "People asked his father whether he had lost his mind casting Geetha Singh, and whether Telugu audiences would watch a film without songs. But the casting was exactly the concept. Tell ten people the idea, Naresh says, and nine would ask why anyone would watch it.",
    },
  ]);
  branch(3, "b", [
    {
      title: "Reverse-engineering the budget",
      summary:
        "He argued for lower fees and a reverse-engineered budget, so the risk couldn't lose too much. Given a day, he wrote the plan: no Sundays or festival days, no double call sheets, fewer extras, locations they controlled. He first says ₹80 crore, then corrects himself — ₹80 lakh.",
    },
  ]);
  claim(
    3,
    "claim-heroine",
    "The heroine",
    "Whether Kithakithalu needed a glamorous heroine",
    {
      speaker: "Commonly asked, as he reports it",
      text: "Why not cast a glamorous heroine who is currently in demand?",
    },
    { speaker: NARESH, text: "But that was exactly the concept." },
    "tip-c-an-3a-1",
  );
  spawn(
    "stat-ninein10",
    statPayload("Who'd have said no", {
      value: "Nine in ten",
      label: "People who'd ask “Why would anyone watch a film with her as the heroine?”",
      speaker: NARESH,
    }),
    "tip-c-an-3a-1",
  );
  table(
    "table-doubts",
    "The other doubts",
    [
      ["doubt", "Doubt"],
      ["asked", "As it was put"],
    ],
    [
      { doubt: "The songs", asked: "Will Telugu audiences watch a film without songs?" },
      { doubt: "The timing", asked: "Why take this risk when he’s in a good growth phase?" },
      { doubt: "The genre", asked: "Why are you putting him in an experimental genre?" },
    ],
    "tip-c-an-3a-1",
  );
  todo(
    "todo-plan",
    "The ₹80 lakh plan",
    [
      "Don’t shoot on Sundays",
      "Don’t shoot on festival days",
      "Avoid double call sheets and double shifts",
      "Use the bundled track and trolley efficiently",
      "Limit the extras",
      "Shoot in places you control — friends’ houses, the guest house, the office",
    ],
    "tip-c-an-3b-1",
  );
  spawn(
    "stat-kithakithalu",
    statPayload("Kithakithalu", {
      value: "₹8 crore",
      label: "Collected, around — by a film made for ₹80 lakh. “That was the value of planning”",
      delta: { from: "₹80 lakh", to: "₹8 crore" },
      speaker: NARESH,
    }),
    "tip-c-an-3b-1",
  );
  site("kithakithalu", "https://en.wikipedia.org/wiki/Kithakithalu", "Kithakithalu", "tip-c-an-3b-1");

  // ---- 4 · Ravi Babu Changed Everything — 4 primary, 1 sticky
  branch(4, "a", [
    {
      title: "Not hero material",
      summary:
        "He had done a guest appearance or two as a child without any fear, but braces, a skinny frame and barely a beard made him self-conscious as a teenager. Visitors kept saying the elder boy should be the hero and the younger should go into direction. So when Ravi asked, he answered with a shrug: everyone keeps saying it, so why not one film?",
    },
  ]);
  chain(
    "mech-ravi",
    "How Ravi came home",
    [
      { id: "surgery", label: "Surgery in the US, at 16" },
      { id: "ny", label: "Two or three weeks with Ravi in New York" },
      {
        id: "alone",
        label: "“Your father will be alone here”",
        note: "His father, persuading Ravi to come back",
      },
      { id: "back", label: "Ravi returns and makes Mamidakulu" },
      { id: "frogs", label: "Flying Frogs, on the Chennai ground floor" },
      { id: "hero", label: "“Why don’t you become a hero?”" },
    ],
    head(4),
    [
      { from: "surgery", to: "ny" },
      { from: "ny", to: "alone", label: "later" },
      { from: "alone", to: "back" },
      { from: "back", to: "frogs" },
      { from: "frogs", to: "hero", label: "then one day" },
    ],
  );
  spawn(
    "def-frogs",
    definitionPayload("Flying Frogs", {
      term: "Flying Frogs",
      gloss: "They used to make ads, jingles and related work in Chennai.",
      speaker: NARESH,
    }),
    head(4),
  );
  quote(
    4,
    "quote-heromaterial",
    "Hero material",
    "I kept wondering whether this face was really hero material.",
    "On being skinny, in braces and barely bearded as a teenager",
    "tip-c-an-4a-1",
  );
  quote(
    4,
    "quote-elderboy",
    "The younger boy",
    "The elder boy looks great, make him the hero. Let the younger boy go into direction.",
    "What visitors to the house kept saying",
    "tip-c-an-4a-1",
    "Visitors at home, as he recalls it",
  );
  sticky(
    "sticky-ravi",
    "Ravi garu is Ravi Babu",
    "The chapter title's Ravi Babu is the man Naresh calls Ravi garu and Allari Ravi — Chalapathi Rao's only son, and the director who would cast him.",
    "violet",
    head(4),
  );
  /*
   * E. V. V. and Ravi Babu get no tiles: neither Wikipedia page yields a
   * preview image, and a blank globe is a bookmark, not a source. Both sit in
   * the masthead's link directory instead.
   */

  // ---- 5 · How Naresh Became a Hero — 6 primary, 1 reference
  branch(5, "a", [
    {
      title: "The story on day three",
      summary:
        "Shooting began on the 24th without Ravi telling him the story. On the 26th some equipment was delayed, so Ravi had the writer Nivas narrate it to him on the pavement in front of Basavatarakam Cancer Hospital. Naresh had always wanted to come in from outside — not, like Hrithik Roshan, launched by his own father.",
    },
    {
      title: "The boy next door",
      summary:
        "His father told Ravi to make one successful film before experimenting with an all-new cast. Ravi's answer was that the character needed innocence and a little foolishness — someone between child and grown man who thinks he knows everything. His father left the call to Ravi.",
    },
  ]);
  branch(5, "b", [
    {
      title: "Nobody knew whose son",
      summary:
        "There was a single private screening on May 9 for Suresh Babu, his father, Ravi and a few others — the day Nagarjuna's Santosham released and became a big hit. Ravi insisted no one should know whose son the new hero was, with Naresh's elder brother being launched two weeks later and already all over the news. The public found out from the 100th-day poster.",
    },
  ]);
  spawn(
    "stat-day3",
    statPayload("When he heard the story", {
      value: "The third day",
      label: "Of the shoot — narrated by the writer Nivas on a pavement in front of Basavatarakam Cancer Hospital",
      speaker: NARESH,
    }),
    "tip-c-an-5a-1",
  );
  quote(
    5,
    "quote-outside",
    "From outside",
    "I wanted to come in from outside. I didn’t want my first film to be with my father.",
    "On why his debut wasn't one of his father's films",
    "tip-c-an-5a-1",
  );
  claim(
    5,
    "claim-casting",
    "Casting a newcomer",
    "Whether a new director should launch an all-new hero",
    {
      speaker: "His father, as Naresh tells it",
      text: "First make one successful film, then experiment.",
    },
    {
      speaker: "Ravi Babu, as Naresh tells it",
      text: "Uncle, this is exactly the kind of character I need. He has to look like the boy next door, like one of us.",
    },
    "tip-c-an-5a-2",
  );
  /*
   * Three of these four events fall within a day of each other, which a
   * timeline axis stacks on one spot — so the release week is a dated table.
   * Every date is the transcript's own.
   */
  table(
    "table-release-week",
    "Release week",
    [
      ["when", "When"],
      ["what", "What happened"],
    ],
    [
      { when: "May 9", what: "One private screening — Suresh Babu, his father, Ravi" },
      { when: "May 9", what: "Nagarjuna's Santosham releases, and is a big hit" },
      { when: "May 10", what: { value: "Allari releases", tags: [{ label: "Debut", tone: "info" }] } },
      { when: "100th day", what: "The poster names him E. V. V.'s second son" },
    ],
    "tip-c-an-5b-1",
  );
  quote(
    5,
    "quote-whoseson",
    "Ravi's rule",
    "Under no circumstances should anyone know whose son this boy is.",
    "Kept until the 100-day celebration",
    "tip-c-an-5b-1",
    "Ravi Babu, as Naresh tells it",
  );
  chain(
    "mech-quiet",
    "Why the debut went quietly",
    [
      { id: "brother", label: "His brother is launched around the same time" },
      { id: "spot", label: "The spotlight is already on one son" },
      { id: "quiet", label: "“Let’s go quietly”" },
      { id: "none", label: "No expectations, no baggage" },
      { id: "poster", label: "Revealed on the 100th-day poster" },
    ],
    "tip-c-an-5b-1",
  );
  site("allari", "https://en.wikipedia.org/wiki/Allari_(film)", "Allari (2002)", head(5));

  // ---- 6 · Allari Changed My Life — 5 primary
  branch(6, "a", [
    {
      title: "Five bottles by the interval",
      summary:
        "He couldn't watch the film, so he sat outside drinking Thums Up, and by the interval had finished five bottles, hoping he'd at least get to do five films in his life. People coming out said it was good, but he assumed that is what anyone tells a hero to his face.",
    },
    {
      title: "Before the phone told you",
      summary:
        "He was 19 and had no instinct yet for what success felt like. Today, he says, you can tell within hours from whether the phone keeps ringing. Back then the only answer was whether the film held on in the theatres.",
    },
  ]);
  spawn(
    "stat-60",
    statPayload("The first show", {
      value: "60% full",
      label: "His first show, mostly teenagers — and his mind went straight to the missing 40%",
      speaker: NARESH,
    }),
    head(6),
  );
  chain(
    "mech-firstweeks",
    "Allari's first weeks",
    [
      { id: "first", label: "First show, around 60% full" },
      { id: "doubt", label: "At Arjun: “won’t run beyond three weeks”" },
      { id: "pick", label: "It picks up from the matinee shows" },
      { id: "fourth", label: "Held at Arjun into the fourth week" },
      { id: "hundred", label: "Genuinely runs 100 days in a few centres" },
    ],
    head(6),
  );
  spawn(
    "stat-bottles",
    statPayload("Release-day nerves", {
      value: "Five bottles",
      label: "Of Thums Up, drunk outside the theatre by the interval of his first film",
      speaker: NARESH,
    }),
    "tip-c-an-6a-1",
  );
  quote(
    6,
    "quote-fivefilms",
    "First and last",
    "At least let me somehow do five films in my life. This may be my first and last.",
    "What he was thinking, outside, during the first show",
    "tip-c-an-6a-1",
  );
  quote(
    6,
    "quote-phone",
    "The phone test",
    "if your phone keeps ringing, the film is working; if there are no calls, you know it’s gone.",
    "How a release reads today, compared with his debut",
    "tip-c-an-6a-2",
  );

  // ---- 7 · Launching New Talent — 6 primary
  branch(7, "a", [
    {
      title: "Testing a director",
      summary:
        "Back then the only vetting was asking who a director had assisted, and you found out on the second or third day whether he knew the job. Today you can spend two or three lakhs on test scenes with dummy artists and a stand-in. That matters most to a producer putting ₹10 or ₹15 crore behind a newcomer.",
    },
    {
      title: "Why so many new heroines",
      summary:
        "With four to six films running at once and ensembles of Brahmanandam, Ali and Raghu Babu to schedule around, an in-demand heroine's dates would clash. He needed someone who would come tomorrow if a shoot was suddenly called. It was convenience and availability, he says — not a mission to introduce newcomers.",
    },
  ]);
  branch(7, "b", [
    {
      title: "Owning the misses",
      summary:
        "His father's first film as a director was a flop, and Naidu garu backed him for the second anyway, so Naresh has repeatedly worked with directors whose first film failed. Some of those decisions were good and some were bad. He owns all of them.",
    },
  ]);
  table(
    "table-narrate",
    "Narrators and makers",
    [
      ["who", "Newcomer"],
      ["narrate", "Narration"],
      ["execute", "Execution"],
    ],
    [
      { who: "Some", narrate: success("Extraordinarily well"), execute: danger("Can’t execute it") },
      { who: "Others", narrate: danger("Poor narrators"), execute: success("Make it brilliantly") },
    ],
    head(7),
  );
  spawn(
    "stat-can",
    statPayload("A can of film", {
      value: "₹14,000",
      label: "What each can of film cost — producers gave four cans to finish three scenes",
      speaker: NARESH,
    }),
    "tip-c-an-7a-1",
  );
  table(
    "table-vetting",
    "Vetting a new director",
    [
      ["aspect", ""],
      ["then", "Then"],
      ["now", "Today"],
    ],
    [
      { aspect: "The test", then: "“Who did you assist?”", now: "Test scenes with dummy artists" },
      { aspect: "The cost", then: "—", now: "Two or three lakhs" },
      { aspect: "You find out", then: "Only after starting", now: "From a demo with a stand-in" },
    ],
    "tip-c-an-7a-1",
  );
  chain(
    "mech-heroines",
    "Why the heroines were new",
    [
      { id: "films", label: "Four, five, sometimes six films at once" },
      { id: "ensemble", label: "Huge comedy ensembles to schedule around" },
      { id: "clash", label: "A heroine in demand — her dates clash" },
      { id: "tomorrow", label: "Need someone who'll say “I’ll come” tomorrow" },
      { id: "new", label: "Newcomers, for convenience and availability" },
    ],
    "tip-c-an-7a-2",
  );
  quote(
    7,
    "quote-baby",
    "Not my baby",
    "Just because a baby isn’t born perfectly, or doesn’t turn out exactly as expected, you don’t say, “That isn’t my baby.”",
    "On the films with first-time directors that didn't work",
    "tip-c-an-7b-1",
  );
  quote(
    7,
    "quote-onefilm",
    "One film",
    "One film doesn’t decide someone’s ability.",
    "Why he works with directors whose first film failed",
    "tip-c-an-7b-1",
  );

  // ---- 8 · 50 Films by Age 33 — 5 primary, 1 reference
  branch(8, "a", [
    {
      title: "Released into an election",
      summary:
        "One film he was certain would be the biggest of his career — certain enough to turn down four or five projects to wait for it — released in election season. Political hoardings left no space to promote it, and audiences' minds were on rallies, not entertainment. It took him a while to recover, until Kithakithalu.",
    },
    {
      title: "Ten stories, ten comedies",
      summary:
        "After Gamyam was accepted he should have balanced comedy with other kinds of films, he says. But every distributor and director brought comedy, citing Pranam as proof that serious roles didn't work for him. So he gave them what they expected — and after Sudigadu became a huge hit, experimented inside comedy instead.",
    },
  ]);
  branch(8, "b", [
    {
      title: "Laddu Babu's prosthetics",
      summary:
        "Everyone knew Naresh as a thin guy, so Laddu Babu asked what if he were obese, and covered him in heavy prosthetics. In theatres people said they never saw Naresh. Meanwhile television, Facebook and social media were circulating jokes constantly, and comedy itself was changing.",
    },
  ]);
  quote(
    8,
    "quote-trustme",
    "Waiting for a hit",
    "No, this is going to be a big hit. Trust me,",
    "Turning down four or five projects to wait for one release",
    "tip-c-an-8a-1",
  );
  /*
   * Class C with resolved dates. Every film is named in this chapter (the 3D
   * action-comedy is named Action 3D at 2:25:40); the years come from each
   * film's Wikipedia page, and Sudigadu and Action 3D carry their release days.
   */
  timeline(
    "timeline-career",
    "Leaving comedy, and coming back",
    [
      { at: year(2003), label: "Pranam — didn’t succeed" },
      { at: year(2006), label: "Kithakithalu brings him back" },
      { at: year(2008), label: "Gamyam is accepted" },
      { at: year(2010), label: "Shambo Shiva Shambo — serious, with some fun" },
      { at: "2012-08-24T12:00:00.000Z", label: "Sudigadu becomes a huge hit" },
      { at: "2013-06-21T12:00:00.000Z", label: "A 3D action-comedy — nearly two years" },
      { at: year(2014), label: "Laddu Babu, in heavy prosthetics" },
      { at: year(2019), label: "After Maharshi: “I need to change a little”", highlight: true },
    ],
    "tip-c-an-8a-2",
  );
  chain(
    "mech-box",
    "How the box stayed shut",
    [
      { id: "pranam", label: "Pranam didn’t work" },
      { id: "scripts", label: "Every script that comes is a comedy", note: "If ten stories came, all ten were comedies" },
      { id: "told", label: "“Serious films don’t work for you, sir”" },
      { id: "expect", label: "“They expect only comedy from me”" },
      { id: "give", label: "Give them what they expect" },
    ],
    "tip-c-an-8a-2",
  );
  spawn(
    "stat-face",
    statPayload("His face in Laddu Babu", {
      value: "Barely ten minutes",
      label: "Of his real face on screen — the rest is all prosthetics",
      speaker: NARESH,
    }),
    "tip-c-an-8b-1",
  );
  quote(
    8,
    "quote-fatman",
    "What audiences saw",
    "We never saw Naresh. We only saw some fat man,",
    "What many people said of Laddu Babu",
    "tip-c-an-8b-1",
    "Audiences, as he reports it",
  );
  site("laddu-babu", "https://en.wikipedia.org/wiki/Laddu_Babu", "Laddu Babu", "tip-c-an-8b-1");

  // ---- 9 · Is Comedy the Hardest Genre? — 5 primary
  branch(9, "a", [
    {
      title: "Letting the theatre settle",
      summary:
        "In a run of punches the audience laughs at the first, and if the next line comes immediately, the third and fourth are buried under the laughter. So you wait three or four seconds before the next beat. And every comedian's timing is different — M. S. Narayana, Ali, Raghu Babu and Brahmanandam each had their own — so you match each one.",
    },
  ]);
  branch(9, "b", [
    {
      title: "Why can't I do serious roles?",
      summary:
        "He used to complain that his father had made so many comedies with him that comedy had become his brand. His father's reply named Rajinikanth, Chiranjeevi and Amitabh Bachchan — superstars who all have terrific comic timing. Making people laugh, his father added, is a rare gift when so many people live with depression.",
    },
    {
      title: "Comedy's reach",
      summary:
        "He understood it later, visiting hospitals: nurses told him the images of the day follow them home to dinner. Channels like Aditya Comedy, which played only comedy scenes, were how people unwound. Now he sees making people laugh as a blessing.",
    },
  ]);
  quote(
    9,
    "quote-skin",
    "One layer of skin",
    "For comedy to work, you need to shed one layer of your skin—one layer of self-consciousness.",
    "What his teacher told him as a theatre artist",
    head(9),
    "His acting teacher, as he recalls it",
  );
  quote(
    9,
    "quote-serious",
    "Serious business",
    "we ourselves must not laugh. Comedy is serious business.",
    "The laughter has to come from the character's innocence",
    head(9),
  );
  spawn(
    "stat-settle",
    statPayload("Let the theatre settle", {
      value: "Three or four seconds",
      label: "Before the next punch — fire sooner and the third and fourth punches get buried under the laughter",
      speaker: NARESH,
    }),
    "tip-c-an-9a-1",
  );
  claim(
    9,
    "claim-boxed",
    "Boxed into comedy",
    "Whether being typecast in comedy holds an actor back",
    {
      speaker: NARESH,
      text: "Why can’t I do different roles? Why am I being pushed into only comedy?",
    },
    {
      speaker: FATHER,
      text: "A person who can make people laugh can also make them cry. But someone who can make them cry may not be able to make them laugh.",
    },
    "tip-c-an-9b-1",
  );
  chain(
    "mech-reach",
    "How comedy reaches a hospital",
    [
      { id: "day", label: "All day: people crying, blood, suffering" },
      { id: "dinner", label: "The images keep haunting them at dinner" },
      { id: "relief", label: "They need some relief" },
      { id: "clips", label: "Comedy clips — a channel like Aditya Comedy" },
      { id: "blessing", label: "Making people laugh as a blessing" },
    ],
    "tip-c-an-9b-2",
  );

  // ---- 10 · EVV's Secret Writing Formula — 5 primary
  branch(10, "a", [
    {
      title: "Nine writers, nine versions",
      summary:
        "L. B. Sriram would read out his version while Babu Rao threw in a counter, and his father noted down the extra lines. Writers from Tamil and Telugu competed over whose dialogue made it into the scene. The drafts were refined until the final screenplay was perhaps the eighth or ninth.",
    },
    {
      title: "When to say no",
      summary:
        "Then the comedians on set wanted to add more. A sequence allotted two minutes can grow to three or three and a half, so the director has to judge whether an addition improves the scene or breaks its rhythm. Naresh still turns ideas down when a film is already too long — they'll use it in the next one.",
    },
  ]);
  branch(10, "b", [
    {
      title: "Three ways to brief an actor",
      summary:
        "Some directors explain the characterization in detail, some hand over the character and let you own it, and some demonstrate. Ravi and his father were demonstrators — his father would act out every role, even for Krishna Bhagavan. Naresh grew up calling Brahmanandam “Brahma Uncle”, which took the nerves out of working with them.",
    },
  ]);
  spawn(
    "def-navagrahalu",
    definitionPayload("Nava grahalu", {
      term: "Nava grahalu",
      gloss: "nine planets",
      speaker: NARESH,
    }),
    head(10),
  );
  chain(
    "mech-drafts",
    "From nine drafts to one",
    [
      { id: "write", label: "Everyone writes a version" },
      { id: "read", label: "Versions are read aloud", note: "L. B. Sriram reading his" },
      { id: "counter", label: "Others throw in counters", note: "“Did you eat dosa or what?”" },
      { id: "note", label: "His father notes the extra lines" },
      { id: "compete", label: "A healthy competition over whose lines make it" },
      { id: "final", label: "Refined to the eighth or ninth draft" },
    ],
    "tip-c-an-10a-1",
  );
  spawn(
    "stat-sequence",
    statPayload("An improvised sequence", {
      value: "three-and-a-half minutes",
      label: "What a sequence allotted two minutes can become if every on-set addition stays",
      delta: { from: "two minutes", to: "three-and-a-half minutes" },
      speaker: NARESH,
    }),
    "tip-c-an-10a-2",
  );
  table(
    "table-briefing",
    "How directors brief actors",
    [
      ["style", "Director"],
      ["how", "How"],
      ["who", "Who"],
    ],
    [
      { style: "Explains everything", how: "Characterization, behaviour, how a miser would react", who: "—" },
      { style: "Leaves it to you", how: "“Own it in your style.”", who: "—" },
      { style: "Demonstrates", how: "Acts it out — “he’ll enter like this…”", who: "Ravi garu, his father" },
    ],
    "tip-c-an-10b-1",
  );
  quote(
    10,
    "quote-copy80",
    "Copy 80%",
    "Just copy 80% of whatever he does and he’ll say okay.",
    "Joking about how his father demonstrated every scene",
    "tip-c-an-10b-1",
    "M. S. Narayana, as Naresh recalls it",
  );

  // ---- 11 · Did Jabardasth Kill Comedy? — 5 primary
  branch(11, "a", [
    {
      title: "Spoofs on a weekly clock",
      summary:
        "A film spoofing his film might release four months later; television can spoof this week's release next week. Everything became instantly available, which he calls the real difference between then and now.",
    },
  ]);
  branch(11, "b", [
    {
      title: "Films he couldn't make today",
      summary:
        "Laddu Babu might still pass, because the hero accepts his own body; standing there insulting an overweight heroine would be body-shaming. Earlier, Kota hitting Babu Mohan on the back got a laugh; today someone might call it inhuman. You can't joke about colour or creed any more.",
    },
  ]);
  claim(
    11,
    "claim-tolerance",
    "Too much comedy?",
    "Whether endless comedy wears audiences out",
    {
      speaker: HOST,
      text: "With this abundance and constant availability of content, doesn’t the audience’s tolerance for comedy reduce?",
    },
    {
      speaker: NARESH,
      text: "I don’t think comedy ever goes away. It always has its place, though there are ups and downs.",
    },
    head(11),
  );
  spawn(
    "stat-2015",
    statPayload("The peak", {
      value: "Around 2015",
      label: "When comedy shows peaked — and when, nearly 50 comedies in, people began asking “Is this all he does?”",
      speaker: NARESH,
    }),
    head(11),
  );
  table(
    "table-clock",
    "Comedy's clock",
    [
      ["what", ""],
      ["then", "Then"],
      ["now", "Now"],
    ],
    [
      { what: "Where you watched", then: "Mainly in a movie theatre", now: "At home, on TV comedy shows" },
      { what: "Spoofing a new film", then: "Another film, four months later", now: "Television, next week" },
      { what: "Spoofing a statement", then: "Only in films", now: "By the afternoon" },
    ],
    "tip-c-an-11a-1",
  );
  table(
    "table-today",
    "Could he make it today?",
    [
      ["film", "Film"],
      ["verdict", "Today"],
      ["why", "Why"],
    ],
    [
      { film: "Kithakithalu", verdict: danger("Can’t make it"), why: "People would say it’s body-shaming" },
      { film: "Laddu Babu", verdict: warning("May still be accepted"), why: "His character accepts his body" },
      { film: "Seema Sastry", verdict: danger("Would be difficult"), why: "There are religious elements" },
    ],
    "tip-c-an-11b-1",
  );
  quote(
    11,
    "quote-inhuman",
    "Then and now",
    "Earlier, if Kota garu hit Babu Mohan garu on the back and he fell, people laughed. Today someone might say, “That’s inhuman.”",
    "On how much more aware audiences have become",
    "tip-c-an-11b-1",
  );

  // ---- 12 · Is Comedy Running Out? — 4 primary
  branch(12, "a", [
    {
      title: "The two-sheet test",
      summary:
        "He hands aspiring writers two sheets of paper and asks them to write something; after an hour many still can't. Asked for four or five punch lines on a sequence, most produce lines that sound heard in another movie. Organic comedy, he says, is that hard to write.",
    },
    {
      title: "The new writers",
      summary:
        "What gives him hope are writers around 22 or 23 who skip the big “high moments” for everyday exchanges — husband and wife, mother and son, a father's usual comments and counters. People connect with them immediately.",
    },
  ]);
  branch(12, "b", [
    {
      title: "Travelling on its own merit",
      summary:
        "Now the boundaries are narrow: jokes get checked four times while writing and questioned again while acting. He hates being told that a controversy will reach the audience faster. If a film is genuinely funny, word of mouth will spread it — and if it's bad, that will spread too.",
    },
  ]);
  chain(
    "mech-writers",
    "Where the comedy writers went",
    [
      { id: "success", label: "A big success" },
      { id: "next", label: "“Now I should make a serious film, an action film”" },
      { id: "scale", label: "Commercial cinema: bigger budgets, more fame" },
      { id: "short", label: "A shortage of writers who can genuinely write comedy" },
    ],
    head(12),
  );
  quote(
    12,
    "quote-sheets",
    "Two sheets of paper",
    "I often give aspiring writers two sheets of paper and say, “Write something.” After an hour, many still can’t.",
    "How he tests whether someone can write comedy",
    "tip-c-an-12a-1",
  );
  spawn(
    "stat-young",
    statPayload("Who's cracking it", {
      value: "22 or 23",
      label: "The age of the youngsters he sees writing organic comedy — small counters from everyday life at home",
      speaker: NARESH,
    }),
    "tip-c-an-12a-2",
  );
  claim(
    12,
    "claim-controversy",
    "Controversy as a shortcut",
    "Whether a controversy is the fast way to an audience",
    {
      speaker: "Commonly pitched, as he reports it",
      text: "Sir, if we do this controversial thing, we’ll reach the audience faster.",
    },
    {
      speaker: NARESH,
      text: "I say no. I want the film to travel genuinely on its own merit.",
    },
    "tip-c-an-12b-1",
  );

  // ---- 13 · PR & Politics in Tollywood — 4 primary
  branch(13, "a", [
    {
      title: "Comedy from character",
      summary:
        "A love story across two religions has natural comedy in the contrast between their practices, but he now leaves such scripts alone — not because the joke wouldn't work, but because someone may genuinely be hurt. Comedy should come from the characters, he says, not from someone's identity or belief system.",
    },
    {
      title: "The complete actor",
      summary:
        "Big films once wrote separate comedy tracks: the hero had one, Brahmanandam might enter for ten minutes and Ali for another ten. That culture has almost disappeared. Today even action heroes generate their own comedy, and only when every box is ticked does the audience call a hero a complete actor.",
    },
  ]);
  quote(
    13,
    "quote-substance",
    "No PR manager",
    "If your film has substance, it will speak for itself.",
    "Why neither Allari nor Sudigadu needed PR",
    head(13),
  );
  quote(
    13,
    "quote-organic",
    "Comedy from character",
    "The comedy in our films should come organically from the characters, not be forced in by using someone’s identity or belief system.",
    "On scripts that draw their jokes from religion",
    "tip-c-an-13a-1",
  );
  table(
    "table-tracks",
    "Who carries the comedy",
    [
      ["what", ""],
      ["then", "Earlier"],
      ["now", "Today"],
    ],
    [
      { what: "Who's funny", then: "A comedian, on a separate track", now: "The hero himself" },
      { what: "For example", then: "Brahmanandam ten minutes, Ali ten more", now: "Even action heroes" },
    ],
    "tip-c-an-13a-2",
  );
  todo(
    "todo-complete",
    "The complete actor",
    ["Deliver powerful mass dialogues", "Dance well", "Fight well", "Also be funny"],
    "tip-c-an-13a-2",
  );

  // ---- 14 · His Best Comedy Pairings — 5 primary
  branch(14, "a", [
    {
      title: "Bhagavan's counters",
      summary:
        "On Kithakithalu, Krishna Bhagavan would quietly suggest a line, Naresh would tell him to tell the director, and his father — noticing — would insist on hearing it, then say “Put it in, Bhagavan.” Since you never knew what Bhagavan would throw, you kept counters ready, with one or two seconds to respond.",
    },
  ]);
  branch(14, "b", [
    {
      title: "189 takes",
      summary:
        "Seema Sastry had stretched from four months to a year and a half, so the actors were available only in windows of four or five days for 17 or 18 scenes. Ali got stuck on “tala”, meaning head, and once the set started laughing before he reached the word, it took 189 takes — until he switched to saying “head, head”. Every break cost ten or fifteen minutes to reset.",
    },
  ]);
  table(
    "table-learn",
    "Who he learned from",
    [
      ["actor", "Watch"],
      ["lesson", "For"],
    ],
    [
      { actor: "Rajendra Prasad, M. S. Narayana", lesson: "Acting drunk without drinking" },
      { actor: "Govinda", lesson: "Tiny expressions between dance movements" },
      { actor: "Krishna Bhagavan", lesson: "Lines that weren’t in the script" },
      { actor: "Brahmanandam", lesson: "One glance — and you laugh" },
    ],
    head(14),
  );
  quote(
    14,
    "quote-counters",
    "Counters in reserve",
    "Sometimes I’d keep four or five possible counters ready in my head—if he says this, I’ll say that.",
    "Working opposite Krishna Bhagavan",
    "tip-c-an-14a-1",
  );
  spawn(
    "stat-schedule",
    statPayload("Seema Sastry's schedule", {
      value: "About a year and a half",
      label: "What a four-month shoot stretched to — leaving actors in four- or five-day windows",
      delta: { from: "Four months", to: "About a year and a half" },
      speaker: NARESH,
    }),
    "tip-c-an-14b-1",
  );
  spawn(
    "stat-189",
    statPayload("One word", {
      value: "189",
      unit: "takes",
      label: "For one Seema Sastry sequence — until Ali gave up on “tala” and said “head, head”",
      speaker: NARESH,
    }),
    "tip-c-an-14b-1",
  );
  chain(
    "mech-laugh",
    "How a laugh gets into a scene",
    [
      { id: "small", label: "A small laugh gets into a scene" },
      { id: "wonder", label: "Next take: “Will you laugh this time? Will I?”" },
      { id: "burst", label: "Someone loses control and bursts out" },
      { id: "calm", label: "Ten or fifteen minutes to calm everyone down" },
      { id: "reset", label: "Reset the energy and the mood" },
    ],
    "tip-c-an-14b-1",
  );

  // ---- 15 · EVV's Cult Classics — 4 primary, 1 sticky, 1 reference
  branch(15, "a", [
    {
      title: "From Reverse Gear",
      summary:
        "His father first meant to cast the actor Naresh garu, and narrated the story to him in Tirupati during a shoot. Naresh garu felt “reverse” sounded inauspicious for a positive film and called the next day with a new title. The banner carried Naresh's mother's name, and four partners pooled equal shares.",
    },
  ]);
  branch(15, "b", [
    {
      title: "The preview walkouts",
      summary:
        "Distributors then bought territories after watching the finished film, and this one had them asking “Women becoming men?”. Some senior directors walked out of the industry preview midway. His father released it himself — and invited the people who walked out as chief guests at the 100-day function.",
    },
  ]);
  chain(
    "mech-title",
    "How it got its name",
    [
      { id: "1983", label: "Written in 1983, as an assistant director" },
      { id: "gear", label: "Titled Reverse Gear — everything goes in reverse" },
      { id: "omen", label: "Naresh garu: “reverse” sounds inauspicious" },
      { id: "jlp", label: "Next day: “Let’s title it Jamba Lakidi Pamba”" },
    ],
    "tip-c-an-15a-1",
  );
  table(
    "table-partners",
    "Who made Jamba Lakidi Pamba",
    [
      ["partner", "Partner"],
      ["share", "Share"],
      ["note", "Note"],
    ],
    [
      { partner: "Danayya garu", share: "Equal", note: "His first film" },
      { partner: "Pulla Rao garu", share: "Equal", note: "—" },
      { partner: "E. V. V.", share: "Equal", note: "Banner in his wife's name" },
      { partner: "Gopi garu", share: "Equal", note: "—" },
    ],
    "tip-c-an-15a-1",
  );
  sticky(
    "sticky-naresh",
    "Not this Naresh",
    "The “Naresh garu” his father first meant to cast is a senior actor of the same name — not the guest.",
    "chalk",
    "tip-c-an-15a-1",
  );
  spawn(
    "stat-odds",
    statPayload("Selling to distributors", {
      value: "One in ten",
      label: "Distributors you hoped would buy at a screening — “Even if nine out of ten rejected it”",
      speaker: NARESH,
    }),
    "tip-c-an-15b-1",
  );
  claim(
    15,
    "claim-preview",
    "The preview",
    "Whether Jamba Lakidi Pamba would work",
    {
      speaker: "Senior directors at the preview, as he tells it",
      text: "What kind of crazy film is this?",
    },
    {
      speaker: "His father, as he tells it",
      text: "What you assumed wasn’t what the audience felt. The audience accepted it.",
    },
    "tip-c-an-15b-1",
  );
  site(
    "jamba",
    "https://en.wikipedia.org/wiki/Jamba_Lakidi_Pamba_(1992_film)",
    "Jamba Lakidi Pamba",
    "tip-c-an-15a-1",
  );

  // ---- 16 · Amitabh's Career Advice — 5 primary, 1 reference
  branch(16, "a", [
    {
      title: "Leave the classics alone",
      summary:
        "People pitch a remake as the safe option, especially after a string of flops. He thinks it would be one of the toughest projects, because the artists who made the original special are no longer around, and once audiences have seen a role performed, replacing the actor is very difficult.",
    },
    {
      title: "The film that keeps coming back",
      summary:
        "Sooryavansham didn't do well in theatres but made a huge cultural impact, with a repeat audience as far as Bangladesh and Pakistan. Up north, Hello Brother means nothing until he says it became Judwaa — David Dhawan, a close friend, remade several of his father's films.",
    },
  ]);
  branch(16, "b", [
    {
      title: "Directing Amitabh",
      summary:
        "His father had turned down Karisma Kapoor's Hindi debut, afraid he couldn't explain his writing outside Telugu. When Padmalaya brought him Sooryavansham with Amitabh Bachchan, the family pushed him to go from fan to director. The actor Banerjee carried his Telugu briefs into Hindi, and his father brought Brahmanandam along to the Hindi audience.",
    },
    {
      title: "Twenty or thirty cars",
      summary:
        "Before his difficult phase, his father came back from shooting at 6:30, met producers back to back until 9:30, wrote with his nine writers until two or three in the morning, and was on set again by seven. There were times Naresh couldn't get a moment with him.",
    },
  ]);
  quote(
    16,
    "quote-classics",
    "Leave them be",
    "Some classics are better left exactly as they are.",
    "On calls to remake Jamba Lakidi Pamba",
    "tip-c-an-16a-1",
  );
  quote(
    16,
    "quote-sonymax",
    "Bombay rains",
    "what do Bombay rains, Sooryavansham and Sony Max have in common? They keep coming back.",
    "The joke someone told him about his father's film",
    "tip-c-an-16a-2",
  );
  chain(
    "mech-hindi",
    "How his father came to Hindi",
    [
      { id: "decline", label: "Declines Karisma Kapoor's Hindi debut", note: "“My English isn’t great”" },
      { id: "story", label: "Sooryavansham: already a hit in Tamil and Telugu" },
      { id: "padmalaya", label: "Padmalaya approaches him directly" },
      { id: "amitabh", label: "Amitabh Bachchan will star — fan to director" },
      { id: "banerjee", label: "Banerjee translates — almost a co-director" },
    ],
    "tip-c-an-16b-1",
  );
  spawn(
    "stat-onehindi",
    statPayload("Hindi films he directed", {
      value: "Just that one",
      label: "Sooryavansham — he never directed another Hindi film, and it became a cult film",
      speaker: NARESH,
    }),
    "tip-c-an-16b-1",
  );
  table(
    "table-evvday",
    "His father's day, at the peak",
    [
      ["when", "When"],
      ["what", "What"],
    ],
    [
      { when: "Around 6:30", what: "Back from shooting" },
      { when: "7 to 9:30", what: "Producers, one after another" },
      { when: "After they left", what: "Nine writers write the next day’s scenes" },
      { when: "Two or three a.m.", what: "Writing ends" },
      { when: "Around 2:30", what: "Eats, sleeps" },
      { when: "6:30 or 7", what: "Up, to shoot what was just written" },
    ],
    "tip-c-an-16b-2",
  );
  site("sooryavansham", "https://en.wikipedia.org/wiki/Sooryavansham", "Sooryavansham", "tip-c-an-16a-2");

  // ---- 17 · Losing EVV Satyanarayana — 5 primary
  branch(17, "a", [
    {
      title: "Saving ten rupees",
      summary:
        "Not even a proper cashier, he dealt with the food mess and vendors and went into the Old City himself to bargain for dancers' costumes. If he could save ten rupees, he wanted to.",
    },
    {
      title: "Amitabh at Ravindra Bharathi",
      summary:
        "Planned for ten or fifteen shields, the 100-day event swelled as light men, production staff and actors all wanted one from Amitabh Bachchan, who agreed and stayed his full hour and a half. Called back as the film's cashier, Naresh was asked his height and told he was around Abhishek Bachchan's. He was sixteen.",
    },
  ]);
  branch(17, "b", [
    {
      title: "The senior brother",
      summary:
        "His father put him into acting classes before his elder brother Rajesh — who finished a B.Com, went abroad for an MBA and worked in the US first — so Naresh became, as he puts it, the senior. His debut released two weeks before his brother's. He trained under Devadas Kanakala and later with Deekshit at Lalitha Kala Thoranam.",
    },
    {
      title: "It began on Bend Apparao",
      summary:
        "In the first week of June, on an outdoor schedule, his father couldn't keep food down for days. It took almost a month to diagnose cancer in the lymph nodes near the throat; chemotherapy in Bombay worked at first. From hospital, his father handed over the shot divisions so a cousin could finish the last ten days of the film.",
    },
  ]);
  chain(
    "mech-cashier",
    "How he became the cashier",
    [
      { id: "flops", label: "A few of his father's films don't work" },
      { id: "own", label: "“Let’s produce our own”", note: "Chala Bagundi" },
      { id: "uncle", label: "His uncle handles the money" },
      { id: "rakhi", label: "NTR’s Rakhi starts; the uncle has to go", note: "Ten days after their film started" },
      { id: "both", label: "His father directing and doing accounts" },
      { id: "me", label: "“I’ll come and take care of it”" },
    ],
    head(17),
  );
  quote(
    17,
    "quote-tenrupees",
    "Ten rupees",
    "Even if I could save ten rupees, I wanted to save it.",
    "Bargaining for dancers' costumes in the Old City",
    "tip-c-an-17a-1",
  );
  quote(
    17,
    "quote-makehero",
    "Make him a hero",
    "Make him a hero. He’s around Abhishek Bachchan’s height.",
    "At the Chala Bagundi 100-day celebration, to his father",
    "tip-c-an-17a-2",
    "Amitabh Bachchan, as Naresh recalls it",
  );
  table(
    "table-brothers",
    "Two routes in",
    [
      ["what", ""],
      ["rajesh", "Rajesh"],
      ["naresh", "Naresh"],
    ],
    [
      { what: "Studies", rajesh: "B.Com here, MBA abroad", naresh: "Less focused" },
      { what: "First", rajesh: "Worked in the US a year or two", naresh: "Acting classes, right away" },
      { what: "Debut", rajesh: "Two weeks later", naresh: "Two weeks earlier" },
    ],
    "tip-c-an-17b-1",
  );
  /*
   * Class C with resolved dates. The 1983 story, the 2008 diagnosis, the 2010
   * relapse and the 2011 passing are all dated in the transcript; Jamba Lakidi
   * Pamba (1992), Sooryavansham (1999) and Chala Bagundi (2000) take their
   * years from Wikipedia, and the 21st is 21 January 2011. The final event is
   * this episode's publish date.
   */
  timeline(
    "timeline-evv",
    "His father's years, as named here",
    [
      { at: year(1983), label: "Writes the Jamba Lakidi Pamba story" },
      { at: year(1992), label: "Jamba Lakidi Pamba becomes a sensation" },
      { at: year(1999), label: "Sooryavansham — his only Hindi film" },
      { at: year(2000), label: "Produces his own: Chala Bagundi" },
      { at: year(2008), label: "First diagnosis, on the Bend Apparao shoot" },
      { at: year(2010), label: "The relapse" },
      { at: "2011-01-21T12:00:00.000Z", label: "Passes away, on the 21st" },
      { at: "2026-09-04T12:00:00.000Z", label: "This conversation, on Raw Talks with VK", highlight: true },
    ],
    "tip-c-an-17b-2",
  );

  // ---- 18 · Gamyam Changed My Career — 5 primary, 1 reference
  branch(18, "a", [
    {
      title: "Working on the 21st",
      summary:
        "Around 40 artists were about to travel abroad for two months, so Seema Tapakai's climax couldn't be postponed. He stepped out to cry between takes of a spoof song while his father's old colleagues told him nothing would happen. His brother's engagement was weeks away; his father had wanted both sons married by 25 or 26.",
    },
    {
      title: "A year of staying strong",
      summary:
        "Closest of the family to his father, he decided he had to be strong for everyone for a year and kept working — four or five films released, some of them hits. If he sat at home, the grief would catch up. It truly sank in after three or four months.",
    },
  ]);
  branch(18, "b", [
    {
      title: "Dividing the work",
      summary:
        "He and Rajesh split it: Naresh would focus on work, Rajesh on the properties, investments and finances. On E. V. V. Cinema films today, Rajesh produces and stays on set within a fixed budget while Naresh handles story, casting and promotions — a production, he says, needs one person in control.",
    },
  ]);
  branch(18, "c", [
    {
      title: "He didn't know about Gamyam",
      summary:
        "A comedian once joked that his father tells him which films to do. In fact Naresh chose Gamyam himself, drawn to shaded characters like Karthik's in a film called Mouna Ragam and Jagapathi Babu's in Anthapuram. Gandham Nagaraju handed him the only complete bound script he has ever received in advance.",
    },
  ]);
  quote(
    18,
    "quote-thatday",
    "Shooting that day",
    "Personally, I sometimes feel I shouldn’t have worked that day, even though professionally I understand why I did.",
    "On being on set until 6:30 on the day his father died",
    "tip-c-an-18a-1",
  );
  quote(
    18,
    "quote-onepercent",
    "The tiny 1%",
    "even when you know 99% that someone is gone, there’s still that tiny 1% in your mind hoping somehow they’re still there.",
    "On the first ten or fifteen days of grief",
    "tip-c-an-18a-2",
  );
  table(
    "table-split",
    "Who does what",
    [
      ["what", ""],
      ["naresh", "Naresh"],
      ["rajesh", "Rajesh"],
    ],
    [
      { what: "After 2011", naresh: "Focus on work", rajesh: "Properties, investments, finances" },
      { what: "E. V. V. Cinema now", naresh: "Story, casting, promotions", rajesh: "On set, inside the budget" },
    ],
    "tip-c-an-18b-1",
  );
  claim(
    18,
    "claim-chose",
    "Who chose his films",
    "Whether his father chose his films for him",
    {
      speaker: "A comedian, joking",
      text: "E. V. V. garu is there to tell you which films to do and which not to do.",
    },
    {
      speaker: NARESH,
      text: "But that simply wasn’t true. He didn’t even know I was doing Gamyam.",
    },
    "tip-c-an-18c-1",
  );
  spawn(
    "stat-bound",
    statPayload("Gamyam's script", {
      value: "The only bound script",
      label: "He was ever handed complete and in advance — first half, second half, everything",
      speaker: NARESH,
    }),
    "tip-c-an-18c-1",
  );
  site("gamyam", "https://en.wikipedia.org/wiki/Gamyam", "Gamyam", "tip-c-an-18c-1");

  // ---- 19 · The Truth About EVV's Addiction — 4 primary, 1 sticky
  branch(19, "a", [
    {
      title: "The layers",
      summary:
        "The hero is Abhiram and the girl Janaki, so Gaali Seenu enters like Hanuman while Rama is searching for Sita. Sharwanand's character is a wealthy man changed by the world — almost a prince becoming Buddha.",
    },
  ]);
  branch(19, "b", [
    {
      title: "Who fires",
      summary:
        "Krish, who decided to play the Naxalite himself, proposed that the Naxalite shoot Seenu thinking he had brought the police. Naresh pushed back: the Naxalites and the police both believe they are fighting for people, so the story shouldn't pick a side.",
    },
  ]);
  quote(
    19,
    "quote-willhedie",
    "No long death",
    "I didn’t want it stretched into, “He keeps talking and talking—will he ever die?”",
    "His one major concern about Gamyam's death scene",
    head(19),
  );
  quote(
    19,
    "quote-tears",
    "Hearing the scene",
    "When it ended and someone said, “That’s the scene, boss,” I had tears in my eyes.",
    "At the reading session, hearing Krish's version",
    head(19),
  );
  table(
    "table-layers",
    "Gamyam's layers",
    [
      ["character", "Character"],
      ["echo", "Echoes"],
    ],
    [
      { character: "Abhiram, the hero", echo: "Rama, searching" },
      { character: "Janaki, the girl", echo: "Sita" },
      { character: "Gaali Seenu", echo: "Hanuman, entering the search" },
      { character: "Sharwa's character", echo: "A prince becoming Buddha" },
    ],
    "tip-c-an-19a-1",
  );
  claim(
    19,
    "claim-whofires",
    "Who fires",
    "Who should be responsible for Gaali Seenu's death",
    {
      speaker: "Krish, as Naresh tells it",
      text: "Krish suggested the Naxalite might shoot him thinking he brought the police",
    },
    {
      speaker: NARESH,
      text: "Both sides believe they are working for people. Why make either side the villain?",
    },
    "tip-c-an-19b-1",
  );
  sticky(
    "sticky-notaddiction",
    "Not about addiction",
    "Despite the title, this span is all Gamyam. The question about his father and alcohol comes at 1:24, two chapters on.",
    "chalk",
    head(19),
  );

  // ---- 20 · Comparison With His Brother — 4 primary, 1 sticky
  branch(20, "a", [
    {
      title: "A death scene on his birthday",
      summary:
        "Delayed from the 27th and the 28th, the scene was shot on the 30th — his birthday. Krish kept apologising, his mother asked how he could do it on his birthday, and his father told them to ward off the evil eye, break a coconut and smile for the camera.",
    },
    {
      title: "Showing it to his father",
      summary:
        "His father knew almost nothing about the film until a screening around January 2, arranged with Sharwanand's uncle to work out how to get it into theatres. He came out and said one thing.",
    },
  ]);
  chain(
    "mech-crossfire",
    "Why it's crossfire",
    [
      { id: "police", label: "Show the police firing" },
      { id: "blame", label: "People walk away blaming the police" },
      { id: "nax", label: "Show the Naxalites firing" },
      { id: "villain", label: "They become the villains" },
      { id: "cross", label: "Crossfire — someone fired" },
      { id: "unknown", label: "You never know whose bullet hit him" },
    ],
    head(20),
    [
      { from: "police", to: "blame", label: "if the film" },
      { from: "nax", to: "villain", label: "if it" },
      { from: "cross", to: "unknown", label: "so" },
    ],
  );
  spawn(
    "stat-5lakh",
    statPayload("How Gamyam was paid for", {
      value: "₹5 lakh",
      label: "At a time, for four days of shooting — then arrange another ₹5 lakh, for 18 months",
      speaker: NARESH,
    }),
    head(20),
  );
  quote(
    20,
    "quote-birthday",
    "On his birthday",
    "Krish, how can you make him do a death scene on his birthday?",
    "His mother, to the director",
    "tip-c-an-20a-1",
    "His mother, as he recalls it",
  );
  quote(
    20,
    "quote-narrated",
    "The screening",
    "If you had narrated this story to me before making it, I would probably have told you not to do it.",
    "His father, after seeing the finished Gamyam",
    "tip-c-an-20a-2",
    FATHER,
  );
  sticky(
    "sticky-brother",
    "The brothers come later",
    "Despite this chapter's title, the brothers are compared at 1:26, two chapters on.",
    "haiti",
    head(20),
  );

  // ---- 21 · EVV's Sudden Death — 4 primary
  branch(21, "a", [
    {
      title: "Smoke and tea, not drink",
      summary:
        "His father wrote until two in the morning, slept little and had red eyes and a heavy personality, so people assumed. Neither his brother nor his grandfather drinks; Naresh himself has a beer or two and has never tried whisky. His father's real habits were chain-smoking, tea and every new restaurant in town.",
    },
  ]);
  table(
    "table-ninefilms",
    "Nine films with his father",
    [
      ["kind", "Kind"],
      ["films", "Films"],
      ["result", "Result"],
    ],
    [
      { kind: "Comedies", films: "Seven", result: success("All seven worked") },
      { kind: "Serious", films: "Fitting Master, Nuvvante Naakishtam", result: danger("Didn’t work") },
    ],
    head(21),
  );
  quote(
    21,
    "quote-ticket",
    "Every right",
    "they bought a ticket, so they have every right to comment.",
    "Why negative comments stopped bothering him",
    head(21),
  );
  claim(
    21,
    "claim-alcohol",
    "His father and alcohol",
    "Whether alcohol harmed his father's health",
    {
      speaker: "Host, citing claims online",
      text: "there are things online claiming alcohol played a role in his health.",
    },
    { speaker: NARESH, text: "My father only smoked. He never drank." },
    "tip-c-an-21a-1",
  );
  spawn(
    "stat-tea",
    statPayload("What kept him awake", {
      value: "20 or 30 cups",
      label: "Of tea a day, as far as he knows — alongside the chain-smoking, through nights of writing",
      speaker: NARESH,
    }),
    "tip-c-an-21a-1",
  );

  // ---- 22 · How Much Do Heroes Earn? — 2 primary, 1 sticky
  table(
    "table-newset",
    "On a new set",
    [
      ["what", ""],
      ["naresh", "Naresh"],
      ["rajesh", "Rajesh"],
    ],
    [
      { what: "Comfortable with the unit", naresh: "By the second day", rajesh: "Five or ten days" },
      { what: "On being visible", naresh: "“Come out, be visible.”", rajesh: "“Once I’m successful.”" },
    ],
    head(22),
  );
  spawn(
    "stat-66",
    statPayload("His count", {
      value: "Around 66",
      unit: "films",
      label: "Each with four or five assistant directors and new crew — a new set of friends every time",
      speaker: NARESH,
    }),
    head(22),
  );
  sticky(
    "sticky-earnings",
    "Earnings come later",
    "Despite the title, this is the brothers' comparison. What heroes earn comes up at 2:07, under “Fake Box Office Collections”.",
    "turbo",
    head(22),
  );

  // ---- 23 · Learning to Say No — 3 primary
  branch(23, "a", [
    {
      title: "A letter, or a conversation",
      summary:
        "The host recalls Karan Johar describing a letter a relative brought him after his father died — not emotional, but about properties, which chartered accountant to trust and whom not to. Naresh says his father did something similar, though not on paper: he explained everything at the first diagnosis in 2008, before the relapse in 2010.",
    },
  ]);
  quote(
    23,
    "quote-ask",
    "Ask for it",
    "If you don’t ask, even your mother won’t know you’re hungry.",
    "What he keeps telling his brother about finding work",
    head(23),
  );
  table(
    "table-letter",
    "Two ways to leave instructions",
    [
      ["what", ""],
      ["kjo", "Karan Johar's father"],
      ["evv", "His father"],
    ],
    [
      { what: "Form", kjo: "A letter, brought by a relative", evv: "Explained in person" },
      { what: "When", kjo: "After his death", evv: "At the first diagnosis" },
      { what: "Covered", kjo: "Properties, whom to trust", evv: "Assets, liabilities, rentals" },
    ],
    "tip-c-an-23a-1",
  );
  spawn(
    "stat-gap",
    statPayload("Between the diagnoses", {
      value: "About a year or so",
      label: "Of health between the first diagnosis in 2008 and the relapse in 2010",
      speaker: NARESH,
    }),
    "tip-c-an-23a-1",
  );

  // ---- 24 · Why I Never Take Advances — 4 primary
  branch(24, "a", [
    {
      title: "The round-table",
      summary:
        "His father on the bed and the family around him, he explained how he wanted things divided: Rajesh would get more of the rental income, Naresh — earning far more from films — the less liquid assets. His mother asked him to stop talking like that; he stayed practical. After his death she asked both sons for one promise.",
    },
  ]);
  chain(
    "mech-debt",
    "Clearing the Fitting Master debt",
    [
      { id: "loss", label: "Fitting Master loses close to ₹4 crore" },
      { id: "fin", label: "The financiers have to be repaid" },
      { id: "sell", label: "His father: sell the land, clear everything" },
      { id: "films", label: "Naresh: four or five films will clear it" },
      { id: "clear", label: "Cleared within a year or two" },
    ],
    head(24),
  );
  table(
    "table-division",
    "The division",
    [
      ["son", "Son"],
      ["gets", "Gets"],
      ["why", "Why"],
    ],
    [
      { son: "Rajesh", gets: "More rental income", why: "—" },
      { son: "Naresh", gets: "The less liquid ‘white-elephant’ assets", why: "Earning more from many films" },
    ],
    "tip-c-an-24a-1",
  );
  quote(
    24,
    "quote-assets",
    "Earning and protecting",
    "earning assets is one thing; protecting them is another",
    "What his father always said",
    "tip-c-an-24a-1",
    FATHER,
  );
  quote(
    24,
    "quote-promise",
    "The promise",
    "It’s okay if you don’t earn more. It’s okay if you don’t buy more property. But don’t sell what your father left behind.",
    "What his mother asked of both sons",
    "tip-c-an-24a-1",
    "His mother, as he recalls it",
  );

  // ---- 25 · Fake Script Stories 😂 — 4 primary, 1 sticky
  branch(25, "a", [
    {
      title: "Not a word of debate",
      summary:
        "Their father had already said who got what, so nobody argued and no outsider was brought in — not his brother, not Naresh, not their mother. He had always hated family disputes going public. Much of it is houses, which he preferred over speculative land, plus 60 or 70 acres in his native village that they have never touched.",
    },
  ]);
  branch(25, "b", [
    {
      title: "Favour films",
      summary:
        "Films done for his father's friends and colleagues followed a pattern: if one worked, they were right to ask; if it failed, Naresh had ruined it. That, he says, is when you discover who someone really is. He places the realisation around 2015, after a lot of damage was done.",
    },
  ]);
  chain(
    "mech-distribution",
    "Releasing it themselves",
    [
      { id: "fear", label: "His father dreads “We lost this much, repay us”" },
      { id: "risk", label: "Take the distribution risk yourself", note: "As with Kithakithalu" },
      { id: "offers", label: "Bandipotu draws low offers" },
      { id: "release", label: "Released on their own — recovers one or two crores" },
      { id: "fees", label: "Two or three years of his remuneration clears the loss" },
    ],
    head(25),
  );
  spawn(
    "stat-acres",
    statPayload("Land in the village", {
      value: "60 or 70 acres",
      label: "In his father's native village — bought out of emotion, not for returns, and untouched since",
      speaker: NARESH,
    }),
    "tip-c-an-25a-1",
  );
  quote(
    25,
    "quote-inside",
    "Inside the family",
    "Whatever the issue is, sit inside the family and sort it out. Don’t take it outside.",
    "His father's rule on family disputes",
    "tip-c-an-25a-1",
    FATHER,
  );
  table(
    "table-favour",
    "A favour film",
    [
      ["outcome", "If the film"],
      ["say", "They say"],
    ],
    [
      { outcome: success("Works"), say: "“See, we knew he had to do it.”" },
      { outcome: danger("Fails"), say: "“Because of Naresh, the whole thing went wrong.”" },
    ],
    "tip-c-an-25b-1",
  );
  sticky(
    "sticky-scripts",
    "The script stories come later",
    "This span is the family's money. The fake script stories of the title arrive at 1:46, under “My Darkest Phase”.",
    "chalk",
    head(25),
  );

  // ---- 26 · Sudigadu 2 & Fan Wars — 4 primary
  branch(26, "a", [
    {
      title: "Two ways to say no",
      summary:
        "He used to say “let's meet again in two days” and have his manager give a softer reason later. He came to see that as worse: a director spends the whole month hoping. Now he tells them directly that someone else might connect with it, and accepts that they'll curse him on the way home.",
    },
  ]);
  branch(26, "b", [
    {
      title: "Not one letter",
      summary:
        "When he says certain portions don't work, most narrators want to know what to fix, which he understands. But some refuse to change a word. If the discussion can't begin in a healthy way before shooting, he says, imagine the arguments on set.",
    },
  ]);
  spawn(
    "stat-firstscript",
    statPayload("A first script", {
      value: "Three or four years",
      label: "What a first-time director has often spent writing it — a second film may take three or four months",
      speaker: NARESH,
    }),
    head(26),
  );
  table(
    "table-sayingno",
    "Saying no",
    [
      ["how", "Approach"],
      ["said", "What he said"],
      ["cost", "What it cost them"],
    ],
    [
      { how: "Soft", said: "“Let’s meet again in two days”", cost: "A month of hoping" },
      { how: "Direct", said: "“I didn’t connect with it; someone else might.”", cost: "A night of cursing" },
    ],
    "tip-c-an-26a-1",
  );
  quote(
    26,
    "quote-month",
    "A month for a no",
    "Nobody should lose a month waiting for my no.",
    "Why he stopped softening rejections",
    "tip-c-an-26a-1",
  );
  claim(
    26,
    "claim-oneletter",
    "Not one letter",
    "Whether a script can be changed in discussion",
    {
      speaker: "Some narrators, as he reports it",
      text: "Sir, I won’t change even one letter. This is my Bhagavad Gita.",
    },
    {
      speaker: NARESH,
      text: "Cinema is a creative medium. It cannot be controlled by one person alone.",
    },
    "tip-c-an-26b-1",
  );

  // ---- 27 · The Set Burned Down! — 5 primary
  branch(27, "a", [
    {
      title: "Pressure by escalation",
      summary:
        "Assistant directors open by reminding him that his father was a director, then ask him not to tell the producer he said no. Others escalate step by step until someone influential calls him directly. And some ask to be his fifth film in a year's time, then want to start next month.",
    },
  ]);
  branch(27, "b", [
    {
      title: "No advances",
      summary:
        "Given dates from October 2 or 4, he takes the payment only around October 1. Many producers borrow part of their capital, so an advance paid months early means months of extra interest that ends up in the film's budget. Nobody has demanded money back from him, but interest should start with the film.",
    },
  ]);
  branch(27, "c", [
    {
      title: "After Sudigadu",
      summary:
        "When Sudigadu became a big hit, he kept the fees he had agreed for films already committed. Two or three of those producers raised them anyway, knowing what he was being offered elsewhere — not the full new market rate, but something.",
    },
  ]);
  spawn(
    "stat-crafts",
    statPayload("Crafts on a film", {
      value: "24",
      unit: "crafts",
      label: "Involved in a film — so it has to be collaborative, not one writer's fixed text",
      speaker: NARESH,
    }),
    head(27),
  );
  chain(
    "mech-escalation",
    "How the pressure escalates",
    [
      { id: "msg", label: "Messages to his manager or the office" },
      { id: "polite", label: "A polite no: “It doesn’t fit our profile”" },
      { id: "relatives", label: "Direct calls from relatives" },
      { id: "vip", label: "The politician or actor calls himself" },
      { id: "look", label: "“Give me a chance to look at it”" },
    ],
    "tip-c-an-27a-1",
  );
  chain(
    "mech-advance",
    "What an early advance costs",
    [
      { id: "early", label: "Advance paid months before the shoot" },
      { id: "borrow", label: "The producer borrowed that money" },
      { id: "interest", label: "Interest for the extra months", note: "₹10–15 lakh over six or seven months" },
      { id: "budget", label: "It goes into the film’s budget" },
      { id: "cut", label: "Costs get cut somewhere else" },
    ],
    "tip-c-an-27b-1",
  );
  quote(
    27,
    "quote-word",
    "His word",
    "If I give someone my word, I try to keep it.",
    "Why he didn't raise his fee after Sudigadu",
    "tip-c-an-27c-1",
  );
  spawn(
    "stat-raise",
    statPayload("An unasked raise", {
      value: "₹15, ₹20 or ₹25 lakh",
      label: "Added on their own by two or three producers who had signed him before Sudigadu's hit",
      speaker: NARESH,
    }),
    "tip-c-an-27c-1",
  );

  // ---- 28 · My Darkest Phase — 5 primary, 2 reference
  branch(28, "a", [
    {
      title: "Isn't this that film?",
      summary:
        "Narrators assume they are the only ones who have seen a certain Korean or French film. Copying is harder now: the original team can watch a trailer online and act. So he tells people the honest route — buy the rights — and has his team research submissions, since one interesting email turned out to be a French film.",
    },
  ]);
  branch(28, "b", [
    {
      title: "Who knows what",
      summary:
        "A few lines per section can't show where the reveals are or how the screenplay is ordered. In comedy you need the punch lines, the first-half knot, where it opens in the second half — and above all what the characters know versus what the audience knows. So he would rather hear a narration.",
    },
  ]);
  branch(28, "c", [
    {
      title: "Where Sudigadu came from",
      summary:
        "Nobody in the industry objected to being spoofed. As a kid he had seen Hot Shots!, which played war films and political figures for laughs, and later Scary Movie spoofing films like I Know What You Did Last Summer. His father's films had occasional spoofs, but nobody had made a full feature-length parody in Telugu.",
    },
  ]);
  spawn(
    "stat-cds",
    statPayload("His film library", {
      value: "More than 5,000",
      unit: "movie CDs",
      label: "At home — French, Korean, whatever — which is why a lifted pitch gets recognised",
      speaker: NARESH,
    }),
    head(28),
  );
  quote(
    28,
    "quote-ten",
    "Ten percent inspiration",
    "“Sir, we only took 10% inspiration and changed 90%,” when actually 90% is the same and only 10% has changed.",
    "On people avoiding the rights process",
    "tip-c-an-28a-1",
  );
  todo(
    "todo-rights",
    "Adapting a film you love",
    [
      "Go and buy the rights",
      "Find the rights holder — the production house, online",
      "Decide: only Telugu rights, or all-India rights",
    ],
    "tip-c-an-28a-1",
  );
  table(
    "table-knows",
    "Who knows the truth",
    [
      ["knows", "Who knows"],
      ["effect", "What the audience does"],
    ],
    [
      { knows: "The audience, not the characters", effect: "Laughs as one suspects the wrong person" },
      { knows: "Nobody, audience included", effect: "Shares the suspense" },
      { knows: "One character", effect: "Watches everyone else guessing" },
    ],
    "tip-c-an-28b-1",
  );
  /*
   * Class C with resolved dates: every title is named in the chapter, and the
   * years are each film's release (Sudigadu's day from its Wikipedia page).
   */
  timeline(
    "timeline-parody",
    "Where Sudigadu came from",
    [
      { at: year(1991), label: "Hot Shots! — seen as a kid" },
      { at: year(1997), label: "I Know What You Did Last Summer" },
      { at: year(2000), label: "Scary Movie spoofs films like it" },
      { at: "2012-08-24T12:00:00.000Z", label: "Sudigadu: a feature-length Telugu parody", highlight: true },
    ],
    "tip-c-an-28c-1",
  );
  site("hot-shots", "https://en.wikipedia.org/wiki/Hot_Shots!", "Hot Shots!", "tip-c-an-28c-1");
  site("sudigadu", "https://en.wikipedia.org/wiki/Sudigadu", "Sudigadu", "tip-c-an-28c-1");

  // ---- 29 · Remuneration & Hero Ego — 4 primary, 1 reference
  branch(29, "a", [
    {
      title: "Why no Sudigadu 2",
      summary:
        "He could get permission from actors and production houses, but fans react unpredictably, and a tiny reference in another film recently became a huge issue. Corporate studios and legal teams now charge for clips and dialogues at prices that may not fit the budget. The new film keeps its references small — a character who talks like the heroes he watches.",
    },
  ]);
  branch(29, "b", [
    {
      title: "Chevella",
      summary:
        "For one Seema Sastry song they built effigies on open land beyond Chevella, at the peak of the Telangana agitation, when shoots everywhere were being stopped to draw attention. A group arrived and refused to let it continue. With 30 or 40 dancers on set, his first call was to get the women out in whatever cars were available.",
    },
  ]);
  branch(29, "c", [
    {
      title: "Three days in Ramoji",
      summary:
        "Shooting a night item song for Shambo Shiva Shambo, they learned a crowd had gathered outside Ramoji Film City, and both exits were blocked. They stayed three days and moved deep inside, to a low spot where the lights couldn't be seen from the hills. None of it, he says, was aimed at Andhra actors.",
    },
  ]);
  table(
    "table-nosudigadu2",
    "Why no Sudigadu 2",
    [
      ["obstacle", "Obstacle"],
      ["detail", "As he puts it"],
    ],
    [
      { obstacle: danger("Fan wars"), detail: "Fans can react unpredictably" },
      { obstacle: danger("Licensing"), detail: "A fee even to use certain dialogues" },
      { obstacle: warning("Studio rules"), detail: "No recreating particular scenes" },
      { obstacle: warning("Cost"), detail: "May not fit our budget" },
    ],
    "tip-c-an-29a-1",
  );
  claim(
    29,
    "claim-set",
    "The burned set",
    "Whether a protest group burned his set",
    {
      speaker: HOST,
      text: "I heard there was an incident where a Telangana group burned down one of your sets.",
    },
    {
      speaker: NARESH,
      text: "No, it wasn’t actually our set. We were shooting a song during Seema Sastry.",
    },
    "tip-c-an-29b-1",
  );
  chain(
    "mech-chevella",
    "The morning at Chevella",
    [
      { id: "arrive", label: "Protesters: “No shooting should happen here”" },
      { id: "explain", label: "Explaining it isn’t political doesn’t help" },
      { id: "women", label: "Women dancers sent away first, in any car" },
      { id: "police", label: "Police arrive an hour later; shoot cancelled" },
      { id: "rebuild", label: "Set rebuilt elsewhere in a day or two" },
    ],
    "tip-c-an-29b-1",
  );
  // Coordinates are lookups for the two places he names.
  map(
    "map-agitation",
    "Chevella and Ramoji Film City",
    { name: "Hyderabad", lat: 17.33, lng: 78.42 },
    9,
    [
      { id: "an-chevella", label: "Chevella — the Seema Sastry song set", lat: 17.3067, lng: 78.1353 },
      { id: "an-ramoji", label: "Ramoji Film City — three days inside", lat: 17.2543, lng: 78.6808 },
    ],
    "tip-c-an-29b-1",
  );
  spawn(
    "stat-ramoji",
    statPayload("Stuck in Ramoji", {
      value: "Three days",
      label: "Inside Ramoji Film City with both exits blocked, finishing the song where the lights couldn't be seen",
      speaker: NARESH,
    }),
    "tip-c-an-29c-1",
  );

  // ---- 30 · Theatre Politics Exposed — 4 primary, 1 reference
  branch(30, "a", [
    {
      title: "Maharshi",
      summary:
        "When Vamshi Paidipally called, Naresh assumed he would be Mahesh Babu's funny friend, and his career was not in a phase where a supporting role felt small. Vamshi told him not to judge it by the cover and narrated the whole story, in which the two characters save each other. Mahesh Babu, he heard, was among the first to suggest his name.",
    },
  ]);
  branch(30, "b", [
    {
      title: "Six months off",
      summary:
        "After Maharshi, people praised his performance rather than the comedy, and he decided he didn't want to keep doing routine films out of fear of disappearing. He took around six months off and resolved to dedicate himself fully to the next story he genuinely liked.",
    },
  ]);
  spawn(
    "def-minimum",
    definitionPayload("Minimum guarantee", {
      term: "A minimum guarantee story",
      gloss: "If Naresh does this kind of film, it will at least work.",
      speaker: NARESH,
    }),
    head(30),
  );
  quote(
    30,
    "quote-sidekick",
    "Hero to comedian?",
    "Sir, all the comedians are becoming heroes these days. You’re not bringing a hero back to make him a comedian, right?",
    "To Vamshi Paidipally, before hearing Maharshi",
    "tip-c-an-30a-1",
  );
  chain(
    "mech-maharshi",
    "How Maharshi changed the read",
    [
      { id: "friend", label: "Expects to be Mahesh Babu's funny friend" },
      { id: "cover", label: "“Don’t judge it by the cover”" },
      { id: "cry", label: "A role that had to make people cry" },
      { id: "calls", label: "Callers: “you made us cry too”" },
      { id: "praise", label: "Praised for the performance, not the comedy" },
    ],
    "tip-c-an-30a-1",
  );
  spawn(
    "stat-break",
    statPayload("The break", {
      value: "Around six months",
      label: "Off after Maharshi, resolved to commit only to a story he genuinely liked — it was Naandhi",
      speaker: NARESH,
    }),
    "tip-c-an-30b-1",
  );
  site("maharshi", "https://en.wikipedia.org/wiki/Maharshi_(2019_film)", "Maharshi", "tip-c-an-30a-1");

  // ---- 31 · After Nandi... Nothing Worked? — 4 primary, 1 reference
  branch(31, "a", [
    {
      title: "Half a crew, half a house",
      summary:
        "When shooting resumed, a set that normally has 80 or 90 people was allowed around 40, with distancing, sanitizers and doctors adding to the cost. Theatres reopened with alternate seats blocked. And this was a serious film, not his usual strength, released to people wearing two masks.",
    },
  ]);
  branch(31, "b", [
    {
      title: "Comedy, with expectations",
      summary:
        "After four or five years of serious work, audiences want him back on his home ground. He wants to give them comedy too, or he'll be boxed again as the man who only does serious cinema. But a serious film can draw people on a good trailer; a comedy has to clear a higher bar.",
    },
  ]);
  chain(
    "mech-naandhi",
    "Naandhi's road to release",
    [
      { id: "eighty", label: "80% complete when COVID hits" },
      { id: "stop", label: "Stopped for eight or nine months" },
      { id: "resume", label: "Resumes with around 40 people", note: "Distancing, sanitizers, doctors" },
      { id: "reopen", label: "Theatres reopen at half capacity" },
      { id: "open", label: "Opens well; good word of mouth" },
      { id: "wildfire", label: "Spreads like wildfire from the second and third day" },
    ],
    head(31),
  );
  spawn(
    "stat-crew",
    statPayload("A COVID set", {
      value: "Around 40",
      label: "People allowed on set when shooting resumed",
      delta: { from: "80 or 90", to: "Around 40" },
      speaker: NARESH,
    }),
    "tip-c-an-31a-1",
  );
  spawn(
    "stat-seats",
    statPayload("A COVID theatre", {
      value: "50 tickets",
      label: "All a 100-seat theatre could sell, with alternate seats blocked",
      speaker: NARESH,
    }),
    "tip-c-an-31a-1",
  );
  quote(
    31,
    "quote-funny",
    "Back to comedy",
    "With comedy, people already arrive expecting, “Naresh is back—this better be funny.”",
    "Why choosing his comeback comedy takes time",
    "tip-c-an-31b-1",
  );
  site("naandhi", "https://en.wikipedia.org/wiki/Naandhi", "Naandhi", head(31));

  // ---- 32 · Fake Box Office Collections — 4 primary
  branch(32, "a", [
    {
      title: "Same fee, any billing",
      summary:
        "He doesn't raise his fee after a hit or cut it after a flop, and takes the same amount for a multistarrer as for a lead, though the days may be fewer. In Tamil he is a newcomer again, so he works at the fees of his first Telugu films to build a market — sometimes so low his manager gets angry.",
    },
    {
      title: "Letting money go",
      summary:
        "Many of his producers came from real estate or other businesses and didn't know how schedules expand. Even when production costs hold, interest accumulates, so when a producer can't pay the full agreed amount, he weighs the overall situation.",
    },
  ]);
  quote(
    32,
    "quote-character",
    "The character, not the star",
    "the audience shouldn’t see “Naresh.” They should see the character.",
    "What he wants from any genre, like Fahadh Faasil",
    head(32),
  );
  quote(
    32,
    "quote-ipl",
    "The auction",
    "Sometimes it feels like sitting in an IPL auction.",
    "On producers bidding up a fee after a hit",
    "tip-c-an-32a-1",
  );
  table(
    "table-fees",
    "What he charges",
    [
      ["role", "Role"],
      ["days", "Shooting"],
      ["fee", "Fee"],
    ],
    [
      { role: "Lead, his own film", days: "45 days", fee: "His lead fee" },
      { role: "Na Saami Ranga", days: "Roughly 30–35 days", fee: success("The same amount") },
      { role: "Tamil films", days: "—", fee: warning("His first Telugu films' rate") },
    ],
    "tip-c-an-32a-1",
  );
  spawn(
    "stat-overrun",
    statPayload("A schedule overrun", {
      value: "18 months",
      label: "How long a film planned for four months can take — and interest keeps accumulating",
      delta: { from: "Four months", to: "18 months" },
      speaker: NARESH,
    }),
    "tip-c-an-32a-2",
  );

  // ---- 33 · Biggest Career Regrets — 8 primary, 1 sticky, 1 reference
  branch(33, "a", [
    {
      title: "Correcting the budget",
      summary:
        "A flop rarely halves a fee overnight; instead the next film's budget is re-planned and everyone adjusts, from the director to the technicians. Producers through a bad run ask every artist the same question. Profit-sharing is another route — a lower upfront fee plus a share if the film works.",
    },
    {
      title: "Call sheets",
      summary:
        "An overrun of an hour can trigger an extra half call sheet, and crews sometimes waive it for a producer under pressure. Shooting a jam session on Bonalu, a holiday, already meant a double call sheet, and running long made it triple. Per head it looks small; multiplied across a unit, it adds up — and a lightman earns the same on any hero's set.",
    },
  ]);
  branch(33, "b", [
    {
      title: "Winning an audience back",
      summary:
        "He has no insecurity about acting, but a run of flops costs a hero respect, and people start telling each other not to bother. After Naandhi, Ugram added six or seven action scenes too suddenly, and Itlu Maredumilli Prajaneekam's tribal story was hard to sell — though it did very well on OTT. Of the 240 or 250 films a year, maybe twenty really stand out.",
    },
    {
      title: "Cinema is what I know",
      summary:
        "He relates to a Ravi Teja line about making another film whether or not the last one worked. He wouldn't know how to open a restaurant. Ask him about lenses instead — the first thing he asked on this set was which camera and lens, because the frame decides how much he can move.",
    },
  ]);
  branch(33, "c", [
    {
      title: "Gross and share",
      summary:
        "Most people hear a gross figure and assume the producer receives it, when theatre charges, publicity and distribution come out first. He has never checked Sudigadu's collection — if he found his highest, he'd have to find his lowest — and he even spoofed inflated posters in that film. Fans want the bragging rights; producers carry the losses.",
    },
  ]);
  branch(33, "d", [
    {
      title: "Karthikeya and the snakes",
      summary:
        "Offered Karthikeya right after Sudigadu, he liked the story but already had four commitments, the project had come through a mutual friend of Nikhil's, and everyone from Dasari onward was telling him to stick to comedy. Above all, he is terrified of snakes, and the film needed thirty or forty snake shots.",
    },
    {
      title: "Not a lover boy",
      summary:
        "He was approached for Nithiin's Gunde Jaari Gallanthayyinde too, but apart from Siddu from Srikakulam he has hardly done a love story. Romantic scenes are one of his insecurities — he can sense when he is forcing it. He wouldn't call either refusal a regret.",
    },
  ]);
  spawn(
    "stat-correction",
    statPayload("After a flop", {
      value: "Six or seven crore",
      label: "What a film planned at ₹10 crore gets re-planned at — the director and every technician adjust too",
      delta: { from: "₹10 crore", to: "Six or seven" },
      speaker: NARESH,
    }),
    "tip-c-an-33a-1",
  );
  table(
    "table-callsheets",
    "Call sheets",
    [
      ["day", "The day"],
      ["charge", "Charged as"],
    ],
    [
      { day: "Due to end 6:30, runs to 7:30", charge: warning("An extra half call sheet") },
      { day: "A holiday — Bonalu", charge: warning("A double call sheet") },
      { day: "A holiday that runs long", charge: danger("A triple call sheet") },
      { day: "Serials", charge: success("A fixed 9-to-9 call sheet") },
    ],
    "tip-c-an-33a-2",
  );
  quote(
    33,
    "quote-lose",
    "Losing an audience",
    "Once you lose an audience, winning them back is very difficult.",
    "On what a run of flops really costs a hero",
    "tip-c-an-33b-1",
  );
  quote(
    33,
    "quote-average",
    "No more average films",
    "Today, there's almost no such thing as an “average” film.",
    "Hit, average and flop used to be three categories — now average means OTT",
    "tip-c-an-33b-1",
  );
  quote(
    33,
    "quote-raviteja",
    "Another film",
    "whether a film is a hit or a flop, we make another film, because films are all I know.",
    "A Ravi Teja dialogue he relates to",
    "tip-c-an-33b-2",
  );
  spawn(
    "def-share",
    definitionPayload("Share", {
      term: "Share",
      gloss: "What eventually reaches the producer is the share after deductions.",
      speaker: NARESH,
    }),
    "tip-c-an-33c-1",
  );
  table(
    "table-success",
    "What counted as success",
    [
      ["what", ""],
      ["then", "His father's time"],
      ["now", "Today"],
    ],
    [
      { what: "The milestone", then: "Days run — 100, 150, in many centres", now: "Collection figures" },
      { what: "Reaching homes", then: "Doordarshan after a year and a half", now: "OTT by the third week" },
    ],
    "tip-c-an-33c-1",
  );
  table(
    "table-turneddown",
    "The roles he turned down",
    [
      ["film", "Film"],
      ["why", "Why he said no"],
    ],
    [
      { film: "Karthikeya", why: "Thirty or forty snake shots — and four commitments" },
      { film: "Gunde Jaari Gallanthayyinde", why: "A sincere love story — romance is his insecurity" },
    ],
    "tip-c-an-33d-1",
  );
  sticky(
    "sticky-regret",
    "“I wouldn't say I regret it”",
    "The chapter is titled regrets; asked for one, he says he wouldn't call either refusal a regret.",
    "turbo",
    "tip-c-an-33d-1",
  );
  site(
    "gunde-jaari",
    "https://en.wikipedia.org/wiki/Gunde_Jaari_Gallanthayyinde",
    "Gunde Jaari Gallanthayyinde",
    "tip-c-an-33d-2",
  );

  /*
   * The masthead: what the video is, an index into the 33 chapter groups, two
   * measured charts, and the link directory. Chapter rows carry the group ids
   * layoutChapters generates (`${idPrefix}-chapter-${n}`), so a click frames
   * that chapter.
   *
   * Both charts are class D* — computed from the chapter stamps and the
   * caption text at build time, never typed in. With 33 chapters both are bars;
   * the theme counts cover both speakers, since the captions don't separate
   * them.
   */
  const MASTHEAD_NODE_IDS = [
    "tip-art-an-episode",
    "tip-art-an-chart-airtime",
    "tip-art-an-chart-themes",
    "tip-art-an-links",
  ];

  spawn(
    "episode",
    episodePayload("The episode", {
      videoTitle: "‼️😅ALLARIIII - BEYOND THE COMEDY | Ft. Allari Naresh | RAW TALKS WITH VK |",
      channel: "Raw Talks With VK",
      duration: "2:28:36",
      url: ALLARI_NARESH_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/nuKQ5SyNu_E/maxresdefault.jpg",
      description:
        "Allari Naresh has carved a unique place in Telugu cinema with his effortless comic timing, memorable performances, and willingness to reinvent himself. From entertainers like Allari and Sudigadu to powerful films such as Gamyam and Naandhi, his journey reflects versatility, resilience, and a deep understanding of cinema.",
      chapters: ALLARI_NARESH_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-an-chapter-${index + 1}`,
      })),
    }),
    head(1),
  );
  const durations = chapterDurations(ALLARI_NARESH_CHAPTERS);
  spawn(
    "chart-airtime",
    {
      type: "chart",
      title: "Where the two and a half hours went",
      data: {
        chartType: "bar",
        categories: CHAPTER_SHORT_NAMES,
        series: [
          {
            name: "Minutes",
            data: durations.map((seconds) => Math.round((seconds / 60) * 10) / 10),
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
        series: countThemes(
          ALLARI_NARESH_CHAPTERS.map((chapter) => allariNareshSpan(chapter.start, chapter.end)),
          ALLARI_NARESH_THEMES,
        ),
        unit: "mentions",
        source: "Word counts per chapter in the English transcript, both speakers",
      },
    },
    head(1),
  );
  spawn(
    "links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: ALLARI_NARESH_VIDEO_URL },
            { label: "Raw Talks With VK", url: "https://www.youtube.com/@rawtalkswithvk" },
            { label: "rawtalks.in", url: "https://rawtalks.in/" },
            {
              label: "On Spotify",
              url: "https://open.spotify.com/episode/4Bjcc1cimxbVwXx6xtx6Oh",
            },
          ],
        },
        {
          label: "From the description",
          links: [
            {
              label: "The episode's research sheet",
              url: "https://docs.google.com/spreadsheets/d/1CN2-UqBoOmP3cmrr2HkF5ajTUeqPUtQfvpwZe3esQ_E/edit?usp=sharing",
            },
          ],
        },
        {
          label: "People",
          links: [
            { label: "Allari Naresh", url: "https://en.wikipedia.org/wiki/Allari_Naresh" },
            { label: "E. V. V. Satyanarayana", url: "https://en.wikipedia.org/wiki/E._V._V._Satyanarayana" },
            { label: "Aryan Rajesh", url: "https://en.wikipedia.org/wiki/Aryan_Rajesh" },
            { label: "Ravi Babu", url: "https://en.wikipedia.org/wiki/Ravi_Babu" },
          ],
        },
        {
          label: "Films discussed",
          links: [
            { label: "Allari (2002)", url: "https://en.wikipedia.org/wiki/Allari_(film)" },
            { label: "Kithakithalu", url: "https://en.wikipedia.org/wiki/Kithakithalu" },
            { label: "Gamyam", url: "https://en.wikipedia.org/wiki/Gamyam" },
            { label: "Sudigadu", url: "https://en.wikipedia.org/wiki/Sudigadu" },
            { label: "Maharshi", url: "https://en.wikipedia.org/wiki/Maharshi_(2019_film)" },
            { label: "Naandhi", url: "https://en.wikipedia.org/wiki/Naandhi" },
            { label: "Sooryavansham", url: "https://en.wikipedia.org/wiki/Sooryavansham" },
            { label: "Fitting Master", url: "https://en.wikipedia.org/wiki/Fitting_Master" },
            { label: "Seema Tapakai", url: "https://en.wikipedia.org/wiki/Seema_Tapakai" },
          ],
        },
      ],
    }),
    head(1),
  );

  const layout = layoutChapters({
    mainCardIds: ALLARI_NARESH_CHAPTERS.map((_, index) => head(index + 1)),
    mastheadNodeIds: MASTHEAD_NODE_IDS,
    cards,
    cardOrder,
    connections,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    idPrefix: "tip-an",
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
