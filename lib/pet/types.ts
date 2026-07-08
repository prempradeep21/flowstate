/**
 * Canvas Pet — shared types for the stickman engine.
 *
 * All coordinates are playground-local pixels (not screen, not canvas-world).
 * A pet's position is its FOOT POINT: x = horizontal center of the feet,
 * y = the surface it stands on. Rendering anchors the figure bottom-center
 * to this point.
 */

/** A solid surface the pet can stand/run on (top edge of a canvas element). */
export interface Foothold {
  id: string;
  /** Left edge of the walkable surface, px. */
  left: number;
  /** Right edge of the walkable surface, px. */
  right: number;
  /** Y of the top surface the feet rest on, px. */
  surfaceY: number;
}

/** Visual pose — maps 1:1 to a `data-pose` attribute driving CSS keyframes. */
export type PetPose = "stand" | "run" | "jump" | "dance" | "rest";

/** Which way the figure faces; rendered as scaleX(±1). */
export type PetFacing = 1 | -1;

export interface PetPoint {
  x: number;
  y: number;
}

/** A fully precomputed jump: sample with `sampleJumpArc(arc, t)`, t ∈ [0,1]. */
export interface JumpArc {
  from: PetPoint;
  to: PetPoint;
  /** Apex height above the straight from→to line, px (always positive). */
  apex: number;
  /** Flight time in ms. */
  duration: number;
}

/** Minimal design config — locked to color + size for this prototype. */
export interface PetConfig {
  /** Stroke color for the whole figure (any CSS color). */
  color: string;
  /** Figure height in px (head to feet). */
  size: number;
}

/** An action the free-will brain can decide on. */
export type BrainAction =
  | { kind: "jump"; direction: -1 | 1 }
  | { kind: "wander" } // short run within the current foothold
  | { kind: "dance" }
  | { kind: "rest" }
  | { kind: "idle" }; // just stand there for a beat
