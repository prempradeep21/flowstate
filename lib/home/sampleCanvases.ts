/**
 * Placeholder "Sample canvases" shown on the Home view. These are static entry
 * points for now — real canvases + artifacts will be attached later, at which
 * point each entry can gain a `canvasId` (or a snapshot source) to open.
 */
export interface SampleCanvas {
  slug: string;
  title: string;
  /** Short supporting line shown under the title. */
  tagline: string;
  /** Thumbnail accent — artifact category color (see --artifact-cat-* tokens). */
  accent: string;
}

export const SAMPLE_CANVASES: SampleCanvas[] = [
  {
    slug: "travel-planning",
    title: "Travel planning",
    tagline: "Map a trip end to end",
    accent: "rgb(var(--artifact-cat-geo-fg))",
  },
  {
    slug: "financial-planning",
    title: "Financial planning",
    tagline: "Model budgets and goals",
    accent: "rgb(var(--artifact-cat-data-fg))",
  },
  {
    slug: "freelance-planning",
    title: "Freelance planning",
    tagline: "Run projects and clients",
    accent: "rgb(var(--artifact-cat-planning-fg))",
  },
];
