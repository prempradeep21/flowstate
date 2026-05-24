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
    kind: "3d",
    label: "3D preview",
    prompt: "Generate a 3D preview of ",
  },
  {
    kind: "images",
    label: "Images",
    prompt: "Create an image gallery showing ",
  },
];
