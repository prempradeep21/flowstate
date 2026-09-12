/** Logo/type formation idents — five 3s variants, white background, brand
 *  blue on white. Everything is a pure function of t (ms) like the other
 *  demo-video scenes, so the capture script can frame-step deterministically. */

import {
  cubicBezier,
  easeGlide,
  easeInOut,
  easeSettle,
  lerp,
  seg,
  type Ease,
} from "../../timeline";

export const LOGO_DURATION_MS = 3000;

export type LogoVariant =
  | "logo-draw"
  | "logo-type"
  | "logo-o"
  | "logo-lockup"
  | "logo-nodes";

export const LOGO_VARIANTS: LogoVariant[] = [
  "logo-draw",
  "logo-type",
  "logo-o",
  "logo-lockup",
  "logo-nodes",
];

export const BRAND_BLUE = "#2066EB";
export const WORD = "flowstate";
/** Figma spec: Alkatra Regular at -5% letter spacing. */
export const TRACK_FINAL = -0.05;

/* ------------------------------------------------------------------ */
/* Mark geometry — lifted from public/flowstate-logo.svg (146 viewBox). */
/* The rotated rounded-rect is exactly a circle at (73,73) r 72.943.    */
/* ------------------------------------------------------------------ */

export const MARK_VIEWBOX = 146;
export const MARK_CIRCLE = { cx: 73, cy: 73, r: 72.943 };
export const MARK_PATHS = [
  "M-18.7098 148.049C-7.86879 137.208 9.23958 120.1 19.1545 110.185C35.0474 94.2922 16.4405 75.6487 40.2324 54.7245",
  "M-1.89125 164.863C8.9498 154.022 26.0581 136.914 35.973 126.999C51.866 111.106 70.5095 129.713 91.4337 105.921",
  "M-5.10498 151.262L87.3438 58.813",
];
/** Node dot centers (the matrix transforms in the source SVG, resolved). */
export const MARK_NODES = [
  { x: 42.92, y: 51.55 },
  { x: 94.61, y: 103.24 },
  { x: 93.72, y: 52.44 },
];
export const MARK_NODE_R = 9.93979;

/** Where the converging dots drift in from (logo-nodes), viewBox coords. */
export const DOT_STARTS = [
  { x: -28, y: 2 },
  { x: 152, y: 178 },
  { x: 168, y: -6 },
];

/* ------------------------------------------------------------------ */
/* Easing                                                               */
/* ------------------------------------------------------------------ */

/** Overshooting back-out — the "pop". */
const backOut = (overshoot = 1.70158): Ease => {
  const c3 = overshoot + 1;
  return (p) => {
    const q = p - 1;
    return 1 + c3 * q * q * q + overshoot * q * q;
  };
};
const popSoft = backOut(1.35);
const popNode = backOut(2.2);
const easeDraw = cubicBezier(0.55, 0, 0.15, 1);

const tri = (fn: (i: number) => number): [number, number, number] => [
  fn(0),
  fn(1),
  fn(2),
];

/* ------------------------------------------------------------------ */
/* Scene state                                                          */
/* ------------------------------------------------------------------ */

export interface MarkPose {
  opacity: number;
  scale: number;
  /** Degrees. */
  rotate: number;
  /** Stroke draw-on progress per branch path, 0..1. */
  draw: [number, number, number];
  /** Node dot pop scale per node, 0..1 (overshoots past 1). */
  nodes: [number, number, number];
}

export interface LetterPose {
  opacity: number;
  /** Vertical rise offset, em (positive = below final position). */
  rise: number;
  /** Horizontal offset, em. */
  shift: number;
}

export interface ConvergePose {
  /** 0..1 dot travel from DOT_STARTS to MARK_NODES. */
  dotTravel: number;
  dotOpacity: number;
  draw: [number, number, number];
  /** 0..1 of the full circle radius (the blue reveal). */
  circleR: number;
  /** Opacity of the blue-on-white layer outside the circle. */
  exterior: number;
}

export interface LogoSceneState {
  mark: MarkPose;
  letters: LetterPose[];
  /** Letter tracking, em. */
  tracking: number;
  converge: ConvergePose | null;
}

const MARK_HIDDEN: MarkPose = {
  opacity: 0,
  scale: 0,
  rotate: 0,
  draw: [0, 0, 0],
  nodes: [0, 0, 0],
};

/* ------------------------------------------------------------------ */
/* Variant storyboards (all hold a stable end pose for the last ~1s so  */
/* the final frame works as a freeze/endcap).                           */
/* ------------------------------------------------------------------ */

/** Mark formation: circle pops in, branches draw on, nodes pop. */
function drawState(t: number): LogoSceneState {
  return {
    mark: {
      opacity: seg(t, 0, 240),
      scale: seg(t, 0, 680, popSoft),
      rotate: 0,
      draw: tri((i) => seg(t, 520 + i * 170, 1480 + i * 170, easeDraw)),
      nodes: tri((i) => seg(t, 1230 + i * 170, 1640 + i * 170, popNode)),
    },
    letters: [],
    tracking: TRACK_FINAL,
    converge: null,
  };
}

/** Wordmark formation: letters rise+fade in left→right, tracking settles. */
function typeState(t: number): LogoSceneState {
  const letters = WORD.split("").map((_, i) => {
    const s = 260 + i * 70;
    const p = seg(t, s, s + 680, easeSettle);
    return { opacity: seg(t, s, s + 360), rise: (1 - p) * 0.45, shift: 0 };
  });
  return {
    mark: MARK_HIDDEN,
    letters,
    tracking: lerp(-0.012, TRACK_FINAL, seg(t, 500, 1900, easeGlide)),
    converge: null,
  };
}

/** The requested one: "fl" + "wstate" part in, the mark lands as the o. */
function oState(t: number): LogoSceneState {
  const close = seg(t, 150, 900, easeSettle);
  const op = seg(t, 150, 600);
  const letters = Array.from({ length: 8 }, (_, i) => ({
    opacity: op,
    rise: 0,
    // "fl" (0..1) drifts in from the left, "wstate" (2..7) from the right.
    shift: (i < 2 ? -0.12 : 0.12) * (1 - close),
  }));
  const appear = seg(t, 700, 1350, easeSettle);
  return {
    mark: {
      opacity: seg(t, 700, 900),
      scale: seg(t, 700, 1350, backOut(1.6)),
      rotate: lerp(-40, 0, appear),
      draw: tri((i) => seg(t, 1000 + i * 130, 1550 + i * 130, easeDraw)),
      nodes: tri((i) => seg(t, 1350 + i * 130, 1680 + i * 130, popNode)),
    },
    letters,
    tracking: TRACK_FINAL,
    converge: null,
  };
}

/** Horizontal lockup: mark pops in, letters cascade out to its right. */
function lockupState(t: number): LogoSceneState {
  const letters = WORD.split("").map((_, i) => {
    const s = 620 + i * 55;
    return {
      opacity: seg(t, s, s + 320),
      rise: 0,
      shift: -(1 - seg(t, s, s + 600, easeSettle)) * 0.3,
    };
  });
  return {
    mark: {
      opacity: seg(t, 80, 300),
      scale: seg(t, 80, 660, backOut(1.5)),
      rotate: 0,
      draw: tri((i) => seg(t, 480 + i * 150, 1280 + i * 150, easeDraw)),
      nodes: tri((i) => seg(t, 1050 + i * 150, 1400 + i * 150, popNode)),
    },
    letters,
    tracking: TRACK_FINAL,
    converge: null,
  };
}

/** Conceptual: threads converge into dots, the blue circle reveal inverts
 *  everything inside it to white, loose ends fade — the mark remains. */
function nodesState(t: number): LogoSceneState {
  return {
    mark: MARK_HIDDEN,
    letters: [],
    tracking: TRACK_FINAL,
    converge: {
      dotTravel: seg(t, 80, 1050, easeGlide),
      dotOpacity: seg(t, 60, 320),
      // Tails grow out of the dots once they've (mostly) landed.
      draw: tri((i) => seg(t, 950 + i * 110, 1700 + i * 110, easeDraw)),
      circleR: seg(t, 1850, 2400, easeSettle),
      exterior: 1 - seg(t, 2300, 2700, easeInOut),
    },
  };
}

export function logoSceneStateAt(
  variant: LogoVariant,
  t: number,
): LogoSceneState {
  switch (variant) {
    case "logo-draw":
      return drawState(t);
    case "logo-type":
      return typeState(t);
    case "logo-o":
      return oState(t);
    case "logo-lockup":
      return lockupState(t);
    case "logo-nodes":
      return nodesState(t);
  }
}
