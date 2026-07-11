import type { ArtifactKind } from "@/lib/artifactTypes";

/** Artifact starter pills on the empty canvas — extend as needed. */
export const LANDING_ARTIFACT_SUGGESTIONS: {
  kind: ArtifactKind;
  label: string;
  prompt: string;
}[] = [
  {
    kind: "table",
    label: "Tables",
    prompt: "Create a table that compares ",
  },
  {
    kind: "custom",
    label: "Custom UI",
    prompt: "Build a custom UI component for ",
  },
  {
    kind: "images",
    label: "Images",
    prompt: "Create an image gallery showing ",
  },
  {
    kind: "map",
    label: "Maps",
    prompt: "Show me a map of ",
  },
];
