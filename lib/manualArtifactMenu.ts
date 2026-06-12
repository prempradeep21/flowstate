import type { ArtifactKind } from "@/lib/artifactTypes";
import type { ManualArtifactType } from "@/lib/manualArtifactDefaults";

export type ManualArtifactMenuPick =
  | { kind: "question" }
  | { kind: "artifact"; artifactType: ManualArtifactType };

export interface ManualArtifactMenuEntry {
  pick: ManualArtifactMenuPick;
  label: string;
  iconKind: ArtifactKind | "question";
}

/** Flat menu order: spawn priority, Add question last. */
export const MANUAL_ARTIFACT_MENU_ITEMS: ManualArtifactMenuEntry[] = [
  {
    pick: { kind: "artifact", artifactType: "stickynote" },
    label: "Sticky note",
    iconKind: "stickynote",
  },
  { pick: { kind: "artifact", artifactType: "todo" }, label: "To-do list", iconKind: "todo" },
  { pick: { kind: "artifact", artifactType: "calendar" }, label: "Calendar", iconKind: "calendar" },
  { pick: { kind: "artifact", artifactType: "timeline" }, label: "Timeline", iconKind: "timeline" },
  { pick: { kind: "artifact", artifactType: "table" }, label: "Table", iconKind: "table" },
  { pick: { kind: "artifact", artifactType: "chart" }, label: "Chart", iconKind: "chart" },
  { pick: { kind: "artifact", artifactType: "map" }, label: "Map", iconKind: "map" },
  { pick: { kind: "artifact", artifactType: "streetview" }, label: "Street view", iconKind: "streetview" },
  { pick: { kind: "artifact", artifactType: "images" }, label: "Images", iconKind: "images" },
  { pick: { kind: "question" }, label: "Add question", iconKind: "question" },
];
