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
  RANA_DAGGUBATI_CHAPTERS,
  RANA_DAGGUBATI_VIDEO_URL,
} from "@/lib/transcriptImport/ranaDaggubatiInterview";

/*
 * Rana Daggubati on InFocus (The Hollywood Reporter India), 46 minutes.
 *
 * The first fixture built from a real video with creator chapters, so the spine
 * is theirs: seven chapters, their titles verbatim, their boundaries, and their
 * time ranges on the group labels. It is also the first with timestamps, so
 * every quote carries the position it was said at.
 *
 * Two caveats the source forces, both of them general to ASR captions:
 *
 * 1. No speaker labels. Attribution is read from the turn structure and is only
 *    asserted where that structure is unambiguous — which rules out one
 *    otherwise-good claim around 8:03, where the ASR run-on makes it impossible
 *    to tell where the question ends and the answer starts.
 * 2. Mangled proper nouns. "UTI" is Ooty, "Mika" is Miheeka, "Raja Moly" is
 *    Rajamouli. Resolving a mangled referent is a lookup, not a new fact, so
 *    Ooty appears resolved in the Assembly Rooms table; no mangled name is used
 *    anywhere it would carry a claim.
 */

const RANA = "Rana Daggubati";
const ANUPAMA = "Anupama Chopra";

export const TIP_THREAD_RANA_MAIN = "tip-thread-rana-main";
export const TIP_THREAD_RANA_NEWGEN = "tip-thread-rana-newgen";
export const TIP_THREAD_RANA_COSTS = "tip-thread-rana-costs";
export const TIP_THREAD_RANA_BALANCE = "tip-thread-rana-balance";
export const TIP_THREAD_RANA_CREATOR = "tip-thread-rana-creator";
export const TIP_THREAD_RANA_TRAUMA = "tip-thread-rana-trauma";
export const TIP_THREAD_RANA_BREAK = "tip-thread-rana-break";
export const TIP_THREAD_RANA_INDIE = "tip-thread-rana-indie";
export const TIP_THREAD_RANA_ROOMS = "tip-thread-rana-rooms";
export const TIP_THREAD_RANA_TELUGU = "tip-thread-rana-telugu";
export const TIP_THREAD_RANA_MONEY = "tip-thread-rana-money";
export const TIP_THREAD_RANA_PRODUCERS = "tip-thread-rana-producers";
export const TIP_THREAD_RANA_THEATRES = "tip-thread-rana-theatres";
export const TIP_THREAD_RANA_RULES = "tip-thread-rana-rules";
export const TIP_THREAD_RANA_WRITING = "tip-thread-rana-writing";
export const TIP_THREAD_RANA_RELEASE = "tip-thread-rana-release";
export const TIP_THREAD_RANA_CULTURE = "tip-thread-rana-culture";
export const TIP_THREAD_RANA_FUTURE = "tip-thread-rana-future";

export function buildRanaDaggubatiCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_RANA_MAIN,
    TIP_THREAD_RANA_NEWGEN,
    TIP_THREAD_RANA_COSTS,
    TIP_THREAD_RANA_BALANCE,
    TIP_THREAD_RANA_CREATOR,
    TIP_THREAD_RANA_TRAUMA,
    TIP_THREAD_RANA_BREAK,
    TIP_THREAD_RANA_INDIE,
    TIP_THREAD_RANA_ROOMS,
    TIP_THREAD_RANA_TELUGU,
    TIP_THREAD_RANA_MONEY,
    TIP_THREAD_RANA_PRODUCERS,
    TIP_THREAD_RANA_THEATRES,
    TIP_THREAD_RANA_RULES,
    TIP_THREAD_RANA_WRITING,
    TIP_THREAD_RANA_RELEASE,
    TIP_THREAD_RANA_CULTURE,
    TIP_THREAD_RANA_FUTURE,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 15 + index);
  });

  // ---- Chapter heads: the creator's seven, titles verbatim ----------------
  const mainDefs = RANA_DAGGUBATI_CHAPTERS.map((chapter, index) => ({
    id: `tip-c-rana-main-${index + 1}`,
    title: chapter.title,
  }));
  const summaries = [
    "There are always at least three world-domination plans running, and he treats that as correct — if an idea is not world-dominating it is not worth doing. The direction comes from his grandfather, who left a village to make films and made over a hundred. The focus now is a new generation of filmmakers, held back by costs that rose out of proportion.",
    "You never log out of the arts: what you see and hear is the business, and from the moment you wake you are performing to something. He says people mistake the choice for freedom when it is a full-time job. Yet the balance everyone chases already exists in it — a friend pointed out that someone comes to your office each morning to tell you a story.",
    "Trauma is not the negative word it sounds like — it is whatever deeply affected you, and often you only see afterwards which part of your life a film came from. His grandfather's death and his own health became weapons, not wounds. Testing Claude since launch convinced him it can mimic that but not make it: cinema runs on how a person responded.",
    "When you break, you break, and everything you believed your life was disappears. Months in America among doctors and bookstores, where nobody knew who he had been, gave him time he had never had. He spent three days listing everything else he could do, concluded that what you do is not the end of your life but only how you defined it, and reset it.",
    "In Telugu the money goes on the screen — the cost of talent is small beside what reaches the frame — and almost all of it is borrowed rather than funded. That leaves a fire to make it back in the cinemas, which OTT money briefly removed before taking the cushion away again. Every couple of years another eight or ten risk-taking producers arrive.",
    "Very little of what they do with AI will reach the final screen, because you cannot test it the way you test an actual illusion effect. Everything else he treats as an efficiency tool — a digital double instead of risking a real one, language cleaned up for writers who do not write well. Specialised products are already being built for the industry.",
    "Up north the networks decide the release date rather than the producer, and he finds it very hard to get used to. The north is also heavily underscreened, so the theatrical window keeps narrowing. Here the cinema-going habit was cultivated deliberately, on low ticket prices and films that taught people their customs, and it did not die.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_RANA_MAIN,
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

  // ---- Chapter 1 · Intro --------------------------------------------------
  branch(TIP_THREAD_RANA_NEWGEN, "tip-c-rana-main-1", [
    {
      id: "tip-c-rana-newgen-1",
      title: "A new generation, a new voice",
      summary:
        "He says the last five or six months have made it unmistakable that a new generation and a new voice have arrived. The evidence is everywhere he looks: the news, social media, which films are working in cinemas, and the younger audiences turning up for them. At forty-two he notes that everyone under thirty is consuming something different.",
    },
    {
      id: "tip-c-rana-newgen-2",
      title: "The under-30 office",
      summary:
        "A decade ago they ran the exercise deliberately, making it an under-30 office when he was barely thirty himself and the oldest person in the camp. They were releasing films with new filmmakers and new actors at the same time. Those kids are now seasoned actors and popular directors.",
    },
  ]);
  branch(TIP_THREAD_RANA_COSTS, "tip-c-rana-main-1", [
    {
      id: "tip-c-rana-costs-1",
      title: "Costs went up, caution came back",
      summary:
        "Costs have risen dramatically and experimenting has got more expensive with them. Films they were once comfortable making for three to five crore — grand, good-looking, well cast — are harder to mount at that number now. So the industry went back to a cautious route of making only what it already knows will work.",
    },
    {
      id: "tip-c-rana-costs-2",
      title: "Kerala shows it is possible",
      summary:
        "He does not accept that the cost problem is real. Kerala is making films at a cost nobody else in the country manages, which is proof the number is achievable. What it takes, he says, is the effort to get off the high horse: production does not mean a fancy vacation and the vanity around it.",
    },
  ]);

  // ---- Chapter 2 · Why acting is a lifestyle, not a job -------------------
  branch(TIP_THREAD_RANA_BALANCE, "tip-c-rana-main-2", [
    {
      id: "tip-c-rana-balance-1",
      title: "The other way around",
      summary:
        "Asked whether his wife's advocacy for slowing down had rubbed off on him, he says the influence has run the other way. She now has projects in Bombay, Goa and China, travels more than he does and spends longer on calls than he does. He says he loves it.",
    },
    {
      id: "tip-c-rana-balance-2",
      title: "Already balanced",
      summary:
        "He rejects the premise that he is unbalanced. In his account the balance already exists, because you spend the majority of your day sitting with an idea that you, or a group of you, are excited about. He cannot name another job that keeps a person that engaged, whatever financial pressure sits alongside it.",
    },
    {
      id: "tip-c-rana-balance-3",
      title: "Ravi's line",
      summary:
        "A school friend called Ravi, with nothing to do with the movies, came by the Chennai office while Rana was in a narration. Afterwards he said: what a wonderful life you have — you sit there in the morning and someone comes and tells you a story. Rana counts it among the things he had stopped noticing were a blessing.",
    },
  ]);
  branch(TIP_THREAD_RANA_CREATOR, "tip-c-rana-main-2", [
    {
      id: "tip-c-rana-creator-1",
      title: "Every industry needs storytelling",
      summary:
        "Moving into the brand world showed him those businesses are creating too, telling shorter stories through a product rather than through a plot. His conclusion was that every industry needs storytelling, whatever it happens to sell. Water, a magazine, an insurance policy in a bank — the requirement does not change.",
    },
    {
      id: "tip-c-rana-creator-2",
      title: "Consumers become creators",
      summary:
        "A friend from the brand world gave him the line: every extreme consumer becomes a creator at some point. He says it holds for almost everything in his life, the tequila included. It also describes how his generation got into film — most never went to film school, they watched obsessively and worked out how to make it themselves.",
    },
  ]);

  // ---- Chapter 3 · Trauma, AI and what machines can't make ---------------
  branch(TIP_THREAD_RANA_TRAUMA, "tip-c-rana-main-3", [
    {
      id: "tip-c-rana-trauma-1",
      title: "What trauma actually means",
      summary:
        "He pushes back on the word itself. Trauma carries a large negative connotation, but what he means by it is anything that deeply affected you, and the effect need not have been bad. Often the recognition is retrospective: only after making a film or a decision do you realise which part of your life it played out from.",
    },
    {
      id: "tip-c-rana-trauma-2",
      title: "Traumas became weapons",
      summary:
        "The two he names are his grandfather's passing and his health taking a toll. Both became weapons rather than wounds — he restructured his life around the void his grandfather left, and now does things his grandfather used to do. Had his health not turned after Baahubali, he says, he would never have been part of the stories he tells now.",
    },
    {
      id: "tip-c-rana-trauma-3",
      title: "Mimicry is not creation",
      summary:
        "He has been testing Claude since the day it launched, trying to build scenes and stand in for writers. His finding is that it mimics: given an event in someone's life it extrapolates how things would go from there. What it cannot produce is the relationship a person forms with what happened to them, and that response is individual.",
    },
  ]);
  branch(TIP_THREAD_RANA_BREAK, "tip-c-rana-main-3", [
    {
      id: "tip-c-rana-break-1",
      title: "When you break, you break",
      summary:
        "He does not soften it: when you break, you break, and everything you believed your life was disappears. He describes it as a strange reset in which nothing feels true any more, because it turns out the whole thing could go away in seconds. Looking inwards from there, he realised how far he had kept himself at the centre.",
    },
    {
      id: "tip-c-rana-break-2",
      title: "Bookstores and anonymity",
      summary:
        "The months in America were spent visiting doctors and hospitals, eating salt-free food, and otherwise in bookstores and libraries. Nobody there knew him, so no one had a past reference for whether he had been a thin guy or a big guy. He says America gives you a great deal of time, which working life never does.",
    },
    {
      id: "tip-c-rana-break-3",
      title: "The exhaustive list",
      summary:
        "He spent three whole days writing a list of everything else he could do. Voiceovers, if he could not move. Running certain kinds of business, coming back to animation, even running a restaurant. By the end it was exhaustive enough that he asked himself what he had been worried about — and some of the vaguer items he now actually does.",
    },
  ]);

  // ---- Chapter 4 · Rebuilding after Baahubali ----------------------------
  branch(TIP_THREAD_RANA_INDIE, "tip-c-rana-main-4", [
    {
      id: "tip-c-rana-indie-1",
      title: "Reset the definition",
      summary:
        "The clarity he took from the list was that what you are doing is not the end of your life; it is only what you had defined your life as. So he reset the definition and went forward from there. He reports the outcome plainly: life is back, and it has been pretty good.",
    },
    {
      id: "tip-c-rana-indie-2",
      title: "Why parallel cinema",
      summary:
        "He picked parallel cinema deliberately, in the wake of the new technology world taking over rather than in spite of it. The data he was working with suggested people no longer engage with digital as much, because there is simply too much of it. What becomes important in that world, he argues, is the need for humans.",
    },
    {
      id: "tip-c-rana-indie-3",
      title: "The wrong engine",
      summary:
        "The films are not the problem; the system they are released into is. He compares it to taking a vintage, beautiful-looking car and driving it with an engine it was never built for — it is going to blow up. Exhibition has been built for something else entirely, and each release teaches them more about that landscape.",
    },
  ]);
  branch(TIP_THREAD_RANA_ROOMS, "tip-c-rana-main-4", [
    {
      id: "tip-c-rana-rooms-1",
      title: "Cinemas like coffee shops",
      summary:
        "They are building fifty and eighty-seater rooms with two or three screens each, designed so that it does not feel like a theatre at all. The reference point is a coffee shop. The aim is to remove the whole ordeal of parking downstairs and going up through a mall for a film that was never mainstream to begin with.",
    },
    {
      id: "tip-c-rana-rooms-2",
      title: "The Assembly Rooms",
      summary:
        "The project is called the Assembly Rooms, starting in Ooty with a second being built in Hyderabad and one or two facilities in Bangalore. Mumbai comes last in the cycle, because the real estate there is expensive. Through September they are also running an outdoor cinema playing alternative Telugu films with Q&As.",
    },
  ]);
  branch(TIP_THREAD_RANA_TELUGU, "tip-c-rana-main-4", [
    {
      id: "tip-c-rana-telugu-1",
      title: "Hero-first to director-first",
      summary:
        "The shift he considers the big one is that audiences moved from hero-first to director-first. He credits Rajamouli, Nag Ashwin and others with governing their cinema in a particular manner. The result is that the director has become the reason you go, which he calls an incredible change and a large one.",
    },
    {
      id: "tip-c-rana-telugu-2",
      title: "Languages disappeared",
      summary:
        "Languages have effectively disappeared as a barrier. Subtitles are a normal thing now, dubbing across languages has become comfortable, and if a film does not reach a theatre there is a version of it sitting on some streaming service. Audiences consume across Tamil, Malayalam and Telugu in whatever form reaches them.",
    },
    {
      id: "tip-c-rana-telugu-3",
      title: "Small films get an equal chance",
      summary:
        "Telugu, like Malayalam, is finding a way to hold its mainstream and its alternative edge in the same place. An indie film can take a mainstream release and stand a real chance of winning, and a star as big as Mahesh Babu can back something unconventional. He expects small gems to break out next year among the big titles.",
    },
  ]);

  // ---- Chapter 5 · When too much money becomes a problem -----------------
  branch(TIP_THREAD_RANA_MONEY, "tip-c-rana-main-5", [
    {
      id: "tip-c-rana-money-1",
      title: "It goes on the screen",
      summary:
        "Where the money goes is the distinction he draws. The cost of talent is very little in the scheme of these films; almost all of the budget is spent on what is actually on set and therefore reaches the screen. He contrasts that with an industry where the ratio runs the other way around.",
    },
    {
      id: "tip-c-rana-money-2",
      title: "Borrowed, not funded",
      summary:
        "These are not funded films. Almost all of it is borrowed money, and he reckons perhaps ten per cent of films here are made without interest attached. So the bigger you push the budget, the bigger the interest being pushed along with it — which leaves a general fire to make the money back in the cinemas.",
    },
    {
      id: "tip-c-rana-money-3",
      title: "The heat came back",
      summary:
        "For a short period, selling to OTT covered the cost and made the profit before release, and producers pushed budgets two and three times higher on that comfort. He says OTT was nice enough to take the cushion away very fast. The pressure came back, and with it the fire in the belly and the absence of any comfort zone.",
    },
  ]);
  branch(TIP_THREAD_RANA_PRODUCERS, "tip-c-rana-main-5", [
    {
      id: "tip-c-rana-producers-1",
      title: "A new bunch every couple of years",
      summary:
        "Every couple of years another eight or ten producers enter Telugu cinema. He says that influx simply does not happen in the other languages, where the roster stays much the same. Part of the money is flowing back from the Telugu community abroad, which has done well financially in other markets.",
    },
    {
      id: "tip-c-rana-producers-2",
      title: "They carry the risk",
      summary:
        "These are risk-taking producers in the literal sense: liable for the money and guarantors for it, not people who sign the biggest star and wait. He describes meeting first-time producers who will back a first-time director on the strength of a story. They did not come for the star; they came because the story excited them.",
    },
  ]);
  branch(TIP_THREAD_RANA_THEATRES, "tip-c-rana-main-5", [
    {
      id: "tip-c-rana-theatres-1",
      title: "More vibrant than ever",
      summary:
        "Asked whether the appetite for films in theatres is still vibrant, he says it is much more vibrant now than ever — and adds that he would not have said it so confidently a year ago. He answers as someone with the vantage point to judge: he owns around three hundred screens across two states.",
    },
    {
      id: "tip-c-rana-theatres-2",
      title: "The short-content fad is done",
      summary:
        "Short content, he argues, has run its course as a fad. There is only so much chips and coke a person will have before wanting a proper meal, something more nourishing. Doom scrolling became a recognised thing, he sees young people turning their phones off, and a whole generation is buying flip phones again.",
    },
  ]);

  // ---- Chapter 6 · Drawing his own lines around AI -----------------------
  branch(TIP_THREAD_RANA_RULES, "tip-c-rana-main-6", [
    {
      id: "tip-c-rana-rules-1",
      title: "Almost nothing reaches the screen",
      summary:
        "Very little of what they do with AI will reach the final screen, and he would be wary of letting it. The reason is testability: you cannot test AI output the way you test an actual illusion effect. He treats the whole thing as an efficiency tool that can halve the hours a task takes, not as something that arrives in the cut.",
    },
    {
      id: "tip-c-rana-rules-2",
      title: "Digital doubles instead",
      summary:
        "Where he does see it working is at the complex end of stunts. A digital double can take a shot that would otherwise put a real body double at genuine risk on your behalf. That is the kind of substitution he considers clearly worth making.",
    },
    {
      id: "tip-c-rana-rules-3",
      title: "What's impossible in camera",
      summary:
        "What he is actually waiting for is the wild stuff — the work you cannot put a camera in front of at all. He frames it as a question to put to the tool: tell me the stories that are impossible in camera. That is where the edge is, rather than in reproducing something a camera could already have captured.",
    },
  ]);
  branch(TIP_THREAD_RANA_WRITING, "tip-c-rana-main-6", [
    {
      id: "tip-c-rana-writing-1",
      title: "It cleans up the language",
      summary:
        "He is relaxed about writers running their prose through Claude. Many people writing in English do not write it very well, and having the language cleaned up simply makes them easier to communicate with. He includes himself in that, joking that he no longer looks like a spaz when he writes an email.",
    },
    {
      id: "tip-c-rana-writing-2",
      title: "One filter, not all of them",
      summary:
        "The limit showed up in his own office a couple of months ago. Great log lines and pitches came in, and then the moment they met the person there was nothing there. His reading is that the tool gets someone through one filter rather than all of them — because finally it is you who is the story.",
    },
    {
      id: "tip-c-rana-writing-3",
      title: "Specialised products are coming",
      summary:
        "It does not handle vernacular languages well yet, but he knows enough techies around Hyderabad and Chennai already teaching it and building products for the entertainment industry. He expects specialised tools rather than generic ones, comparing it to what Movie Magic and Final Draft did — standards that changed how everybody worked.",
    },
  ]);

  // ---- Chapter 7 · Producing his first Hindi film ------------------------
  branch(TIP_THREAD_RANA_RELEASE, "tip-c-rana-main-7", [
    {
      id: "tip-c-rana-release-1",
      title: "The networks decide",
      summary:
        "His Hindi producing debut is finished and he is waiting on a release date, because up north the producer does not choose it — the networks do. He finds it very hard to get used to. The best time for his film in the theatre and the best slot in a network's monthly schedule are rarely the same date.",
    },
    {
      id: "tip-c-rana-release-2",
      title: "The north is underscreened",
      summary:
        "The north is heavily underscreened by comparison, something he says he is only noticing properly now that he releases films there. In his two states there are enough screens and enough audience to put out a small indie film alongside three big Sankranti releases. In Hindi that window keeps getting tighter.",
    },
  ]);
  branch(TIP_THREAD_RANA_CULTURE, "tip-c-rana-main-7", [
    {
      id: "tip-c-rana-culture-1",
      title: "Theatre is where culture happens",
      summary:
        "He is unequivocal that theatrical release is where cultural influence is made, and that it rarely comes from streaming. To be mainstream, to be part of popular culture, the film has to be in the theatre. He does not offer a substitute, because in his account there is not one.",
    },
    {
      id: "tip-c-rana-culture-2",
      title: "Cinema taught the customs",
      summary:
        "He traces the strength of the habit back to what the cinema taught its audience. Gods, prayers, how to lead a life and how to be with one another — a great deal of it came from film. Many customs in use today are film customs rather than inherited ones, and the programmes themselves were film-based.",
    },
    {
      id: "tip-c-rana-culture-3",
      title: "A literate audience",
      summary:
        "The other reason he gives is price: tickets were kept low, because people wanted a bigger audience rather than more money per head. That cultivated a habit which did not die, so a film with a decent trailer still picks up quickly. Watching across Tamil, Malayalam and Telugu made that audience literate and cosmopolitan.",
    },
  ]);
  branch(TIP_THREAD_RANA_FUTURE, "tip-c-rana-main-7", [
    {
      id: "tip-c-rana-future-1",
      title: "Formats will change",
      summary:
        "Asked to look ahead, he expects what everyone treats as fixed format to move. Films without intervals, films of different durations, much longer films in cinemas, and a day pass that lets you spend the whole day in one. Habits are changing: people still want to go to the same place, but to do something different there.",
    },
    {
      id: "tip-c-rana-future-2",
      title: "A surge in live performance",
      summary:
        "He also predicts an extreme surge in live performance — theatre and performers. He reads it as the counter-effect of AI rather than a coincidence: having had enough of the synthetic, people want to see real people. He says that fact really means a lot.",
    },
    {
      id: "tip-c-rana-future-3",
      title: "Made to get there",
      summary:
        "The change he finds most striking is one of intent. Filmmakers now say openly that they are making a film to win at Cannes or to reach the Oscars, and he has never seen that before. He believes the momentum is real, and that a chunk of global entertainment will end up owned here.",
    },
  ]);

  /*
   * Artifacts, chapter by chapter, per the transcript-artifacts skill. Every
   * quote, claim side, definition gloss and example below is a verbatim lift
   * from RANA_DAGGUBATI_INTERVIEW_TRANSCRIPT — enforced by
   * transcriptFidelity.test.ts.
   */
  const spawn = (nodeId: string, payload: Parameters<typeof spawnPayload>[1], cardId: string) =>
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

  // Chapter 1 — D' stat x2, H quote, F claim.
  spawn(
    "tip-art-rana-video",
    {
      type: "images",
      title: "Rana Daggubati On Baahubali, His Health Crisis & The Reset",
      data: {
        items: [
          {
            kind: "youtube",
            url: RANA_DAGGUBATI_VIDEO_URL,
            title: "Rana Daggubati | InFocus | THR India",
            thumb: "https://img.youtube.com/vi/lSRSF7l7-rg/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-rana-main-1",
  );
  spawn(
    "tip-art-rana-quote-vacation",
    quotePayload("Production is a camera and what's in front of it", {
      text:
        "production does not mean a fancy vacation and vanity that's around you.",
      speaker: RANA,
      timestamp: "0:00",
      context: "The cold open; he says it again at 5:12",
    }),
    "tip-c-rana-costs-1",
  );
  spawn(
    "tip-art-rana-stat-grandfather",
    statPayload("His grandfather's count", {
      value: "100+",
      unit: "films",
      label:
        "Made by a grandfather who came from a village and decided he wanted to make movies",
      speaker: ANUPAMA,
    }),
    "tip-c-rana-main-1",
  );
  spawn(
    "tip-art-rana-stat-budget",
    statPayload("What they used to cost", {
      value: "3–5",
      unit: "crore rupees",
      label:
        "Films they were very comfortable making — grand, beautiful looking, great concepts, great actors",
      speaker: RANA,
    }),
    "tip-c-rana-costs-1",
  );
  spawn(
    "tip-art-rana-claim-costs",
    claimPayload("Can it still be made for less?", {
      topic: "Whether films can still be made at the costs they used to be",
      proposition: {
        speaker: "A complaint we have in our heads",
        text: "oh this can't get done at this cost this can't get done",
      },
      counter: {
        speaker: RANA,
        text:
          "there's no real reason uh because in the same time an industry like Kerala is making it at the cost that nobody else in the country",
      },
    }),
    "tip-c-rana-costs-2",
  );
  site(
    "rana-wiki",
    "https://en.wikipedia.org/wiki/Rana_Daggubati",
    "Rana Daggubati",
    "tip-c-rana-main-1",
  );
  site(
    "ramanaidu-wiki",
    "https://en.wikipedia.org/wiki/D._Ramanaidu",
    "D. Ramanaidu",
    "tip-c-rana-main-1",
  );

  // Chapter 2 — F claim, H quote x2, E mechanism.
  spawn(
    "tip-art-rana-claim-free",
    claimPayload("Does choosing the arts buy you freedom?", {
      topic: "What people assume choosing the arts gets you",
      proposition: {
        speaker: "A common assumption, as he frames it",
        text: "a lot of times we mistake it for I'll be free",
      },
      counter: {
        speaker: RANA,
        text:
          "But that's not how it is. It's a full-time job. It's 24/7 completely.",
        timestamp: "7:00",
      },
    }),
    "tip-c-rana-main-2",
  );
  spawn(
    "tip-art-rana-quote-story",
    quotePayload("What a wonderful life you have", {
      text:
        "You're just sitting in the morning and someone is coming and telling you a story.",
      speaker: "Ravi, a school friend — quoted by Rana Daggubati",
      timestamp: "9:08",
      context: "The line that made him notice what the job actually is",
    }),
    "tip-c-rana-balance-3",
  );
  spawn(
    "tip-art-rana-quote-consumer",
    quotePayload("Extreme consumers become creators", {
      text: "every extreme consumer becomes a creator at some point",
      speaker: "A brand friend — quoted by Rana Daggubati",
      timestamp: "11:35",
      context: "His explanation for the tequila brand, and for most things",
    }),
    "tip-c-rana-creator-2",
  );
  spawn(
    "tip-art-rana-mech-filmschool",
    mechanismPayload("How a generation got in without film school", {
      steps: [
        { id: "noschool", label: "Didn't go to film school in India itself" },
        { id: "watch", label: "Watched movies like crazy" },
        { id: "job", label: "Figured out how to get a job" },
        { id: "made", label: "Made it" },
      ],
      edges: [
        { from: "noschool", to: "watch" },
        { from: "watch", to: "job" },
        { from: "job", to: "made" },
      ],
    }),
    "tip-c-rana-creator-2",
  );

  // Chapter 3 — G definition, F claim, H quote x2.
  spawn(
    "tip-art-rana-def-trauma",
    definitionPayload("Trauma", {
      term: "Trauma",
      gloss:
        "it's something that you're deeply affected by and that deep effect could be anything",
      speaker: RANA,
    }),
    "tip-c-rana-trauma-1",
  );
  spawn(
    "tip-art-rana-claim-ai",
    claimPayload("Will AI take over creativity?", {
      topic: "Whether AI is going to take over creativity",
      proposition: {
        speaker: "The question everybody's grappling with",
        text: "Is it going to take over creativity?",
      },
      counter: {
        speaker: RANA,
        text: "the arts are born out of trauma and AI doesn't do trauma",
        timestamp: "13:19",
      },
    }),
    "tip-c-rana-main-3",
  );
  spawn(
    "tip-art-rana-quote-react",
    quotePayload("Why we go to the movies", {
      text:
        "It can help you in plot. It can get your structure together but finally how people react is why we are going to the movies.",
      speaker: RANA,
      timestamp: "16:23",
      context: "On the limit of what a model can reach",
    }),
    "tip-c-rana-trauma-3",
  );
  spawn(
    "tip-art-rana-quote-center",
    quotePayload("What actual growth is", {
      text:
        "Only if you can remove yourself from the center and people grow around you is actual growth.",
      speaker: RANA,
      timestamp: "17:55",
      context: "What he realised after the health crisis",
    }),
    "tip-c-rana-break-1",
  );
  site("claude-ai", "https://claude.ai", "Claude", "tip-c-rana-trauma-3");
  site(
    "baahubali-wiki",
    "https://en.wikipedia.org/wiki/Baahubali:_The_Beginning",
    "Baahubali: The Beginning",
    "tip-c-rana-main-3",
  );

  // Chapter 4 — E mechanism, H quote x2, B table.
  spawn(
    "tip-art-rana-mech-parallel",
    mechanismPayload("Why he picked parallel cinema", {
      steps: [
        {
          id: "toomuch",
          label: "Too much digital stuff",
          note: "People don't engage so much with it anymore",
        },
        { id: "humans", label: "The need of humans becomes really important" },
        { id: "parallel", label: "Picked parallel cinema" },
        {
          id: "exhibition",
          label: "Fighting an exhibition system built for something else",
        },
      ],
      edges: [
        { from: "toomuch", to: "humans" },
        { from: "humans", to: "parallel" },
        { from: "parallel", to: "exhibition" },
      ],
    }),
    "tip-c-rana-indie-2",
  );
  spawn(
    "tip-art-rana-quote-coffee",
    quotePayload("Not a theatre, a coffee shop", {
      text: "it shouldn't feel like a theater it should feel like a coffee shop",
      speaker: RANA,
      timestamp: "21:56",
      context: "The design brief for the new 50 and 80-seater cinemas",
    }),
    "tip-c-rana-rooms-1",
  );
  spawn(
    "tip-art-rana-table-rooms",
    {
      type: "table",
      title: "The Assembly Rooms rollout",
      data: {
        columns: [
          { key: "city", label: "City" },
          { key: "status", label: "Status" },
          { key: "note", label: "Note" },
        ],
        rows: [
          {
            city: "Ooty",
            status: { value: "First", tags: [{ label: "Starting", tone: "success" }] },
            note: "The project is called the Assembly Rooms",
          },
          {
            city: "Hyderabad",
            status: { value: "Second", tags: [{ label: "Building", tone: "info" }] },
            note: "Should be up soon",
          },
          {
            city: "Bangalore",
            status: "One or two facilities",
            note: "Should be up soon",
          },
          {
            city: "Mumbai",
            status: { value: "Last of the cycles", tags: [{ label: "Later", tone: "warning" }] },
            note: "Mumbai real estate is very expensive",
          },
        ],
      },
    },
    "tip-c-rana-rooms-2",
  );
  spawn(
    "tip-art-rana-quote-director",
    quotePayload("The audience shifted", {
      text: "the audience have shifted from hero first to director first",
      speaker: RANA,
      timestamp: "23:58",
      context: "On what changed in Telugu cinema",
    }),
    "tip-c-rana-telugu-1",
  );

  // Chapter 5 — D' stat, H quote x2, E mechanism.
  spawn(
    "tip-art-rana-stat-interest",
    statPayload("Films made without interest", {
      value: "10%",
      label:
        "The rest are borrowed money — so the bigger you push, the bigger the interest pushed with it",
      speaker: RANA,
    }),
    "tip-c-rana-money-2",
  );
  spawn(
    "tip-art-rana-quote-fire",
    quotePayload("The fire that theatrical money leaves", {
      text:
        "there's one general fire in you that listen you have to make this money back in the cinemas",
      speaker: RANA,
      timestamp: "27:51",
      context: "What borrowed money does that funded money does not",
    }),
    "tip-c-rana-money-3",
  );
  spawn(
    "tip-art-rana-mech-ott",
    mechanismPayload("How the OTT cushion came and went", {
      steps: [
        { id: "comfort", label: "OTT started giving that comfort" },
        {
          id: "push",
          label: "We started pushing even more",
          note: "Budgets went 2x, 3x",
        },
        { id: "away", label: "OTT took that cushion away very very fast" },
        { id: "fire", label: "Back to just fire in your belly" },
      ],
      edges: [
        { from: "comfort", to: "push" },
        { from: "push", to: "away" },
        { from: "away", to: "fire" },
      ],
    }),
    "tip-c-rana-money-3",
  );
  spawn(
    "tip-art-rana-quote-chips",
    quotePayload("Why short content peaked", {
      text: "there's only so much chips and coke that you'll have in your life",
      speaker: RANA,
      timestamp: "31:21",
      context: "On the fad of snackable content being over",
    }),
    "tip-c-rana-theatres-2",
  );
  site(
    "mahesh-wiki",
    "https://en.wikipedia.org/wiki/Mahesh_Babu",
    "Mahesh Babu",
    "tip-c-rana-producers-2",
  );

  // Chapter 6 — F claim, B table, H quote, E mechanism.
  spawn(
    "tip-art-rana-claim-job",
    claimPayload("What's left to do when AI makes the film?", {
      topic: "What job is left when AI is making the entire film",
      proposition: {
        speaker: "A Reddit AMA questioner",
        text:
          "when AI is making the entire film, what job are you going to do?",
      },
      counter: {
        speaker: RANA,
        text: "I'm going to own the AI company.",
        timestamp: "32:57",
      },
    }),
    "tip-c-rana-main-6",
  );
  spawn(
    "tip-art-rana-table-ai",
    {
      type: "table",
      title: "Where he draws the line on AI",
      data: {
        columns: [
          { key: "area", label: "Area" },
          { key: "use", label: "Uses it?" },
          { key: "why", label: "Why" },
        ],
        rows: [
          {
            area: "Output on the final screen",
            use: { value: "Very little", tags: [{ label: "Wary", tone: "danger" }] },
            why: "You don't get to test it like how you test actual illusion effects",
          },
          {
            area: "Digital doubles for stunts",
            use: { value: "Yes", tags: [{ label: "Uses", tone: "success" }] },
            why: "Where a body double is actually risking something for you",
          },
          {
            area: "Time on a task",
            use: { value: "Yes", tags: [{ label: "Uses", tone: "success" }] },
            why: "Will slash that time by half if not much more",
          },
          {
            area: "Cleaning up written English",
            use: { value: "Yes", tags: [{ label: "Uses", tone: "success" }] },
            why: "Makes it easier to communicate",
          },
          {
            area: "Vernacular languages",
            use: { value: "Not yet", tags: [{ label: "Gap", tone: "warning" }] },
            why: "It doesn't do vernacular languages very well",
          },
        ],
      },
    },
    "tip-c-rana-rules-1",
  );
  spawn(
    "tip-art-rana-quote-camera",
    quotePayload("The edge worth chasing", {
      text: "What's impossible in camera? That's what it's going to do.",
      speaker: RANA,
      timestamp: "34:57",
      context: "What he is actually waiting for AI to make possible",
    }),
    "tip-c-rana-rules-3",
  );
  spawn(
    "tip-art-rana-mech-products",
    mechanismPayload("How AI becomes a standard tool", {
      steps: [
        {
          id: "techies",
          label: "Techies around Hyderabad and Chennai teaching it",
        },
        {
          id: "products",
          label: "Products built for the entertainment industry",
          note: "Not generic — they understand how ideas are generated",
        },
        { id: "specialized", label: "Things get specialized" },
        {
          id: "standard",
          label: "A standard way of working",
          note: "The way Final Draft became one",
        },
      ],
      edges: [
        { from: "techies", to: "products" },
        { from: "products", to: "specialized" },
        { from: "specialized", to: "standard" },
      ],
    }),
    "tip-c-rana-writing-3",
  );
  site(
    "final-draft",
    "https://www.finaldraft.com",
    "Final Draft",
    "tip-c-rana-writing-3",
  );

  // Chapter 7 — D' stat, H quote x2, E mechanism.
  spawn(
    "tip-art-rana-stat-screens",
    statPayload("Screens he owns", {
      value: "300",
      unit: "screens",
      label:
        "Across two states — enough that a small indie film can still open against three big ones",
      speaker: RANA,
    }),
    "tip-c-rana-release-2",
  );
  spawn(
    "tip-art-rana-quote-theatre",
    quotePayload("Where popular culture is made", {
      text:
        "you have to be in the theater to be mainstream to be part of popular culture",
      speaker: RANA,
      timestamp: "41:59",
      context: "On why streaming rarely makes something mainstream",
    }),
    "tip-c-rana-culture-1",
  );
  spawn(
    "tip-art-rana-mech-habit",
    mechanismPayload("Why the cinema-going habit held", {
      steps: [
        {
          id: "taught",
          label: "Cinema taught gods, prayers, how to lead life",
          note: "Many customs in use today are customs from film",
        },
        { id: "price", label: "The ticket price was controlled" },
        { id: "afford", label: "Always a low ticket price, so it's affordable" },
        { id: "habit", label: "You cultivated the habit" },
        { id: "alive", label: "That habit didn't die" },
      ],
      edges: [
        { from: "taught", to: "price" },
        { from: "price", to: "afford" },
        { from: "afford", to: "habit" },
        { from: "habit", to: "alive" },
      ],
    }),
    "tip-c-rana-culture-3",
  );
  spawn(
    "tip-art-rana-quote-intervals",
    quotePayload("What the next few years look like", {
      text:
        "You will start seeing films without intervals. You will start seeing films of different durations. You will start seeing much longer films in cinemas.",
      speaker: RANA,
      timestamp: "44:08",
      context: "Asked to look into his crystal ball",
    }),
    "tip-c-rana-future-1",
  );

  /*
   * The masthead: what the video is, a clickable index into the seven chapter
   * groups, and the link directory.
   *
   * The chapter rows carry the group ids layoutChapters will generate
   * (`${idPrefix}-chapter-${n}`), so clicking one frames that chapter.
   *
   * On the links: this description carries no URLs at all — no socials, no
   * products, no related videos — so the directory is built from what the
   * episode and the conversation actually point at rather than from invented
   * affiliate rows. A description that does carry them fills the same shape.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-rana-episode", "tip-art-rana-links"];

  spawn(
    "tip-art-rana-episode",
    episodePayload("The episode", {
      videoTitle:
        "Rana Daggubati On Baahubali, His Health Crisis & The Reset | InFocus | THR India",
      channel: "The Hollywood Reporter India",
      duration: "46:08",
      url: RANA_DAGGUBATI_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/lSRSF7l7-rg/maxresdefault.jpg",
      description:
        "Anupama Chopra sits down with Rana Daggubati for InFocus, at a moment when the actor-producer has at least three world domination plans running at once.",
      chapters: RANA_DAGGUBATI_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-rana-chapter-${index + 1}`,
      })),
    }),
    "tip-c-rana-main-1",
  );
  spawn(
    "tip-art-rana-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            {
              label: "This episode",
              url: RANA_DAGGUBATI_VIDEO_URL,
            },
            {
              label: "THR India",
              url: "https://www.youtube.com/@HollywoodReporterIndia",
            },
          ],
        },
        {
          label: "People",
          links: [
            { label: "Rana Daggubati", url: "https://en.wikipedia.org/wiki/Rana_Daggubati" },
            { label: "D. Ramanaidu", url: "https://en.wikipedia.org/wiki/D._Ramanaidu" },
            { label: "Mahesh Babu", url: "https://en.wikipedia.org/wiki/Mahesh_Babu" },
          ],
        },
        {
          label: "Tools he names",
          links: [
            { label: "Claude", url: "https://claude.ai" },
            { label: "Final Draft", url: "https://www.finaldraft.com" },
          ],
        },
      ],
    }),
    "tip-c-rana-main-1",
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
    idPrefix: "tip-rana",
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
