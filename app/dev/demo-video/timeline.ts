import type { CardStatus } from "@/lib/store";
import {
  ANSWER_B,
  ANSWER_C,
  ANSWER_D,
  ANSWER_R,
  CAPTIONS,
  CARD_B,
  CARD_C,
  CARD_D,
  CARD_R,
  EXPLAIN_TEXT,
  FOLLOW_UP_B,
  POS_B,
  POS_C,
  POS_D,
  POS_R,
  QUESTION_C,
  QUESTION_D,
  QUESTION_R,
  SELECTION_PHRASE,
  type DemoCardId,
} from "./fixtures";

export const DEMO_DURATION_MS = 15000;
export const DEMO_FPS = 60;

/* ------------------------------------------------------------------ */
/* Easing / interpolation helpers — everything is a pure function of t */
/* ------------------------------------------------------------------ */

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p;
}

export type Ease = (p: number) => number;

/** Deterministic cubic-bezier sampler (framer-motion is wall-clock driven). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const sampleDX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (p: number) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let u = p;
    for (let i = 0; i < 8; i++) {
      const x = sampleX(u) - p;
      if (Math.abs(x) < 1e-5) break;
      const d = sampleDX(u);
      if (Math.abs(d) < 1e-6) break;
      u -= x / d;
    }
    return sampleY(clamp01(u));
  };
}

export const easeGlide = cubicBezier(0.45, 0.05, 0.15, 1);
export const easeSettle = cubicBezier(0.22, 1, 0.36, 1);
export const easeInOut = cubicBezier(0.65, 0, 0.35, 1);
export const linear: Ease = (p) => p;

/** Normalized progress of t through [t0, t1], eased. */
export function seg(t: number, t0: number, t1: number, ease: Ease = linear) {
  if (t1 <= t0) return t >= t1 ? 1 : 0;
  return ease(clamp01((t - t0) / (t1 - t0)));
}

/** Typewriter slice: how much of `text` is typed at time t. */
export function typed(text: string, t: number, t0: number, t1: number) {
  return text.slice(0, Math.floor(seg(t, t0, t1) * text.length));
}

/** Streaming slice with a slight ease-in so tokens ramp up naturally. */
export function streamed(text: string, t: number, t0: number, t1: number) {
  const p = seg(t, t0, t1, cubicBezier(0.3, 0, 0.7, 1));
  return text.slice(0, Math.floor(p * text.length));
}

export interface NumKeyframe {
  t: number;
  v: number;
  /** Ease used travelling INTO this keyframe from the previous one. */
  ease?: Ease;
}

export function track(frames: NumKeyframe[], t: number): number {
  if (t <= frames[0].t) return frames[0].v;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (t <= b.t) {
      return lerp(a.v, b.v, seg(t, a.t, b.t, b.ease ?? easeGlide));
    }
  }
  return frames[frames.length - 1].v;
}

/* ------------------------------------------------------------------ */
/* Scene model                                                          */
/* ------------------------------------------------------------------ */

export interface WorldRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** DOM-measured facts the timeline needs (heights, selection geometry).
 *  Captured once after fonts load; defaults keep the scene sane pre-measure. */
export interface DemoLayout {
  /** Card heights in their "done" state (R measured with follow-up footer too). */
  heights: Record<DemoCardId, number>;
  rHeightWithFooter: number;
  /** Selection phrase rects in WORLD coordinates (one per rendered line). */
  selectionRects: WorldRect[];
}

export const DEFAULT_LAYOUT: DemoLayout = {
  heights: {
    [CARD_R]: 360,
    [CARD_B]: 330,
    [CARD_C]: 300,
    [CARD_D]: 300,
  },
  rHeightWithFooter: 420,
  selectionRects: [{ x: POS_B.x + 150, y: POS_B.y + 170, w: 110, h: 20 }],
};

export interface DemoCardScene {
  id: DemoCardId;
  threadId: string;
  pos: { x: number; y: number };
  question: string;
  answer: string;
  status: CardStatus;
  quotedSelection?: string;
  /** 0..1 mount transition (scale/opacity). */
  spawn: number;
  visible: boolean;
  showFollowUp: boolean;
  followUpDraft: string;
  emptyDraft: string;
  plugsOpacity: number;
  hintSide: "left" | "right" | null;
  /** Lateral branches that exist (renders the product's collapse toggle). */
  branchSides: ("left" | "right")[];
  /** Scene-time ms since this card's turn started (drives the elapsed readout). */
  askElapsedMs: number;
}

export interface SceneConnection {
  id: string;
  from: DemoCardId;
  to: DemoCardId;
  fromSide: "top" | "bottom" | "left" | "right";
  toSide: "top" | "bottom" | "left" | "right";
  progress: number;
}

export interface SceneState {
  camera: { cx: number; cy: number; scale: number };
  cursor: { x: number; y: number; opacity: number; pressed: boolean };
  /** Expanding click rings, world coords, p in 0..1. */
  ripples: { x: number; y: number; p: number }[];
  cards: DemoCardScene[];
  connections: SceneConnection[];
  ghost: { from: DemoCardId; fromSide: "right"; to: { x: number; y: number } } | null;
  /** Progressive reveal of the selection highlight, 0..1 (null = none). */
  selection: { progress: number } | null;
  menu: { visible: boolean; opacity: number; explaining: boolean } | null;
  explain: {
    status: "loading" | "done";
    explanation: string;
    selectedText: string;
  } | null;
  caption: { text: string; opacity: number } | null;
}

/* ------------------------------------------------------------------ */
/* Beat times (ms)                                                      */
/* ------------------------------------------------------------------ */

export const BEATS = {
  cursorIn: 600,
  glideToComposer: 900,
  clickComposer: 1650,
  typeStart: 1750,
  typeEnd: 2750,
  clickSend: 2850,
  bSpawn: 2950,
  connRBStart: 2950,
  connRBEnd: 3300,
  bThinkEnd: 3400,
  bStreamEnd: 4600,
  plugsIn: 4600,
  plugPress: 5050,
  dragEnd: 5950,
  cSpawn: 5950,
  connRCEnd: 6250,
  cTypeStart: 6250,
  cTypeEnd: 6900,
  cClickSend: 7000,
  cThinkStart: 7050,
  cThinkEnd: 7450,
  cStreamEnd: 8300,
  selMoveStart: 8300,
  selPress: 8950,
  selRelease: 9650,
  menuIn: 9650,
  quickExplainClick: 10250,
  explainLoadEnd: 10650,
  explainStreamEnd: 11500,
  askQuestionClick: 11750,
  dSpawn: 12150,
  connBDEnd: 12500,
  dTypeStart: 12300,
  dTypeEnd: 12750,
  dAsk: 12800,
  dThinkEnd: 13150,
  dStreamEnd: 13800,
  zoomOutStart: 13200,
  zoomOutEnd: 14600,
  end: 15000,
} as const;

/** Cursor click moments (world position resolved at scene build). */
const CLICK_TIMES = [
  BEATS.clickComposer,
  BEATS.clickSend,
  BEATS.cClickSend,
  BEATS.quickExplainClick,
  BEATS.askQuestionClick,
];

const RIPPLE_MS = 450;

/* ------------------------------------------------------------------ */
/* The storyboard                                                       */
/* ------------------------------------------------------------------ */

export function sceneStateAt(t: number, layout: DemoLayout): SceneState {
  const hR = layout.heights[CARD_R];
  const hRf = layout.rHeightWithFooter;
  const selRects = layout.selectionRects;
  const selFirst = selRects[0];
  const selLast = selRects[selRects.length - 1];
  const selBounds: WorldRect = {
    x: Math.min(...selRects.map((r) => r.x)),
    y: Math.min(...selRects.map((r) => r.y)),
    w:
      Math.max(...selRects.map((r) => r.x + r.w)) -
      Math.min(...selRects.map((r) => r.x)),
    h:
      Math.max(...selRects.map((r) => r.y + r.h)) -
      Math.min(...selRects.map((r) => r.y)),
  };
  const selCenter = {
    x: selBounds.x + selBounds.w / 2,
    y: selBounds.y + selBounds.h / 2,
  };

  /* -------------------------- camera -------------------------- */
  // Key world anchors
  const rCenter = { x: POS_R.x + 210, y: POS_R.y + hR / 2 };
  const composerR = { x: POS_R.x + 190, y: POS_R.y + hRf - 30 };
  const sendR = { x: POS_R.x + 388, y: POS_R.y + hRf - 30 };
  const plugR = { x: POS_R.x + 420, y: POS_R.y + hR / 2 };
  const dragTo = { x: POS_R.x + 800, y: POS_R.y + hR / 2 + 50 };
  const composerC = { x: POS_C.x + 190, y: POS_C.y + 40 };
  const sendC = { x: POS_C.x + 388, y: POS_C.y + 40 };

  const cx = track(
    [
      { t: 0, v: rCenter.x },
      { t: BEATS.glideToComposer, v: rCenter.x },
      { t: BEATS.clickComposer, v: composerR.x + 20, ease: easeSettle },
      { t: BEATS.bSpawn, v: rCenter.x, ease: easeGlide },
      { t: BEATS.bStreamEnd, v: POS_B.x + 210, ease: easeGlide },
      { t: BEATS.plugPress, v: rCenter.x + 160, ease: easeGlide },
      { t: BEATS.dragEnd, v: rCenter.x + 420, ease: easeGlide },
      { t: BEATS.connRCEnd + 200, v: (rCenter.x + POS_C.x + 210) / 2, ease: easeSettle },
      { t: BEATS.cStreamEnd, v: (rCenter.x + POS_C.x + 210) / 2 },
      { t: BEATS.selPress, v: selCenter.x + 40, ease: easeSettle },
      { t: BEATS.quickExplainClick + 350, v: selCenter.x + 170, ease: easeGlide },
      { t: BEATS.askQuestionClick, v: selCenter.x + 170 },
      { t: BEATS.connBDEnd + 300, v: (POS_D.x + 210 + POS_B.x + 210) / 2, ease: easeGlide },
      { t: BEATS.zoomOutStart, v: (POS_D.x + 210 + POS_B.x + 210) / 2 },
      { t: BEATS.zoomOutEnd, v: 210, ease: easeInOut },
    ],
    t,
  );

  const cy = track(
    [
      { t: 0, v: rCenter.y - 20 },
      { t: BEATS.glideToComposer, v: rCenter.y - 20 },
      { t: BEATS.clickComposer, v: composerR.y - 100, ease: easeSettle },
      { t: BEATS.bSpawn, v: POS_B.y - 40, ease: easeGlide },
      { t: BEATS.bStreamEnd, v: POS_B.y + 130, ease: easeGlide },
      { t: BEATS.plugPress, v: rCenter.y + 60, ease: easeGlide },
      { t: BEATS.dragEnd, v: rCenter.y + 60 },
      { t: BEATS.connRCEnd + 200, v: rCenter.y + 130, ease: easeSettle },
      { t: BEATS.cStreamEnd, v: rCenter.y + 130 },
      { t: BEATS.selPress, v: selCenter.y + 40, ease: easeSettle },
      { t: BEATS.quickExplainClick + 350, v: selCenter.y + 10, ease: easeGlide },
      { t: BEATS.connBDEnd + 300, v: POS_D.y + 110, ease: easeGlide },
      { t: BEATS.zoomOutStart, v: POS_D.y + 110 },
      { t: BEATS.zoomOutEnd, v: 380, ease: easeInOut },
    ],
    t,
  );

  // Scale interpolated in log space so zooms feel uniform.
  const logScale = track(
    [
      { t: 0, v: Math.log(0.7) },
      { t: BEATS.glideToComposer, v: Math.log(0.78), ease: linear },
      { t: BEATS.clickComposer, v: Math.log(1.05), ease: easeSettle },
      { t: BEATS.bSpawn, v: Math.log(1.0), ease: easeGlide },
      { t: BEATS.bStreamEnd, v: Math.log(0.98) },
      { t: BEATS.plugPress, v: Math.log(0.9), ease: easeGlide },
      { t: BEATS.connRCEnd + 200, v: Math.log(0.82), ease: easeSettle },
      { t: BEATS.cStreamEnd, v: Math.log(0.82) },
      { t: BEATS.selPress, v: Math.log(1.3), ease: easeSettle },
      { t: BEATS.quickExplainClick + 350, v: Math.log(1.18), ease: easeGlide },
      { t: BEATS.connBDEnd + 300, v: Math.log(0.9), ease: easeGlide },
      { t: BEATS.zoomOutStart, v: Math.log(0.9) },
      { t: BEATS.zoomOutEnd, v: Math.log(0.55), ease: easeInOut },
      { t: BEATS.end, v: Math.log(0.548), ease: linear },
    ],
    t,
  );
  const scale = Math.exp(logScale);

  /* -------------------------- cursor -------------------------- */
  const selStart = { x: selFirst.x - 6, y: selFirst.y + selFirst.h / 2 };
  const selEnd = { x: selLast.x + selLast.w + 4, y: selLast.y + selLast.h / 2 };
  // Selection-menu buttons live in screen space; approximate their world
  // position from the menu anchor (top-center of selection) and the beat's
  // camera scale. Offsets tuned against the rendered pill (~336px wide).
  const menuScale = 1.3;
  const menuAnchor = { x: selBounds.x + selBounds.w / 2, y: selBounds.y - 8 };
  const quickExplainBtn = {
    x: menuAnchor.x - 112 / menuScale,
    y: menuAnchor.y - 22 / menuScale,
  };
  const askQuestionBtn = {
    x: menuAnchor.x + 10 / menuScale,
    y: menuAnchor.y - 22 / menuScale,
  };

  const cursorX = track(
    [
      { t: BEATS.cursorIn, v: POS_R.x + 520 },
      { t: BEATS.glideToComposer + 100, v: POS_R.x + 520 },
      { t: BEATS.clickComposer - 50, v: composerR.x, ease: easeSettle },
      { t: BEATS.typeEnd, v: composerR.x },
      { t: BEATS.clickSend - 20, v: sendR.x, ease: easeSettle },
      { t: BEATS.bSpawn + 300, v: sendR.x + 60, ease: easeGlide },
      { t: BEATS.bStreamEnd - 200, v: POS_B.x + 480, ease: easeGlide },
      { t: BEATS.plugPress - 80, v: plugR.x + 2, ease: easeSettle },
      { t: BEATS.dragEnd, v: dragTo.x, ease: easeGlide },
      { t: BEATS.cTypeStart - 50, v: composerC.x, ease: easeSettle },
      { t: BEATS.cTypeEnd, v: composerC.x },
      { t: BEATS.cClickSend - 20, v: sendC.x, ease: easeSettle },
      { t: BEATS.cStreamEnd - 300, v: POS_C.x + 470, ease: easeGlide },
      { t: BEATS.selPress - 60, v: selStart.x, ease: easeSettle },
      { t: BEATS.selRelease, v: selEnd.x, ease: easeInOut },
      { t: BEATS.quickExplainClick - 80, v: quickExplainBtn.x, ease: easeSettle },
      { t: BEATS.explainStreamEnd, v: quickExplainBtn.x },
      { t: BEATS.askQuestionClick - 60, v: askQuestionBtn.x, ease: easeSettle },
      { t: BEATS.dSpawn + 700, v: POS_D.x + 470, ease: easeGlide },
    ],
    t,
  );

  const cursorY = track(
    [
      { t: BEATS.cursorIn, v: POS_R.y + 260 },
      { t: BEATS.glideToComposer + 100, v: POS_R.y + 260 },
      { t: BEATS.clickComposer - 50, v: composerR.y, ease: easeSettle },
      { t: BEATS.typeEnd, v: composerR.y },
      { t: BEATS.clickSend - 20, v: sendR.y, ease: easeSettle },
      { t: BEATS.bSpawn + 300, v: POS_B.y + 60, ease: easeGlide },
      { t: BEATS.bStreamEnd - 200, v: POS_B.y + 140, ease: easeGlide },
      { t: BEATS.plugPress - 80, v: plugR.y, ease: easeSettle },
      { t: BEATS.dragEnd, v: dragTo.y, ease: easeGlide },
      { t: BEATS.cTypeStart - 50, v: composerC.y, ease: easeSettle },
      { t: BEATS.cTypeEnd, v: composerC.y },
      { t: BEATS.cClickSend - 20, v: sendC.y, ease: easeSettle },
      { t: BEATS.cStreamEnd - 300, v: POS_C.y + 200, ease: easeGlide },
      { t: BEATS.selPress - 60, v: selStart.y, ease: easeSettle },
      { t: BEATS.selRelease, v: selEnd.y, ease: easeInOut },
      { t: BEATS.quickExplainClick - 80, v: quickExplainBtn.y, ease: easeSettle },
      { t: BEATS.explainStreamEnd, v: quickExplainBtn.y },
      { t: BEATS.askQuestionClick - 60, v: askQuestionBtn.y, ease: easeSettle },
      { t: BEATS.dSpawn + 700, v: POS_D.y + 80, ease: easeGlide },
    ],
    t,
  );

  const cursorOpacity =
    seg(t, BEATS.cursorIn, BEATS.cursorIn + 300) *
    (1 - seg(t, BEATS.zoomOutStart, BEATS.zoomOutStart + 500));

  const pressed =
    (t >= BEATS.plugPress && t < BEATS.dragEnd) ||
    (t >= BEATS.selPress && t < BEATS.selRelease) ||
    CLICK_TIMES.some((c) => t >= c && t < c + 120);

  const cursorWorld = { x: cursorX, y: cursorY };

  const ripplePoints: Record<number, { x: number; y: number }> = {
    [BEATS.clickComposer]: composerR,
    [BEATS.clickSend]: sendR,
    [BEATS.cClickSend]: sendC,
    [BEATS.quickExplainClick]: quickExplainBtn,
    [BEATS.askQuestionClick]: askQuestionBtn,
  };
  const ripples = CLICK_TIMES.filter(
    (c) => t >= c && t <= c + RIPPLE_MS,
  ).map((c) => ({
    x: ripplePoints[c].x,
    y: ripplePoints[c].y,
    p: (t - c) / RIPPLE_MS,
  }));

  /* -------------------------- cards -------------------------- */

  const bExists = t >= BEATS.bSpawn;
  const cExists = t >= BEATS.cSpawn;
  const dExists = t >= BEATS.dSpawn;

  const cardR: DemoCardScene = {
    id: CARD_R,
    threadId: "demo_thread_main",
    pos: POS_R,
    question: QUESTION_R,
    answer: ANSWER_R,
    status: "done",
    spawn: 1,
    visible: true,
    showFollowUp: !bExists,
    followUpDraft: bExists ? "" : typed(FOLLOW_UP_B, t, BEATS.typeStart, BEATS.typeEnd),
    emptyDraft: "",
    plugsOpacity: seg(t, BEATS.plugsIn, BEATS.plugsIn + 350),
    hintSide: t >= BEATS.plugsIn && t < BEATS.plugPress ? "right" : null,
    branchSides: cExists ? ["right"] : [],
    askElapsedMs: 0,
  };

  const bStatus: CardStatus =
    t < BEATS.bThinkEnd ? "thinking" : t < BEATS.bStreamEnd ? "streaming" : "done";
  const cardB: DemoCardScene = {
    id: CARD_B,
    threadId: "demo_thread_main",
    pos: POS_B,
    question: FOLLOW_UP_B,
    answer:
      t < BEATS.bThinkEnd
        ? ""
        : streamed(ANSWER_B, t, BEATS.bThinkEnd, BEATS.bStreamEnd),
    status: bStatus,
    spawn: seg(t, BEATS.bSpawn, BEATS.bSpawn + 320, easeSettle),
    visible: bExists,
    showFollowUp: bStatus === "done" && !dExists,
    followUpDraft: "",
    emptyDraft: "",
    plugsOpacity: dExists ? 1 : 0,
    hintSide: null,
    branchSides: dExists ? ["left"] : [],
    askElapsedMs: Math.max(0, t - BEATS.bSpawn),
  };

  const cAsked = t >= BEATS.cThinkStart;
  const cStatus: CardStatus = !cAsked
    ? "empty"
    : t < BEATS.cThinkEnd
      ? "thinking"
      : t < BEATS.cStreamEnd
        ? "streaming"
        : "done";
  const cardC: DemoCardScene = {
    id: CARD_C,
    threadId: "demo_thread_branch",
    pos: POS_C,
    question: cAsked ? QUESTION_C : "",
    answer:
      t < BEATS.cThinkEnd
        ? ""
        : streamed(ANSWER_C, t, BEATS.cThinkEnd, BEATS.cStreamEnd),
    status: cStatus,
    spawn: seg(t, BEATS.cSpawn, BEATS.cSpawn + 320, easeSettle),
    visible: cExists,
    showFollowUp: cStatus === "done",
    followUpDraft: "",
    emptyDraft: cAsked ? "" : typed(QUESTION_C, t, BEATS.cTypeStart, BEATS.cTypeEnd),
    plugsOpacity: 0,
    hintSide: null,
    branchSides: [],
    askElapsedMs: Math.max(0, t - BEATS.cThinkStart),
  };

  const dAsked = t >= BEATS.dAsk;
  const dStatus: CardStatus = !dAsked
    ? "empty"
    : t < BEATS.dThinkEnd
      ? "thinking"
      : t < BEATS.dStreamEnd
        ? "streaming"
        : "done";
  const cardD: DemoCardScene = {
    id: CARD_D,
    threadId: "demo_thread_selection",
    pos: POS_D,
    question: dAsked ? QUESTION_D : "",
    answer:
      t < BEATS.dThinkEnd
        ? ""
        : streamed(ANSWER_D, t, BEATS.dThinkEnd, BEATS.dStreamEnd),
    status: dStatus,
    quotedSelection: SELECTION_PHRASE,
    spawn: seg(t, BEATS.dSpawn, BEATS.dSpawn + 320, easeSettle),
    visible: dExists,
    showFollowUp: dStatus === "done",
    followUpDraft: "",
    emptyDraft: dAsked
      ? ""
      : typed(QUESTION_D, t, BEATS.dTypeStart, BEATS.dTypeEnd),
    plugsOpacity: 0,
    hintSide: null,
    branchSides: [],
    askElapsedMs: Math.max(0, t - BEATS.dAsk),
  };

  /* -------------------------- connections / ghost -------------------------- */

  const connections: SceneConnection[] = [];
  if (bExists) {
    connections.push({
      id: "conn_rb",
      from: CARD_R,
      to: CARD_B,
      fromSide: "bottom",
      toSide: "top",
      progress: seg(t, BEATS.connRBStart, BEATS.connRBEnd, easeInOut),
    });
  }
  if (cExists) {
    connections.push({
      id: "conn_rc",
      from: CARD_R,
      to: CARD_C,
      fromSide: "right",
      toSide: "left",
      progress: seg(t, BEATS.cSpawn, BEATS.connRCEnd, easeInOut),
    });
  }
  if (dExists) {
    connections.push({
      id: "conn_bd",
      from: CARD_B,
      to: CARD_D,
      fromSide: "left",
      toSide: "right",
      progress: seg(t, BEATS.dSpawn, BEATS.connBDEnd, easeInOut),
    });
  }

  const ghost: SceneState["ghost"] =
    t >= BEATS.plugPress && t < BEATS.dragEnd
      ? {
          from: CARD_R,
          fromSide: "right",
          to: cursorWorld,
        }
      : null;

  /* -------------------------- selection / menu / explain -------------------------- */

  const selection =
    t >= BEATS.selPress
      ? { progress: seg(t, BEATS.selPress, BEATS.selRelease, easeInOut) }
      : null;

  const menuVisible = t >= BEATS.menuIn && t < BEATS.askQuestionClick + 150;
  const menu = menuVisible
    ? {
        visible: true,
        opacity: seg(t, BEATS.menuIn, BEATS.menuIn + 200),
        explaining: t >= BEATS.quickExplainClick && t < BEATS.explainLoadEnd,
      }
    : null;

  const explain =
    t >= BEATS.quickExplainClick + 150 && t < BEATS.askQuestionClick + 150
      ? {
          status:
            t < BEATS.explainStreamEnd ? ("loading" as const) : ("done" as const),
          explanation:
            t < BEATS.explainLoadEnd
              ? ""
              : streamed(EXPLAIN_TEXT, t, BEATS.explainLoadEnd, BEATS.explainStreamEnd),
          selectedText: SELECTION_PHRASE,
        }
      : null;

  /* -------------------------- caption -------------------------- */

  let caption: SceneState["caption"] = null;
  for (const c of CAPTIONS) {
    if (t >= c.t0 && t <= c.t1) {
      const fadeIn = seg(t, c.t0, c.t0 + 250);
      const fadeOut = 1 - seg(t, c.t1 - 250, c.t1);
      caption = { text: c.text, opacity: Math.min(fadeIn, fadeOut) };
      break;
    }
  }
  // Keep the closing caption up through the end frame.
  const last = CAPTIONS[CAPTIONS.length - 1];
  if (t > last.t0 && t >= last.t1 - 1) {
    caption = { text: last.text, opacity: 1 };
  }

  return {
    camera: { cx, cy, scale },
    cursor: { ...cursorWorld, opacity: cursorOpacity, pressed },
    ripples,
    cards: [cardR, cardB, cardC, cardD],
    connections,
    ghost,
    selection,
    menu,
    explain,
    caption,
  };
}
