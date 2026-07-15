import type { CardStatus } from "@/lib/store";
import {
  easeGlide,
  easeInOut,
  easeSettle,
  linear,
  seg,
  streamed,
  track,
  typed,
  type NumKeyframe,
} from "../../timeline";
import {
  A_CAL,
  A_MAP,
  A_PIE,
  A_STREET,
  A_TABLE,
  ANODE_CAL,
  ANODE_MAP,
  ANODE_PIE,
  ANODE_STREET,
  ANODE_TABLE,
  ANODE_VIDEO,
  ANODE_WIKI,
  ART_CAL,
  ART_MAP,
  ART_PIE,
  ART_STREET,
  ART_TABLE,
  ART_VIDEO,
  ART_WIKI,
  ASSET_BUDGET,
  ASSET_FLIGHT,
  CARD_CAL_Q,
  CARD_MAP_Q,
  CARD_PIE_Q,
  CARD_STREET_Q,
  CARD_TABLE_Q,
  NODE_BUDGET,
  NODE_FLIGHT,
  POS,
  Q_CAL,
  Q_MAP,
  Q_PIE,
  Q_STREET,
  Q_TABLE,
  THREAD_BUDGET,
  THREAD_FLIGHT,
  THREAD_STREET,
  THREAD_VIDEO,
  THREAD_WIKI,
} from "./fixtures";

export const ASSETS_DURATION_MS = 36000;

/* ------------------------------------------------------------------ */
/* Scene model                                                          */
/* ------------------------------------------------------------------ */

export interface CursorScene {
  x: number;
  y: number;
  opacity: number;
  pressed: boolean;
}

/** Mirrors v1 DemoCardScene (so the real DemoCard renders it) + pill refs. */
export interface AssetsCardScene {
  id: string;
  threadId: string;
  pos: { x: number; y: number };
  question: string;
  answer: string;
  status: CardStatus;
  spawn: number;
  visible: boolean;
  showFollowUp: boolean;
  followUpDraft: string;
  emptyDraft: string;
  plugsOpacity: number;
  hintSide: "left" | "right" | null;
  branchSides: ("left" | "right")[];
  askElapsedMs: number;
  /** Composer attachment pills (plugComposer* store maps). */
  attachedAssetId?: string;
  attachedArtifactId?: string;
  /** In-card artifact pill once the artifact materializes. */
  outputArtifactId?: string;
}

export interface AssetNodeScene {
  nodeId: string;
  assetId: string;
  pos: { x: number; y: number };
  size?: { w: number; h: number };
  spawn: number; // 0 = invisible (still mounted for stable bounds)
}

export interface ArtifactNodeScene {
  nodeId: string;
  artifactId: string;
  sourceCardId: string;
  pos: { x: number; y: number };
  size?: { w: number; h: number };
  generating: boolean;
  generatingKind?: string;
  generatingTitle?: string;
  spawn: number;
  morphPulse: number; // 0..1 settle pulse at generating→real swap
}

export interface ArtifactEdgeScene {
  id: string;
  artifactNodeId: string;
  cardId: string;
  fromSide: "left" | "right";
  toSide: "left" | "right";
  opacity: number;
}

export interface AssetsSceneState {
  camera: { cx: number; cy: number; scale: number };
  /** God-view guard: visual scale may dip below 0.52 in the finale while
   *  the settled scale written to the store stays above it. */
  settledScale: number;
  cursorMaya: CursorScene;
  cursorDev: CursorScene;
  ripples: { x: number; y: number; p: number; color: string }[];
  cards: AssetsCardScene[];
  assetNodes: AssetNodeScene[];
  artifactNodes: ArtifactNodeScene[];
  artifactEdges: ArtifactEdgeScene[];
  /** Follow-up chain connector Q2→Q3 (v1 DemoConnector). */
  chainProgress: number;
  mapPinCount: number;
}

/* ------------------------------------------------------------------ */
/* Beats (ms)                                                           */
/* ------------------------------------------------------------------ */

export const BEATS2 = {
  mayaIn: 500,
  devIn: 900,
  // Asset drops
  videoDrop: 1200,
  wikiDrop: 2000,
  budgetDrop: 2800,
  flightDrop: 3600,
  // Beat 1 — YouTube → map (Maya)
  q1Spawn: 4700,
  q1Click: 5000,
  q1Attach: 5300,
  q1TypeStart: 5500,
  q1TypeEnd: 6600,
  q1Send: 6900,
  q1Think: 7000,
  mapSpawn: 7900,
  q1StreamStart: 7900,
  q1StreamEnd: 8950,
  mapMorph: 9000,
  pin1: 9500,
  pin2: 9950,
  pin3: 10400,
  pin4: 10850,
  pin5: 11250,
  // Beat 2 — Wikipedia → museums table (Dev)
  q2Spawn: 11800,
  q2Attach: 12100,
  q2TypeStart: 12300,
  q2TypeEnd: 13400,
  q2Send: 13600,
  q2Think: 13700,
  tableSpawn: 14300,
  q2StreamStart: 14300,
  q2StreamEnd: 15250,
  tableMorph: 15300,
  // Beat 2b — follow-up → street view (Dev)
  q3Spawn: 16000,
  q3TypeStart: 16200,
  q3TypeEnd: 17200,
  q3Send: 17400,
  q3Think: 17500,
  streetSpawn: 18000,
  q3StreamStart: 18000,
  q3StreamEnd: 18950,
  streetMorph: 19000,
  // Beat 3 — CSV → pie chart (Maya)
  q4Spawn: 19800,
  q4Attach: 20100,
  q4TypeStart: 20300,
  q4TypeEnd: 21500,
  q4Send: 21700,
  q4Think: 21800,
  pieSpawn: 22400,
  q4StreamStart: 22400,
  q4StreamEnd: 23250,
  pieMorph: 23300,
  // Beat 4 — flight doc → calendar (Dev)
  q5Spawn: 24000,
  q5Attach: 24300,
  q5TypeStart: 24500,
  q5TypeEnd: 25700,
  q5Send: 25900,
  q5Think: 26000,
  calSpawn: 26600,
  q5StreamStart: 26600,
  q5StreamEnd: 27650,
  calMorph: 27700,
  // Finale
  zoomOutStart: 28600,
  cursorsOut: 32500,
  zoomOutEnd: 34000,
  end: 36000,
} as const;

const RIPPLE_MS = 450;
const SPAWN_MS = 320;
const MORPH_MS = 250;

/** Default node sizes (getDefaultArtifactSize values, pinned for determinism). */
const SIZES = {
  video: { w: 520, h: 400 },
  wiki: { w: 520, h: 400 },
  map: { w: 520, h: 380 },
  table: { w: 680, h: 512 },
  street: { w: 520, h: 430 },
  pie: { w: 520, h: 392 },
  cal: { w: 520, h: 540 },
  csv: { w: 480, h: 360 },
  md: { w: 480, h: 360 },
} as const;

/* ------------------------------------------------------------------ */
/* Cursor choreography helpers                                          */
/* ------------------------------------------------------------------ */

interface CursorAction {
  /** Arrive at (x,y) by time t (eased); hold until the next action. */
  t: number;
  x: number;
  y: number;
}

function cursorTrack(actions: CursorAction[], t: number) {
  const xs: NumKeyframe[] = actions.map((a) => ({
    t: a.t,
    v: a.x,
    ease: easeSettle,
  }));
  const ys: NumKeyframe[] = actions.map((a) => ({
    t: a.t,
    v: a.y,
    ease: easeSettle,
  }));
  return { x: track(xs, t), y: track(ys, t) };
}

const composerAt = (pos: { x: number; y: number }) => ({
  x: pos.x + 190,
  y: pos.y + 42,
});
const sendAt = (pos: { x: number; y: number }) => ({
  x: pos.x + 380,
  y: pos.y + 42,
});

/* ------------------------------------------------------------------ */
/* The storyboard                                                       */
/* ------------------------------------------------------------------ */

export function assetsSceneStateAt(t: number): AssetsSceneState {
  const B = BEATS2;

  /* ------------------------------ camera ------------------------------ */

  const cx = track(
    [
      { t: 0, v: 620 },
      { t: B.videoDrop, v: 560, ease: linear },
      { t: B.wikiDrop + 300, v: 1250, ease: easeGlide },
      { t: B.budgetDrop + 300, v: 2300, ease: easeGlide },
      { t: B.flightDrop + 400, v: 3100, ease: easeGlide },
      { t: B.q1Spawn + 300, v: 640, ease: easeGlide },
      { t: B.mapSpawn + 400, v: 760, ease: easeSettle },
      { t: B.pin2, v: 800, ease: easeGlide },
      { t: B.q2Spawn + 300, v: 1900, ease: easeGlide },
      { t: B.tableMorph + 300, v: 1980, ease: easeSettle },
      { t: B.q3Spawn + 300, v: 1860, ease: easeGlide },
      { t: B.streetMorph + 300, v: 1930, ease: easeSettle },
      { t: B.q4Spawn + 300, v: 3080, ease: easeGlide },
      { t: B.pieMorph + 300, v: 3140, ease: easeSettle },
      { t: B.q5Spawn + 300, v: 4180, ease: easeGlide },
      { t: B.calMorph + 300, v: 4240, ease: easeSettle },
      { t: B.zoomOutStart, v: 4240 },
      { t: B.zoomOutEnd, v: 2350, ease: easeInOut },
    ],
    t,
  );

  const cy = track(
    [
      { t: 0, v: 420 },
      { t: B.videoDrop, v: 380, ease: linear },
      { t: B.wikiDrop + 300, v: 340, ease: easeGlide },
      { t: B.budgetDrop + 300, v: 330, ease: easeGlide },
      { t: B.flightDrop + 400, v: 340, ease: easeGlide },
      { t: B.q1Spawn + 300, v: 700, ease: easeGlide },
      { t: B.mapSpawn + 400, v: 740, ease: easeSettle },
      { t: B.pin2, v: 750, ease: easeGlide },
      { t: B.q2Spawn + 300, v: 740, ease: easeGlide },
      { t: B.q3Spawn + 300, v: 1080, ease: easeGlide },
      { t: B.streetMorph + 300, v: 1180, ease: easeSettle },
      { t: B.q4Spawn + 300, v: 720, ease: easeGlide },
      { t: B.q5Spawn + 300, v: 730, ease: easeGlide },
      { t: B.zoomOutStart, v: 730 },
      { t: B.zoomOutEnd, v: 720, ease: easeInOut },
    ],
    t,
  );

  const logScale = track(
    [
      { t: 0, v: Math.log(0.66) },
      { t: B.videoDrop, v: Math.log(0.74), ease: linear },
      { t: B.wikiDrop + 300, v: Math.log(0.72), ease: easeGlide },
      { t: B.flightDrop + 400, v: Math.log(0.66), ease: easeGlide },
      { t: B.q1Spawn + 300, v: Math.log(0.92), ease: easeGlide },
      { t: B.mapSpawn + 400, v: Math.log(1.0), ease: easeSettle },
      { t: B.pin2, v: Math.log(1.06), ease: easeGlide },
      { t: B.q2Spawn + 300, v: Math.log(0.88), ease: easeGlide },
      { t: B.tableMorph + 300, v: Math.log(0.92), ease: easeSettle },
      { t: B.q3Spawn + 300, v: Math.log(0.95), ease: easeGlide },
      { t: B.q4Spawn + 300, v: Math.log(0.95), ease: easeGlide },
      { t: B.pieMorph + 300, v: Math.log(1.0), ease: easeSettle },
      { t: B.q5Spawn + 300, v: Math.log(0.92), ease: easeGlide },
      { t: B.calMorph + 300, v: Math.log(0.95), ease: easeSettle },
      { t: B.zoomOutStart, v: Math.log(0.95) },
      { t: B.zoomOutEnd, v: Math.log(0.4), ease: easeInOut },
      { t: B.end, v: Math.log(0.398), ease: linear },
    ],
    t,
  );
  const scale = Math.exp(logScale);
  const settledScale = Math.max(scale, 0.53);

  /* ------------------------------ cursors ------------------------------ */

  // Maya: drops video + budget, runs beats 1 and 3.
  const maya = cursorTrack(
    [
      { t: B.mayaIn, x: 900, y: 300 },
      { t: B.videoDrop, x: POS.srcVideo.x + 260, y: POS.srcVideo.y + 200 },
      { t: B.budgetDrop, x: POS.srcBudget.x + 240, y: POS.srcBudget.y + 180 },
      { t: B.q1Spawn + 200, x: POS.qMap.x + 320, y: POS.qMap.y - 60 },
      { t: B.q1Click, ...composerAt(POS.qMap) },
      { t: B.q1TypeEnd + 80, ...composerAt(POS.qMap) },
      { t: B.q1Send - 30, ...sendAt(POS.qMap) },
      { t: B.mapSpawn + 500, x: POS.artMap.x + 260, y: POS.artMap.y + 200 },
      { t: B.pin3, x: POS.artMap.x + 330, y: POS.artMap.y + 240 },
      // drifts while Dev works, then beat 3
      { t: B.q2TypeEnd, x: POS.artTable.x + 60, y: POS.artTable.y - 80 },
      { t: B.q4Spawn + 200, x: POS.qPie.x + 320, y: POS.qPie.y - 60 },
      { t: B.q4Attach - 100, ...composerAt(POS.qPie) },
      { t: B.q4TypeEnd + 80, ...composerAt(POS.qPie) },
      { t: B.q4Send - 30, ...sendAt(POS.qPie) },
      { t: B.pieMorph + 500, x: POS.artPie.x + 280, y: POS.artPie.y + 220 },
      { t: B.zoomOutStart + 1500, x: 2200, y: 820 },
    ],
    t,
  );

  // Dev: drops wiki + flight doc, runs beats 2, 2b and 4.
  const dev = cursorTrack(
    [
      { t: B.devIn, x: 1500, y: 500 },
      { t: B.wikiDrop, x: POS.srcWiki.x + 260, y: POS.srcWiki.y + 190 },
      { t: B.flightDrop, x: POS.srcFlight.x + 240, y: POS.srcFlight.y + 170 },
      { t: B.q2Spawn + 200, x: POS.qTable.x + 320, y: POS.qTable.y - 60 },
      { t: B.q2Attach - 100, ...composerAt(POS.qTable) },
      { t: B.q2TypeEnd + 80, ...composerAt(POS.qTable) },
      { t: B.q2Send - 30, ...sendAt(POS.qTable) },
      { t: B.tableMorph + 400, x: POS.artTable.x + 340, y: POS.artTable.y + 260 },
      { t: B.q3Spawn + 150, ...composerAt(POS.qStreet) },
      { t: B.q3TypeEnd + 80, ...composerAt(POS.qStreet) },
      { t: B.q3Send - 30, ...sendAt(POS.qStreet) },
      { t: B.streetMorph + 500, x: POS.artStreet.x + 260, y: POS.artStreet.y + 200 },
      { t: B.q5Spawn + 200, x: POS.qCal.x + 320, y: POS.qCal.y - 60 },
      { t: B.q5Attach - 100, ...composerAt(POS.qCal) },
      { t: B.q5TypeEnd + 80, ...composerAt(POS.qCal) },
      { t: B.q5Send - 30, ...sendAt(POS.qCal) },
      { t: B.calMorph + 500, x: POS.artCal.x + 260, y: POS.artCal.y + 220 },
      { t: B.zoomOutStart + 1500, x: 2520, y: 830 },
    ],
    t,
  );

  const cursorFade = (inAt: number) =>
    seg(t, inAt, inAt + 300) * (1 - seg(t, B.cursorsOut, B.cursorsOut + 600));

  const clickWindows: {
    t: number;
    pos: { x: number; y: number };
    color: string;
  }[] = [
    { t: B.videoDrop, pos: { x: POS.srcVideo.x + 260, y: POS.srcVideo.y + 200 }, color: "#64B5F6" },
    { t: B.wikiDrop, pos: { x: POS.srcWiki.x + 260, y: POS.srcWiki.y + 190 }, color: "#F06292" },
    { t: B.budgetDrop, pos: { x: POS.srcBudget.x + 240, y: POS.srcBudget.y + 180 }, color: "#64B5F6" },
    { t: B.flightDrop, pos: { x: POS.srcFlight.x + 240, y: POS.srcFlight.y + 170 }, color: "#F06292" },
    { t: B.q1Click, pos: composerAt(POS.qMap), color: "#64B5F6" },
    { t: B.q1Send, pos: sendAt(POS.qMap), color: "#64B5F6" },
    { t: B.q2Send, pos: sendAt(POS.qTable), color: "#F06292" },
    { t: B.q3Send, pos: sendAt(POS.qStreet), color: "#F06292" },
    { t: B.q4Send, pos: sendAt(POS.qPie), color: "#64B5F6" },
    { t: B.q5Send, pos: sendAt(POS.qCal), color: "#F06292" },
  ];
  const ripples = clickWindows
    .filter((c) => t >= c.t && t <= c.t + RIPPLE_MS)
    .map((c) => ({ ...c.pos, p: (t - c.t) / RIPPLE_MS, color: c.color }));

  const mayaPressed = clickWindows.some(
    (c) => c.color === "#64B5F6" && t >= c.t && t < c.t + 120,
  );
  const devPressed = clickWindows.some(
    (c) => c.color === "#F06292" && t >= c.t && t < c.t + 120,
  );

  /* ------------------------------ cards ------------------------------ */

  function questionCard(opts: {
    id: string;
    threadId: string;
    pos: { x: number; y: number };
    question: string;
    answer: string;
    spawnAt: number;
    typeStart: number;
    typeEnd: number;
    askAt: number;
    thinkEnd: number;
    streamEnd: number;
    attachedAssetId?: string;
    attachedArtifactId?: string;
    attachAt?: number;
    outputArtifactId?: string;
    outputAt?: number;
  }): AssetsCardScene {
    const asked = t >= opts.askAt;
    const status: CardStatus = !asked
      ? "empty"
      : t < opts.thinkEnd
        ? "thinking"
        : t < opts.streamEnd
          ? "streaming"
          : "done";
    return {
      id: opts.id,
      threadId: opts.threadId,
      pos: opts.pos,
      question: asked ? opts.question : "",
      answer: t < opts.thinkEnd ? "" : streamed(opts.answer, t, opts.thinkEnd, opts.streamEnd),
      status,
      spawn: seg(t, opts.spawnAt, opts.spawnAt + SPAWN_MS, easeSettle),
      visible: t >= opts.spawnAt,
      showFollowUp: false,
      followUpDraft: "",
      emptyDraft: asked ? "" : typed(opts.question, t, opts.typeStart, opts.typeEnd),
      plugsOpacity: 0,
      hintSide: null,
      branchSides: [],
      askElapsedMs: Math.max(0, t - opts.askAt),
      attachedAssetId:
        !asked && opts.attachAt != null && t >= opts.attachAt
          ? opts.attachedAssetId
          : undefined,
      attachedArtifactId:
        !asked && opts.attachAt != null && t >= opts.attachAt
          ? opts.attachedArtifactId
          : undefined,
      outputArtifactId:
        opts.outputArtifactId && opts.outputAt != null && t >= opts.outputAt
          ? opts.outputArtifactId
          : undefined,
    };
  }

  const cards: AssetsCardScene[] = [
    questionCard({
      id: CARD_MAP_Q,
      threadId: THREAD_VIDEO,
      pos: POS.qMap,
      question: Q_MAP,
      answer: A_MAP,
      spawnAt: B.q1Spawn,
      typeStart: B.q1TypeStart,
      typeEnd: B.q1TypeEnd,
      askAt: B.q1Think,
      thinkEnd: B.q1StreamStart,
      streamEnd: B.q1StreamEnd,
      attachedArtifactId: ART_VIDEO,
      attachAt: B.q1Attach,
      outputArtifactId: ART_MAP,
      outputAt: B.mapMorph,
    }),
    questionCard({
      id: CARD_TABLE_Q,
      threadId: THREAD_WIKI,
      pos: POS.qTable,
      question: Q_TABLE,
      answer: A_TABLE,
      spawnAt: B.q2Spawn,
      typeStart: B.q2TypeStart,
      typeEnd: B.q2TypeEnd,
      askAt: B.q2Think,
      thinkEnd: B.q2StreamStart,
      streamEnd: B.q2StreamEnd,
      attachedArtifactId: ART_WIKI,
      attachAt: B.q2Attach,
      outputArtifactId: ART_TABLE,
      outputAt: B.tableMorph,
    }),
    questionCard({
      id: CARD_STREET_Q,
      threadId: THREAD_STREET,
      pos: POS.qStreet,
      question: Q_STREET,
      answer: A_STREET,
      spawnAt: B.q3Spawn,
      typeStart: B.q3TypeStart,
      typeEnd: B.q3TypeEnd,
      askAt: B.q3Think,
      thinkEnd: B.q3StreamStart,
      streamEnd: B.q3StreamEnd,
      outputArtifactId: ART_STREET,
      outputAt: B.streetMorph,
    }),
    questionCard({
      id: CARD_PIE_Q,
      threadId: THREAD_BUDGET,
      pos: POS.qPie,
      question: Q_PIE,
      answer: A_PIE,
      spawnAt: B.q4Spawn,
      typeStart: B.q4TypeStart,
      typeEnd: B.q4TypeEnd,
      askAt: B.q4Think,
      thinkEnd: B.q4StreamStart,
      streamEnd: B.q4StreamEnd,
      attachedAssetId: ASSET_BUDGET,
      attachAt: B.q4Attach,
      outputArtifactId: ART_PIE,
      outputAt: B.pieMorph,
    }),
    questionCard({
      id: CARD_CAL_Q,
      threadId: THREAD_FLIGHT,
      pos: POS.qCal,
      question: Q_CAL,
      answer: A_CAL,
      spawnAt: B.q5Spawn,
      typeStart: B.q5TypeStart,
      typeEnd: B.q5TypeEnd,
      askAt: B.q5Think,
      thinkEnd: B.q5StreamStart,
      streamEnd: B.q5StreamEnd,
      attachedAssetId: ASSET_FLIGHT,
      attachAt: B.q5Attach,
      outputArtifactId: ART_CAL,
      outputAt: B.calMorph,
    }),
  ];

  /* --------------------------- asset nodes --------------------------- */

  const assetNodes: AssetNodeScene[] = [
    {
      nodeId: NODE_BUDGET,
      assetId: ASSET_BUDGET,
      pos: POS.srcBudget,
      size: SIZES.csv,
      spawn: seg(t, B.budgetDrop, B.budgetDrop + SPAWN_MS, easeSettle),
    },
    {
      nodeId: NODE_FLIGHT,
      assetId: ASSET_FLIGHT,
      pos: POS.srcFlight,
      size: SIZES.md,
      spawn: seg(t, B.flightDrop, B.flightDrop + SPAWN_MS, easeSettle),
    },
  ];

  /* -------------------------- artifact nodes ------------------------- */

  const mapPinCount = [B.pin1, B.pin2, B.pin3, B.pin4, B.pin5].filter(
    (p) => t >= p,
  ).length;

  function emergingArtifact(opts: {
    nodeId: string;
    artifactId: string;
    sourceCardId: string;
    pos: { x: number; y: number };
    size: { w: number; h: number };
    spawnAt: number;
    morphAt: number;
    kind: string;
    title: string;
  }): ArtifactNodeScene {
    return {
      nodeId: opts.nodeId,
      artifactId: opts.artifactId,
      sourceCardId: opts.sourceCardId,
      pos: opts.pos,
      size: opts.size,
      generating: t < opts.morphAt,
      generatingKind: opts.kind,
      generatingTitle: opts.title,
      spawn: seg(t, opts.spawnAt, opts.spawnAt + SPAWN_MS, easeSettle),
      morphPulse: seg(t, opts.morphAt, opts.morphAt + MORPH_MS, easeSettle),
    };
  }

  const artifactNodes: ArtifactNodeScene[] = [
    // Sources dropped directly onto the canvas (no generating state).
    {
      nodeId: ANODE_VIDEO,
      artifactId: ART_VIDEO,
      sourceCardId: "",
      pos: POS.srcVideo,
      size: SIZES.video,
      generating: false,
      spawn: seg(t, B.videoDrop, B.videoDrop + SPAWN_MS, easeSettle),
      morphPulse: 1,
    },
    {
      nodeId: ANODE_WIKI,
      artifactId: ART_WIKI,
      sourceCardId: "",
      pos: POS.srcWiki,
      size: SIZES.wiki,
      generating: false,
      spawn: seg(t, B.wikiDrop, B.wikiDrop + SPAWN_MS, easeSettle),
      morphPulse: 1,
    },
    emergingArtifact({
      nodeId: ANODE_MAP,
      artifactId: ART_MAP,
      sourceCardId: CARD_MAP_Q,
      pos: POS.artMap,
      size: SIZES.map,
      spawnAt: B.mapSpawn,
      morphAt: B.mapMorph,
      kind: "map",
      title: "London — spots from the vlog",
    }),
    emergingArtifact({
      nodeId: ANODE_TABLE,
      artifactId: ART_TABLE,
      sourceCardId: CARD_TABLE_Q,
      pos: POS.artTable,
      size: SIZES.table,
      spawnAt: B.tableSpawn,
      morphAt: B.tableMorph,
      kind: "table",
      title: "Top 5 Museums to Visit in London",
    }),
    emergingArtifact({
      nodeId: ANODE_STREET,
      artifactId: ART_STREET,
      sourceCardId: CARD_STREET_Q,
      pos: POS.artStreet,
      size: SIZES.street,
      spawnAt: B.streetSpawn,
      morphAt: B.streetMorph,
      kind: "streetview",
      title: "Natural History Museum, London",
    }),
    emergingArtifact({
      nodeId: ANODE_PIE,
      artifactId: ART_PIE,
      sourceCardId: CARD_PIE_Q,
      pos: POS.artPie,
      size: SIZES.pie,
      spawnAt: B.pieSpawn,
      morphAt: B.pieMorph,
      kind: "chart",
      title: "London budget — £2,400 split",
    }),
    emergingArtifact({
      nodeId: ANODE_CAL,
      artifactId: ART_CAL,
      sourceCardId: CARD_CAL_Q,
      pos: POS.artCal,
      size: SIZES.cal,
      spawnAt: B.calSpawn,
      morphAt: B.calMorph,
      kind: "calendar",
      title: "London — four days in November",
    }),
  ];

  /* -------------------------- dashed edges --------------------------- */

  function edge(
    id: string,
    artifactNodeId: string,
    cardId: string,
    fadeInAt: number,
  ): ArtifactEdgeScene {
    return {
      id,
      artifactNodeId,
      cardId,
      fromSide: "left",
      toSide: "right",
      opacity: seg(t, fadeInAt, fadeInAt + 350),
    };
  }

  const artifactEdges: ArtifactEdgeScene[] = [
    edge("e_map", ANODE_MAP, CARD_MAP_Q, B.mapSpawn),
    edge("e_table", ANODE_TABLE, CARD_TABLE_Q, B.tableSpawn),
    edge("e_street", ANODE_STREET, CARD_STREET_Q, B.streetSpawn),
    edge("e_pie", ANODE_PIE, CARD_PIE_Q, B.pieSpawn),
    edge("e_cal", ANODE_CAL, CARD_CAL_Q, B.calSpawn),
  ].filter((e) => e.opacity > 0);

  return {
    camera: { cx, cy, scale },
    settledScale,
    cursorMaya: {
      ...maya,
      opacity: cursorFade(B.mayaIn),
      pressed: mayaPressed,
    },
    cursorDev: { ...dev, opacity: cursorFade(B.devIn), pressed: devPressed },
    ripples,
    cards,
    assetNodes,
    artifactNodes,
    artifactEdges,
    chainProgress: seg(t, B.q3Spawn, B.q3Spawn + 350, easeInOut),
    mapPinCount,
  };
}
