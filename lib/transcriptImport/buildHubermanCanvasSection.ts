import { CARD_WIDTH } from "@/lib/canvasNodeBounds";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import {
  ARTIFACT_OFFSET_X,
  CARD_STEP_X,
  conn,
  convCard,
  spawnPayload,
  spawnWebsite,
  thread,
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";
import { HUBERMAN_NEUROPLASTICITY_SOURCE_URL } from "@/lib/transcriptImport/hubermanNeuroplasticity";
import type {
  BranchGroup,
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";

export const TIP_GROUP_ID_HUB = "tip-import-group-hub";
export const TIP_THREAD_HUB_MAIN = "tip-thread-hub-main";
export const TIP_THREAD_HUB_SENSORY = "tip-thread-hub-sensory";
export const TIP_THREAD_HUB_AWARE = "tip-thread-hub-aware";
export const TIP_THREAD_HUB_ATTENTION = "tip-thread-hub-attention";
export const TIP_THREAD_HUB_CHEM = "tip-thread-hub-chem";
export const TIP_THREAD_HUB_PROTOCOL = "tip-thread-hub-protocol";
export const TIP_THREAD_HUB_SLEEP = "tip-thread-hub-sleep";

/**
 * Placed to the RIGHT of the design-tools + YC stack so the three imported
 * conversations read side by side across a wide canvas. Clears the widest
 * design-tools artifacts (~x=6500).
 */
export const HUB_ORIGIN_X = 7200;

const HUB_ABOVE_Y = 80;
const HUB_MAIN_Y = 720;
const HUB_PROTOCOL_Y = 1320;
const HUB_ATTENTION_Y = 1900;
const HUB_CHEM_Y = 2480;
const HUB_SLEEP_Y = 3060;

const colX = (i: number) => HUB_ORIGIN_X + CARD_STEP_X * i;

/** Andrew Huberman neuroplasticity conversation graph for the playground. */
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
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  // ---- Main spine ---------------------------------------------------------
  const mainDefs = [
    {
      id: "tip-c-hub-main-1",
      title: "Neuroplasticity, defined",
      summary:
        "The nervous system's ability to change in response to experience — arguably the most important feature of our biology.",
      x: colX(0),
    },
    {
      id: "tip-c-hub-main-2",
      title: "Born to change",
      summary:
        "Babies are wired crudely; through experience the nervous system becomes customized to each person's unique life.",
      x: colX(1),
    },
    {
      id: "tip-c-hub-main-3",
      title: "Plastic vs hardwired",
      summary:
        "Sensory maps are highly plastic; heartbeat, breathing, and digestion circuits are fixed — and thank goodness they are.",
      x: colX(2),
    },
    {
      id: "tip-c-hub-main-4",
      title: "After 25, plasticity is gated",
      summary:
        "No more passive learning — you must deliberately shift your internal state to open the window for change.",
      x: colX(3),
    },
    {
      id: "tip-c-hub-main-5",
      title: "The recipe for change",
      summary:
        "Epinephrine (alertness) + acetylcholine from two sources. Get all three and the nervous system doesn't just change — it must.",
      x: colX(4),
    },
    {
      id: "tip-c-hub-main-6",
      title: "Change happens in sleep",
      summary:
        "Plasticity is not consolidated while awake — the highlighted circuits are rewired during deep sleep and NSDR.",
      x: colX(5),
    },
  ];

  for (const def of mainDefs) {
    cards[def.id] = convCard(def.id, TIP_THREAD_HUB_MAIN, def.title, def.summary, {
      x: def.x,
      y: HUB_MAIN_Y,
    });
    cardOrder.push(def.id);
  }
  for (let i = 0; i < mainDefs.length - 1; i++) {
    connections.push(conn(mainDefs[i]!.id, mainDefs[i + 1]!.id, "right", "left"));
  }

  // ---- Sensory substitution (above main-2) --------------------------------
  const sensoryDefs = [
    {
      id: "tip-c-hub-sensory-1",
      title: "Blindness rewires the cortex",
      summary:
        "In people blind from birth, the visual cortex is overtaken by hearing and Braille touch.",
      x: colX(1),
    },
    {
      id: "tip-c-hub-sensory-2",
      title: "Sharper hearing & touch",
      summary:
        "The result is heightened auditory and touch acuity — and a much higher incidence of perfect pitch.",
      x: colX(2),
    },
  ];
  for (const def of sensoryDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_SENSORY,
      def.title,
      def.summary,
      { x: def.x, y: HUB_ABOVE_Y },
      "tip-c-hub-main-2",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-2", "tip-c-hub-sensory-1", "top", "bottom"));
  connections.push(conn("tip-c-hub-sensory-1", "tip-c-hub-sensory-2", "right", "left"));

  // ---- Awareness is step one (above main-4) -------------------------------
  const awareDefs = [
    {
      id: "tip-c-hub-aware-1",
      title: "Recognition comes first",
      summary:
        "Naming what you want to change — even just an uncomfortable reaction — is the actual first step in plasticity.",
      x: colX(3),
    },
    {
      id: "tip-c-hub-aware-2",
      title: "Prefrontal flags 'attend'",
      summary:
        "The forebrain signals the rest of the nervous system that what's coming is worth paying attention to.",
      x: colX(4),
    },
  ];
  for (const def of awareDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_AWARE,
      def.title,
      def.summary,
      { x: def.x, y: HUB_ABOVE_Y },
      "tip-c-hub-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-4", "tip-c-hub-aware-1", "top", "bottom"));
  connections.push(conn("tip-c-hub-aware-1", "tip-c-hub-aware-2", "right", "left"));

  // ---- Protocols (below main-4) -------------------------------------------
  const protocolDefs = [
    {
      id: "tip-c-hub-proto-1",
      title: "Get alert on purpose",
      summary:
        "Sleep + caffeine set the baseline; accountability, love, or fear all raise epinephrine — the brain doesn't care which.",
      x: colX(2),
    },
    {
      id: "tip-c-hub-proto-2",
      title: "Mental focus follows visual focus",
      summary:
        "Narrow your gaze to a small window for 60–120s to trigger acetylcholine and epinephrine at the plasticity sites.",
      x: colX(3),
    },
    {
      id: "tip-c-hub-proto-3",
      title: "90-minute ultradian bouts",
      summary:
        "One focused bout, distractions off. Expect flicker at the edges, and re-anchor drifting attention with your eyes.",
      x: colX(4),
    },
  ];
  for (const def of protocolDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_PROTOCOL,
      def.title,
      def.summary,
      { x: def.x, y: HUB_PROTOCOL_Y },
      "tip-c-hub-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-4", "tip-c-hub-proto-2", "bottom", "top"));
  connections.push(conn("tip-c-hub-proto-1", "tip-c-hub-proto-2", "right", "left"));
  connections.push(conn("tip-c-hub-proto-2", "tip-c-hub-proto-3", "right", "left"));

  // ---- Attention gates plasticity — Merzenich (below main-5) --------------
  const attentionDefs = [
    {
      id: "tip-c-hub-att-1",
      title: "Merzenich's spinning drum",
      summary:
        "Adults felt bumps of varying spacing; attending to the distance drove rapid plasticity in the finger maps.",
      x: colX(3),
    },
    {
      id: "tip-c-hub-att-2",
      title: "Attention, not exposure",
      summary:
        "Same touch, but attend the tone → auditory plasticity; attend the bumps → touch plasticity. Attention decides.",
      x: colX(4),
    },
    {
      id: "tip-c-hub-att-3",
      title: "Not every experience changes you",
      summary:
        "The 'everything rewires your brain' claim is false — only what you deeply attend to opens plasticity.",
      x: colX(5),
    },
  ];
  for (const def of attentionDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_ATTENTION,
      def.title,
      def.summary,
      { x: def.x, y: HUB_ATTENTION_Y },
      "tip-c-hub-main-5",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-5", "tip-c-hub-att-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-att-1", "tip-c-hub-att-2", "right", "left"));
  connections.push(conn("tip-c-hub-att-2", "tip-c-hub-att-3", "right", "left"));

  // ---- Neurochemistry (below attention) -----------------------------------
  const chemDefs = [
    {
      id: "tip-c-hub-chem-1",
      title: "Epinephrine = alertness",
      summary:
        "Released from the locus coeruleus in the brainstem — the same molecule as adrenaline from the adrenal glands.",
      x: colX(3),
    },
    {
      id: "tip-c-hub-chem-2",
      title: "Acetylcholine = spotlight",
      summary:
        "A brainstem source raises signal-to-noise, letting one input cut through the sensory bombardment at the thalamus.",
      x: colX(4),
    },
    {
      id: "tip-c-hub-chem-3",
      title: "Nucleus basalis seals it",
      summary:
        "A third source — nucleus basalis of Meynert. Epinephrine + both acetylcholine sources = change is obligatory.",
      x: colX(5),
    },
  ];
  for (const def of chemDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_CHEM,
      def.title,
      def.summary,
      { x: def.x, y: HUB_CHEM_Y },
      "tip-c-hub-main-5",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-att-1", "tip-c-hub-chem-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-chem-1", "tip-c-hub-chem-2", "right", "left"));
  connections.push(conn("tip-c-hub-chem-2", "tip-c-hub-chem-3", "right", "left"));

  // ---- Sleep & NSDR (below main-6) ----------------------------------------
  const sleepDefs = [
    {
      id: "tip-c-hub-sleep-1",
      title: "Sleep locks in learning",
      summary:
        "Acetylcholine stamps the active synapses; over the next nights of deep sleep those circuits strengthen and others fade.",
      x: colX(4),
    },
    {
      id: "tip-c-hub-sleep-2",
      title: "NSDR & naps accelerate it",
      summary:
        "A 20-minute NSDR or shallow nap right after a hard task beat a full night's sleep in a Cell Reports study.",
      x: colX(5),
    },
  ];
  for (const def of sleepDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_HUB_SLEEP,
      def.title,
      def.summary,
      { x: def.x, y: HUB_SLEEP_Y },
      "tip-c-hub-main-6",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-hub-main-6", "tip-c-hub-sleep-1", "bottom", "top"));
  connections.push(conn("tip-c-hub-sleep-1", "tip-c-hub-sleep-2", "right", "left"));

  // ---- Artifacts (far-right lane, clear of every card) --------------------
  const artX = colX(5) + CARD_WIDTH + ARTIFACT_OFFSET_X;

  spawnWebsite(
    "hub-hubermanlab",
    HUBERMAN_NEUROPLASTICITY_SOURCE_URL,
    "Huberman Lab",
    "tip-c-hub-main-1",
    { x: artX, y: HUB_MAIN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "hub-neuroplasticity-wiki",
    "https://en.wikipedia.org/wiki/Neuroplasticity",
    "Neuroplasticity — Wikipedia",
    "tip-c-hub-main-1",
    { x: artX, y: HUB_MAIN_Y + 560 },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "hub-merzenich-wiki",
    "https://en.wikipedia.org/wiki/Michael_Merzenich",
    "Michael Merzenich — Wikipedia",
    "tip-c-hub-att-1",
    { x: artX, y: HUB_ATTENTION_Y },
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
    { x: artX, y: HUB_CHEM_Y },
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
    { x: artX, y: HUB_SLEEP_Y },
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
    { x: artX, y: HUB_SLEEP_Y + 560 },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  const groups: Record<string, BranchGroup> = {
    [TIP_GROUP_ID_HUB]: {
      id: TIP_GROUP_ID_HUB,
      label: "Neuroplasticity (Huberman) import",
      familyRootThreadIds: [TIP_THREAD_HUB_MAIN],
      summaryMarkdown: null,
    },
  };

  return {
    cards,
    cardOrder,
    connections,
    threads,
    threadOrder,
    groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: { x: HUB_ORIGIN_X + CARD_STEP_X * 2.5, y: HUB_MAIN_Y },
  };
}
