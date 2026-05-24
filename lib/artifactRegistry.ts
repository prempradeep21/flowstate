import type { ArtifactKind } from "@/lib/artifactTypes";
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
};

const SIDEBAR_KINDS: ArtifactKind[] = ["table", "custom", "3d", "images"];

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
    default:
      return null;
  }
}

export function buildArtifactRegistry(
  artifacts: SessionArtifact[],
): ArtifactRegistryGroup[] {
  const buckets: Record<SidebarArtifactCategory, ArtifactRegistryItem[]> = {
    table: [],
    custom: [],
    "3d": [],
    image: [],
  };

  for (const art of artifacts) {
    if (!SIDEBAR_KINDS.includes(art.kind)) continue;
    const category = kindToCategory(art.kind);
    if (!category) continue;
    const ver = getLatestVersion(art);
    buckets[category].push({
      artifactId: art.id,
      versionId: ver.id,
      title: artifactDisplayTitle(art, ver),
      category,
    });
  }

  return (["table", "custom", "3d", "image"] as const).map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: buckets[category],
  }));
}
