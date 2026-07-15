import { buildHenryFordCanvas } from "@/lib/sampleCanvases/henryFord/buildHenryFordCanvas";
import type { SampleCanvasDefinition } from "@/lib/sampleCanvases/types";

/**
 * All code-defined sample canvases, in display order. Every entry is produced
 * with the `research-canvas` Claude Code skill — see
 * .claude/skills/research-canvas/SKILL.md for the methodology and the
 * checklist for registering a new canvas here.
 *
 * Must stay client-importable: the admin page builds snapshots in the browser,
 * so nothing in lib/sampleCanvases may import server-only modules.
 */
export const SAMPLE_CANVAS_REGISTRY: SampleCanvasDefinition[] = [
  {
    slug: "henry-ford",
    title: "Henry Ford",
    subject: "Henry Ford",
    subjectKind: "person",
    tagline: "The man who put the world on wheels",
    description:
      "Deep research into Henry Ford (1863–1947): Model T production and price arcs, the assembly line and $5 day, River Rouge, Fordlândia, Willow Run's bomber-an-hour line, and the museum that keeps it all. Overview metrics up top, seven annotated era deep-dives below with sticky-note highlights and question prompts.",
    eraRange: "1863–1947",
    accent: "rgb(var(--artifact-cat-data-fg))",
    createdWithSkillVersion: "research-canvas@0.2.0",
    stats: {
      charts: 6,
      tables: 3,
      timelines: 1,
      videos: 15,
      websites: 12,
      maps: 5,
      other: 23,
    },
    buildSnapshot: buildHenryFordCanvas,
  },
];

export function getSampleCanvas(
  slug: string,
): SampleCanvasDefinition | undefined {
  return SAMPLE_CANVAS_REGISTRY.find((entry) => entry.slug === slug);
}
