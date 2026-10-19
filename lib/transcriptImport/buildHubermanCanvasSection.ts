import type { SessionArtifact } from "@/lib/sessionArtifacts";
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
import { HUBERMAN_NEUROPLASTICITY_SOURCE_URL } from "@/lib/transcriptImport/hubermanNeuroplasticity";
import {
  claimPayload,
  definitionPayload,
  episodePayload,
  linkGroupPayload,
  mechanismPayload,
  quotePayload,
  statPayload,
} from "@/lib/transcriptArtifacts";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";

/** The only voice in this episode — a solo Huberman Lab Essentials. */
const SPEAKER = "Andrew Huberman";

export const TIP_THREAD_HUB_MAIN = "tip-thread-hub-main";
export const TIP_THREAD_HUB_SENSORY = "tip-thread-hub-sensory";
export const TIP_THREAD_HUB_AWARE = "tip-thread-hub-aware";
export const TIP_THREAD_HUB_ATTENTION = "tip-thread-hub-attention";
export const TIP_THREAD_HUB_CHEM = "tip-thread-hub-chem";
export const TIP_THREAD_HUB_PROTOCOL = "tip-thread-hub-protocol";
export const TIP_THREAD_HUB_SLEEP = "tip-thread-hub-sleep";

/** Andrew Huberman neuroplasticity conversation graph for the playground. */
/**
 * Canvas memory for this canvas — one gist per thread.
 *
 * On a canvas the user built, /api/gist writes these after each exchange. An
 * imported canvas has no exchanges, so the builder authors them: same ~40-word
 * shape, so a branch asked later gets the same faint sibling awareness it would
 * have had if the conversation had actually happened here.
 */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_HUB_MAIN]:
    "Neuroplasticity end to end: what it is, why babies are wired crudely and customised by experience, which circuits stay fixed, why plasticity is gated after 25, the chemical recipe for change, and why it is consolidated in sleep.",
  [TIP_THREAD_HUB_SENSORY]:
    "How blindness rewires the cortex — in people blind from birth the visual cortex is taken over by hearing and Braille touch, producing heightened auditory and tactile acuity and a much higher incidence of perfect pitch.",
  [TIP_THREAD_HUB_AWARE]:
    "Awareness as the first step in plasticity: naming what you want to change, even an uncomfortable reaction, is what makes the prefrontal cortex flag the rest of the nervous system that what is coming is worth attending to.",
  [TIP_THREAD_HUB_ATTENTION]:
    "Attention, not exposure, decides what changes: Merzenich's spinning-drum experiment showed the same touch drives auditory or tactile plasticity depending on what the subject attended to — so 'everything rewires your brain' is false.",
  [TIP_THREAD_HUB_CHEM]:
    "The three molecules of change — epinephrine from the locus coeruleus for alertness, acetylcholine from a brainstem source for signal-to-noise, and a second acetylcholine source in the nucleus basalis that makes change obligatory.",
  [TIP_THREAD_HUB_PROTOCOL]:
    "The practical protocol: get alert on purpose via sleep and caffeine, narrow your visual focus for 60–120 seconds to trigger the plasticity chemicals, then run one 90-minute ultradian bout with distractions off.",
  [TIP_THREAD_HUB_SLEEP]:
    "Why learning is locked in during sleep: acetylcholine stamps the active synapses and deep sleep strengthens them over following nights — and a 20-minute NSDR or shallow nap right after a hard task beat a full night in a Cell Reports study.",
};

export function buildHubermanCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const threads: Record<string, Thread> = {
    [TIP_THREAD_HUB_MAIN]: thread(TIP_THREAD_HUB_MAIN, 8),
    [TIP_THREAD_HUB_SENSORY]: thread(TIP_THREAD_HUB_SENSORY, 9),
    [TIP_THREAD_HUB_AWARE]: thread(TIP_THREAD_HUB_AWARE, 10),
    [TIP_THREAD_HUB_ATTENTION]: thread(TIP_THREAD_HUB_ATTENTION, 11),
    [TIP_THREAD_HUB_CHEM]: thread(TIP_THREAD_HUB_CHEM, 12),
    [TIP_THREAD_HUB_PROTOCOL]: thread(TIP_THREAD_HUB_PROTOCOL, 13),
    [TIP_THREAD_HUB_SLEEP]: thread(TIP_THREAD_HUB_SLEEP, 14),
  };
  const threadOrder = [
    TIP_THREAD_HUB_MAIN,
    TIP_THREAD_HUB_SENSORY,
    TIP_THREAD_HUB_AWARE,
    TIP_THREAD_HUB_ATTENTION,
    TIP_THREAD_HUB_CHEM,
    TIP_THREAD_HUB_PROTOCOL,
    TIP_THREAD_HUB_SLEEP,
  ];
  const threadGists = Object.fromEntries(
    threadOrder.map((id) => [id, threadGist(THREAD_GISTS[id]!, 1)]),
  );
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  // ---- Chapter heads (the main spine) -------------------------------------
  const mainDefs = [
    {
      id: "tip-c-hub-main-1",
      title: "Neuroplasticity, defined",
      summary:
        "The nervous system's ability to change in response to experience — arguably the most important feature of our biology.",
    },
    {
      id: "tip-c-hub-main-2",
      title: "Born to change",
      summary:
        "Babies are wired crudely; through experience the nervous system becomes customized to each person's unique life.",
    },
    {
      id: "tip-c-hub-main-3",
      title: "Plastic vs hardwired",
      summary:
        "Sensory maps are highly plastic; heartbeat, breathing, and digestion circuits are fixed — and thank goodness they are.",
    },
    {
      id: "tip-c-hub-main-4",
      title: "After 25, plasticity is gated",
      summary:
        "No more passive learning — you must deliberately shift your internal state to open the window for change.",
    },
    {
      id: "tip-c-hub-main-5",
      title: "The recipe for change",
      summary:
        "Epinephrine (alertness) + acetylcholine from two sources. Get all three and the nervous system doesn't just change — it must.",
    },
    {
      id: "tip-c-hub-main-6",
      title: "Change happens in sleep",
      summary:
        "Plasticity is not consolidated while awake — the highlighted circuits are rewired during deep sleep and NSDR.",
    },
  ];

  for (const def of mainDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_MAIN,
      def.title,
      def.summary,
    );
    cardOrder.push(def.id);
  }

  // ---- Sensory substitution (chapter 2) -----------------------------------
  const sensoryDefs = [
    {
      id: "tip-c-hub-sensory-1",
      title: "Blindness rewires the cortex",
      summary:
        "In people blind from birth, the visual cortex is overtaken by hearing and Braille touch.",
    },
    {
      id: "tip-c-hub-sensory-2",
      title: "Sharper hearing & touch",
      summary:
        "The result is heightened auditory and touch acuity — and a much higher incidence of perfect pitch.",
    },
  ];
  for (const def of sensoryDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_SENSORY,
      def.title,
      def.summary,
      "tip-c-hub-main-2",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-2", "tip-c-hub-sensory-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-sensory-1", "tip-c-hub-sensory-2", "right", "left"));

  // ---- Awareness is step one (chapter 4) ----------------------------------
  const awareDefs = [
    {
      id: "tip-c-hub-aware-1",
      title: "Recognition comes first",
      summary:
        "Naming what you want to change — even just an uncomfortable reaction — is the actual first step in plasticity.",
    },
    {
      id: "tip-c-hub-aware-2",
      title: "Prefrontal flags 'attend'",
      summary:
        "The forebrain signals the rest of the nervous system that what's coming is worth paying attention to.",
    },
  ];
  for (const def of awareDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_AWARE,
      def.title,
      def.summary,
      "tip-c-hub-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-4", "tip-c-hub-aware-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-aware-1", "tip-c-hub-aware-2", "right", "left"));

  // ---- Protocols (chapter 4) ----------------------------------------------
  const protocolDefs = [
    {
      id: "tip-c-hub-proto-1",
      title: "Get alert on purpose",
      summary:
        "Sleep + caffeine set the baseline; accountability, love, or fear all raise epinephrine — the brain doesn't care which.",
    },
    {
      id: "tip-c-hub-proto-2",
      title: "Mental focus follows visual focus",
      summary:
        "Narrow your gaze to a small window for 60–120s to trigger acetylcholine and epinephrine at the plasticity sites.",
    },
    {
      id: "tip-c-hub-proto-3",
      title: "90-minute ultradian bouts",
      summary:
        "One focused bout, distractions off. Expect flicker at the edges, and re-anchor drifting attention with your eyes.",
    },
  ];
  for (const def of protocolDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_PROTOCOL,
      def.title,
      def.summary,
      "tip-c-hub-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-4", "tip-c-hub-proto-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-proto-1", "tip-c-hub-proto-2", "right", "left"));
  connections.push(conn("tip-c-hub-proto-2", "tip-c-hub-proto-3", "right", "left"));

  // ---- Attention gates plasticity — Merzenich (chapter 5) -----------------
  const attentionDefs = [
    {
      id: "tip-c-hub-att-1",
      title: "Merzenich's spinning drum",
      summary:
        "Adults felt bumps of varying spacing; attending to the distance drove rapid plasticity in the finger maps.",
    },
    {
      id: "tip-c-hub-att-2",
      title: "Attention, not exposure",
      summary:
        "Same touch, but attend the tone → auditory plasticity; attend the bumps → touch plasticity. Attention decides.",
    },
    {
      id: "tip-c-hub-att-3",
      title: "Not every experience changes you",
      summary:
        "The 'everything rewires your brain' claim is false — only what you deeply attend to opens plasticity.",
    },
  ];
  for (const def of attentionDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_ATTENTION,
      def.title,
      def.summary,
      "tip-c-hub-main-5",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-5", "tip-c-hub-att-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-att-1", "tip-c-hub-att-2", "right", "left"));
  connections.push(conn("tip-c-hub-att-2", "tip-c-hub-att-3", "right", "left"));

  // ---- Neurochemistry (chapter 5) -----------------------------------------
  const chemDefs = [
    {
      id: "tip-c-hub-chem-1",
      title: "Epinephrine = alertness",
      summary:
        "Released from the locus coeruleus in the brainstem — the same molecule as adrenaline from the adrenal glands.",
    },
    {
      id: "tip-c-hub-chem-2",
      title: "Acetylcholine = spotlight",
      summary:
        "A brainstem source raises signal-to-noise, letting one input cut through the sensory bombardment at the thalamus.",
    },
    {
      id: "tip-c-hub-chem-3",
      title: "Nucleus basalis seals it",
      summary:
        "A third source — nucleus basalis of Meynert. Epinephrine + both acetylcholine sources = change is obligatory.",
    },
  ];
  for (const def of chemDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_CHEM,
      def.title,
      def.summary,
      "tip-c-hub-main-5",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-att-1", "tip-c-hub-chem-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-chem-1", "tip-c-hub-chem-2", "right", "left"));
  connections.push(conn("tip-c-hub-chem-2", "tip-c-hub-chem-3", "right", "left"));

  // ---- Sleep & NSDR (chapter 6) -------------------------------------------
  const sleepDefs = [
    {
      id: "tip-c-hub-sleep-1",
      title: "Sleep locks in learning",
      summary:
        "Acetylcholine stamps the active synapses; over the next nights of deep sleep those circuits strengthen and others fade.",
    },
    {
      id: "tip-c-hub-sleep-2",
      title: "NSDR & naps accelerate it",
      summary:
        "A 20-minute NSDR or shallow nap right after a hard task beat a full night's sleep in a Cell Reports study.",
    },
  ];
  for (const def of sleepDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_SLEEP,
      def.title,
      def.summary,
      "tip-c-hub-main-6",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-6", "tip-c-hub-sleep-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-sleep-1", "tip-c-hub-sleep-2", "right", "left"));

  // ---- Artifacts — each lands in the chapter of its source card -----------
  spawnWebsite(
    "hub-hubermanlab",
    HUBERMAN_NEUROPLASTICITY_SOURCE_URL,
    "Huberman Lab",
    "tip-c-hub-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "hub-neuroplasticity-wiki",
    "https://en.wikipedia.org/wiki/Neuroplasticity",
    "Neuroplasticity — Wikipedia",
    "tip-c-hub-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "hub-merzenich-wiki",
    "https://en.wikipedia.org/wiki/Michael_Merzenich",
    "Michael Merzenich — Wikipedia",
    "tip-c-hub-att-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-hub-table",
    {
      type: "table",
      title: "Plastic vs hardwired circuits",
      data: {
        columns: [
          { key: "circuit", label: "Circuit" },
          { key: "plastic", label: "Plastic?" },
          { key: "note", label: "Note" },
        ],
        rows: [
          { circuit: "Visual / auditory maps", plastic: "Yes", note: "Remap to experience" },
          { circuit: "Touch representation", plastic: "Yes", note: "Attention-gated" },
          { circuit: "Heartbeat / breathing", plastic: "No", note: "Kept reliable by design" },
          { circuit: "Digestion", plastic: "No", note: "Hardwired brainstem control" },
        ],
      },
    },
    "tip-c-hub-main-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-hub-timeline",
    {
      type: "timeline",
      title: "Anatomy of a learning bout",
      data: {
        scale: "day",
        events: [
          { id: "hub1", label: "Get alert — epinephrine", at: "2020-01-01T09:00:00.000Z" },
          { id: "hub2", label: "Visual focus — acetylcholine", at: "2020-01-01T09:10:00.000Z" },
          { id: "hub3", label: "90-min focused bout", at: "2020-01-01T09:15:00.000Z" },
          { id: "hub4", label: "NSDR / nap", at: "2020-01-01T10:45:00.000Z" },
          { id: "hub5", label: "Deep sleep locks it in", at: "2020-01-01T23:00:00.000Z", highlight: true },
        ],
      },
    },
    "tip-c-hub-main-6",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-hub-sticky",
    {
      type: "stickynote",
      title: "Core rule",
      data: {
        text: "Mental focus follows visual focus. No attention, no plasticity — and it's cemented in sleep.",
        colorId: "chalk",
      },
    },
    "tip-c-hub-proto-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );


  /*
   * Extracted artifacts, chapter by chapter, per the transcript-artifacts skill.
   * Every string below is a verbatim lift from HUBERMAN_NEUROPLASTICITY_TRANSCRIPT.
   * The transcript carries no timestamps, so no artifact claims one.
   */

  // Chapter 1 — G definition, H quote.
  spawnPayload(
    "tip-art-hub-def-plasticity",
    definitionPayload("Neuroplasticity", {
      term: "Neuroplasticity",
      gloss:
        "this incredible feature of our nervous system's that allows it to change in response to experience",
      speaker: SPEAKER,
    }),
    "tip-c-hub-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-quote-promise",
    quotePayload("The promise of plasticity", {
      text:
        "It holds the promise for each and all of us to think differently, to learn new things, to forget painful experiences, and to essentially adapt to anything that life brings us by becoming better.",
      speaker: SPEAKER,
      context: "Opening definition of why neuroplasticity matters",
    }),
    "tip-c-hub-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 2 — E mechanism (sensory substitution), H quote.
  spawnPayload(
    "tip-art-hub-mech-blind",
    mechanismPayload("How blindness remaps the cortex", {
      steps: [
        { id: "blind", label: "Blind from birth" },
        { id: "occipital", label: "Occipital cortex", note: "The visual cortex in the back" },
        { id: "respond", label: "Neurons respond to sound and Braille touch" },
        { id: "acuity", label: "Greater auditory and touch acuity", note: "Higher incidence of perfect pitch" },
      ],
      edges: [
        { from: "blind", to: "occipital", label: "overtaken by hearing" },
        { from: "occipital", to: "respond" },
        { from: "respond", to: "acuity" },
      ],
    }),
    "tip-c-hub-sensory-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-quote-map",
    quotePayload("The cortex is a map of your life", {
      text:
        "That tells us that the neocortex is really designed to be a map of our own individual experience.",
      speaker: SPEAKER,
      context: "On what sensory substitution reveals",
    }),
    "tip-c-hub-sensory-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 3 — B table (already above), H quote.
  spawnPayload(
    "tip-art-hub-quote-reliable",
    quotePayload("Why some circuits must not change", {
      text:
        "And thank goodness those circuits were set up that way, because you want them to be extremely reliable.",
      speaker: SPEAKER,
      context: "On the hardwired circuits for heartbeat, breathing and digestion",
    }),
    "tip-c-hub-main-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 4 — D' stat x2, H quote, I todo.
  spawnPayload(
    "tip-art-hub-stat-25",
    statPayload("When passive learning ends", {
      value: "25",
      unit: "years",
      label:
        "After this age, changing the superhighways of connectivity requires very specific processes",
      speaker: SPEAKER,
    }),
    "tip-c-hub-main-4",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-stat-focus",
    statPayload("The visual focus window", {
      value: "60–120",
      unit: "seconds",
      label:
        "Focusing visual attention on a small window raises visual acuity and activity in the areas gathering information from that location",
      speaker: SPEAKER,
    }),
    "tip-c-hub-proto-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-quote-recognition",
    quotePayload("Recognition is step one", {
      text:
        "What this says is that the recognition of something — whether an emotional thing or a desire to learn something — is actually the first step in neuroplasticity.",
      speaker: SPEAKER,
      context: "After the story of the listener who found his voice hard to hear",
    }),
    "tip-c-hub-aware-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-todo",
    {
      type: "todo",
      title: "Protocol for opening a plasticity window",
      data: {
        items: [
          { id: "hub-t1", label: "Master your sleep schedule", checked: false },
          {
            id: "hub-t2",
            label:
              "Identify a kit of reasons, several reasons, fear-based and love-based",
            checked: false,
          },
          { id: "hub-t3", label: "Practice visual focus", checked: false },
          {
            id: "hub-t4",
            label: "Turn off the Wi-Fi, put your phone in the other room",
            checked: false,
          },
          {
            id: "hub-t5",
            label: "Run a 90-minute bout with a 5-to-10-minute warm-up",
            checked: false,
          },
        ],
      },
    },
    "tip-c-hub-proto-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 5 — B table (the three ingredients), F claim, H quote.
  spawnPayload(
    "tip-art-hub-chem-table",
    {
      type: "table",
      title: "The three ingredients for change",
      data: {
        columns: [
          { key: "chemical", label: "Neurochemical" },
          { key: "source", label: "Released from" },
          { key: "role", label: "Role" },
        ],
        rows: [
          {
            chemical: "Epinephrine",
            source: "Locus coeruleus (brainstem)",
            role: "Alertness",
          },
          {
            chemical: "Acetylcholine",
            source: "Brainstem",
            role: "Spotlight — raises signal to noise",
          },
          {
            chemical: "Acetylcholine",
            source: "Nucleus basalis of Meynert (forebrain)",
            role: "The third component that seals it",
          },
        ],
      },
    },
    "tip-c-hub-chem-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-claim-experience",
    claimPayload("Does every experience change your brain?", {
      topic: "Whether every experience you have changes your brain",
      proposition: {
        speaker: "Commonly claimed",
        text: "Every experience you have changes your brain.",
      },
      counter: {
        speaker: SPEAKER,
        text:
          "That's absolutely not true. The nervous system changes when certain neurochemicals are released and allow whatever neurons are active in that period to strengthen or weaken their connections.",
      },
    }),
    "tip-c-hub-att-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-quote-must",
    quotePayload("Change becomes obligatory", {
      text: "Not only will the nervous system change, it has to change.",
      speaker: SPEAKER,
      context: "When all three neurochemical conditions are met",
    }),
    "tip-c-hub-chem-3",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  // Chapter 6 — C timeline (already above), E mechanism, D' stat, H quote.
  spawnPayload(
    "tip-art-hub-mech-sleep",
    mechanismPayload("Where the rewiring actually happens", {
      steps: [
        { id: "focus", label: "~90 minutes of hard focus" },
        { id: "stamp", label: "Acetylcholine stamps the active synapses", note: "Marks them as biased to change" },
        { id: "sleep", label: "Deep sleep, that night and the following nights" },
        { id: "strengthen", label: "Those circuits strengthen, others are lost" },
      ],
      edges: [
        { from: "focus", to: "stamp" },
        { from: "stamp", to: "sleep" },
        { from: "sleep", to: "strengthen", label: "consolidates" },
      ],
    }),
    "tip-c-hub-sleep-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-stat-nsdr",
    statPayload("NSDR beat a full night alone", {
      value: "20",
      unit: "minutes",
      label:
        "NSDR or a shallow nap immediately after a difficult spatial-memory task produced significantly higher rates of learning than a good night's sleep alone",
      source: "Cell Reports",
      speaker: SPEAKER,
    }),
    "tip-c-hub-sleep-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-quote-secret",
    quotePayload("The real secret", {
      text:
        "But the real secret is that neuroplasticity doesn't occur during wakefulness — it occurs during sleep.",
      speaker: SPEAKER,
      context: "The turn into the chapter on sleep and NSDR",
    }),
    "tip-c-hub-main-6",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  /*
   * The masthead. This source is a podcast episode with no video, so there is
   * no thumbnail, duration or watch URL to show — the artifact carries the
   * chapter index and the show link and nothing it cannot support. The
   * description is the show's own framing, verbatim from the transcript.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-hub-episode", "tip-art-hub-links"];

  spawnPayload(
    "tip-art-hub-episode",
    episodePayload("The episode", {
      videoTitle: "Huberman Lab Essentials — neuroplasticity",
      channel: "Huberman Lab",
      url: HUBERMAN_NEUROPLASTICITY_SOURCE_URL,
      description:
        "where we revisit past episodes for the most potent and actionable science-based tools for mental health, physical health, and performance",
      chapters: mainDefs.map((def, index) => ({
        label: def.title,
        groupId: `tip-hub-chapter-${index + 1}`,
      })),
    }),
    "tip-c-hub-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-hub-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "Huberman Lab", url: HUBERMAN_NEUROPLASTICITY_SOURCE_URL },
          ],
        },
        {
          label: "Referenced",
          links: [
            {
              label: "Neuroplasticity",
              url: "https://en.wikipedia.org/wiki/Neuroplasticity",
            },
            {
              label: "Michael Merzenich",
              url: "https://en.wikipedia.org/wiki/Michael_Merzenich",
            },
          ],
        },
      ],
    }),
    "tip-c-hub-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  const layout = layoutChapters({
    mainCardIds: mainDefs.map((def) => def.id),
    cards,
    cardOrder,
    connections,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    mastheadNodeIds: MASTHEAD_NODE_IDS,
    idPrefix: "tip-hub",
  });

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
