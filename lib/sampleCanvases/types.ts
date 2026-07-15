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
 * A code-defined research canvas produced with the `research-canvas` Claude
 * Code skill (.claude/skills/research-canvas). Registered entries surface in
 * the admin "Sample Canvases" section where an admin can stamp a copy into
 * their own account.
 */
export interface SampleCanvasDefinition {
  /** Stable kebab-case id, e.g. "henry-ford". */
  slug: string;
  /** Title used for the created canvas row. */
  title: string;
  /** The person or company researched. */
  subject: string;
  subjectKind: "person" | "company";
  /** Short supporting line under the title. */
  tagline: string;
  /** A few sentences on what the canvas covers. */
  description: string;
  /** Years the canvas spans, e.g. "1863–1947". */
  eraRange: string;
  /** Card accent — artifact category color token (see --artifact-cat-* tokens). */
  accent: string;
  /** Skill + version that produced this canvas, e.g. "research-canvas@0.1.0". */
  createdWithSkillVersion: string;
  stats: SampleCanvasStats;
  /** Builds a fresh snapshot; called lazily when the admin adds the canvas. */
  buildSnapshot: () => CanvasSnapshot;
}
