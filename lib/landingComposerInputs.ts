import type { ArtifactKind } from "@/lib/artifactTypes";

/** Composer and sidebar inputs — mirrors ChatComposer attachment surfaces. */
export type LandingComposerInput = {
  id: string;
  label: string;
  description: string;
  /** Which product UI pattern this row demonstrates. */
  demo: "image" | "file" | "artifact" | "asset" | "skill" | "drive" | "plug";
  artifactKind?: ArtifactKind;
  sampleTitle?: string;
  sampleFileName?: string;
  sampleImageAlt?: string;
};

export const LANDING_COMPOSER_INPUTS: LandingComposerInput[] = [
  {
    id: "images",
    label: "Images",
    description:
      "Drop photos or paste from your clipboard — sketches, screenshots, references.",
    demo: "image",
    sampleImageAlt: "Mood board photo",
  },
  {
    id: "files",
    label: "Files",
    description:
      "Attach PDFs, notes, spreadsheets, or code files from your machine.",
    demo: "file",
    sampleFileName: "trip-notes.pdf",
  },
  {
    id: "drive",
    label: "Google Drive",
    description:
      "Pull Docs, Sheets, or Slides into a question without leaving the canvas.",
    demo: "drive",
    sampleFileName: "Weekend itinerary",
  },
  {
    id: "artifacts",
    label: "Artifacts",
    description:
      "Plug an existing table, map, or chart into your next question.",
    demo: "artifact",
    artifactKind: "table",
    sampleTitle: "Trip budget comparison",
  },
  {
    id: "assets",
    label: "Canvas assets",
    description:
      "Drag anything from your sidebar Assets panel into the composer.",
    demo: "asset",
    sampleFileName: "research-notes.md",
  },
  {
    id: "skills",
    label: "Skills",
    description:
      "Attach a skill file so the model follows your personal instructions.",
    demo: "skill",
    sampleTitle: "Travel planner",
  },
  {
    id: "plugs",
    label: "Side plugs",
    description:
      "Connect a card to an artifact, asset, or skill with a single drag.",
    demo: "plug",
  },
];
