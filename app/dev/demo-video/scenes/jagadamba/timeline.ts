import type { CardStatus } from "@/lib/store";
import {
  clamp01,
  cubicBezier,
  easeGlide,
  easeInOut,
  easeSettle,
  lerp,
  linear,
  seg,
  track,
  typed,
} from "../../timeline";
import {
  BRANCH_ANSWER,
  BRANCH_POS,
  BRANCH_QUESTION,
  DROP_POINT,
  SOURCE_PLUG,
  SOURCE_RECT,
} from "./fixtures";

export const JAG_DURATION_MS = 15000;

/* ------------------------------------------------------------------ */
/* Beats (ms)                                                           */
/* ------------------------------------------------------------------ */

export const B = {
  // Shot 0 — tilted, shallow depth of field, slow pan across Chapters 1–2.
  focusPullEnd: 1100,
  // Shot 0 → 1 — the canvas levels out and pulls back to the whole wall.
  flattenStart: 3700,
  flattenEnd: 5700,
  toOverviewEnd: 6000,
  chromeIn: 5000,
  // Shot 1 → 2 — push into Chapters 5–6.
  toChaptersStart: 6600,
  toChaptersEnd: 8100,
  // Shot 2 → 3 — push into the quote the branch is pulled from.
  toQuoteStart: 8550,
  toQuoteEnd: 9950,
  // The branch.
  cursorIn: 9650,
  hover: 10150,
  atPlug: 10500,
  press: 10600,
  drop: 11250,
  typeStart: 11600,
  typeEnd: 12500,
  send: 12650,
  thinkStart: 12700,
  done: 13450,
} as const;

const RIPPLE_MS = 450;
const SPAWN_MS = 320;

/* ------------------------------------------------------------------ */
/* Camera — four drifting shots blended by eased cross-weights.         */
/* Each shot keeps a slow drift of its own so the frame is never dead,   */
/* and a blend weight that starts and ends at zero slope keeps velocity  */
/* continuous across every hand-off.                                    */
/* ------------------------------------------------------------------ */

interface Pose {
  cx: number;
  cy: number;
  scale: number;
}

const drift = (t: number, t0: number, t1: number) =>
  clamp01((t - t0) / (t1 - t0));

function shotTilt(t: number): Pose {
  const p = drift(t, 0, 6000);
  return {
    cx: lerp(1980, 3380, p),
    cy: lerp(1960, 1690, p),
    scale: Math.exp(lerp(Math.log(0.6), Math.log(0.68), p)),
  };
}

function shotOverview(t: number): Pose {
  const p = drift(t, 3700, 8100);
  return {
    cx: lerp(6640, 6740, p),
    cy: 1470,
    scale: Math.exp(lerp(Math.log(0.128), Math.log(0.139), p)),
  };
}

function shotChapters(t: number): Pose {
  const p = drift(t, 6600, 9950);
  return {
    cx: lerp(11430, 11640, p),
    cy: lerp(1300, 1330, p),
    scale: Math.exp(lerp(Math.log(0.4), Math.log(0.44), p)),
  };
}

function shotQuote(t: number): Pose {
  const p = drift(t, 8550, JAG_DURATION_MS);
  return {
    cx: lerp(13290, 13440, easeGlide(p)),
    cy: 1530,
    scale: 1.1,
  };
}

/** Blend two poses the way a pinch-zoom about a fixed screen point moves:
 *  scale in log space, centre weighted by how far the zoom has travelled —
 *  so content never whips across the frame at the high-scale end. */
function blendPose(a: Pose, b: Pose, w: number): Pose {
  if (w <= 0) return a;
  if (w >= 1) return b;
  const scale = Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), w));
  const k =
    Math.abs(b.scale - a.scale) < 1e-6
      ? w
      : (1 - a.scale / scale) / (1 - a.scale / b.scale);
  return {
    cx: lerp(a.cx, b.cx, k),
    cy: lerp(a.cy, b.cy, k),
    scale,
  };
}

const easeShot = cubicBezier(0.6, 0, 0.2, 1);

function cameraAt(t: number): Pose {
  let pose = shotTilt(t);
  pose = blendPose(
    pose,
    shotOverview(t),
    seg(t, B.flattenStart, B.toOverviewEnd, easeInOut),
  );
  pose = blendPose(
    pose,
    shotChapters(t),
    seg(t, B.toChaptersStart, B.toChaptersEnd, easeShot),
  );
  pose = blendPose(
    pose,
    shotQuote(t),
    seg(t, B.toQuoteStart, B.toQuoteEnd, easeShot),
  );
  return pose;
}

/* ------------------------------------------------------------------ */
/* Scene state                                                          */
/* ------------------------------------------------------------------ */

export interface JagBranchScene {
  visible: boolean;
  /** Drop-in: opacity 0→1, lift −16→0, scale 1→0.96→1.02→1 (dropVariants). */
  opacity: number;
  liftY: number;
  scale: number;
  status: CardStatus;
  draft: string;
  question: string;
  answer: string;
  /** Answer + follow-up fade once the turn lands. */
  reveal: number;
  askElapsedMs: number;
  /** Artifact → card plug connection exists (after the drop). */
  connected: boolean;
}

export interface JagSceneState {
  camera: Pose;
  settledScale: number;
  /** 1 = fully tilted, 0 = flat. */
  tilt: number;
  /** Tilt-shift depth of field strength, 0..1. */
  dof: number;
  /** Whole-frame defocus (px) for the opening focus pull. */
  introBlur: number;
  /** Background veil over the canvas, 1 → 0 at the open. */
  introVeil: number;
  chromeOpacity: number;
  gridOpacity: number;
  cursor: { x: number; y: number; opacity: number; pressed: boolean };
  ripples: { x: number; y: number; p: number }[];
  /** Hover chrome (plugs) on the source artifact. */
  plugOpacity: number;
  /** Pointer world position while the plug is being dragged. */
  drag: { x: number; y: number } | null;
  branch: JagBranchScene;
}

/** Composer text field / send button inside the empty branch card (world).
 *  The attachment pill sits above the textarea, pushing both down. */
const COMPOSER_AT = { x: BRANCH_POS.x + 150, y: BRANCH_POS.y + 96 };
const SEND_AT = { x: BRANCH_POS.x + 384, y: BRANCH_POS.y + 96 };
const HOVER_AT = {
  x: SOURCE_RECT.x + SOURCE_RECT.w * 0.72,
  y: SOURCE_RECT.y + SOURCE_RECT.h * 0.6,
};
const ENTER_AT = { x: 13560, y: 1990 };
const REST_AT = { x: BRANCH_POS.x + 330, y: BRANCH_POS.y + 430 };

const easeDrop = cubicBezier(0.16, 1, 0.3, 1);

export function jagSceneStateAt(t: number): JagSceneState {
  const camera = cameraAt(t);

  const tilt = 1 - seg(t, B.flattenStart, B.flattenEnd, easeInOut);
  const focus = seg(t, 0, B.focusPullEnd, easeSettle);

  /* ---- Cursor ---------------------------------------------------- */
  const cx = track(
    [
      { t: B.cursorIn, v: ENTER_AT.x },
      { t: B.hover, v: HOVER_AT.x, ease: easeSettle },
      { t: B.atPlug, v: SOURCE_PLUG.x, ease: easeSettle },
      { t: B.press, v: SOURCE_PLUG.x },
      { t: B.drop, v: DROP_POINT.x, ease: easeGlide },
      { t: B.drop + 120, v: DROP_POINT.x },
      { t: B.typeStart - 60, v: COMPOSER_AT.x, ease: easeSettle },
      { t: B.typeEnd - 250, v: COMPOSER_AT.x },
      { t: B.send - 60, v: SEND_AT.x, ease: easeSettle },
      { t: B.send + 250, v: SEND_AT.x },
      { t: B.send + 950, v: REST_AT.x, ease: easeGlide },
    ],
    t,
  );
  const cy = track(
    [
      { t: B.cursorIn, v: ENTER_AT.y },
      { t: B.hover, v: HOVER_AT.y, ease: easeSettle },
      { t: B.atPlug, v: SOURCE_PLUG.y, ease: easeSettle },
      { t: B.press, v: SOURCE_PLUG.y },
      { t: B.drop, v: DROP_POINT.y, ease: easeGlide },
      { t: B.drop + 120, v: DROP_POINT.y },
      { t: B.typeStart - 60, v: COMPOSER_AT.y, ease: easeSettle },
      { t: B.typeEnd - 250, v: COMPOSER_AT.y },
      { t: B.send - 60, v: SEND_AT.y, ease: easeSettle },
      { t: B.send + 250, v: SEND_AT.y },
      { t: B.send + 950, v: REST_AT.y, ease: easeGlide },
    ],
    t,
  );
  const cursorOpacity =
    seg(t, B.cursorIn, B.cursorIn + 250) *
    (1 - seg(t, B.send + 700, B.send + 1000));
  const dragging = t >= B.press && t < B.drop;
  const pressed =
    dragging || (t >= B.send && t < B.send + 120);

  const ripples =
    t >= B.send && t < B.send + RIPPLE_MS
      ? [{ x: SEND_AT.x, y: SEND_AT.y, p: (t - B.send) / RIPPLE_MS }]
      : [];

  /* ---- Source artifact hover chrome ------------------------------- */
  const plugOpacity =
    seg(t, B.hover - 60, B.hover + 140) *
    (1 - seg(t, B.press + 150, B.press + 600));

  /* ---- Branch card ------------------------------------------------ */
  const sinceDrop = t - B.drop;
  const visible = sinceDrop >= 0;
  const scaleP = clamp01(sinceDrop / SPAWN_MS);
  const dropScale =
    scaleP < 0.35
      ? lerp(1, 0.96, scaleP / 0.35)
      : scaleP < 0.7
        ? lerp(0.96, 1.02, (scaleP - 0.35) / 0.35)
        : lerp(1.02, 1, (scaleP - 0.7) / 0.3);

  const status: CardStatus =
    t < B.thinkStart ? "empty" : t < B.done ? "thinking" : "done";

  const branch: JagBranchScene = {
    visible,
    opacity: seg(t, B.drop, B.drop + 200, linear),
    liftY: -16 * (1 - seg(t, B.drop, B.drop + SPAWN_MS, easeDrop)),
    scale: dropScale,
    status,
    draft:
      status === "empty"
        ? typed(BRANCH_QUESTION, t, B.typeStart, B.typeEnd)
        : "",
    question: status === "empty" ? "" : BRANCH_QUESTION,
    answer: status === "done" ? BRANCH_ANSWER : "",
    reveal: seg(t, B.done, B.done + 380, easeSettle),
    askElapsedMs: Math.max(0, t - B.thinkStart),
    connected: visible,
  };

  return {
    camera,
    settledScale: camera.scale,
    tilt,
    dof: tilt,
    introBlur: 18 * (1 - focus),
    // No veil: frame 0 is the poster frame, so it opens on the canvas itself
    // (defocused), never on a blank field.
    introVeil: 0,
    chromeOpacity: seg(t, B.chromeIn, B.chromeIn + 700, easeInOut),
    gridOpacity: 1 - tilt,
    cursor: { x: cx, y: cy, opacity: cursorOpacity, pressed },
    ripples,
    plugOpacity,
    drag: dragging ? { x: cx, y: cy } : null,
    branch,
  };
}
