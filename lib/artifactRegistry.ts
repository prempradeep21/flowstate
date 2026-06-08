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
  todo: "To-do lists",
};

const SIDEBAR_KINDS: ArtifactKind[] = [
  "table",
  "custom",
  "3d",
  "images",
  "map",
  "todo",
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
    case "todo":
      return "todo";
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
    todo: [],
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

  return (["table", "custom", "3d", "image", "map", "todo"] as const).map(
    (category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: buckets[category],
    }),
  );
}
