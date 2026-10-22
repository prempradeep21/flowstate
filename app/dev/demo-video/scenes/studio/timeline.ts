import type { QaState } from "@/components/artifactStyles/types";
import {
  clamp01,
  cubicBezier,
  easeGlide,
  easeInOut,
  easeSettle,
  lerp,
  seg,
  streamed,
  typed,
} from "../../timeline";
import { FRAME, type StudioLayout, type StudioSceneSpec } from "./fixtures";

export const STUDIO_DURATION_MS = 15000;

/* ------------------------------------------------------------------ */
/* Beats (ms)                                                           */
/* ------------------------------------------------------------------ */

export const B = {
  // Shot 0 — tilted, shallow depth of field, a slow focus pull and pan.
  veilEnd: 650,
  focusPullEnd: 1250,
  // Shot 0 → 1 — the plane levels out, the bento snaps into the 9:16.
  flattenStart: 3300,
  flattenEnd: 5400,
  alignStart: 3550,
  alignStagger: 75,
  alignDur: 1050,
  // Shot 2 — a tilt-shift pan down the aligned grid to the composer.
  panStart: 6600,
  panEnd: 9200,
  // The question.
  typeStart: 9450,
  typeEnd: 10450,
  send: 10620,
  morphStart: 10720,
  morphEnd: 11260,
  // The answer.
  popStart: 12350,
  popEnd: 13000,
  streamStart: 12420,
  streamEnd: 13550,
  end: STUDIO_DURATION_MS,
} as const;

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

export interface Pose {
  cx: number;
  cy: number;
  scale: number;
}

const drift = (t: number, t0: number, t1: number) => clamp01((t - t0) / (t1 - t0));

/** Blend two poses the way a pinch-zoom about a fixed screen point moves. */
function blendPose(a: Pose, b: Pose, w: number): Pose {
  if (w <= 0) return a;
  if (w >= 1) return b;
  const scale = Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), w));
  const k = Math.abs(b.scale - a.scale) < 1e-6 ? w : (1 - a.scale / scale) / (1 - a.scale / b.scale);
  return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), scale };
}

const easeShot = cubicBezier(0.6, 0, 0.2, 1);
const easePop = cubicBezier(0.3, 1.45, 0.5, 1);

/** The whole grid, with margins, in the 9:16 frame. */
export function overviewScale(layout: StudioLayout): number {
  const { w, h } = layout.bounds;
  return Math.min(FRAME.w / (w + 88), FRAME.h / (h + 120));
}

function cameraAt(t: number, layout: StudioLayout, m: Measured): Pose {
  const { bounds, composer } = layout;
  const over = overviewScale(layout);

  // Shot 0: tilted close-up drifting across the top rows.
  const p0 = drift(t, 0, B.flattenEnd);
  let pose: Pose = {
    cx: lerp(430, 700, p0),
    cy: lerp(430, 620, p0),
    scale: Math.exp(lerp(Math.log(1.42), Math.log(1.5), p0)),
  };
  // Shot 1: the whole bento.
  const p1 = drift(t, B.flattenStart, B.panStart);
  const overview: Pose = {
    cx: bounds.w / 2,
    cy: bounds.h / 2,
    scale: Math.exp(lerp(Math.log(over), Math.log(over * 1.025), p1)),
  };
  pose = blendPose(pose, overview, seg(t, B.flattenStart, B.flattenEnd + 300, easeInOut));
  // Shot 2: tilt-shift pan down to the composer.
  const p2 = drift(t, B.panStart + 200, B.panEnd);
  const pan: Pose = {
    cx: bounds.w / 2,
    cy: lerp(420, composer.y - 130, easeGlide(p2)),
    scale: 1.32,
  };
  pose = blendPose(pose, pan, seg(t, B.panStart, B.panStart + 1300, easeShot));
  // Shot 3: on the composer, room below for the card to grow.
  const ask: Pose = { cx: bounds.w / 2, cy: composer.y + 150, scale: 1.5 };
  pose = blendPose(pose, ask, seg(t, B.panEnd - 400, B.typeStart + 200, easeShot));
  // Shot 4: card + pop-out framed together, then a slow push.
  const stackH = m.doneH + POP_GAP + layout.popSize.h;
  const p4 = drift(t, B.popEnd, B.end);
  const answer: Pose = {
    cx: bounds.w / 2,
    cy: composer.y + stackH / 2 + 10 - 18 * p4,
    scale: Math.exp(lerp(Math.log(1.24), Math.log(1.3), easeGlide(p4))),
  };
  pose = blendPose(pose, answer, seg(t, B.popStart - 150, B.popEnd + 350, easeShot));
  return pose;
}

/* ------------------------------------------------------------------ */
/* Scene state                                                          */
/* ------------------------------------------------------------------ */

export const POP_GAP = 28;

/** A streamed slice cut inside a `**bold**` run: close the run so no marker shows. */
function closeBold(text: string): string {
  const trimmed = text.replace(/\*{1,2}$/, "");
  return (trimmed.match(/\*\*/g)?.length ?? 0) % 2 ? `${trimmed}**` : trimmed;
}

/** DOM-measured heights of the Q&A card (world px), captured once after fonts. */
export interface Measured {
  thinkH: number;
  doneH: number;
}

export const DEFAULT_MEASURED: Measured = { thinkH: 236, doneH: 330 };

export interface TileState {
  /** World position after scatter → grid alignment. */
  x: number;
  y: number;
  rot: number;
}

export interface QaScene {
  /** Which surface is showing: the composer pill or the card. */
  qaState: QaState;
  draft: string;
  answer: string;
  /** Composer pill opacity / press scale. */
  composerOpacity: number;
  composerScale: number;
  /** Card opacity and the height its box is held at (world px). */
  cardOpacity: number;
  cardH: number;
}

export interface PopScene {
  visible: boolean;
  opacity: number;
  scale: number;
  /** Lift from its resting place (world px). */
  liftY: number;
}

export interface StudioSceneState {
  camera: Pose;
  /** 1 = fully tilted, 0 = flat. */
  tilt: number;
  /** Tilt-shift depth of field for the tilted open (asymmetric bands). */
  dofTilt: number;
  /** Miniature tilt-shift for the flat pan (symmetric bands). */
  dofFlat: number;
  introBlur: number;
  introVeil: number;
  tiles: TileState[];
  qa: QaScene;
  pop: PopScene;
}

export function studioSceneStateAt(t: number, spec: StudioSceneSpec, layout: StudioLayout, m: Measured): StudioSceneState {
  const tilt = 1 - seg(t, B.flattenStart, B.flattenEnd, easeInOut);
  const dofTilt = 1 - seg(t, B.flattenStart - 100, B.flattenEnd - 500, easeInOut);
  const dofFlat =
    seg(t, B.panStart + 100, B.panStart + 900, easeInOut) *
    (1 - seg(t, B.typeStart - 500, B.typeStart + 300, easeInOut));
  const introBlur = 14 * (1 - seg(t, 0, B.focusPullEnd, easeGlide));
  const introVeil = 1 - seg(t, 0, B.veilEnd, easeInOut);

  const tiles = layout.tiles.map((tile) => {
    const t0 = B.alignStart + tile.order * B.alignStagger;
    const a = seg(t, t0, t0 + B.alignDur, easeSettle);
    return {
      x: tile.x + tile.scatter.dx * (1 - a),
      y: tile.y + tile.scatter.dy * (1 - a),
      rot: tile.scatter.rot * (1 - a),
    };
  });

  // The Q&A turn.
  const morph = seg(t, B.morphStart, B.morphEnd, easeSettle);
  const grow = seg(t, B.popStart, B.popStart + 520, easeSettle);
  const press = seg(t, B.send, B.send + 120) * (1 - seg(t, B.send + 120, B.send + 320, easeSettle));
  const qaState: QaState = t < B.morphStart ? "typing" : t < B.popStart ? "thinking" : "done";
  const qa: QaScene = {
    qaState,
    draft: typed(spec.question, t, B.typeStart, B.typeEnd),
    answer: closeBold(streamed(spec.answer, t, B.streamStart, B.streamEnd)),
    composerOpacity: 1 - seg(t, B.morphStart, B.morphStart + 240),
    composerScale: 1 - 0.018 * press,
    cardOpacity: seg(t, B.morphStart + 110, B.morphStart + 420),
    cardH: t < B.popStart ? lerp(layout.composer.h, m.thinkH, morph) : lerp(m.thinkH, m.doneH, grow),
  };

  const popP = seg(t, B.popStart, B.popEnd, easePop);
  const pop: PopScene = {
    visible: t >= B.popStart,
    opacity: seg(t, B.popStart, B.popStart + 260),
    scale: 0.7 + 0.3 * popP,
    liftY: 34 * (1 - popP),
  };

  return {
    camera: cameraAt(t, layout, m),
    tilt,
    dofTilt,
    dofFlat,
    introBlur,
    introVeil,
    tiles,
    qa,
    pop,
  };
}
