import type { QaState } from "@/components/artifactStyles/types";
import { clamp01, cubicBezier, easeGlide, easeInOut, easeSettle, lerp, seg, streamed, typed } from "../../timeline";
import { ANSWER, FRAME, POP_GAP, QUESTION, type ShowcaseLayout, type WorldRect } from "./fixtures";

export const SHOWCASE_DURATION_MS = 30000;

/* ------------------------------------------------------------------ */
/* Beats (ms)                                                           */
/* ------------------------------------------------------------------ */

export const B = {
  // Shot A — tilted, shallow depth of field: a slow focus pull, then a pan
  // along the top of the wall while the first charts draw themselves.
  veilEnd: 600,
  focusPullEnd: 1300,
  // Shot A → B — the plane levels out and the whole wall comes into frame.
  flattenStart: 4200,
  flattenEnd: 6400,
  // Shot B — the wall, in miniature. The rest of the skeletons fill in a wave.
  overviewHoldEnd: 8600,
  waveStart: 6300,
  // Shot C — flat push into the ledger; its rows arrive.
  ledgerIn: 8600,
  ledgerOut: 13000,
  // Shot D — pan right to the empty card; the question, the thinking, the answer.
  askIn: 13000,
  typeStart: 13900,
  typeEnd: 14900,
  send: 15080,
  morphStart: 15180,
  morphEnd: 15720,
  popStart: 16760,
  popEnd: 17400,
  streamStart: 16840,
  streamEnd: 18200,
  // Shot E — the second tilt, along the foot of the wall: the timeline and
  // the mechanism build themselves as the camera glides past.
  tiltInStart: 19000,
  tiltInEnd: 20700,
  footPanEnd: 25200,
  // Shot F — level out and pull back to the whole wall.
  flatten2Start: 25000,
  flatten2End: 27000,
  end: SHOWCASE_DURATION_MS,
} as const;

/** When each filling card's content arrives (keyed by cast key). */
export const FILLS: Record<string, { t0: number; t1: number }> = {
  // Shot A, in view of the tilted pan.
  "guinness-campaign/guinness-art-channel-split": { t0: 900, t1: 2000 },
  "airbnb/abnb-art-chart-revenue": { t0: 1700, t1: 3000 },
  "airbnb/abnb-art-chart-nights": { t0: 2500, t1: 3800 },
  // Shot B, the wave across the wall.
  "huberman-neuroplasticity|Neuroplasticity": { t0: 6300, t1: 7500 },
  "yc-interview|Great things start small": { t0: 6500, t1: 7700 },
  "emergent/emg-art-gauge-deploy": { t0: 6600, t1: 7800 },
  "huberman-neuroplasticity|Protocol for opening a plasticity window": { t0: 6700, t1: 8000 },
  "design-tools|Photoshop — first mass pro tool": { t0: 6900, t1: 8100 },
  "the-long-noon/longnoon-art-colony-ui": { t0: 7000, t1: 8300 },
  "guinness-campaign/guinness-art-flight-plan": { t0: 7200, t1: 8300 },
  // Shot C, close on the ledger.
  "airbnb/abnb-art-table-funding-ladder": { t0: 9300, t1: 11300 },
  // Shot E, along the foot.
  "emergent/emg-art-timeline-emergent": { t0: 20500, t1: 23000 },
  "allari-naresh-raw-talks|How a laugh gets into a scene": { t0: 22200, t1: 24300 },
};

/** How long the skeleton takes to give way to the body once content starts. */
export const FILL_FADE_MS = 260;

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

function union(rects: WorldRect[]): WorldRect {
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** The pose that frames `rects` with `pad` world px of air, no closer than `maxScale`. */
function fitPose(rects: WorldRect[], pad: number, maxScale: number): Pose {
  const r = union(rects);
  const scale = Math.min(maxScale, FRAME.w / (r.w + pad * 2), FRAME.h / (r.h + pad * 2));
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, scale };
}

const tileOf = (layout: ShowcaseLayout, key: string): WorldRect => {
  const tile = layout.tiles.find((t) => t.key === key);
  if (!tile) throw new Error(`showcase camera: no tile "${key}"`);
  return tile;
};

/** The whole wall, with margins, in the 16:9 frame. */
export function overviewPose(layout: ShowcaseLayout): Pose {
  return fitPose([layout.bounds], 70, 1);
}

function cameraAt(t: number, layout: ShowcaseLayout, m: Measured): Pose {
  const { composer } = layout;
  const pie = tileOf(layout, "guinness-campaign/guinness-art-channel-split");
  const bar = tileOf(layout, "airbnb/abnb-art-chart-revenue");
  const stat = tileOf(layout, "lightcone-emergent|What the software used to cost");
  const nights = tileOf(layout, "airbnb/abnb-art-chart-nights");
  const ledger = tileOf(layout, "airbnb/abnb-art-table-funding-ladder");
  const claim = tileOf(layout, "rana-daggubati-infocus|Will AI take over creativity?");
  const timeline = tileOf(layout, "emergent/emg-art-timeline-emergent");
  const mechanism = tileOf(layout, "allari-naresh-raw-talks|How a laugh gets into a scene");
  const over = overviewPose(layout);

  // Shot A: tilted close-up drifting from the stat and pie across to the bar
  // and area charts.
  const a0 = fitPose([stat, pie], 60, 1.5);
  const a1 = fitPose([bar, nights], 60, 1.5);
  const pA = drift(t, 0, B.flattenEnd);
  let pose: Pose = {
    cx: lerp(a0.cx - 40, a1.cx + 60, pA),
    cy: lerp(a0.cy + 190, a1.cy + 40, pA),
    scale: Math.exp(lerp(Math.log(Math.min(a0.scale, 1.32)), Math.log(Math.min(a1.scale, 1.4)), pA)),
  };

  // Shot B: the whole wall, drifting in a touch.
  const pB = drift(t, B.flattenStart, B.overviewHoldEnd);
  const overview: Pose = { cx: over.cx, cy: over.cy, scale: Math.exp(lerp(Math.log(over.scale), Math.log(over.scale * 1.03), pB)) };
  pose = blendPose(pose, overview, seg(t, B.flattenStart, B.flattenEnd + 300, easeInOut));

  // Shot C: the ledger and the claim beneath it, with a slow push.
  const c = fitPose([ledger, claim], 90, 1.15);
  const pC = drift(t, B.ledgerIn + 600, B.ledgerOut);
  const ledgerPose: Pose = {
    cx: c.cx,
    cy: lerp(ledger.y + ledger.h * 0.55, c.cy, easeGlide(pC)),
    scale: Math.exp(lerp(Math.log(Math.min(c.scale * 1.12, 1.25)), Math.log(c.scale), easeGlide(pC))),
  };
  pose = blendPose(pose, ledgerPose, seg(t, B.ledgerIn, B.ledgerIn + 1500, easeShot));

  // Shot D: on the composer, room below for the card to grow.
  const ask: Pose = { cx: composer.x + composer.w / 2 - 230, cy: composer.y + 140, scale: 1.35 };
  pose = blendPose(pose, ask, seg(t, B.askIn, B.typeStart + 100, easeShot));
  // Then the card and its pop-out framed together, with a slow push.
  const stackH = m.doneH + POP_GAP + layout.popSize.h;
  const pD = drift(t, B.popEnd, B.tiltInStart);
  const answer: Pose = {
    cx: composer.x + composer.w / 2 - 260,
    cy: composer.y + stackH / 2 + 8 - 14 * pD,
    scale: Math.exp(lerp(Math.log(Math.min(1.08, (FRAME.h - 150) / stackH)), Math.log(Math.min(1.14, (FRAME.h - 110) / stackH)), easeGlide(pD))),
  };
  pose = blendPose(pose, answer, seg(t, B.popStart - 150, B.popEnd + 400, easeShot));

  // Shot E: tilted again, gliding along the foot of the wall from the
  // mechanism (right) back to the timeline (left).
  const pE = drift(t, B.tiltInStart + 300, B.footPanEnd);
  const foot: Pose = {
    cx: lerp(mechanism.x + mechanism.w * 0.62, timeline.x + timeline.w * 0.6, easeGlide(pE)),
    // The foot row sits in the lower-middle of the frame (the focal band), the
    // columns above it receding into the far blur.
    cy: lerp(mechanism.y + mechanism.h * 0.5 - 300, timeline.y + timeline.h * 0.5 - 220, easeGlide(pE)),
    scale: Math.exp(lerp(Math.log(0.98), Math.log(0.92), easeGlide(pE))),
  };
  pose = blendPose(pose, foot, seg(t, B.tiltInStart - 200, B.tiltInEnd + 200, easeShot));

  // Shot F: back to the whole wall, settling with a slow push.
  const pF = drift(t, B.flatten2End, B.end);
  const finale: Pose = { cx: over.cx, cy: over.cy, scale: Math.exp(lerp(Math.log(over.scale * 0.985), Math.log(over.scale * 1.035), easeGlide(pF))) };
  pose = blendPose(pose, finale, seg(t, B.flatten2Start, B.flatten2End + 400, easeInOut));
  return pose;
}

/* ------------------------------------------------------------------ */
/* Scene state                                                          */
/* ------------------------------------------------------------------ */

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

export interface FillState {
  /** 0..1 of the body arrived; 0 = skeleton only. */
  p: number;
  /** Skeleton → body cross-fade, 0..1. */
  fade: number;
}

export interface QaScene {
  qaState: QaState;
  draft: string;
  answer: string;
  composerOpacity: number;
  composerScale: number;
  cardOpacity: number;
  cardH: number;
}

export interface PopScene {
  visible: boolean;
  opacity: number;
  scale: number;
  liftY: number;
  /** Pie slices arriving, 0..1. */
  fill: number;
}

export interface ShowcaseSceneState {
  camera: Pose;
  /** Plane rotation (degrees): about screen-X (lie back) and screen-Z (skew). */
  tiltX: number;
  tiltZ: number;
  /** Tilt-shift depth of field for the tilted shots (asymmetric bands). */
  dofTilt: number;
  /** Miniature tilt-shift for the flat overview (symmetric bands). */
  dofFlat: number;
  introBlur: number;
  introVeil: number;
  /** Per cast key; absent = fully drawn from the first frame. */
  fills: Record<string, FillState>;
  qa: QaScene;
  pop: PopScene;
}

export function showcaseSceneStateAt(t: number, layout: ShowcaseLayout, m: Measured): ShowcaseSceneState {
  const tilt1 = 1 - seg(t, B.flattenStart, B.flattenEnd, easeInOut);
  const tilt2 = seg(t, B.tiltInStart, B.tiltInEnd, easeInOut) * (1 - seg(t, B.flatten2Start, B.flatten2End, easeInOut));
  const dofTilt = Math.max(
    1 - seg(t, B.flattenStart - 100, B.flattenEnd - 500, easeInOut),
    seg(t, B.tiltInStart + 200, B.tiltInEnd + 300, easeInOut) * (1 - seg(t, B.flatten2Start - 100, B.flatten2End - 500, easeInOut)),
  );
  const dofFlat =
    0.85 * seg(t, B.flattenEnd - 200, B.flattenEnd + 700, easeInOut) * (1 - seg(t, B.ledgerIn - 300, B.ledgerIn + 500, easeInOut));
  const introBlur = 14 * (1 - seg(t, 0, B.focusPullEnd, easeGlide));
  // A half veil: frame 0 is the poster frame, so it opens on the wall itself (defocused).
  const introVeil = 0.55 * (1 - seg(t, 0, B.veilEnd, easeInOut));

  const fills: Record<string, FillState> = {};
  for (const [key, win] of Object.entries(FILLS)) {
    fills[key] = { p: seg(t, win.t0, win.t1, easeSettle), fade: seg(t, win.t0, win.t0 + FILL_FADE_MS, easeInOut) };
  }

  // The Q&A turn.
  const morph = seg(t, B.morphStart, B.morphEnd, easeSettle);
  const grow = seg(t, B.popStart, B.popStart + 520, easeSettle);
  const press = seg(t, B.send, B.send + 120) * (1 - seg(t, B.send + 120, B.send + 320, easeSettle));
  const qaState: QaState = t < B.morphStart ? "typing" : t < B.popStart ? "thinking" : "done";
  const qa: QaScene = {
    qaState,
    draft: typed(QUESTION, t, B.typeStart, B.typeEnd),
    answer: closeBold(streamed(ANSWER, t, B.streamStart, B.streamEnd)),
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
    fill: seg(t, B.popStart + 200, B.popEnd + 700, easeSettle),
  };

  return {
    camera: cameraAt(t, layout, m),
    tiltX: 50 * tilt1 + 47 * tilt2,
    tiltZ: -11 * tilt1 + 9 * tilt2,
    dofTilt,
    dofFlat,
    introBlur,
    introVeil,
    fills,
    qa,
    pop,
  };
}
