import type { CanvasSnapshot } from "@/lib/canvasSnapshot";

/** Rolled-up artifact counts shown on the admin card — must match the built snapshot. */
export interface SampleCanvasStats {
  charts: number;
  tables: number;
  timelines: number;
  videos: number;
  websites: number;
  maps: number;
  other: number;
}

/**
 * What kind of canvas an entry is. `research` canvases deep-research a subject
 * and are produced with the `research-canvas` skill (overview band + era
 * clusters). `project` canvases model a piece of work moving through states and
 * are hand-built with their own geometry — they share no layout conventions
 * with research canvases beyond pure geometry maths.
 */
export type SampleCanvasKind = "research" | "project";

/**
 * A code-defined sample canvas. Registered entries surface in the admin "Sample
 * Canvases" section where an admin can stamp a copy into their own account.
 */
export interface SampleCanvasDefinition {
  /** Stable kebab-case id, e.g. "henry-ford". */
  slug: string;
  kind: SampleCanvasKind;
  /** Title used for the created canvas row. */
  title: string;
  /** The person or company the canvas is about. */
  subject: string;
  subjectKind: "person" | "company";
  /** Short supporting line under the title. */
  tagline: string;
  /** A few sentences on what the canvas covers. */
  description: string;
  /** The span the canvas covers — an era for research, a campaign window for a project. */
  eraRange: string;
  /** Card accent — artifact category color token (see --artifact-cat-* tokens). */
  accent: string;
  /**
   * Skill + version that produced this canvas, e.g. "research-canvas@0.1.0".
   * Omitted for hand-built canvases that came from no skill — do not invent a
   * value, the admin card simply hides the pill.
   */
  createdWithSkillVersion?: string;
  stats: SampleCanvasStats;
  /** Builds a fresh snapshot; called lazily when the admin adds the canvas. */
  buildSnapshot: () => CanvasSnapshot;
}
