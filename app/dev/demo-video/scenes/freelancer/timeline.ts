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
  A_CONV,
  A_INV,
  A_TL,
  A_TODO,
  A_TZ,
  ANODE_CONV,
  ANODE_FIGMA,
  ANODE_IMG,
  ANODE_INV,
  ANODE_SITE,
  ANODE_STICKY,
  ANODE_TL,
  ANODE_TODO,
  ANODE_TZ,
  ART_CONV,
  ART_FIGMA,
  ART_IMG,
  ART_INV,
  ART_SITE,
  ART_STICKY,
  ART_TL,
  ART_TODO,
  ART_TZ,
  ASSET_BRIEF,
  ASSET_NDA,
  CARD_CONV_Q,
  CARD_INV_Q,
  CARD_TL_Q,
  CARD_TODO_Q,
  CARD_TZ_Q,
  CHIPS,
  CURSOR_ANANYA,
  CURSOR_PREM,
  FL_LABELS,
  NODE_BRIEF,
  NODE_NDA,
  POS,
  Q_CONV,
  Q_INV,
  Q_TL,
  Q_TODO,
  Q_TZ,
  SIZES,
  THREAD_CONV,
  THREAD_INV,
  THREAD_TL,
  THREAD_TODO,
  THREAD_TZ,
} from "./fixtures";

export const FL_DURATION_MS = 34500;

/* ------------------------------------------------------------------ */
/* Scene model (mirrors the disney scene so DemoCard renders it)        */
/* ------------------------------------------------------------------ */

export interface CursorScene {
  x: number;
  y: number;
  opacity: number;
  pressed: boolean;
}

export interface FlCardScene {
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
  attachedAssetId?: string;
  attachedArtifactId?: string;
  outputArtifactId?: string;
}

export interface AssetNodeScene {
  nodeId: string;
  assetId: string;
  pos: { x: number; y: number };
  size?: { w: number; h: number };
  spawn: number;
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
  morphPulse: number;
}

export interface ArtifactEdgeScene {
  id: string;
  artifactNodeId: string;
  cardId: string;
  fromSide: "left" | "right";
  toSide: "left" | "right";
  opacity: number;
}

export interface LabelScene {
  id: string;
  opacity: number;
}

export interface BrandScene {
  titleOpacity: number;
  chip: { text: string; opacity: number } | null;
  canvasFade: number;
  lockup: number;
}

export interface FlSceneState {
  camera: { cx: number; cy: number; scale: number };
  settledScale: number;
  cursorPrem: CursorScene;
  cursorAnanya: CursorScene;
  ripples: { x: number; y: number; p: number; color: string }[];
  cards: FlCardScene[];
  assetNodes: AssetNodeScene[];
  artifactNodes: ArtifactNodeScene[];
  artifactEdges: ArtifactEdgeScene[];
  labels: LabelScene[];
  brand: BrandScene;
}

/* ------------------------------------------------------------------ */
/* Beats (ms)                                                           */
/* ------------------------------------------------------------------ */

export const BEATS = {
  titleIn: 200,
  titleOut: 1500,
  ananyaIn: 500,
  premIn: 4300,
  // The pile-up — the client drops the paperwork, the freelancer adds refs.
  // (The NDA waits for the title bookend to clear before it lands.)
  ndaDrop: 1550,
  briefDrop: 2400,
  figmaDrop: 3300,
  siteDrop: 4100,
  imgDrop: 4900,
  stickyDrop: 5400,
  // Beat 1 — brief attached → project timeline
  q1Spawn: 5700,
  q1Click: 6000,
  q1Attach: 6300,
  q1TypeStart: 6500,
  q1TypeEnd: 8700,
  q1Send: 8950,
  q1Think: 9050,
  tlSpawn: 9800,
  q1StreamStart: 9800,
  q1StreamEnd: 10900,
  tlMorph: 11000,
  // camera pans along the timeline 11300 → 12500
  // Beat 2 — design phase → task list
  q2Spawn: 12600,
  q2TypeStart: 12900,
  q2TypeEnd: 14300,
  q2Send: 14500,
  q2Think: 14600,
  todoSpawn: 15300,
  q2StreamStart: 15300,
  q2StreamEnd: 16200,
  todoMorph: 16300,
  // Beat 3 — build your own software, in parallel (Prem: converter,
  // Ananya: time zones). Both cards think at once.
  q3Spawn: 17100,
  q3TypeStart: 17350,
  q3TypeEnd: 19050,
  q3Send: 19250,
  q3Think: 19350,
  q4Spawn: 18200,
  q4TypeStart: 18450,
  q4TypeEnd: 19650,
  q4Send: 19850,
  q4Think: 19950,
  convSpawn: 20050,
  q3StreamStart: 20050,
  q3StreamEnd: 21050,
  convMorph: 21200,
  tzSpawn: 20650,
  q4StreamStart: 20650,
  q4StreamEnd: 21650,
  tzMorph: 21800,
  // camera frames both widgets 22000 → 24200
  // Beat 4 — the invoice payoff
  q5Spawn: 24400,
  q5TypeStart: 24650,
  q5TypeEnd: 25850,
  q5Send: 26050,
  q5Think: 26150,
  invSpawn: 26900,
  q5StreamStart: 26900,
  q5StreamEnd: 27900,
  invMorph: 28000,
  // Finale — zoom out to the wall
  zoomOutStart: 29000,
  zoomOutEnd: 32200,
  cursorsOut: 31500,
  canvasFadeStart: 32400,
  canvasFadeEnd: 33200,
  lockupIn: 33300,
  end: 34500,
} as const;

const RIPPLE_MS = 450;
const SPAWN_MS = 320;
const MORPH_MS = 250;

/* ------------------------------------------------------------------ */
/* Cursor choreography helpers                                          */
/* ------------------------------------------------------------------ */

interface CursorAction {
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

export function flSceneStateAt(t: number): FlSceneState {
  const B = BEATS;

  /* ------------------------------ camera ------------------------------ */

  const cx = track(
    [
      { t: 0, v: 300 },
      { t: B.ndaDrop + 400, v: 330, ease: linear },
      { t: B.briefDrop + 400, v: 620, ease: easeGlide },
      { t: B.figmaDrop + 400, v: 560, ease: easeGlide },
      { t: B.siteDrop + 400, v: 800, ease: easeGlide },
      { t: B.imgDrop + 400, v: 1180, ease: easeGlide },
      { t: B.q1Spawn + 300, v: 2100, ease: easeGlide },
      { t: B.tlSpawn + 400, v: 2500, ease: easeSettle },
      // pan along the timeline once it lands
      { t: B.tlMorph + 300, v: 2900, ease: easeSettle },
      { t: B.tlMorph + 1500, v: 3800, ease: easeInOut },
      { t: B.q2Spawn + 300, v: 2350, ease: easeGlide },
      { t: B.todoMorph + 300, v: 2500, ease: easeSettle },
      { t: B.q3Spawn + 300, v: 5520, ease: easeGlide },
      { t: B.q4Spawn + 500, v: 5580, ease: easeSettle },
      { t: B.convMorph + 300, v: 5700, ease: easeSettle },
      { t: B.tzMorph + 700, v: 5680, ease: easeInOut },
      { t: B.q5Spawn + 300, v: 6940, ease: easeGlide },
      { t: B.invMorph + 300, v: 7060, ease: easeSettle },
      { t: B.zoomOutEnd, v: 3770, ease: easeInOut },
    ],
    t,
  );

  const cy = track(
    [
      { t: 0, v: 170 },
      { t: B.ndaDrop + 400, v: 175, ease: linear },
      { t: B.briefDrop + 400, v: 150, ease: easeGlide },
      { t: B.figmaDrop + 400, v: 420, ease: easeGlide },
      { t: B.siteDrop + 400, v: 480, ease: easeGlide },
      { t: B.imgDrop + 400, v: 300, ease: easeGlide },
      { t: B.q1Spawn + 300, v: 300, ease: easeGlide },
      { t: B.tlSpawn + 400, v: 280, ease: easeSettle },
      { t: B.tlMorph + 300, v: 260, ease: easeSettle },
      { t: B.tlMorph + 1500, v: 260, ease: easeInOut },
      { t: B.q2Spawn + 300, v: 800, ease: easeGlide },
      { t: B.todoMorph + 300, v: 820, ease: easeSettle },
      { t: B.q3Spawn + 300, v: 330, ease: easeGlide },
      { t: B.q4Spawn + 500, v: 560, ease: easeSettle },
      { t: B.convMorph + 300, v: 480, ease: easeSettle },
      { t: B.tzMorph + 700, v: 500, ease: easeInOut },
      { t: B.q5Spawn + 300, v: 340, ease: easeGlide },
      { t: B.invMorph + 300, v: 360, ease: easeSettle },
      { t: B.zoomOutEnd, v: 460, ease: easeInOut },
    ],
    t,
  );

  const logScale = track(
    [
      { t: 0, v: Math.log(0.82) },
      { t: B.ndaDrop + 400, v: Math.log(0.92), ease: linear },
      { t: B.briefDrop + 400, v: Math.log(0.8), ease: easeGlide },
      { t: B.figmaDrop + 400, v: Math.log(0.74), ease: easeGlide },
      { t: B.siteDrop + 400, v: Math.log(0.72), ease: easeGlide },
      { t: B.imgDrop + 400, v: Math.log(0.72), ease: easeGlide },
      { t: B.q1Spawn + 300, v: Math.log(0.95), ease: easeGlide },
      { t: B.tlSpawn + 400, v: Math.log(0.8), ease: easeSettle },
      { t: B.tlMorph + 300, v: Math.log(0.66), ease: easeSettle },
      { t: B.tlMorph + 1500, v: Math.log(0.62), ease: easeInOut },
      { t: B.q2Spawn + 300, v: Math.log(0.9), ease: easeGlide },
      { t: B.todoMorph + 300, v: Math.log(0.92), ease: easeSettle },
      { t: B.q3Spawn + 300, v: Math.log(0.88), ease: easeGlide },
      { t: B.q4Spawn + 500, v: Math.log(0.72), ease: easeSettle },
      { t: B.convMorph + 300, v: Math.log(0.7), ease: easeSettle },
      { t: B.tzMorph + 700, v: Math.log(0.66), ease: easeInOut },
      { t: B.q5Spawn + 300, v: Math.log(0.88), ease: easeGlide },
      { t: B.invMorph + 300, v: Math.log(0.78), ease: easeSettle },
      { t: B.zoomOutEnd, v: Math.log(0.245), ease: easeInOut },
      { t: B.end, v: Math.log(0.243), ease: linear },
    ],
    t,
  );
  const scale = Math.exp(logScale);
  const settledScale = Math.max(scale, 0.53);

  /* ------------------------------ cursors ------------------------------ */

  // Ananya (client) drops the paperwork, asks for the clock, admires the
  // invoice.
  const ananya = cursorTrack(
    [
      { t: B.ananyaIn, x: 620, y: 340 },
      { t: B.ndaDrop, x: POS.srcNda.x + 240, y: POS.srcNda.y + 180 },
      { t: B.briefDrop, x: POS.srcBrief.x + 240, y: POS.srcBrief.y + 180 },
      { t: B.figmaDrop, x: POS.srcFigma.x + 260, y: POS.srcFigma.y + 200 },
      { t: B.siteDrop, x: POS.srcSite.x + 260, y: POS.srcSite.y + 200 },
      { t: B.q1Send, x: POS.srcSite.x + 420, y: POS.srcSite.y + 120 },
      { t: B.tlMorph + 600, x: POS.artTl.x + 420, y: POS.artTl.y + 520 },
      { t: B.q4Spawn - 150, x: POS.qTz.x + 320, y: POS.qTz.y - 60 },
      { t: B.q4Spawn + 150, ...composerAt(POS.qTz) },
      { t: B.q4TypeEnd + 80, ...composerAt(POS.qTz) },
      { t: B.q4Send - 30, ...sendAt(POS.qTz) },
      { t: B.tzMorph + 500, x: POS.artTz.x + 260, y: POS.artTz.y + 160 },
      { t: B.invMorph + 700, x: POS.artInv.x + 300, y: POS.artInv.y + 380 },
      { t: B.zoomOutStart + 1500, x: POS.artInv.x + 220, y: POS.artInv.y + 320 },
    ],
    t,
  );

  // Prem (freelancer) adds references and does the asks.
  const prem = cursorTrack(
    [
      { t: B.premIn, x: POS.srcImg.x - 200, y: POS.srcImg.y + 320 },
      { t: B.imgDrop, x: POS.srcImg.x + 260, y: POS.srcImg.y + 200 },
      { t: B.stickyDrop, x: POS.srcSticky.x + 120, y: POS.srcSticky.y + 124 },
      { t: B.q1Spawn + 200, x: POS.qTl.x + 320, y: POS.qTl.y - 60 },
      { t: B.q1Click, ...composerAt(POS.qTl) },
      { t: B.q1TypeEnd + 80, ...composerAt(POS.qTl) },
      { t: B.q1Send - 30, ...sendAt(POS.qTl) },
      { t: B.tlMorph + 500, x: POS.artTl.x + 500, y: POS.artTl.y + 240 },
      { t: B.q2Spawn + 150, ...composerAt(POS.qTodo) },
      { t: B.q2TypeEnd + 80, ...composerAt(POS.qTodo) },
      { t: B.q2Send - 30, ...sendAt(POS.qTodo) },
      { t: B.todoMorph + 500, x: POS.artTodo.x + 260, y: POS.artTodo.y + 220 },
      { t: B.q3Spawn + 200, x: POS.qConv.x + 320, y: POS.qConv.y - 60 },
      { t: B.q3Spawn + 350, ...composerAt(POS.qConv) },
      { t: B.q3TypeEnd + 80, ...composerAt(POS.qConv) },
      { t: B.q3Send - 30, ...sendAt(POS.qConv) },
      { t: B.convMorph + 500, x: POS.artConv.x + 240, y: POS.artConv.y + 300 },
      { t: B.q5Spawn + 200, x: POS.qInv.x + 320, y: POS.qInv.y - 60 },
      { t: B.q5Spawn + 350, ...composerAt(POS.qInv) },
      { t: B.q5TypeEnd + 80, ...composerAt(POS.qInv) },
      { t: B.q5Send - 30, ...sendAt(POS.qInv) },
      { t: B.invMorph + 500, x: POS.artInv.x + 280, y: POS.artInv.y + 260 },
      { t: B.zoomOutStart + 1500, x: 3300, y: 900 },
    ],
    t,
  );

  const cursorFade = (inAt: number) =>
    seg(t, inAt, inAt + 300) * (1 - seg(t, B.cursorsOut, B.cursorsOut + 600));

  const ananyaClicks: { t: number; pos: { x: number; y: number } }[] = [
    { t: B.ndaDrop, pos: { x: POS.srcNda.x + 240, y: POS.srcNda.y + 180 } },
    { t: B.briefDrop, pos: { x: POS.srcBrief.x + 240, y: POS.srcBrief.y + 180 } },
    { t: B.figmaDrop, pos: { x: POS.srcFigma.x + 260, y: POS.srcFigma.y + 200 } },
    { t: B.siteDrop, pos: { x: POS.srcSite.x + 260, y: POS.srcSite.y + 200 } },
    { t: B.q4Spawn + 150, pos: composerAt(POS.qTz) },
    { t: B.q4Send, pos: sendAt(POS.qTz) },
  ];
  const premClicks: { t: number; pos: { x: number; y: number } }[] = [
    { t: B.imgDrop, pos: { x: POS.srcImg.x + 260, y: POS.srcImg.y + 200 } },
    { t: B.stickyDrop, pos: { x: POS.srcSticky.x + 120, y: POS.srcSticky.y + 124 } },
    { t: B.q1Click, pos: composerAt(POS.qTl) },
    { t: B.q1Send, pos: sendAt(POS.qTl) },
    { t: B.q2Send, pos: sendAt(POS.qTodo) },
    { t: B.q3Send, pos: sendAt(POS.qConv) },
    { t: B.q5Send, pos: sendAt(POS.qInv) },
  ];

  const ripples = [
    ...ananyaClicks.map((c) => ({ ...c, color: CURSOR_ANANYA.color })),
    ...premClicks.map((c) => ({ ...c, color: CURSOR_PREM.color })),
  ]
    .filter((c) => t >= c.t && t <= c.t + RIPPLE_MS)
    .map((c) => ({ ...c.pos, p: (t - c.t) / RIPPLE_MS, color: c.color }));

  const ananyaPressed = ananyaClicks.some((c) => t >= c.t && t < c.t + 120);
  const premPressed = premClicks.some((c) => t >= c.t && t < c.t + 120);

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
  }): FlCardScene {
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
      answer:
        t < opts.thinkEnd
          ? ""
          : streamed(opts.answer, t, opts.thinkEnd, opts.streamEnd),
      status,
      spawn: seg(t, opts.spawnAt, opts.spawnAt + SPAWN_MS, easeSettle),
      visible: t >= opts.spawnAt,
      showFollowUp: false,
      followUpDraft: "",
      emptyDraft: asked
        ? ""
        : typed(opts.question, t, opts.typeStart, opts.typeEnd),
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

  const cards: FlCardScene[] = [
    questionCard({
      id: CARD_TL_Q,
      threadId: THREAD_TL,
      pos: POS.qTl,
      question: Q_TL,
      answer: A_TL,
      spawnAt: B.q1Spawn,
      typeStart: B.q1TypeStart,
      typeEnd: B.q1TypeEnd,
      askAt: B.q1Think,
      thinkEnd: B.q1StreamStart,
      streamEnd: B.q1StreamEnd,
      attachedAssetId: ASSET_BRIEF,
      attachAt: B.q1Attach,
      outputArtifactId: ART_TL,
      outputAt: B.tlMorph,
    }),
    questionCard({
      id: CARD_TODO_Q,
      threadId: THREAD_TODO,
      pos: POS.qTodo,
      question: Q_TODO,
      answer: A_TODO,
      spawnAt: B.q2Spawn,
      typeStart: B.q2TypeStart,
      typeEnd: B.q2TypeEnd,
      askAt: B.q2Think,
      thinkEnd: B.q2StreamStart,
      streamEnd: B.q2StreamEnd,
      outputArtifactId: ART_TODO,
      outputAt: B.todoMorph,
    }),
    questionCard({
      id: CARD_CONV_Q,
      threadId: THREAD_CONV,
      pos: POS.qConv,
      question: Q_CONV,
      answer: A_CONV,
      spawnAt: B.q3Spawn,
      typeStart: B.q3TypeStart,
      typeEnd: B.q3TypeEnd,
      askAt: B.q3Think,
      thinkEnd: B.q3StreamStart,
      streamEnd: B.q3StreamEnd,
      outputArtifactId: ART_CONV,
      outputAt: B.convMorph,
    }),
    questionCard({
      id: CARD_TZ_Q,
      threadId: THREAD_TZ,
      pos: POS.qTz,
      question: Q_TZ,
      answer: A_TZ,
      spawnAt: B.q4Spawn,
      typeStart: B.q4TypeStart,
      typeEnd: B.q4TypeEnd,
      askAt: B.q4Think,
      thinkEnd: B.q4StreamStart,
      streamEnd: B.q4StreamEnd,
      outputArtifactId: ART_TZ,
      outputAt: B.tzMorph,
    }),
    questionCard({
      id: CARD_INV_Q,
      threadId: THREAD_INV,
      pos: POS.qInv,
      question: Q_INV,
      answer: A_INV,
      spawnAt: B.q5Spawn,
      typeStart: B.q5TypeStart,
      typeEnd: B.q5TypeEnd,
      askAt: B.q5Think,
      thinkEnd: B.q5StreamStart,
      streamEnd: B.q5StreamEnd,
      outputArtifactId: ART_INV,
      outputAt: B.invMorph,
    }),
  ];

  /* --------------------------- asset nodes --------------------------- */

  const assetNodes: AssetNodeScene[] = [
    {
      nodeId: NODE_NDA,
      assetId: ASSET_NDA,
      pos: POS.srcNda,
      size: SIZES.mdAsset,
      spawn: seg(t, B.ndaDrop, B.ndaDrop + SPAWN_MS, easeSettle),
    },
    {
      nodeId: NODE_BRIEF,
      assetId: ASSET_BRIEF,
      pos: POS.srcBrief,
      size: SIZES.mdAsset,
      spawn: seg(t, B.briefDrop, B.briefDrop + SPAWN_MS, easeSettle),
    },
  ];

  /* -------------------------- artifact nodes ------------------------- */

  function droppedArtifact(opts: {
    nodeId: string;
    artifactId: string;
    pos: { x: number; y: number };
    size: { w: number; h: number };
    spawnAt: number;
  }): ArtifactNodeScene {
    return {
      nodeId: opts.nodeId,
      artifactId: opts.artifactId,
      sourceCardId: "",
      pos: opts.pos,
      size: opts.size,
      generating: false,
      spawn: seg(t, opts.spawnAt, opts.spawnAt + SPAWN_MS, easeSettle),
      morphPulse: 1,
    };
  }

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
    droppedArtifact({
      nodeId: ANODE_FIGMA,
      artifactId: ART_FIGMA,
      pos: POS.srcFigma,
      size: SIZES.website,
      spawnAt: B.figmaDrop,
    }),
    droppedArtifact({
      nodeId: ANODE_SITE,
      artifactId: ART_SITE,
      pos: POS.srcSite,
      size: SIZES.website,
      spawnAt: B.siteDrop,
    }),
    droppedArtifact({
      nodeId: ANODE_IMG,
      artifactId: ART_IMG,
      pos: POS.srcImg,
      size: SIZES.images,
      spawnAt: B.imgDrop,
    }),
    droppedArtifact({
      nodeId: ANODE_STICKY,
      artifactId: ART_STICKY,
      pos: POS.srcSticky,
      size: SIZES.sticky,
      spawnAt: B.stickyDrop,
    }),
    emergingArtifact({
      nodeId: ANODE_TL,
      artifactId: ART_TL,
      sourceCardId: CARD_TL_Q,
      pos: POS.artTl,
      size: SIZES.tl,
      spawnAt: B.tlSpawn,
      morphAt: B.tlMorph,
      kind: "timeline",
      title: "Project timeline",
    }),
    emergingArtifact({
      nodeId: ANODE_TODO,
      artifactId: ART_TODO,
      sourceCardId: CARD_TODO_Q,
      pos: POS.artTodo,
      size: SIZES.todo,
      spawnAt: B.todoSpawn,
      morphAt: B.todoMorph,
      kind: "todo",
      title: "Design phase — task list",
    }),
    emergingArtifact({
      nodeId: ANODE_CONV,
      artifactId: ART_CONV,
      sourceCardId: CARD_CONV_Q,
      pos: POS.artConv,
      size: SIZES.conv,
      spawnAt: B.convSpawn,
      morphAt: B.convMorph,
      kind: "custom",
      title: "Thai Baht ↔ Indian Rupee Converter",
    }),
    emergingArtifact({
      nodeId: ANODE_TZ,
      artifactId: ART_TZ,
      sourceCardId: CARD_TZ_Q,
      pos: POS.artTz,
      size: SIZES.tz,
      spawnAt: B.tzSpawn,
      morphAt: B.tzMorph,
      kind: "custom",
      title: "Thailand & India Time Zones",
    }),
    emergingArtifact({
      nodeId: ANODE_INV,
      artifactId: ART_INV,
      sourceCardId: CARD_INV_Q,
      pos: POS.artInv,
      size: SIZES.inv,
      spawnAt: B.invSpawn,
      morphAt: B.invMorph,
      kind: "custom",
      title: "Invoice Generator",
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
    edge("e_tl", ANODE_TL, CARD_TL_Q, B.tlSpawn),
    edge("e_todo", ANODE_TODO, CARD_TODO_Q, B.todoSpawn),
    edge("e_conv", ANODE_CONV, CARD_CONV_Q, B.convSpawn),
    edge("e_tz", ANODE_TZ, CARD_TZ_Q, B.tzSpawn),
    edge("e_inv", ANODE_INV, CARD_INV_Q, B.invSpawn),
  ].filter((e) => e.opacity > 0);

  /* ------------------------------ labels ------------------------------ */

  const labelRevealAt: Record<number, number> = {
    0: B.briefDrop + 100,
    1: B.tlMorph + 300,
    2: B.convMorph + 300,
    3: B.invMorph + 300,
  };
  const labels: LabelScene[] = FL_LABELS.map((l) => ({
    id: l.id,
    opacity: seg(t, labelRevealAt[l.revealStep], labelRevealAt[l.revealStep] + 350),
  }));

  /* ------------------------------ brand ------------------------------- */

  const titleOpacity =
    seg(t, B.titleIn, B.titleIn + 300) * (1 - seg(t, B.titleOut - 300, B.titleOut));

  let chip: BrandScene["chip"] = null;
  for (const c of CHIPS) {
    if (t >= c.t0 && t <= c.t1) {
      chip = {
        text: c.text,
        opacity: Math.min(seg(t, c.t0, c.t0 + 220), 1 - seg(t, c.t1 - 220, c.t1)),
      };
      break;
    }
  }

  const brand: BrandScene = {
    titleOpacity,
    chip,
    canvasFade: seg(t, B.canvasFadeStart, B.canvasFadeEnd, easeInOut),
    lockup: seg(t, B.lockupIn, B.lockupIn + 500, easeSettle),
  };

  return {
    camera: { cx, cy, scale },
    settledScale,
    cursorPrem: {
      ...prem,
      opacity: cursorFade(B.premIn),
      pressed: premPressed,
    },
    cursorAnanya: {
      ...ananya,
      opacity: cursorFade(B.ananyaIn),
      pressed: ananyaPressed,
    },
    ripples,
    cards,
    assetNodes,
    artifactNodes,
    artifactEdges,
    labels,
    brand,
  };
}
