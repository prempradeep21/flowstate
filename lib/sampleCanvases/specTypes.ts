import type { ArtifactPayload } from "@/lib/artifactTypes";

/**
 * How a sample canvas's data module describes artifacts to its builder.
 *
 * This is a third axis alongside the two in layout.ts: it is neither geometry
 * (layout.ts / companyLayout.ts) nor registry contract (types.ts), and it
 * carries no subject assumptions. Any family may import it — research canvases
 * (people), company canvases, and hand-built project canvases alike.
 */

export interface SampleArtifactSpec {
  /** Stable id suffix, e.g. "chart-revenue" → abnb-art-chart-revenue. */
  key: string;
  payload: ArtifactPayload;
}

export interface SampleClusterColumn {
  /** Optional small annotation label rendered above the column. */
  label?: string;
  items: SampleArtifactSpec[];
}

/**
 * A titled block of media columns plus an annotation column. The unit that both
 * a research era and a company district cluster specialise.
 */
export interface SampleCluster {
  key: string;
  title: string;
  columns: SampleClusterColumn[];
  /** Annotation column: sticky-note highlights and "Ask:" prompts. */
  stickies: SampleArtifactSpec[];
}
