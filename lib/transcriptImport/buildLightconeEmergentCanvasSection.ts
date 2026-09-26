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
  LIGHTCONE_EMERGENT_CHAPTERS,
  LIGHTCONE_EMERGENT_VIDEO_URL,
} from "@/lib/transcriptImport/lightconeEmergent";

/*
 * The Lightcone, "AI Is Unlocking Millions Of New Builders" — the founders of
 * Emergent, 39 minutes, on the Y Combinator channel.
 *
 * The first fixture built from a video WITH creator chapters, and it is the
 * case the chaptering rules were written for: eleven of them where the
 * derivation formula would have cut four. They stay verbatim, boundaries and
 * titles both, because the reader scrubs this canvas alongside the video.
 *
 * Three things the source forces:
 *
 * 1. Four speakers, none labelled. Two hosts and two founders who are twin
 *    brothers, and the captions never say which twin is answering — so every
 *    attribution here is a role ("Emergent co-founder", "The Lightcone host")
 *    rather than a name, even though the video names them. Guessing which brother
 *    said a line would put a real person's name on words that may not be theirs.
 * 2. Eleven chapters at four primary artifacts each would be a wall, so most
 *    chapters run two or three. The episode total lands above the ~40 guide
 *    because the chapter count is nearly double what that guide assumes; the
 *    per-chapter cap is the constraint that was actually held to.
 * 3. Mangled product names, and they matter more here than usual because the
 *    products are the subject. "cloud code" is Claude Code, "kurs" is Cursor,
 *    "sweet bench" is SWE-bench, "Danzo" is Dunzo, "versel" is Vercel. A
 *    resolution appears in a card summary or a table cell where the context is
 *    unambiguous, and never inside a verbatim field. That rules out one
 *    otherwise excellent quote — "we were like cloud code before cloud code was
 *    a thing" — because the mangled name IS the claim; it is carried in a card
 *    summary instead.
 */

const FOUNDER = "Emergent co-founder";
const LC_HOST = "The Lightcone host";

export const TIP_THREAD_LC_MAIN = "tip-thread-lc-main";
export const TIP_THREAD_LC_INTRO = "tip-thread-lc-intro";
export const TIP_THREAD_LC_TWINS = "tip-thread-lc-twins";
export const TIP_THREAD_LC_DUNZO = "tip-thread-lc-dunzo";
export const TIP_THREAD_LC_VERIFY = "tip-thread-lc-verify";
export const TIP_THREAD_LC_LANDSCAPE = "tip-thread-lc-landscape";
export const TIP_THREAD_LC_BENCH = "tip-thread-lc-bench";
export const TIP_THREAD_LC_PIVOT = "tip-thread-lc-pivot";
export const TIP_THREAD_LC_MODELS = "tip-thread-lc-models";
export const TIP_THREAD_LC_SECOND = "tip-thread-lc-second";
export const TIP_THREAD_LC_DISTRO = "tip-thread-lc-distro";
export const TIP_THREAD_LC_INFRA = "tip-thread-lc-infra";
export const TIP_THREAD_LC_STACK = "tip-thread-lc-stack";
export const TIP_THREAD_LC_MEMORY = "tip-thread-lc-memory";
export const TIP_THREAD_LC_UX = "tip-thread-lc-ux";
export const TIP_THREAD_LC_MODELRISK = "tip-thread-lc-modelrisk";
export const TIP_THREAD_LC_DEMO = "tip-thread-lc-demo";
export const TIP_THREAD_LC_USERS = "tip-thread-lc-users";
export const TIP_THREAD_LC_ASANA = "tip-thread-lc-asana";
export const TIP_THREAD_LC_HIRE = "tip-thread-lc-hire";
export const TIP_THREAD_LC_SPLIT = "tip-thread-lc-split";
export const TIP_THREAD_LC_SAAS = "tip-thread-lc-saas";
export const TIP_THREAD_LC_SWARM = "tip-thread-lc-swarm";
export const TIP_THREAD_LC_PRICE = "tip-thread-lc-price";
export const TIP_THREAD_LC_PEOPLE = "tip-thread-lc-people";

/**
 * Canvas memory for this canvas — one gist per thread.
 *
 * On a canvas the user built, /api/gist writes these after each exchange. An
 * imported canvas has no exchanges, so the builder authors them: same ~40-word
 * shape, so a branch asked later gets the same faint sibling awareness it would
 * have had if the conversation had actually happened here.
 */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_LC_MAIN]:
    "Emergent on The Lightcone: twin founders out of YC summer 2024, the testing-automation idea VCs called too crazy, verification as the loop that keeps an agent running, the pivot from enterprise to consumer, their own Kubernetes stack, a live demo, and small-business users who would once have paid a dev shop half a million dollars.",
  [TIP_THREAD_LC_INTRO]:
    "The host frames the episode with growth rather than product — seven million apps built with Emergent in the eight months since launch — and the platform lets anyone build and ship production-ready software with AI agents.",
  [TIP_THREAD_LC_TWINS]:
    "Both brothers started programming at twelve and came to the US for PhDs; one dropped out for Google, the other started a deep learning team. They had been watching the field expecting an inflection rather than reacting to one.",
  [TIP_THREAD_LC_DUNZO]:
    "Before Emergent one brother ran Dunzo, the Indian hyperlocal quick-commerce company whose name became a verb. Managing three hundred engineers, he watched software testing turn out to be the biggest bottleneck in shipping fast.",
  [TIP_THREAD_LC_VERIFY]:
    "They applied to YC with automated software testing and VCs found it too crazy to fund. Building the testing agents produced the insight that verification is the loop keeping an agent running over a long horizon — solve it and you get much more than testing.",
  [TIP_THREAD_LC_LANDSCAPE]:
    "What the landscape looked like in 2024: Lovable had not started at all, Cursor was just getting going, and Devin had only just come out.",
  [TIP_THREAD_LC_BENCH]:
    "SWE-bench was where every coding agent was measured, so four of them packed into a room to become number one on it — and made discoveries that turned up in papers later.",
  [TIP_THREAD_LC_PIVOT]:
    "Enterprise was the conventional move and they tried it two or three months before concluding it was too slow. A small beta in June took off instead, and eighty percent of those users have no programming knowledge.",
  [TIP_THREAD_LC_MODELS]:
    "The rule they build by: don't solve what the next model generation will solve for you.",
  [TIP_THREAD_LC_SECOND]:
    "Coming second is not the disadvantage it looks like — every model generation reopens the question of what to build, so the second mover starts with a wider aperture while everyone else optimised for the front end.",
  [TIP_THREAD_LC_DISTRO]:
    "Coming from behind means entering head and shoulders above what exists before anyone notices, then scaling distribution deliberately — influencers, and a message about building real apps.",
  [TIP_THREAD_LC_INFRA]:
    "The last mile everyone neglects is the app deploying, not just building — which is why they run their own Kubernetes stack rather than outsourcing to a third-party sandbox vendor.",
  [TIP_THREAD_LC_STACK]:
    "The stack is deliberately not the Node-heavy one most would pick: a Python backend server and a React front-end server in a client-server architecture that supports background work.",
  [TIP_THREAD_LC_MEMORY]:
    "They went multi-agent early because context management has to be frugal — the main agent handles routine work and anything delegable goes to a sub-agent. Aggregating past trajectories into skills gave the agent memory that learns across sessions.",
  [TIP_THREAD_LC_UX]:
    "They hide the diff: the coding agent is strong enough that they use it internally instead of Claude Code, but they do not want to put a power tool in front of a non-technical user — agent experience alongside user experience.",
  [TIP_THREAD_LC_MODELRISK]:
    "On whether more capable models leave them exposed, he argues coding is only twenty percent of the job — and each generation they hand the models more autonomy, from library definitions to integrations to generating unit tests.",
  [TIP_THREAD_LC_DEMO]:
    "A live build: one prompt for an interview-practice app, and the engine works out on its own that this wants a mobile app and routes it to the mobile builder — then comes back with clarifying questions before it builds.",
  [TIP_THREAD_LC_USERS]:
    "Real users: an audio-video business in Illinois that replaced spreadsheet-and-phone intake, and a Norwegian who sold his company to PE and built lawyers a CRM with no programming background. Design stopped being a trade-off against functionality.",
  [TIP_THREAD_LC_ASANA]:
    "Their internal project management tool is an Asana replacement built on Emergent by a QA engineer with no code edited by hand. The whole company builds it collaboratively, and marketing built a complete CRM while support builds its own software.",
  [TIP_THREAD_LC_HIRE]:
    "They hire on two things only — problem solving and ownership — and the shape that follows is one or two people carrying what is a whole company elsewhere, with deployment that nearly mirrors Vercel done by two people.",
  [TIP_THREAD_LC_SPLIT]:
    "Most of the team is in Bangalore with three to five people in SF. Everyone talks to a customer once or twice a week and everyone does support — and he started the company partly to answer why there was no Google or Facebook from India.",
  [TIP_THREAD_LC_SAAS]:
    "SaaS as it exists faces two headwinds: its workflows get consumed by agents, and customers can now build the customised version themselves. Roughly a fifth of what people build on Emergent today is already agentic.",
  [TIP_THREAD_LC_SWARM]:
    "He calls the METR horizon chart the chart of the year, and they are experimenting with agent swarms over longer horizons with an agent watching the swarm. Most internal research goes into fine-tuning verifiers rather than the model — and the frontier models are clearly not interchangeable.",
  [TIP_THREAD_LC_PRICE]:
    "The primary users are small and medium business owners running on email, WhatsApp and spreadsheets, who would previously have gone to a dev shop — half a million dollars becomes five thousand.",
  [TIP_THREAD_LC_PEOPLE]:
    "Christy, a clinical psychologist in Alaska who also coaches equestrian sport, built the app she could not find anywhere. What users tell them is that money was never the whole problem — a lot gets lost in translation explaining an idea through a developer.",
};

export function buildLightconeEmergentCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_LC_MAIN,
    TIP_THREAD_LC_INTRO,
    TIP_THREAD_LC_TWINS,
    TIP_THREAD_LC_DUNZO,
    TIP_THREAD_LC_VERIFY,
    TIP_THREAD_LC_LANDSCAPE,
    TIP_THREAD_LC_BENCH,
    TIP_THREAD_LC_PIVOT,
    TIP_THREAD_LC_MODELS,
    TIP_THREAD_LC_SECOND,
    TIP_THREAD_LC_DISTRO,
    TIP_THREAD_LC_INFRA,
    TIP_THREAD_LC_STACK,
    TIP_THREAD_LC_MEMORY,
    TIP_THREAD_LC_UX,
    TIP_THREAD_LC_MODELRISK,
    TIP_THREAD_LC_DEMO,
    TIP_THREAD_LC_USERS,
    TIP_THREAD_LC_ASANA,
    TIP_THREAD_LC_HIRE,
    TIP_THREAD_LC_SPLIT,
    TIP_THREAD_LC_SAAS,
    TIP_THREAD_LC_SWARM,
    TIP_THREAD_LC_PRICE,
    TIP_THREAD_LC_PEOPLE,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 4 + index);
  });
  const threadGists = Object.fromEntries(
    threadIds.map((id) => [id, threadGist(THREAD_GISTS[id]!, 1)]),
  );

  // ---- Chapter heads: the eleven creator chapters ------------------------
  const mainDefs = LIGHTCONE_EMERGENT_CHAPTERS.map((chapter, index) => ({
    id: `tip-c-lc-main-${index + 1}`,
    title: chapter.title,
  }));
  const summaries = [
    "Emergent is a platform that lets anyone build and ship production-ready software using AI agents, founded by twin brothers who went through YC in summer 2024. The host opens with the number the rest of the episode circles: seven million apps built in the eight months since launch, which he says makes them one of the fastest growing companies YC has funded. The founders are asked to explain where that growth actually came from.",
    "Both brothers started programming at twelve and came to the US for PhDs. One dropped out for Google, the other went on to start the deep learning team at Amazon, and they had been meaning to build something together for years. Before Emergent, one of them ran Dunzo, the Indian quick-commerce company — big enough that its name became a verb — where managing three hundred engineers taught him what actually slows a team down.",
    "The idea they applied to YC with was automating software testing, and VCs told them it was too crazy. Building the testing agents produced the insight the company is built on: verification is what keeps an agent running over a long horizon, so solving it means you can automate software engineering rather than just its tests. That is the point at which they stopped building a testing tool and started building a general coding agent.",
    "In 2024 the field was barely there — Lovable had not started, Cursor was just getting going, Devin had only just come out. They picked SWE-bench, then the benchmark every coding agent was measured on, locked four people in a room and took it to world number one in two months. In that stretch they worked out multi-agent orchestration, memory and agent-to-agent communication, and kept watching their own discoveries appear in papers months later.",
    "The conventional move was enterprise, and they tried it for two or three months before concluding it was too slow. Meanwhile they were using their own platform internally and watching Lovable and Bolt grow, so they packaged the coding agent and launched a small beta in June 2025. It took off, and the audience turned out to be the opposite of what they expected: eighty percent of users have no programming knowledge at all.",
    "Coming second is not the disadvantage it looks like. Every model generation reopens the question of what to build, so the second mover gets to skip whatever the next model will fix and starts with a much wider aperture. Their read was that users wanted apps that actually work while the incumbents were optimised for front-end prototyping, so they rebuilt the whole software lifecycle end to end — and then bought distribution through an influencer network rather than waiting to be found.",
    "The last mile is the part everyone neglects: the app has to deploy, not just build. So they run their own Kubernetes stack rather than a third-party sandbox, give the agent the same infrastructure at build time and deploy time, and feed it fast feedback — an agent is only as good as the feedback it gets. On top of that sit sub-agents for delegated work and a long-term memory that turns past trajectories into skills, so the agent that struggled with an integration three weeks ago no longer does.",
    "The demo is a live build: one prompt, and the platform routes it to the mobile app builder on its own, asks a couple of clarifying questions, and offers its own LLM key so nobody has to go and find one. Alongside it they show what users have shipped — an AV business's intake app from Illinois, a CRM for lawyers from a self-described business developer in Norway — and their own internal Asana replacement, built entirely on the platform by a QA engineer who started by prompting it to clone Jira.",
    "They hire on two things only: problem solving and ownership. The structure that follows is one or two people carrying what elsewhere is a whole company's worth of work — deployment by two, memory by one — on the theory that people are drawn to harder problems. Most of the team is in Bangalore with three to five in SF, and from day one everyone in the company, including a twelve-person engineering team, took a turn on customer support.",
    "SaaS as it exists faces two headwinds: its workflows get consumed by agents, and customers can now build the customised version themselves. Roughly a fifth of what people build on Emergent is already agentic — agents embedded inside the apps rather than software you operate. Looking forward, they are experimenting with swarms coordinating on one task under an overseeing agent, which only works if the verification loop is good enough, which is where their own fine-tuning effort goes.",
    "The users turn out to be small and medium business owners running on email, WhatsApp and spreadsheets, who would have paid a dev shop half a million dollars for custom software and now build it for five thousand. A clinical psychologist and equestrian coach in Alaska built the app at the intersection of her two fields that nobody would ever have built for her. The hosts read it as the next step in a long trend: fewer people needed per business, and more businesses that were never worth starting before.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_LC_MAIN,
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

  // ---- Chapter 1 · What Is Emergent? -------------------------------------
  branch(TIP_THREAD_LC_INTRO, "tip-c-lc-main-1", [
    {
      id: "tip-c-lc-intro-1",
      title: "Seven million apps in eight months",
      summary:
        "The host frames the episode with the growth figure rather than the product: seven million apps built with Emergent in the eight months since launch. He says the statistics the founders had given him beforehand were mind-blowing, and that they are one of the fastest growing companies YC has funded. The question he opens with is when that growth actually inflected.",
    },
    {
      id: "tip-c-lc-intro-2",
      title: "What the platform is",
      summary:
        "Emergent lets anyone build and ship production-ready software using AI agents, and it went through YC in the summer 2024 batch. The two founders are twin brothers. Garry is absent for this episode, so the hosts introduce them and hand over almost immediately.",
    },
  ]);

  // ---- Chapter 2 · Founder Backstory -------------------------------------
  branch(TIP_THREAD_LC_TWINS, "tip-c-lc-main-2", [
    {
      id: "tip-c-lc-twins-1",
      title: "Programming at twelve, a PhD each",
      summary:
        "The brothers started programming at the age of twelve and both came to the US for PhDs. One dropped out of the programme and joined Google; the other went on to start the deep learning team at Amazon. They had been meaning to do a startup together for a long time before this one.",
    },
    {
      id: "tip-c-lc-twins-2",
      title: "Watching the field for the inflection",
      summary:
        "They had been following deep learning for a while and were expecting an inflection point rather than reacting to one. That is the lens they brought to deciding what to build in AI. The first idea came out of an operational observation rather than the research.",
    },
  ]);
  branch(TIP_THREAD_LC_DUNZO, "tip-c-lc-main-2", [
    {
      id: "tip-c-lc-dunzo-1",
      title: "Dunzo became a verb",
      summary:
        "Before Emergent, one of the brothers ran Dunzo, a hyperlocal quick-commerce company in India. The host checks how big it was, and the answer is that it was really big — the name had become a verb, with people saying it the way you would say a thing had been dealt with. The captions render it \"Danzo\" and \"Dunano\" throughout.",
    },
    {
      id: "tip-c-lc-dunzo-2",
      title: "Testing was the bottleneck",
      summary:
        "Managing an engineering team of three hundred, he watched software testing turn out to be the biggest bottleneck in shipping fast. That observation, not a model capability, is what set the first idea. When they started looking at what to build in AI at the end of 2023, testing is where they began.",
    },
  ]);

  // ---- Chapter 3 · From AI Testing to General Coding Agents --------------
  branch(TIP_THREAD_LC_VERIFY, "tip-c-lc-main-3", [
    {
      id: "tip-c-lc-verify-1",
      title: "The VCs thought it was too crazy",
      summary:
        "They applied to YC with the idea of automating software testing, and took it to a lot of VCs first. The reception was that it was too crazy an idea to fund. Looking back at that from here, he says, almost looks funny.",
    },
    {
      id: "tip-c-lc-verify-2",
      title: "Solve verification and you solve the rest",
      summary:
        "Building the testing agents produced the key insight: verification is the loop that keeps an agent running over a long horizon. Solve it and you have not just automated testing but the path to automating software engineering itself. That is the moment they stopped building a testing product and started looking at general coding agents as a space.",
    },
  ]);

  // ---- Chapter 4 · Getting Ahead of the Market ---------------------------
  branch(TIP_THREAD_LC_LANDSCAPE, "tip-c-lc-main-4", [
    {
      id: "tip-c-lc-landscape-1",
      title: "Nobody had started",
      summary:
        "Asked what the landscape looked like in 2024 — how big Lovable was by then — the answer is that Lovable had not started at all. Cursor was just getting going and Devin had only just come out. It was, by his account, really really early.",
    },
  ]);
  branch(TIP_THREAD_LC_BENCH, "tip-c-lc-main-4", [
    {
      id: "tip-c-lc-bench-1",
      title: "Four of them in a room with a benchmark",
      summary:
        "SWE-bench was where every coding agent was being measured at the time, and they took becoming number one on it as the challenge. Four of them packed themselves into a room and worked out how to crack it. They reached world number one in two months, and that result is what the company was founded on.",
    },
    {
      id: "tip-c-lc-bench-2",
      title: "Discoveries that turned up in papers later",
      summary:
        "At that stage they were a research company building coding agents rather than a product company. In the process they worked out multi-agent systems, memory, agent-to-agent communication and how to scale test-time compute. The pattern he remembers is discovering something and then seeing it published a few months later — they were, as he puts it, doing Claude Code before Claude Code was a thing.",
    },
  ]);

  // ---- Chapter 5 · The Pivot to Non-Technical Users ----------------------
  branch(TIP_THREAD_LC_PIVOT, "tip-c-lc-main-5", [
    {
      id: "tip-c-lc-pivot-1",
      title: "Enterprise was the common wisdom",
      summary:
        "With the coding agent working, they went the enterprise route because that was the accepted move at the time. Two or three months of trying to make the agents work inside enterprises told them it was too slow. Meanwhile they were using the platform internally to build their own tools.",
    },
    {
      id: "tip-c-lc-pivot-2",
      title: "A small beta in June that took off",
      summary:
        "Watching Lovable and Bolt grow, they asked why they should not package the coding agent they already had and put it in front of the world. They launched a small beta pilot in June 2025. It took off, and everything since has been aimed at that audience.",
    },
    {
      id: "tip-c-lc-pivot-3",
      title: "Eighty percent have no programming knowledge",
      summary:
        "They had assumed a lot of technical people would use it. In fact eighty percent of users on the platform are non-technical with zero programming knowledge, building apps that run real businesses. The audience is global — seventy to eighty percent in the US and Europe, and users in over a hundred and ninety countries.",
    },
  ]);

  // ---- Chapter 6 · Why Second Movers Can Win in AI -----------------------
  branch(TIP_THREAD_LC_MODELS, "tip-c-lc-main-6", [
    {
      id: "tip-c-lc-models-1",
      title: "Don't solve what the next model will solve",
      summary:
        "When they started, GPT-4 was the model everyone was building against and the problem everybody was working on was JSON parsing and structured output. They decided the next model would solve that and spent no time on it. The general rule he draws is that every model generation reopens the question of what is worth building — Opus is a different class of model, so long-horizon tasks and coordinated agents become the things to reimagine around.",
    },
  ]);
  branch(TIP_THREAD_LC_SECOND, "tip-c-lc-main-6", [
    {
      id: "tip-c-lc-second-1",
      title: "A wider aperture, starting second",
      summary:
        "Two advantages come with being second. You can see what is and is not working for the incumbents, and you start from a fundamentally different point — the aperture on the world is wider, and the imagination bigger, than it was for whoever went first.",
    },
    {
      id: "tip-c-lc-second-2",
      title: "Everyone else optimised for the front end",
      summary:
        "Their read of the users was that they wanted an app that actually works, while the existing platforms were optimised for front-end prototyping. So they reimagined the platform from the ground up around shipping to production. The insight underneath it is that automating software engineering means replicating what a good engineering team does — reviews, testing, debugging, deployment, security, hosting.",
    },
  ]);
  branch(TIP_THREAD_LC_DISTRO, "tip-c-lc-main-6", [
    {
      id: "tip-c-lc-distro-1",
      title: "Influencers, and a message about real apps",
      summary:
        "Coming from behind means the product has to enter head and shoulders above what exists before anyone takes notice — and then distribution has to be scaled deliberately. They built a large influencer network on TikTok and Instagram and that is what kickstarted it. The messaging was broad but pointed: come and ship real software, and don't hit the errors you see on the other platforms.",
    },
  ]);

  // ---- Chapter 7 · Building for Production, Not Just Prototypes ----------
  branch(TIP_THREAD_LC_INFRA, "tip-c-lc-main-7", [
    {
      id: "tip-c-lc-infra-1",
      title: "Their own Kubernetes stack, not a sandbox vendor",
      summary:
        "The last mile — the app deploying, not just building — is what he says people neglect, and it is why they built their own infrastructure instead of outsourcing to a third-party sandbox provider. Their own Kubernetes and container stack means the agent gets the same environment at build time and deploy time, so the deployment phase throws up far fewer problems. Owning it also lets them give the agent fast feedback, which is the thing that actually determines how good it is.",
    },
  ]);
  branch(TIP_THREAD_LC_STACK, "tip-c-lc-main-7", [
    {
      id: "tip-c-lc-stack-1",
      title: "Python backend, React front end",
      summary:
        "The stack is deliberately not the Node-heavy one most people would pick: a Python backend server and a React front-end server, in a client-server architecture that supports background jobs and queues. The reasoning is about where users end up rather than where they start — someone will eventually prompt for asynchronous video processing, and they wanted that supported from day one. It is the same stack Emergent itself is built on, exposed to users and agents alike.",
    },
  ]);
  branch(TIP_THREAD_LC_MEMORY, "tip-c-lc-main-7", [
    {
      id: "tip-c-lc-memory-1",
      title: "Sub-agents for anything delegated",
      summary:
        "They were early on multi-agent architecture because context management has to be frugal. The main driving agent handles the routine and everything delegable goes to a sub-agent — testing, design search, working out how to integrate an unfamiliar API.",
    },
    {
      id: "tip-c-lc-memory-2",
      title: "Skills generated from past trajectories",
      summary:
        "Aggregating the trajectories they were already generating gave the agent a long-term memory that learns across sessions rather than within one — a variant, he argues, of continual learning. He points at the skills-versus-no-skills benchmark result and at the finding that agent-written skills underperform, and says theirs are generated from previous trajectories and put through CI/CD before entering memory. The compounding is concrete: an integration the agent struggled with three weeks ago is no longer a struggle.",
    },
  ]);
  branch(TIP_THREAD_LC_UX, "tip-c-lc-main-7", [
    {
      id: "tip-c-lc-ux-1",
      title: "They hide the diff",
      summary:
        "The coding agent is powerful enough that they use it internally instead of Claude Code, and they are proud of that — but they do not want to put a power tool in front of a non-technical user. There is a VS Code editor and they hide it, because non-technical users panic as soon as they see a diff. Even a fairly technical PM on the team asks not to be shown JSON.",
    },
    {
      id: "tip-c-lc-ux-2",
      title: "Agent experience, alongside user experience",
      summary:
        "The host's read is that they started where Devin and Cursor did — real coding-agent power — and chose to package it for non-technical users, which is the opposite direction from the prototyping tools. Building that requires two kinds of empathy at once: for the user, and for the agent. They have an internal term for the second one, agent experience, and they measure it.",
    },
  ]);
  branch(TIP_THREAD_LC_MODELRISK, "tip-c-lc-main-7", [
    {
      id: "tip-c-lc-modelrisk-1",
      title: "Is Anthropic going to eat everybody up?",
      summary:
        "Asked whether more capable models leave them exposed, he names the industry's version of the worry directly and then argues past it: coding is only twenty percent of the job, and taking an app to production is the hard part. As models get more capable, human ambition grows at the same rate, so users want to build more complex things rather than fewer. Their harness extracts twenty to thirty percent more on top of the models, and can combine several foundation models at once.",
    },
    {
      id: "tip-c-lc-modelrisk-2",
      title: "Give the model more autonomy each generation",
      summary:
        "Some things they now leave to the models on purpose — library definitions, certain integrations, generating unit tests — that they used to prompt heavily for. The harness started strict and has been loosened deliberately with each generation. What they observe is that the more control they hand to the model, the better the harness gets.",
    },
  ]);

  // ---- Chapter 8 · Live Demo ---------------------------------------------
  branch(TIP_THREAD_LC_DEMO, "tip-c-lc-main-8", [
    {
      id: "tip-c-lc-demo-1",
      title: "The prompt picks its own builder",
      summary:
        "He prompts for an app that lets you practise podcast or job interview questions. The prompt engine works out on its own that this wants a mobile app and routes it to the mobile builder — even though the wrong tab was selected. The platform builds full-stack web apps and mobile apps from the same entry point.",
    },
    {
      id: "tip-c-lc-demo-2",
      title: "It asks before it builds",
      summary:
        "Before the agent goes off to build, it comes back with clarifying questions, because it wants to be sure it understood the requirement. One of them would normally require an OpenAI API key, and a non-technical user does not know what that is — so the answer is to use the Emergent LLM key instead. He replies casually, tells it to assume good defaults for the rest, and hands off; from there he could close the laptop and keep prompting from the mobile app.",
    },
  ]);
  branch(TIP_THREAD_LC_USERS, "tip-c-lc-main-8", [
    {
      id: "tip-c-lc-users-1",
      title: "An AV business in Illinois",
      summary:
        "A man in Illinois who runs an audio-video setup business built the intake his team had been doing by spreadsheet and phone calls. The app lets a customer build their room and specify the setup they want, which makes it a lead-generation form with a full stack behind it. He has no coding background.",
    },
    {
      id: "tip-c-lc-users-2",
      title: "A CRM for lawyers, from Norway",
      summary:
        "A man in Norway who sold his previous business to a PE firm noticed how much lawyers struggle with spreadsheets and built them a CRM. He has no programming background and describes himself as a business developer, a phrase the founder likes. CRMs for small businesses are a recurring shape on the platform.",
    },
    {
      id: "tip-c-lc-users-3",
      title: "Design stopped being a trade-off",
      summary:
        "A host notes the AV app simply looks like a well-designed app, down to the icons. They have spent a lot of time on that, because design and functionality used to trade off against each other — optimise for design and the functionality would come out weaker. The fix was working out how to share context so that design improves without costing the rest.",
    },
  ]);
  branch(TIP_THREAD_LC_ASANA, "tip-c-lc-main-8", [
    {
      id: "tip-c-lc-asana-1",
      title: "A QA engineer cloned Jira",
      summary:
        "Their internal project management tool is an Asana replacement built entirely on Emergent by one of their QA engineers, with no code edited by hand. It started as curiosity — his first prompt was to clone Jira — and he kept going. Asana was hard to bend to how they work, and dropping it saves around three to four thousand dollars a month.",
    },
    {
      id: "tip-c-lc-asana-2",
      title: "Everyone's feature requests, one tool",
      summary:
        "The whole company uses the one tool and builds it collaboratively: a PM, a QA, someone from HR can each ask for a feature. There is a testing phase, a deployment phase and versions maintained, with a primary owner managing it. They connect GitHub for internal projects, but non-technical users outside barely know what it is, so versioning is handled for them.",
    },
    {
      id: "tip-c-lc-asana-3",
      title: "Teams building their own software",
      summary:
        "Marketing has built a complete CRM on the platform and customer support is building its own support software. The point is who is doing the building: the people closest to the problem, who understand it best. The internal Asana clone doubles as a dogfooding test at the complexity ceiling users actually reach.",
    },
  ]);

  // ---- Chapter 9 · How Emergent Hires and Runs a Lean Team ---------------
  branch(TIP_THREAD_LC_HIRE, "tip-c-lc-main-9", [
    {
      id: "tip-c-lc-hire-1",
      title: "Problem solving and ownership",
      summary:
        "From day one they have indexed on two things: how good you are at problem solving, and whether you can take real ownership. Early hires came out of an explicit push to recruit top-100 rank holders from the Indian entrance exams, and several of the first engineers came across from Dunzo.",
    },
    {
      id: "tip-c-lc-hire-2",
      title: "One or two people per company-sized problem",
      summary:
        "The shape of the team is one or two people doing what a whole company does elsewhere. Deployment, which he says almost mirrors what Vercel would look like, is done by two people; memory, which multiple startups exist to solve, is built by one. His argument is that giving people far more responsibility is not a cost but the draw.",
    },
  ]);
  branch(TIP_THREAD_LC_SPLIT, "tip-c-lc-main-9", [
    {
      id: "tip-c-lc-split-1",
      title: "Bangalore, with three to five in SF",
      summary:
        "Most of the team is in the Bangalore office, with a very small SF office of three to five people. One brother has been in the Bay Area for ten years and splits his time between the two, constantly jetlagged. They are hiring in both places.",
    },
    {
      id: "tip-c-lc-split-2",
      title: "Everyone does customer support",
      summary:
        "Everyone in the company talks to a customer once or twice a week, and everyone does customer support. With a twelve-person engineering team, one person was always on call for it — a genuinely hard call when you are small and need to ship. He spent his own first five days after launch glued to a desk answering support, much of it in French and German.",
    },
    {
      id: "tip-c-lc-split-3",
      title: "Why not a Silicon Valley company",
      summary:
        "Coming back to India after Google, he kept asking why there was no Google or Facebook from India, and started the second company meaning to answer it. His view is that the talent and the capital are both there and the missing ingredient is ambition — thinking global from day zero. With the internet fully penetrated, he argues any country can build for a global audience.",
    },
  ]);

  // ---- Chapter 10 · Is SaaS Dead? -----------------------------------------
  branch(TIP_THREAD_LC_SAAS, "tip-c-lc-main-10", [
    {
      id: "tip-c-lc-saas-1",
      title: "Two headwinds",
      summary:
        "Asked the provocative version — is SaaS dead, given they killed Asana for themselves — he says the way SaaS exists today needs to change, and names two headwinds. More of those workflows get consumed by an agent, so a SaaS company that does not pivot to agent-first will struggle. And customers increasingly want the customised version, which they can now build themselves.",
    },
    {
      id: "tip-c-lc-saas-2",
      title: "A fifth of it is already agentic",
      summary:
        "The nature of software is changing rather than just its vendors. Roughly twenty percent of what people build on Emergent today is agentic — users embedding the Emergent agent inside their own apps to power workflows. The lawyers' CRM is his example: an agent takes a workflow and runs it through.",
    },
  ]);
  branch(TIP_THREAD_LC_SWARM, "tip-c-lc-main-10", [
    {
      id: "tip-c-lc-swarm-1",
      title: "Swarms, with an agent watching the swarm",
      summary:
        "The METR horizon chart is, he says, the chart of the year, and they are experimenting internally with agent swarms working over much longer horizons. The problem at that length is trajectories getting derailed, so an overseeing agent monitors the overall task in parallel while the others collaborate. Even the crudest version of a long loop only works if there is something to check the work.",
    },
    {
      id: "tip-c-lc-swarm-2",
      title: "They fine-tune the verifiers, not the model",
      summary:
        "Because everything depends on autonomous verification feedback, most of their internal research is on building the best verifiers, including custom fine-tuning. They are deliberate about not competing with the labs head-on — no attempt at building an alternative frontier model, just fine-tuned verification layers on top.",
    },
    {
      id: "tip-c-lc-swarm-3",
      title: "The models are not the same model",
      summary:
        "Asked whether the model companies look alike, he says the models themselves clearly do not: Opus is the workhorse, Codex is strong at backend debugging, Gemini at front end. Being on top of all of them means they can use each model's spikes where it is best. He expects commoditisation eventually — similar behaviours, price competition, open source three to six months behind.",
    },
  ]);

  // ---- Chapter 11 · The Future --------------------------------------------
  branch(TIP_THREAD_LC_PRICE, "tip-c-lc-main-11", [
    {
      id: "tip-c-lc-price-1",
      title: "Half a million becomes five thousand",
      summary:
        "The primary users are small and medium business owners running their businesses on email, WhatsApp and spreadsheets, who would previously have gone to a dev shop for custom software. The price point is what changed: software that would have cost around five hundred thousand dollars now gets built for five thousand, by the owner. That, he says, is the unlock they are bringing.",
    },
  ]);
  branch(TIP_THREAD_LC_PEOPLE, "tip-c-lc-main-11", [
    {
      id: "tip-c-lc-people-1",
      title: "Christy, in Alaska",
      summary:
        "Christy is a clinical psychologist in Alaska who also coaches equestrian sport, and she wanted an app marrying the two. She looked everywhere, found nothing, went to a dev shop in Nova Scotia and was quoted a fortune. She found Emergent, built it herself, launched it on the App Store a couple of weeks ago and has hundreds of users.",
    },
    {
      id: "tip-c-lc-people-2",
      title: "The only builder on his team",
      summary:
        "What people tell them is that the money was never the whole problem — a lot gets lost in translation when you explain your idea through a developer. The Norwegian says he is the only builder in his team and does not bring anyone else in, because he knows exactly what to build while the others handle the business. One solopreneur's app raised four million dollars, though the founder needs permission before saying more.",
    },
    {
      id: "tip-c-lc-people-3",
      title: "The niche of niches",
      summary:
        "The hosts land on what they think is under-told: the debate is all about AI replacing jobs, and almost nobody is talking about the agency it hands to someone who wants to run their own business. They read it as the next step in the trend Paul Graham wrote about — from careers at IBM, to startups, to one person at an intersection nobody would have funded. The founders close on wanting to shrink the gap between idea and reality.",
    },
  ]);

  /*
   * Artifacts, chapter by chapter, per the transcript-artifacts skill. Every
   * quote, claim side and definition gloss below is a verbatim lift from
   * LIGHTCONE_EMERGENT_TRANSCRIPT — enforced by transcriptFidelity.test.ts.
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

  // Chapter 1 — D' stat, C timeline.
  spawn(
    "tip-art-lc-video",
    {
      type: "images",
      title: "AI Is Unlocking Millions Of New Builders",
      data: {
        items: [
          {
            kind: "youtube",
            url: LIGHTCONE_EMERGENT_VIDEO_URL,
            title: "The Lightcone · Emergent",
            thumb: "https://img.youtube.com/vi/8SVocWnDHwE/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-lc-main-1",
  );
  spawn(
    "tip-art-lc-stat-apps",
    statPayload("Apps built since launch", {
      value: "7 million",
      label:
        "Built with Emergent in the 8 months since launch — the number the host opens the episode with",
      speaker: LC_HOST,
    }),
    "tip-c-lc-intro-1",
  );
  /*
   * The four dates are gathered from chapters 1 through 5 rather than from one
   * span, which is why the timeline sits on the framing card instead of inside
   * a later chapter: no single chapter contains the sequence, and splitting it
   * into four one-event artifacts would organise nothing.
   */
  spawn(
    "tip-art-lc-timeline",
    {
      type: "timeline",
      title: "From a testing idea to seven million apps",
      data: {
        scale: "month",
        events: [
          {
            id: "lc-t1",
            label: "The idea: automating software testing",
            at: "2023-12-01T12:00:00.000Z",
          },
          {
            id: "lc-t2",
            label: "YC, summer 2024 — then the pivot to a general coding agent",
            at: "2024-06-01T12:00:00.000Z",
          },
          {
            id: "lc-t3",
            label: "A small beta pilot",
            at: "2025-06-01T12:00:00.000Z",
            highlight: true,
          },
        ],
      },
    },
    "tip-c-lc-intro-2",
  );
  site("lc-emergent", "https://emergent.sh", "Emergent", "tip-c-lc-intro-2");
  site(
    "lc-yc",
    "https://www.ycombinator.com/companies/emergent",
    "Emergent on Y Combinator",
    "tip-c-lc-intro-2",
  );

  // Chapter 2 — H quote, D' stat.
  spawn(
    "tip-art-lc-quote-verb",
    quotePayload("How big Dunzo got", {
      text: "we were almost a verb in India",
      speaker: FOUNDER,
      timestamp: "1:43",
      context: "On the quick-commerce company he ran before Emergent",
    }),
    "tip-c-lc-dunzo-1",
  );
  spawn(
    "tip-art-lc-stat-engineers",
    statPayload("The team that produced the idea", {
      value: "300",
      unit: "engineers",
      label:
        "The team he was managing at Dunzo when he saw that software testing was the biggest bottleneck in shipping fast",
      speaker: FOUNDER,
    }),
    "tip-c-lc-dunzo-2",
  );
  site("lc-dunzo", "https://en.wikipedia.org/wiki/Dunzo", "Dunzo", "tip-c-lc-dunzo-1");

  // Chapter 3 — H quote, E mechanism.
  spawn(
    "tip-art-lc-quote-vcs",
    quotePayload("What the VCs said", {
      text: "we went to a lot of VCs with this idea. They thought it was too crazy.",
      speaker: FOUNDER,
      timestamp: "2:16",
      context: "On pitching automated software testing before they applied to YC",
    }),
    "tip-c-lc-verify-1",
  );
  spawn(
    "tip-art-lc-mech-verification",
    mechanismPayload("The insight that produced the company", {
      steps: [
        {
          id: "testing",
          label: "Build testing agents",
          note: "The idea they applied to YC with",
        },
        { id: "verify", label: "Solve for verification" },
        {
          id: "loop",
          label: "The loop that keeps an agent running longer",
        },
        {
          id: "auto",
          label: "Automate all of software engineering",
        },
        {
          id: "pivot",
          label: "Pivot to general coding agents",
        },
      ],
      edges: [
        { from: "testing", to: "verify" },
        { from: "verify", to: "loop" },
        { from: "loop", to: "auto" },
        { from: "auto", to: "pivot" },
      ],
    }),
    "tip-c-lc-verify-2",
  );

  // Chapter 4 — B table, D' stat, H quote.
  spawn(
    "tip-art-lc-table-landscape",
    {
      type: "table",
      title: "The landscape when they started, 2024",
      data: {
        columns: [
          { key: "product", label: "Product" },
          { key: "state", label: "Where it was" },
        ],
        rows: [
          { product: "Lovable", state: "Had not started" },
          { product: "Cursor", state: "Just getting started" },
          { product: "Devin", state: "Had just come out" },
          {
            product: "Emergent",
            state: {
              value: "Four people and a benchmark",
              tags: [{ label: "Research company, no product", tone: "info" }],
            },
          },
        ],
      },
    },
    "tip-c-lc-landscape-1",
  );
  spawn(
    "tip-art-lc-stat-swebench",
    statPayload("SWE-bench", {
      value: "World number one",
      label:
        "On the benchmark every coding agent was measured on then — reached in two months, by four of them in a room",
      speaker: FOUNDER,
    }),
    "tip-c-lc-bench-1",
  );
  spawn(
    "tip-art-lc-quote-papers",
    quotePayload("Discovering it before the papers did", {
      text:
        "we would discover something and we'll see 3 months later something come out in a paper",
      speaker: FOUNDER,
      timestamp: "3:51",
      context:
        "On working out multi-agent systems, memory and agent-to-agent communication in 2024",
    }),
    "tip-c-lc-bench-2",
  );
  site("lc-swebench", "https://www.swebench.com", "SWE-bench", "tip-c-lc-bench-1");
  site("lc-cursor", "https://cursor.com", "Cursor", "tip-c-lc-landscape-1");
  site("lc-devin", "https://cognition.ai", "Cognition · Devin", "tip-c-lc-landscape-1");

  // Chapter 5 — E mechanism, D' stat.
  spawn(
    "tip-art-lc-mech-pivot",
    mechanismPayload("How they ended up building for non-technical users", {
      steps: [
        {
          id: "enterprise",
          label: "Go enterprise",
          note: "The common wisdom at the time — 2 to 3 months of it",
        },
        { id: "slow", label: "Found it was too slow" },
        {
          id: "internal",
          label: "Meanwhile, using the platform internally",
        },
        {
          id: "watch",
          label: "Lovable and Bolt growing like crazy",
        },
        { id: "package", label: "Package the coding agent for the world" },
        {
          id: "beta",
          label: "A small beta pilot, June 2025",
          note: "It took off",
        },
      ],
      edges: [
        { from: "enterprise", to: "slow" },
        { from: "slow", to: "internal" },
        { from: "internal", to: "watch" },
        { from: "watch", to: "package" },
        { from: "package", to: "beta" },
      ],
    }),
    "tip-c-lc-pivot-1",
  );
  spawn(
    "tip-art-lc-stat-nontechnical",
    statPayload("Who actually turned up", {
      value: "80%",
      label:
        "Of users have zero programming knowledge — a global audience across 190+ countries, 70-80% of it in the US and Europe",
      speaker: FOUNDER,
    }),
    "tip-c-lc-pivot-3",
  );
  site("lc-lovable", "https://lovable.dev", "Lovable", "tip-c-lc-pivot-2");
  site("lc-bolt", "https://bolt.new", "Bolt", "tip-c-lc-pivot-2");

  // Chapter 6 — H quote, I todo, E mechanism.
  spawn(
    "tip-art-lc-quote-generation",
    quotePayload("Why the second mover is not behind", {
      text:
        "every new model generation actually is presenting a new opportunity of looking at the world",
      speaker: FOUNDER,
      timestamp: "6:01",
      context: "On why they skipped JSON parsing — the next model would solve it",
    }),
    "tip-c-lc-models-1",
  );
  spawn(
    "tip-art-lc-todo-replicate",
    {
      type: "todo",
      title: "What automating software engineering actually means",
      data: {
        items: [
          { id: "lc-r1", label: "Code reviews", checked: true },
          { id: "lc-r2", label: "Automated testing", checked: true },
          { id: "lc-r3", label: "Debugging", checked: true },
          { id: "lc-r4", label: "Deployment", checked: true },
          { id: "lc-r5", label: "Security", checked: true },
          { id: "lc-r6", label: "Hosting", checked: true },
        ],
      },
    },
    "tip-c-lc-second-2",
  );
  spawn(
    "tip-art-lc-mech-distribution",
    mechanismPayload("How they bought their way past the incumbents", {
      steps: [
        {
          id: "behind",
          label: "You are coming from behind",
        },
        {
          id: "above",
          label: "Enter head and shoulders above what exists",
          note: "Otherwise nobody takes notice",
        },
        { id: "scale", label: "Rapidly scale up distribution" },
        {
          id: "influencers",
          label: "A large influencer network",
          note: "TikTok and Instagram",
        },
        {
          id: "message",
          label: "Come and ship real software",
          note: "And don't face this error you see on the other platforms",
        },
      ],
      edges: [
        { from: "behind", to: "above" },
        { from: "above", to: "scale" },
        { from: "scale", to: "influencers" },
        { from: "influencers", to: "message" },
      ],
    }),
    "tip-c-lc-distro-1",
  );

  // Chapter 7 — E mechanism x2, H quote, F claim.
  spawn(
    "tip-art-lc-quote-feedback",
    quotePayload("What decides how good an agent is", {
      text: "your agent is only as good as the feedback that you provide",
      speaker: FOUNDER,
      timestamp: "10:29",
      context: "On why they run their own infrastructure rather than a sandbox vendor",
    }),
    "tip-c-lc-infra-1",
  );
  spawn(
    "tip-art-lc-mech-infra",
    mechanismPayload("Why they own the infrastructure", {
      steps: [
        {
          id: "own",
          label: "Their own Kubernetes and container stack",
          note: "Not a third-party sandbox provider",
        },
        {
          id: "same",
          label: "Same infra at build time and deploy time",
        },
        { id: "fewer", label: "Fewer problems in the deployment phase" },
        {
          id: "feedback",
          label: "Rapid feedback to the agent",
        },
      ],
      edges: [
        { from: "own", to: "same" },
        { from: "same", to: "fewer" },
        { from: "own", to: "feedback" },
      ],
    }),
    "tip-c-lc-infra-1",
  );
  spawn(
    "tip-art-lc-mech-memory",
    mechanismPayload("How the agent compounds across sessions", {
      steps: [
        {
          id: "traj",
          label: "Trajectories from every session",
        },
        { id: "agg", label: "Aggregated over time" },
        {
          id: "skills",
          label: "Skills generated from previous trajectories",
          note: "Not written by the agent itself — those underperform",
        },
        { id: "cicd", label: "Run through a CI/CD process" },
        {
          id: "memory",
          label: "Added to long-term memory",
          note: "The integration it struggled with 3 weeks ago is no longer a struggle",
        },
      ],
      edges: [
        { from: "traj", to: "agg" },
        { from: "agg", to: "skills" },
        { from: "skills", to: "cicd" },
        { from: "cicd", to: "memory" },
      ],
    }),
    "tip-c-lc-memory-2",
  );
  /*
   * Reported-and-rebutted: the proposition is one he attributes to the industry
   * rather than to the host, and then answers. Both sides are his own words,
   * which is why the proposition speaker is the position rather than a person.
   */
  spawn(
    "tip-art-lc-claim-models",
    claimPayload("Do the labs eat the layer above them?", {
      topic: "Whether more capable models leave a platform like Emergent exposed",
      proposition: {
        speaker: "The industry view, as he states it",
        text:
          "there is this underlying current right now, right, in the industry that that hey, like is is uh you know like anthropic going to eat everybody up",
        timestamp: "16:00",
      },
      counter: {
        speaker: FOUNDER,
        text: "the coding aspect is only 20% of the job",
        timestamp: "16:07",
      },
    }),
    "tip-c-lc-modelrisk-1",
  );
  site("lc-kubernetes", "https://kubernetes.io", "Kubernetes", "tip-c-lc-infra-1");

  // Chapter 8 — E mechanism, B table, D' stat, H quote.
  spawn(
    "tip-art-lc-mech-demo",
    mechanismPayload("What happens between the prompt and the app", {
      steps: [
        {
          id: "prompt",
          label: "One prompt, whichever tab is selected",
        },
        {
          id: "route",
          label: "The prompt engine picks the right agent",
          note: "It works out this one wants the mobile app builder",
        },
        {
          id: "clarify",
          label: "It asks for clarification first",
          note: "To be sure it understood the requirement",
        },
        {
          id: "key",
          label: "Use the Emergent LLM key",
          note: "No third-party API key for a user who has never heard of one",
        },
        { id: "handoff", label: "Hand off — you can close the laptop" },
        { id: "preview", label: "A preview of your app" },
      ],
      edges: [
        { from: "prompt", to: "route" },
        { from: "route", to: "clarify" },
        { from: "clarify", to: "key" },
        { from: "key", to: "handoff" },
        { from: "handoff", to: "preview" },
      ],
    }),
    "tip-c-lc-demo-2",
  );
  spawn(
    "tip-art-lc-table-users",
    {
      type: "table",
      title: "Who built what, on the demo tour",
      data: {
        columns: [
          { key: "who", label: "Who" },
          { key: "where", label: "Where" },
          { key: "what", label: "What they built" },
        ],
        rows: [
          {
            who: "Runs an audio-video setup business",
            where: "Illinois",
            what: "A full-stack intake and lead-gen app — you build your room and specify the setup",
          },
          {
            who: {
              value: "Sold his business to a PE firm",
              tags: [{ label: "\"I'm a business developer\"", tone: "info" }],
            },
            where: "Norway",
            what: "A CRM for lawyers, agentic — an agent takes a workflow and runs it",
          },
          {
            who: "A QA engineer on their own team",
            where: "Bangalore",
            what: "An Asana replacement, first prompt \"clone Jira\", no code edited by hand",
          },
        ],
      },
    },
    "tip-c-lc-users-1",
  );
  spawn(
    "tip-art-lc-quote-ship",
    quotePayload("Why the clone beat the tool", {
      text: "we ship like three times a day, morning, evening, night",
      speaker: FOUNDER,
      timestamp: "22:09",
      context: "On why Asana could not be bent to the way the team works",
    }),
    "tip-c-lc-asana-1",
  );
  spawn(
    "tip-art-lc-stat-subscription",
    statPayload("What dropping Asana saved", {
      value: "$3,000-$4,000",
      unit: "a month",
      label: "In subscription, after replacing it with a clone built on their own platform",
      speaker: FOUNDER,
    }),
    "tip-c-lc-asana-1",
  );
  site("lc-asana", "https://asana.com", "Asana", "tip-c-lc-asana-1");

  // Chapter 9 — B table, H quote, D' stat.
  spawn(
    "tip-art-lc-table-lean",
    {
      type: "table",
      title: "One or two people, per company-sized problem",
      data: {
        columns: [
          { key: "area", label: "What they built" },
          { key: "people", label: "People" },
          { key: "elsewhere", label: "Elsewhere" },
        ],
        rows: [
          {
            area: "Deployment",
            people: "2",
            elsewhere: "Almost mirrors what Vercel would look like",
          },
          {
            area: "Memory",
            people: {
              value: "1",
              tags: [{ label: "One person", tone: "success" }],
            },
            elsewhere: "Multiple startups solving for memory",
          },
        ],
      },
    },
    "tip-c-lc-hire-2",
  );
  spawn(
    "tip-art-lc-quote-harder",
    quotePayload("Why that is a draw, not a burden", {
      text: "people are generally attracted towards harder problems that they want to solve",
      speaker: FOUNDER,
      timestamp: "25:44",
      context: "On giving one or two people the surface area of a whole company",
    }),
    "tip-c-lc-hire-2",
  );
  spawn(
    "tip-art-lc-stat-support",
    statPayload("The support rota", {
      value: "1 of 12",
      label:
        "Engineers always on call for customer support — a hard call on a team that size, and the reason they built customer empathy from day zero",
      speaker: FOUNDER,
    }),
    "tip-c-lc-split-2",
  );
  site("lc-vercel", "https://vercel.com", "Vercel", "tip-c-lc-hire-2");

  // Chapter 10 — E mechanism x2, D' stat, G definition.
  spawn(
    "tip-art-lc-mech-saas",
    mechanismPayload("The two headwinds facing SaaS", {
      steps: [
        {
          id: "workflows",
          label: "SaaS workflows get consumed by an agent",
        },
        {
          id: "pivot",
          label: "Pivot to an agent-first company, or struggle to survive",
        },
        {
          id: "custom",
          label: "Customers want more customised software",
          note: "Which they can now build themselves",
        },
        {
          id: "internal",
          label: "They build the internal tool instead",
          note: "The way Emergent built its own project management tool",
        },
      ],
      edges: [
        { from: "workflows", to: "pivot" },
        { from: "custom", to: "internal" },
      ],
    }),
    "tip-c-lc-saas-1",
  );
  spawn(
    "tip-art-lc-stat-agentic",
    statPayload("How much of it is agentic", {
      value: "20%",
      label:
        "Of what people build on Emergent today — the Emergent agent embedded inside their own app to power its workflows",
      speaker: FOUNDER,
    }),
    "tip-c-lc-saas-2",
  );
  spawn(
    "tip-art-lc-def-ralph",
    definitionPayload("Ralph Wiggum loop", {
      term: "Ralph Wiggum loop",
      gloss: "just keep poking the agent hey continue until it's done",
      speaker: FOUNDER,
    }),
    "tip-c-lc-swarm-1",
  );
  spawn(
    "tip-art-lc-mech-swarm",
    mechanismPayload("How a swarm is kept on the rails", {
      steps: [
        {
          id: "swarm",
          label: "A few agents collaborating on one task",
        },
        {
          id: "oversee",
          label: "An overseeing agent monitors the overall task",
          note: "In parallel — the main thing is that the trajectory doesn't get derailed",
        },
        {
          id: "verify",
          label: "Autonomous verification feedback",
          note: "Was the job done?",
        },
        {
          id: "finetune",
          label: "Custom fine-tuned verification layers",
          note: "Not an alternative frontier model",
        },
      ],
      edges: [
        { from: "swarm", to: "oversee" },
        { from: "oversee", to: "verify" },
        { from: "verify", to: "finetune" },
      ],
    }),
    "tip-c-lc-swarm-1",
  );
  site("lc-metr", "https://metr.org", "METR", "tip-c-lc-swarm-1");

  // Chapter 11 — D' stat, B table, H quote.
  spawn(
    "tip-art-lc-stat-price",
    statPayload("What the software used to cost", {
      value: "$5,000",
      label: "To build it yourself, where a dev shop would have been half a million",
      delta: { from: "$500,000", to: "$5,000" },
      speaker: FOUNDER,
    }),
    "tip-c-lc-price-1",
  );
  spawn(
    "tip-art-lc-quote-horse",
    quotePayload("The app nobody would have built", {
      text:
        "who would have thought that the thing that the world needs is an app that marries clinical psychology with horse riding",
      speaker: LC_HOST,
      timestamp: "37:26",
      context: "On Christy in Alaska, who launched it after a dev shop quoted her a fortune",
    }),
    "tip-c-lc-people-1",
  );
  spawn(
    "tip-art-lc-table-builders",
    {
      type: "table",
      title: "Who the platform turned out to be for",
      data: {
        columns: [
          { key: "who", label: "Who" },
          { key: "before", label: "Before" },
          { key: "now", label: "Now" },
        ],
        rows: [
          {
            who: "Small and medium business owners",
            before: "Email, WhatsApp and spreadsheets — or a dev shop",
            now: "Custom software for their own business",
          },
          {
            who: "Domain experts",
            before: "Blocked by the technology barrier",
            now: "Christy's app, launched on the App Store with hundreds of users",
          },
          {
            who: "Solopreneurs",
            before: "Would have had to hire a technical CTO",
            now: {
              value: "One of them raised $4 million",
              tags: [{ label: "On an app built on Emergent", tone: "success" }],
            },
          },
        ],
      },
    },
    "tip-c-lc-people-2",
  );

  // Sticky notes — the annotation layer, one per chapter at most.
  spawn(
    "tip-art-lc-sticky-growth",
    {
      type: "stickynote",
      title: "The number to hold onto",
      data: {
        text: "7 million apps in 8 months, and 80% of the people building them have never written code. Everything else in the episode is an explanation of that pair.",
        colorId: "turbo",
      },
    },
    "tip-c-lc-intro-1",
  );
  spawn(
    "tip-art-lc-sticky-second",
    {
      type: "stickynote",
      title: "The second-mover move",
      data: {
        text: "Don't build what the next model will fix, and don't copy what the first mover optimised for. They skipped JSON parsing and skipped front-end prototyping.",
        colorId: "chalk",
      },
    },
    "tip-c-lc-second-1",
  );
  spawn(
    "tip-art-lc-sticky-diff",
    {
      type: "stickynote",
      title: "Power tool, hidden",
      data: {
        text: "The agent is good enough that they use it instead of Claude Code internally — and the UI hides the VS Code editor, because a non-technical user panics at a diff.",
        colorId: "violet",
      },
    },
    "tip-c-lc-ux-1",
  );
  spawn(
    "tip-art-lc-sticky-verify",
    {
      type: "stickynote",
      title: "Same idea, three years apart",
      data: {
        text: "Verification was the 2023 insight that produced the pivot, and it is still the thing gating agent swarms in 2026. The research budget goes to verifiers, not models.",
        colorId: "haiti",
      },
    },
    "tip-c-lc-swarm-2",
  );
  spawn(
    "tip-art-lc-sticky-niche",
    {
      type: "stickynote",
      title: "The niche of niches",
      data: {
        text: "In a world of limited software, the clinical-psychology-meets-horse-riding app never gets built. The scarce thing was never the idea.",
        colorId: "turbo",
      },
    },
    "tip-c-lc-people-3",
  );

  /*
   * The masthead: what the video is, a clickable index into the eleven chapter
   * groups, and the link directory.
   *
   * The chapter rows carry the group ids layoutChapters will generate
   * (`${idPrefix}-chapter-${n}`), so clicking one frames that chapter. Labels
   * and start times are the creator's own.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-lc-episode", "tip-art-lc-links"];

  spawn(
    "tip-art-lc-episode",
    episodePayload("The episode", {
      videoTitle: "AI Is Unlocking Millions Of New Builders",
      channel: "Y Combinator · The Lightcone",
      url: LIGHTCONE_EMERGENT_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/8SVocWnDHwE/maxresdefault.jpg",
      description:
        "The twin founders of Emergent on going from a rejected software-testing idea to seven million apps built in eight months — why verification was the insight, why they own the infrastructure, and why 80% of the people shipping on it have never written code.",
      chapters: LIGHTCONE_EMERGENT_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-lc-chapter-${index + 1}`,
      })),
    }),
    "tip-c-lc-main-1",
  );
  spawn(
    "tip-art-lc-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: LIGHTCONE_EMERGENT_VIDEO_URL },
            { label: "Y Combinator", url: "https://www.youtube.com/@ycombinator" },
            { label: "Apply to YC", url: "https://www.ycombinator.com/apply" },
          ],
        },
        {
          label: "Emergent",
          links: [
            { label: "Emergent", url: "https://emergent.sh" },
            {
              label: "Emergent on Y Combinator",
              url: "https://www.ycombinator.com/companies/emergent",
            },
            { label: "Dunzo", url: "https://en.wikipedia.org/wiki/Dunzo" },
          ],
        },
        {
          label: "The landscape",
          links: [
            { label: "Cursor", url: "https://cursor.com" },
            { label: "Cognition · Devin", url: "https://cognition.ai" },
            { label: "Lovable", url: "https://lovable.dev" },
            { label: "Bolt", url: "https://bolt.new" },
          ],
        },
        {
          label: "What they measure against",
          links: [
            { label: "SWE-bench", url: "https://www.swebench.com" },
            { label: "METR", url: "https://metr.org" },
            { label: "Kubernetes", url: "https://kubernetes.io" },
            { label: "Vercel", url: "https://vercel.com" },
          ],
        },
      ],
    }),
    "tip-c-lc-main-1",
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
    idPrefix: "tip-lc",
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
