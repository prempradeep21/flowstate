import {
  ARTIFACT_CATALOG_ENTRIES,
  CATALOG_SECTIONS,
  type ArtifactCatalogCategory,
  type ArtifactCatalogEntry,
} from "@/lib/artifactCatalogSamples";
import {
  DESIGN_SYSTEM_CARD_SAMPLES,
  type DesignSystemCardSample,
} from "@/lib/designSystemCardSamples";
import {
  DESIGN_SYSTEM_CONNECTOR_SPECS,
  type DesignSystemConnectorSpec,
} from "@/lib/designSystemConnectorDemo";

export type DesignSystemSectionId =
  | "tokens"
  | "artifacts"
  | "cards"
  | "connectors"
  | "docs";

export interface DesignSystemSection {
  id: DesignSystemSectionId;
  title: string;
  description: string;
}

export interface DesignSystemDocEntry {
  id: string;
  title: string;
  description: string;
  path: string;
  tags: string[];
}

export interface DesignSystemArtifactEntry {
  id: string;
  category: ArtifactCatalogCategory;
  name: string;
  title: string;
  description: string;
  tags: string[];
  componentPath: string;
  catalogEntryId: string;
  livePreviewOnly?: boolean;
}

export interface DesignSystemManifest {
  name: string;
  version: string;
  generatedAt: string;
  sections: DesignSystemSection[];
  docs: DesignSystemDocEntry[];
  artifacts: DesignSystemArtifactEntry[];
  cards: DesignSystemCardSample[];
  connectors: DesignSystemConnectorSpec[];
}

const ARTIFACT_COMPONENT_PATHS: Record<string, string> = {
  table: "components/artifacts/TableArtifactContent.tsx",
  chart: "components/artifacts/ChartArtifactContent.tsx",
  code: "components/artifacts/CodeArtifactContent.tsx",
  "3d": "components/artifacts/ThreeDArtifactContent.tsx",
  map: "components/artifacts/MapArtifactContent.tsx",
  streetview: "components/artifacts/StreetViewArtifactContent.tsx",
  todo: "components/artifacts/TodoArtifactContent.tsx",
  calendar: "components/artifacts/CalendarArtifactContent.tsx",
  timeline: "components/artifacts/TimelineArtifactContent.tsx",
  custom: "components/artifacts/CustomArtifactContent.tsx",
  website: "components/artifacts/WebsiteArtifactContent.tsx",
  images: "components/artifacts/ImagesArtifactContent.tsx",
  audio: "components/artifacts/AudioArtifactContent.tsx",
  repo: "components/artifacts/RepoArtifactContent.tsx",
  embed: "components/artifacts/EmbedArtifactContent.tsx",
  prompt: "components/cards/TextCardBody.tsx",
};

const LIVE_PREVIEW_ONLY_IDS = new Set([
  "map",
  "streetview",
  "3d",
  "website",
  "embed",
  "audio",
  "video",
]);

function artifactComponentPath(entry: ArtifactCatalogEntry): string {
  if (entry.previewKind === "text-card") {
    return "components/cards/TextCardBody.tsx";
  }
  const type = entry.payload?.type;
  if (type && ARTIFACT_COMPONENT_PATHS[type]) {
    return ARTIFACT_COMPONENT_PATHS[type]!;
  }
  return "components/artifacts/ArtifactContent.tsx";
}

export const DESIGN_SYSTEM_SECTIONS: DesignSystemSection[] = [
  {
    id: "tokens",
    title: "Tokens",
    description: "Colors, typography, radii, and spacing primitives.",
  },
  {
    id: "artifacts",
    title: "Artifacts",
    description: "Input and output artifact renderers on the canvas.",
  },
  {
    id: "cards",
    title: "Cards",
    description: "Inline Q&A bodies and artifact previews on cards.",
  },
  {
    id: "connectors",
    title: "Connectors",
    description: "Thread curves, plugs, and connector styles.",
  },
  {
    id: "docs",
    title: "Docs",
    description: "Design language and token reference markdown.",
  },
];

export const DESIGN_SYSTEM_DOCS: DesignSystemDocEntry[] = [
  {
    id: "readme",
    title: "Overview",
    description: "Design system index and usage rules.",
    path: "docs/design-system/README.md",
    tags: ["index", "rules"],
  },
  {
    id: "design-language",
    title: "Design language",
    description: "Principles, do/don't, and architecture.",
    path: "docs/design-system/design-language.md",
    tags: ["principles", "patterns"],
  },
  {
    id: "token-reference",
    title: "Token reference",
    description: "Every token with Tailwind class names.",
    path: "docs/design-system/token-reference.md",
    tags: ["tokens", "tailwind"],
  },
];

export function getArtifactEntriesByCategory(
  category: ArtifactCatalogCategory,
): DesignSystemArtifactEntry[] {
  return ARTIFACT_CATALOG_ENTRIES.filter((entry) => entry.category === category).map(
    (entry) => ({
      id: entry.id,
      category: entry.category,
      name: entry.name,
      title: entry.title,
      description: entry.description,
      tags: entry.chips,
      componentPath: artifactComponentPath(entry),
      catalogEntryId: entry.id,
      livePreviewOnly: LIVE_PREVIEW_ONLY_IDS.has(entry.id),
    }),
  );
}

export function getArtifactCatalogEntry(id: string): ArtifactCatalogEntry | undefined {
  return ARTIFACT_CATALOG_ENTRIES.find((entry) => entry.id === id);
}

export function buildDesignSystemManifest(): DesignSystemManifest {
  return {
    name: "Flowstate Design System",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    sections: DESIGN_SYSTEM_SECTIONS,
    docs: DESIGN_SYSTEM_DOCS,
    artifacts: ARTIFACT_CATALOG_ENTRIES.map((entry) => ({
      id: entry.id,
      category: entry.category,
      name: entry.name,
      title: entry.title,
      description: entry.description,
      tags: entry.chips,
      componentPath: artifactComponentPath(entry),
      catalogEntryId: entry.id,
      livePreviewOnly: LIVE_PREVIEW_ONLY_IDS.has(entry.id),
    })),
    cards: DESIGN_SYSTEM_CARD_SAMPLES,
    connectors: DESIGN_SYSTEM_CONNECTOR_SPECS,
  };
}

export { ARTIFACT_CATALOG_ENTRIES, CATALOG_SECTIONS, DESIGN_SYSTEM_CARD_SAMPLES };
