import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";

/** Lower number = higher priority (spawns first without permission). */
const SPAWN_PRIORITY: Record<string, number> = {
  todo: 10,
  calendar: 15,
  timeline: 18,
  table: 20,
  map: 30,
  streetview: 40,
  custom: 50,
  code: 60,
  images: 70,
  "3d": 80,
};

const DEFAULT_PRIORITY = 90;

export function artifactKindPriority(kind: ArtifactKind | string): number {
  return SPAWN_PRIORITY[kind] ?? DEFAULT_PRIORITY;
}

export function sortArtifactsByPriority(
  payloads: ArtifactPayload[],
): ArtifactPayload[] {
  return [...payloads].sort(
    (a, b) =>
      artifactKindPriority(payloadToArtifactKind(a)) -
      artifactKindPriority(payloadToArtifactKind(b)),
  );
}

export function getPermissionCopy(
  kind: ArtifactKind,
  placeName?: string,
): string {
  const place = placeName?.trim();
  switch (kind) {
    case "map":
      return "Create a map to pin places and get an overview of your trip";
    case "streetview":
      return place
        ? `Open Street View at ${place} for a ground-level preview`
        : "Open Street View at this location for a ground-level preview";
    case "table":
      return "Create a table to organize and compare your data";
    case "todo":
      return "Create a checklist to track tasks and action items";
    case "calendar":
      return "Create a calendar to view dates and schedule events";
    case "timeline":
      return "Create a timeline to map events across time";
    case "custom":
      return "Create an interactive component for this idea";
    case "code":
      return "Create a code artifact to explore this implementation";
    case "images":
      return "Create a media gallery for these visuals";
    case "3d":
      return "Create a 3D preview for this model";
    default:
      return "Create this artifact on your canvas";
  }
}
