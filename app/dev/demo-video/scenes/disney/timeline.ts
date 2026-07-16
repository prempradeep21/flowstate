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
  A_CHART,
  A_MAP,
  A_TL,
  ANODE_CHART,
  ANODE_EPCOT,
  ANODE_MAP,
  ANODE_STEAM,
  ANODE_TL,
  ANODE_WIKI,
  ART_CHART,
  ART_EPCOT,
  ART_MAP,
  ART_STEAM,
  ART_TL,
  ART_WIKI,
  ASSET_DOC,
  CARD_CHART_Q,
  CARD_MAP_Q,
  CARD_TL_Q,
  CHIPS,
  DISNEY_LABELS,
  NODE_DOC,
  POS,
  Q_CHART,
  Q_MAP,
  Q_TL,
  SIZES,
  THREAD_CHART,
  THREAD_MAP,
  THREAD_TL,
} from "./fixtures";

export const DISNEY_DURATION_MS = 36500;

/* ------------------------------------------------------------------ */
/* Scene model (mirrors the assets scene so DemoCard renders it)        */
/* ------------------------------------------------------------------ */

export interface CursorScene {
  x: number;
  y: number;
  opacity: number;
  pressed: boolean;
}

export interface DisneyCardScene {
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
  /** Opening title bookend ("deep-dive anything on flowstate"). */
  titleOpacity: number;
  /** Caption chip, bottom-center. */
  chip: { text: string; opacity: number } | null;
  /** Full-frame fade into the brand-blue end card. */
  canvasFade: number;
  /** End-card lockup reveal. */
  lockup: number;
}

export interface DisneySceneState {
  camera: { cx: number; cy: number; scale: number };
  settledScale: number;
  cursorMaya: CursorScene;
  cursorDev: CursorScene;
  ripples: { x: number; y: number; p: number; color: string }[];
  cards: DisneyCardScene[];
  assetNodes: AssetNodeScene[];
  artifactNodes: ArtifactNodeScene[];
  artifactEdges: ArtifactEdgeScene[];
  labels: LabelScene[];
  mapPinCount: number;
  brand: BrandScene;
}

/* ------------------------------------------------------------------ */
/* Beats (ms)                                                           */
/* ------------------------------------------------------------------ */

export const BEATS = {
  titleIn: 200,
  titleOut: 1500,
  mayaIn: 500,
  // Bring in — four drops, camera pans across. The first node lands as the
  // title bookend fades, so the title reads over a nearly-empty canvas.
  steamDrop: 1400,
  docDrop: 2600,
  wikiDrop: 3600,
  epcotDrop: 4500,
  // Beat 1 — the canvas's real Q&A: doc attached → bar chart
  q1Spawn: 5300,
  q1Click: 5600,
  q1Attach: 5900,
  q1TypeStart: 6100,
  q1TypeEnd: 8900,
  q1Send: 9150,
  q1Think: 9250,
  chartSpawn: 10150,
  q1StreamStart: 10150,
  q1StreamEnd: 11250,
  chartMorph: 11350,
  // Beat 2 — milestones timeline
  q2Spawn: 12300,
  q2TypeStart: 12600,
  q2TypeEnd: 14100,
  q2Send: 14300,
  q2Think: 14400,
  tlSpawn: 15200,
  q2StreamStart: 15200,
  q2StreamEnd: 16200,
  tlMorph: 16300,
  // camera pans across the wide timeline 16600 → 17800
  // Beat 3 — EPCOT film attached → Walt Disney World map
  q3Spawn: 18100,
  q3Attach: 18400,
  q3TypeStart: 18600,
  q3TypeEnd: 19600,
  q3Send: 19800,
  q3Think: 19900,
  mapSpawn: 20600,
  q3StreamStart: 20600,
  q3StreamEnd: 21500,
  mapMorph: 21600,
  pinDrop: 22100,
  // Arrange — tidy the timeline into the grid, era labels sweep in
  dragStart: 23300,
  dragEnd: 24500,
  labelFilms: 24800,
  labelDisneyland: 25100,
  labelEpcot: 25400,
  // Finale — zoom out to the wall; Dev joins as the share chip shows
  zoomOutStart: 26200,
  devIn: 27200,
  zoomOutEnd: 30200,
  cursorsOut: 31000,
  canvasFadeStart: 32000,
  canvasFadeEnd: 32800,
  lockupIn: 32900,
  end: 36500,
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

/** Grab point on the timeline node's header while Maya tidies it. */
const tlGrab = (pos: { x: number; y: number }) => ({
  x: pos.x + 550,
  y: pos.y + 24,
});

/* ------------------------------------------------------------------ */
/* The storyboard                                                       */
/* ------------------------------------------------------------------ */

export function disneySceneStateAt(t: number): DisneySceneState {
  const B = BEATS;

  /* --------------------- the tidied timeline node --------------------- */

  const dragP = seg(t, B.dragStart, B.dragEnd, easeGlide);
  const tlPos = {
    x: POS.artTlDrop.x + (POS.artTl.x - POS.artTlDrop.x) * dragP,
    y: POS.artTlDrop.y + (POS.artTl.y - POS.artTlDrop.y) * dragP,
  };

  /* ------------------------------ camera ------------------------------ */

  const cx = track(
    [
      { t: 0, v: 300 },
      { t: B.steamDrop + 400, v: 320, ease: linear },
      { t: B.docDrop + 400, v: 1530, ease: easeGlide },
      { t: B.wikiDrop + 400, v: 2960, ease: easeGlide },
      { t: B.epcotDrop + 400, v: 4110, ease: easeGlide },
      { t: B.q1Spawn + 300, v: 1660, ease: easeGlide },
      { t: B.chartSpawn + 400, v: 1850, ease: easeSettle },
      { t: B.q2Spawn + 300, v: 1700, ease: easeGlide },
      { t: B.tlMorph + 300, v: 2150, ease: easeSettle },
      { t: B.tlMorph + 1500, v: 3100, ease: easeInOut },
      { t: B.q3Spawn + 300, v: 4180, ease: easeGlide },
      { t: B.mapMorph + 300, v: 4300, ease: easeSettle },
      { t: B.dragStart - 400, v: 2400, ease: easeGlide },
      { t: B.labelEpcot + 300, v: 2430 },
      { t: B.zoomOutEnd, v: 2420, ease: easeInOut },
    ],
    t,
  );

  const cy = track(
    [
      { t: 0, v: 190 },
      { t: B.steamDrop + 400, v: 180, ease: linear },
      { t: B.docDrop + 400, v: 150, ease: easeGlide },
      { t: B.wikiDrop + 400, v: 190, ease: easeGlide },
      { t: B.epcotDrop + 400, v: 170, ease: easeGlide },
      { t: B.q1Spawn + 300, v: 640, ease: easeGlide },
      { t: B.chartSpawn + 400, v: 680, ease: easeSettle },
      { t: B.q2Spawn + 300, v: 1210, ease: easeGlide },
      { t: B.tlMorph + 300, v: 1300, ease: easeSettle },
      { t: B.tlMorph + 1500, v: 1310, ease: easeInOut },
      { t: B.q3Spawn + 300, v: 640, ease: easeGlide },
      { t: B.mapMorph + 300, v: 660, ease: easeSettle },
      { t: B.dragStart - 400, v: 930, ease: easeGlide },
      { t: B.labelEpcot + 300, v: 900 },
      { t: B.zoomOutEnd, v: 720, ease: easeInOut },
    ],
    t,
  );

  const logScale = track(
    [
      { t: 0, v: Math.log(0.82) },
      { t: B.steamDrop + 400, v: Math.log(0.92), ease: linear },
      { t: B.docDrop + 400, v: Math.log(0.74), ease: easeGlide },
      { t: B.wikiDrop + 400, v: Math.log(0.72), ease: easeGlide },
      { t: B.epcotDrop + 400, v: Math.log(0.72), ease: easeGlide },
      { t: B.q1Spawn + 300, v: Math.log(0.95), ease: easeGlide },
      { t: B.chartSpawn + 400, v: Math.log(0.98), ease: easeSettle },
      { t: B.q2Spawn + 300, v: Math.log(0.9), ease: easeGlide },
      { t: B.tlMorph + 300, v: Math.log(0.7), ease: easeSettle },
      { t: B.tlMorph + 1500, v: Math.log(0.66), ease: easeInOut },
      { t: B.q3Spawn + 300, v: Math.log(0.92), ease: easeGlide },
      { t: B.mapMorph + 300, v: Math.log(0.96), ease: easeSettle },
      { t: B.dragStart - 400, v: Math.log(0.48), ease: easeGlide },
      { t: B.labelEpcot + 300, v: Math.log(0.48) },
      { t: B.zoomOutEnd, v: Math.log(0.36), ease: easeInOut },
      { t: B.end, v: Math.log(0.358), ease: linear },
    ],
    t,
  );
  const scale = Math.exp(logScale);
  const settledScale = Math.max(scale, 0.53);

  /* ------------------------------ cursors ------------------------------ */

  const maya = cursorTrack(
    [
      { t: B.mayaIn, x: 620, y: 340 },
      { t: B.steamDrop, x: POS.srcSteam.x + 260, y: POS.srcSteam.y + 200 },
      { t: B.docDrop, x: POS.srcDoc.x + 240, y: POS.srcDoc.y + 180 },
      { t: B.wikiDrop, x: POS.srcWiki.x + 260, y: POS.srcWiki.y + 200 },
      { t: B.epcotDrop, x: POS.srcEpcot.x + 260, y: POS.srcEpcot.y + 200 },
      { t: B.q1Spawn + 200, x: POS.qChart.x + 320, y: POS.qChart.y - 60 },
      { t: B.q1Click, ...composerAt(POS.qChart) },
      { t: B.q1TypeEnd + 80, ...composerAt(POS.qChart) },
      { t: B.q1Send - 30, ...sendAt(POS.qChart) },
      { t: B.chartSpawn + 500, x: POS.artChart.x + 260, y: POS.artChart.y + 220 },
      { t: B.q2Spawn + 150, ...composerAt(POS.qTl) },
      { t: B.q2TypeEnd + 80, ...composerAt(POS.qTl) },
      { t: B.q2Send - 30, ...sendAt(POS.qTl) },
      { t: B.tlMorph + 500, x: POS.artTlDrop.x + 420, y: POS.artTlDrop.y + 200 },
      { t: B.q3Spawn + 200, x: POS.qMap.x + 320, y: POS.qMap.y - 60 },
      { t: B.q3Attach - 100, ...composerAt(POS.qMap) },
      { t: B.q3TypeEnd + 80, ...composerAt(POS.qMap) },
      { t: B.q3Send - 30, ...sendAt(POS.qMap) },
      { t: B.mapMorph + 500, x: POS.artMap.x + 260, y: POS.artMap.y + 200 },
      { t: B.dragStart - 150, ...tlGrab(POS.artTlDrop) },
      { t: B.dragEnd, ...tlGrab(POS.artTl) },
      { t: B.labelEpcot + 600, x: POS.artTl.x + 700, y: POS.artTl.y - 120 },
      { t: B.zoomOutStart + 1500, x: 2150, y: 850 },
    ],
    t,
  );

  // Dev arrives with the share caption and tours the finished wall.
  const dev = cursorTrack(
    [
      { t: B.devIn, x: 3400, y: 1250 },
      { t: B.devIn + 1400, x: 2900, y: 950 },
      { t: B.zoomOutEnd - 400, x: 2620, y: 620 },
      { t: B.cursorsOut + 600, x: 2560, y: 600 },
    ],
    t,
  );

  // During the tidy-up drag, Maya's hand stays glued to the node header.
  const mayaPos =
    t >= B.dragStart && t <= B.dragEnd ? tlGrab(tlPos) : { x: maya.x, y: maya.y };

  const cursorFade = (inAt: number) =>
    seg(t, inAt, inAt + 300) * (1 - seg(t, B.cursorsOut, B.cursorsOut + 600));

  const clickWindows: {
    t: number;
    pos: { x: number; y: number };
    color: string;
  }[] = [
    { t: B.steamDrop, pos: { x: POS.srcSteam.x + 260, y: POS.srcSteam.y + 200 }, color: "#64B5F6" },
    { t: B.docDrop, pos: { x: POS.srcDoc.x + 240, y: POS.srcDoc.y + 180 }, color: "#64B5F6" },
    { t: B.wikiDrop, pos: { x: POS.srcWiki.x + 260, y: POS.srcWiki.y + 200 }, color: "#64B5F6" },
    { t: B.epcotDrop, pos: { x: POS.srcEpcot.x + 260, y: POS.srcEpcot.y + 200 }, color: "#64B5F6" },
    { t: B.q1Click, pos: composerAt(POS.qChart), color: "#64B5F6" },
    { t: B.q1Send, pos: sendAt(POS.qChart), color: "#64B5F6" },
    { t: B.q2Send, pos: sendAt(POS.qTl), color: "#64B5F6" },
    { t: B.q3Send, pos: sendAt(POS.qMap), color: "#64B5F6" },
  ];
  const ripples = clickWindows
    .filter((c) => t >= c.t && t <= c.t + RIPPLE_MS)
    .map((c) => ({ ...c.pos, p: (t - c.t) / RIPPLE_MS, color: c.color }));

  const mayaPressed =
    clickWindows.some((c) => t >= c.t && t < c.t + 120) ||
    (t >= B.dragStart && t < B.dragEnd);

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
  }): DisneyCardScene {
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

  const cards: DisneyCardScene[] = [
    questionCard({
      id: CARD_CHART_Q,
      threadId: THREAD_CHART,
      pos: POS.qChart,
      question: Q_CHART,
      answer: A_CHART,
      spawnAt: B.q1Spawn,
      typeStart: B.q1TypeStart,
      typeEnd: B.q1TypeEnd,
      askAt: B.q1Think,
      thinkEnd: B.q1StreamStart,
      streamEnd: B.q1StreamEnd,
      attachedAssetId: ASSET_DOC,
      attachAt: B.q1Attach,
      outputArtifactId: ART_CHART,
      outputAt: B.chartMorph,
    }),
    questionCard({
      id: CARD_TL_Q,
      threadId: THREAD_TL,
      pos: POS.qTl,
      question: Q_TL,
      answer: A_TL,
      spawnAt: B.q2Spawn,
      typeStart: B.q2TypeStart,
      typeEnd: B.q2TypeEnd,
      askAt: B.q2Think,
      thinkEnd: B.q2StreamStart,
      streamEnd: B.q2StreamEnd,
      outputArtifactId: ART_TL,
      outputAt: B.tlMorph,
    }),
    questionCard({
      id: CARD_MAP_Q,
      threadId: THREAD_MAP,
      pos: POS.qMap,
      question: Q_MAP,
      answer: A_MAP,
      spawnAt: B.q3Spawn,
      typeStart: B.q3TypeStart,
      typeEnd: B.q3TypeEnd,
      askAt: B.q3Think,
      thinkEnd: B.q3StreamStart,
      streamEnd: B.q3StreamEnd,
      attachedArtifactId: ART_EPCOT,
      attachAt: B.q3Attach,
      outputArtifactId: ART_MAP,
      outputAt: B.mapMorph,
    }),
  ];

  /* --------------------------- asset nodes --------------------------- */

  const assetNodes: AssetNodeScene[] = [
    {
      nodeId: NODE_DOC,
      assetId: ASSET_DOC,
      pos: POS.srcDoc,
      size: SIZES.doc,
      spawn: seg(t, B.docDrop, B.docDrop + SPAWN_MS, easeSettle),
    },
  ];

  /* -------------------------- artifact nodes ------------------------- */

  const mapPinCount = t >= B.pinDrop ? 1 : 0;

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
    {
      nodeId: ANODE_STEAM,
      artifactId: ART_STEAM,
      sourceCardId: "",
      pos: POS.srcSteam,
      size: SIZES.video,
      generating: false,
      spawn: seg(t, B.steamDrop, B.steamDrop + SPAWN_MS, easeSettle),
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
    {
      nodeId: ANODE_EPCOT,
      artifactId: ART_EPCOT,
      sourceCardId: "",
      pos: POS.srcEpcot,
      size: SIZES.video,
      generating: false,
      spawn: seg(t, B.epcotDrop, B.epcotDrop + SPAWN_MS, easeSettle),
      morphPulse: 1,
    },
    emergingArtifact({
      nodeId: ANODE_CHART,
      artifactId: ART_CHART,
      sourceCardId: CARD_CHART_Q,
      pos: POS.artChart,
      size: SIZES.chart,
      spawnAt: B.chartSpawn,
      morphAt: B.chartMorph,
      kind: "chart",
      title: "Top Grossing Disney Films during Walt's Lifetime",
    }),
    emergingArtifact({
      nodeId: ANODE_TL,
      artifactId: ART_TL,
      sourceCardId: CARD_TL_Q,
      pos: tlPos,
      size: SIZES.tl,
      spawnAt: B.tlSpawn,
      morphAt: B.tlMorph,
      kind: "timeline",
      title: "Walt Disney: 10 Most Iconic Projects & Milestones",
    }),
    emergingArtifact({
      nodeId: ANODE_MAP,
      artifactId: ART_MAP,
      sourceCardId: CARD_MAP_Q,
      pos: POS.artMap,
      size: SIZES.map,
      spawnAt: B.mapSpawn,
      morphAt: B.mapMorph,
      kind: "map",
      title: "Walt Disney World® Resort",
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
    edge("e_chart", ANODE_CHART, CARD_CHART_Q, B.chartSpawn),
    edge("e_tl", ANODE_TL, CARD_TL_Q, B.tlSpawn),
    edge("e_map", ANODE_MAP, CARD_MAP_Q, B.mapSpawn),
  ].filter((e) => e.opacity > 0);

  /* ------------------------------ labels ------------------------------ */

  const labelRevealAt: Record<number, number> = {
    0: B.steamDrop + 100,
    1: B.labelFilms,
    2: B.labelDisneyland,
    3: B.labelEpcot,
  };
  const labels: LabelScene[] = DISNEY_LABELS.map((l) => ({
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
    cursorMaya: {
      ...mayaPos,
      opacity: cursorFade(B.mayaIn),
      pressed: mayaPressed,
    },
    cursorDev: { ...dev, opacity: cursorFade(B.devIn), pressed: false },
    ripples,
    cards,
    assetNodes,
    artifactNodes,
    artifactEdges,
    labels,
    mapPinCount,
    brand,
  };
}
