import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import {
  artifactDisplayTitle,
  getLatestVersion,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type { SidebarArtifactCategory } from "@/lib/sidebarDnD";

export interface ArtifactRegistryItem {
  artifactId: string;
  versionId: string;
  title: string;
  category: SidebarArtifactCategory;
}

export interface ArtifactRegistryGroup {
  category: SidebarArtifactCategory;
  label: string;
  items: ArtifactRegistryItem[];
}

const CATEGORY_LABELS: Record<SidebarArtifactCategory, string> = {
  table: "Tables",
  custom: "Custom UI",
  "3d": "3D preview",
  image: "Images",
  map: "Maps",
  streetview: "Street view",
  todo: "To-do lists",
  calendar: "Calendars",
  website: "Websites",
  repo: "Repositories",
  embed: "Embeds",
  timeline: "Timelines",
  chart: "Charts",
  audio: "Audio",
  stickynote: "Sticky notes",
};

const SIDEBAR_KINDS: ArtifactKind[] = [
  "table",
  "custom",
  "3d",
  "images",
  "map",
  "streetview",
  "todo",
  "calendar",
  "website",
  "repo",
  "embed",
  "timeline",
  "chart",
  "audio",
  "stickynote",
];

function kindToCategory(kind: ArtifactKind): SidebarArtifactCategory | null {
  switch (kind) {
    case "table":
      return "table";
    case "custom":
      return "custom";
    case "3d":
      return "3d";
    case "images":
      return "image";
    case "map":
      return "map";
    case "streetview":
      return "streetview";
    case "todo":
      return "todo";
    case "calendar":
      return "calendar";
    case "website":
      return "website";
    case "repo":
      return "repo";
    case "embed":
      return "embed";
    case "timeline":
      return "timeline";
    case "chart":
      return "chart";
    case "audio":
      return "audio";
    case "stickynote":
      return "stickynote";
    default:
      return null;
  }
}

export interface FlatArtifactListItem {
  artifactId: string;
  versionId: string;
  title: string;
  category: SidebarArtifactCategory;
  kind: ArtifactKind;
  payload: ArtifactPayload;
  createdAt: number;
}

/** One sidebar tile per artifact — latest version preview only. */
export function buildFlatArtifactList(
  artifacts: SessionArtifact[],
): FlatArtifactListItem[] {
  const byArtifactId = new Map<string, FlatArtifactListItem>();

  for (const art of artifacts) {
    if (!SIDEBAR_KINDS.includes(art.kind)) continue;
    const category = kindToCategory(art.kind);
    if (!category) continue;
    const ver = getLatestVersion(art);
    if (!ver) continue;

    const existing = byArtifactId.get(art.id);
    if (existing && existing.createdAt >= ver.createdAt) continue;

    byArtifactId.set(art.id, {
      artifactId: art.id,
      versionId: ver.id,
      title: artifactDisplayTitle(art, ver),
      category,
      kind: art.kind,
      payload: ver.payload,
      createdAt: ver.createdAt,
    });
  }

  return [...byArtifactId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function buildArtifactRegistry(
  artifacts: SessionArtifact[],
): ArtifactRegistryGroup[] {
  const buckets: Record<SidebarArtifactCategory, ArtifactRegistryItem[]> = {
    table: [],
    custom: [],
    "3d": [],
    image: [],
    map: [],
    streetview: [],
    todo: [],
    calendar: [],
    website: [],
    repo: [],
    embed: [],
    timeline: [],
    chart: [],
    audio: [],
    stickynote: [],
  };

  for (const art of artifacts) {
    if (!SIDEBAR_KINDS.includes(art.kind)) continue;
    const category = kindToCategory(art.kind);
    if (!category) continue;
    const ver = getLatestVersion(art);
    if (!ver) continue;
    buckets[category].push({
      artifactId: art.id,
      versionId: ver.id,
      title: artifactDisplayTitle(art, ver),
      category,
    });
  }

  return (
    ["table", "custom", "3d", "image", "map", "todo", "timeline", "website", "embed"] as const
  ).map(
    (category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: buckets[category],
    }),
  );
}
