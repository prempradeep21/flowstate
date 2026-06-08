import { distances, durations, easings, scales } from "./tokens";
import { durationSeconds, framerTransition } from "./transitions";

const standardTransition = framerTransition("standard", "easeMedium");
const fastTransition = framerTransition("fast", "easeLight");
const overlayHeavyTransition = framerTransition("slow", "easeHeavy");

export const dropVariants = {
  initial: {
    opacity: 0,
    y: -distances.dropLift,
    scale: 1,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: [1, scales.scaleCompress, scales.scaleOvershoot, 1],
    transition: {
      opacity: { duration: durationSeconds("fast") },
      y: {
        duration: durationSeconds("standard"),
        ease: [...easings.easeMedium] as [number, number, number, number],
      },
      scale: {
        duration: durationSeconds("standard"),
        ease: [...easings.easeSettle] as [number, number, number, number],
        times: [0, 0.35, 0.7, 1],
      },
    },
  },
  reduced: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: durationSeconds("instant") },
  },
};

export const popUpVariants = {
  initial: {
    opacity: 0,
    y: distances.shiftMd,
    scale: scales.scalePopStart,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: standardTransition,
  },
  reduced: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: durationSeconds("instant") },
  },
};

export const panelContentVariants = {
  enter: (side: "left" | "right") => ({
    opacity: 0,
    x: side === "left" ? -distances.shiftXs : distances.shiftXs,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      ...framerTransition("standard", "easeMedium"),
      delay: 0.06,
    },
  },
  exit: {
    opacity: 0,
    transition: fastTransition,
  },
};

export const overlaySlideVariants = {
  initial: { opacity: 0, x: "100%" },
  animate: {
    opacity: 1,
    x: 0,
    transition: overlayHeavyTransition,
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: framerTransition("standard", "easeMedium"),
  },
  reducedEnter: {
    opacity: 1,
    x: 0,
    transition: { duration: durationSeconds("instant") },
  },
};

export const overlayModalVariants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: standardTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: fastTransition,
  },
};

export const overlayPopoverVariants = {
  initial: { opacity: 0, y: distances.shiftSm },
  animate: {
    opacity: 1,
    y: 0,
    transition: fastTransition,
  },
  exit: {
    opacity: 0,
    transition: { duration: durationSeconds("instant") },
  },
};

export const SPAWN_ANIMATION_MS = durations.standard + 50;
