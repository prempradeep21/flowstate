import type { ArtifactCatalogEntry } from "@/lib/artifactCatalogSamples";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import type { ArtifactKind } from "@/lib/artifactTypes";

export type LandingHeroFloat =
  | {
      id: string;
      kind: "artifact";
      catalogId: string;
      kindLabel: string;
      artifactKind: ArtifactKind | "video";
      className: string;
      width: number;
      previewHeight: number;
    }
  | {
      id: string;
      kind: "question";
      question: string;
      answer: string;
      className: string;
      width: number;
    };

function catalogEntry(id: string): ArtifactCatalogEntry {
  const entry = ARTIFACT_CATALOG_ENTRIES.find((e) => e.id === id);
  if (!entry) throw new Error(`Missing catalog entry: ${id}`);
  return entry;
}

export function landingHeroCatalogEntry(catalogId: string): ArtifactCatalogEntry {
  return catalogEntry(catalogId);
}

/** Absolutely positioned floats on the canvas hero — % via Tailwind placement classes. */
export const LANDING_HERO_FLOATS: LandingHeroFloat[] = [
  {
    id: "float-table",
    kind: "artifact",
    catalogId: "table",
    kindLabel: "Table",
    artifactKind: "table",
    className: "left-[2%] top-[10%] hidden lg:block motion-landing-rise",
    width: 228,
    previewHeight: 132,
  },
  {
    id: "float-website",
    kind: "artifact",
    catalogId: "website",
    kindLabel: "Website",
    artifactKind: "website",
    className: "left-[22%] top-[4%] hidden md:block motion-landing-rise",
    width: 200,
    previewHeight: 108,
  },
  {
    id: "float-chart",
    kind: "artifact",
    catalogId: "chart-bar",
    kindLabel: "Chart",
    artifactKind: "chart",
    className: "right-[3%] top-[8%] hidden lg:block motion-landing-rise",
    width: 196,
    previewHeight: 128,
  },
  {
    id: "float-images",
    kind: "artifact",
    catalogId: "images",
    kindLabel: "Images",
    artifactKind: "images",
    className: "left-[1%] top-[42%] hidden md:block motion-landing-rise",
    width: 210,
    previewHeight: 120,
  },
  {
    id: "float-question-weekend",
    kind: "question",
    question: "Where should we spend the long weekend?",
    answer: "Lisbon keeps coming up — great food, walkable neighborhoods, and easy day trips by train.",
    className: "left-[8%] top-[28%] hidden xl:block motion-landing-rise",
    width: 200,
  },
  {
    id: "float-video",
    kind: "artifact",
    catalogId: "video",
    kindLabel: "Video",
    artifactKind: "video",
    className: "right-[2%] top-[38%] hidden md:block motion-landing-rise",
    width: 214,
    previewHeight: 118,
  },
  {
    id: "float-question-porto",
    kind: "question",
    question: "What about Porto instead?",
    answer: "Compact, cheaper, and strong on wine culture — fewer crowds in shoulder season.",
    className: "right-[14%] top-[24%] hidden xl:block motion-landing-rise",
    width: 188,
  },
  {
    id: "float-map",
    kind: "artifact",
    catalogId: "map",
    kindLabel: "Map",
    artifactKind: "map",
    className: "left-[4%] bottom-[14%] hidden lg:block motion-landing-rise",
    width: 204,
    previewHeight: 130,
  },
  {
    id: "float-todo",
    kind: "artifact",
    catalogId: "todo",
    kindLabel: "To-do",
    artifactKind: "todo",
    className: "right-[5%] bottom-[12%] hidden lg:block motion-landing-rise",
    width: 200,
    previewHeight: 128,
  },
];
