import type { CanvasAsset } from "@/lib/store";
import { transcriptWebsitePreview } from "@/lib/transcriptImport/websitePreviews";
import {
  buildCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import { buildDesignToolsCanvasSection } from "@/lib/transcriptImport/buildDesignToolsCanvasSection";
import { buildYcInterviewCanvasSection } from "@/lib/transcriptImport/buildYcInterviewCanvasSection";
import { buildHubermanCanvasSection } from "@/lib/transcriptImport/buildHubermanCanvasSection";
import { buildRanaDaggubatiCanvasSection } from "@/lib/transcriptImport/buildRanaDaggubatiCanvasSection";
import { buildJagadambaCanvasSection } from "@/lib/transcriptImport/buildJagadambaCanvasSection";
import { buildCazualTalkSahilAggarwalCanvasSection } from "@/lib/transcriptImport/buildCazualTalkSahilAggarwalCanvasSection";
import { buildHubermanRajShamaniCanvasSection } from "@/lib/transcriptImport/buildHubermanRajShamaniCanvasSection";
import { buildLightconeEmergentCanvasSection } from "@/lib/transcriptImport/buildLightconeEmergentCanvasSection";
import { buildPrashantKishorCanvasSection } from "@/lib/transcriptImport/buildPrashantKishorCanvasSection";
import { DESIGN_TOOLS_HISTORY_TRANSCRIPT } from "@/lib/transcriptImport/designToolsHistory";
import {
  HUBERMAN_NEUROPLASTICITY_SOURCE_URL,
  HUBERMAN_NEUROPLASTICITY_TRANSCRIPT,
} from "@/lib/transcriptImport/hubermanNeuroplasticity";
import {
  YC_INTERVIEW_TIPS_TRANSCRIPT,
  YC_INTERVIEW_TIPS_VIDEO_URL,
} from "@/lib/transcriptImport/ycInterviewTips";
import {
  RANA_DAGGUBATI_INTERVIEW_TRANSCRIPT,
  RANA_DAGGUBATI_VIDEO_URL,
} from "@/lib/transcriptImport/ranaDaggubatiInterview";
import {
  JAGADAMBA_THEATRE_TRANSCRIPT,
  JAGADAMBA_THEATRE_VIDEO_URL,
} from "@/lib/transcriptImport/jagadambaTheatre";
import {
  LIGHTCONE_EMERGENT_TRANSCRIPT,
  LIGHTCONE_EMERGENT_VIDEO_URL,
} from "@/lib/transcriptImport/lightconeEmergent";
import {
  PRASHANT_KISHOR_INTERVIEW_TRANSCRIPT,
  PRASHANT_KISHOR_VIDEO_URL,
} from "@/lib/transcriptImport/prashantKishorInterview";
import {
  HUBERMAN_RAJ_SHAMANI_TRANSCRIPT_EXCERPTS,
  HUBERMAN_RAJ_SHAMANI_VIDEO_URL,
} from "@/lib/transcriptImport/hubermanRajShamaniInterview";
import {
  CAZUAL_TALK_SAHIL_AGGARWAL_TRANSCRIPT_EXCERPTS,
  CAZUAL_TALK_SAHIL_AGGARWAL_VIDEO_URL,
} from "@/lib/transcriptImport/cazualTalkSahilAggarwalInterview";
import type { TranscriptImportCanvasSection } from "@/lib/transcriptImport/playgroundLayout";

/**
 * One canvas per imported transcript. Each is built independently at its own
 * origin, so nothing has to be offset around anything else — adding a fourth
 * transcript is a fourth entry, not a fourth magic coordinate.
 */
export interface TranscriptImportCanvasDef {
  id: string;
  title: string;
  transcript: string;
  sourceUrl?: string;
  buildSnapshot(): CanvasSnapshot;
  contentCenter(): { x: number; y: number };
}

/**
 * Register each baked preview image as a canvas asset.
 *
 * The bytes already ship with the app, so this is not about storage — it is
 * about ownership. Registering them means the images travel with the canvas
 * snapshot, appear in its Attachments panel, and are addressed as canvas
 * content rather than as a URL the card happens to point at.
 *
 * Derived from the artifacts rather than authored in each builder, so a new
 * transcript canvas picks this up for free. No asset *nodes* are placed: the
 * image belongs to its website artifact, not to a separate tile on the board.
 */
function websitePreviewAssets(
  section: TranscriptImportCanvasSection,
  canvasId: string,
): Record<string, CanvasAsset> {
  const assets: Record<string, CanvasAsset> = {};
  for (const artifact of Object.values(section.sessionArtifacts)) {
    const version = artifact.versions.find(
      (v) => v.id === artifact.latestVersionId,
    );
    if (version?.payload.type !== "website") continue;
    const preview = transcriptWebsitePreview(version.payload.data.url);
    if (!preview) continue;
    const id = `asset_tip_${preview.path.split("/").pop()!.replace(/\W/g, "_")}`;
    if (assets[id]) continue;
    assets[id] = {
      id,
      canvasId,
      ownerId: "sample",
      name: preview.path.split("/").pop()!,
      mimeType: preview.mime,
      sizeBytes: preview.sizeBytes,
      storagePath: preview.path,
      publicUrl: preview.path,
      kind: "image",
      width: preview.width,
      height: preview.height,
      aspectRatio: preview.height > 0 ? preview.width / preview.height : undefined,
      createdAt: 0,
    };
  }
  return assets;
}

function snapshotFromSection(
  section: TranscriptImportCanvasSection,
  canvasId: string,
): CanvasSnapshot {
  const canvasAssets = websitePreviewAssets(section, canvasId);
  return buildCanvasSnapshot({
    viewport: { x: 0, y: 0, scale: 0.55 },
    cards: section.cards,
    cardOrder: section.cardOrder,
    connections: section.connections,
    threads: section.threads,
    threadOrder: section.threadOrder,
    groups: section.groups,
    connectorStyle: "orthogonal",
    canvasBackgroundStyle: "grid",
    canvasTheme: "light",
    // Imported transcripts read as notes rather than chat output, and neo's
    // flatter casing keeps a chapter of twelve tiles from looking like twelve
    // separate cards.
    canvasArtifactStyle: "neo",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts: section.sessionArtifacts,
    canvasArtifactNodes: section.canvasArtifactNodes,
    canvasArtifactOrder: section.canvasArtifactOrder,
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    canvasAssets,
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}

function defineCanvas(
  id: string,
  title: string,
  transcript: string,
  build: () => TranscriptImportCanvasSection,
  sourceUrl?: string,
): TranscriptImportCanvasDef {
  return {
    id,
    title,
    transcript,
    sourceUrl,
    buildSnapshot: () => snapshotFromSection(build(), id),
    contentCenter: () => build().contentCenter,
  };
}

export const TRANSCRIPT_IMPORT_CANVASES: TranscriptImportCanvasDef[] = [
  defineCanvas(
    "design-tools",
    "Design tools history",
    DESIGN_TOOLS_HISTORY_TRANSCRIPT,
    buildDesignToolsCanvasSection,
  ),
  defineCanvas(
    "yc-interview",
    "YC interview tips",
    YC_INTERVIEW_TIPS_TRANSCRIPT,
    buildYcInterviewCanvasSection,
    YC_INTERVIEW_TIPS_VIDEO_URL,
  ),
  defineCanvas(
    "huberman-neuroplasticity",
    "Neuroplasticity — Huberman",
    HUBERMAN_NEUROPLASTICITY_TRANSCRIPT,
    buildHubermanCanvasSection,
    HUBERMAN_NEUROPLASTICITY_SOURCE_URL,
  ),
  defineCanvas(
    "rana-daggubati-infocus",
    "Rana Daggubati — InFocus",
    RANA_DAGGUBATI_INTERVIEW_TRANSCRIPT,
    buildRanaDaggubatiCanvasSection,
    RANA_DAGGUBATI_VIDEO_URL,
  ),
  defineCanvas(
    "jagadamba-theatre",
    "Jagadamba Theatre — Rooted Stories",
    JAGADAMBA_THEATRE_TRANSCRIPT,
    buildJagadambaCanvasSection,
    JAGADAMBA_THEATRE_VIDEO_URL,
  ),
  defineCanvas(
    "lightcone-emergent",
    "Emergent — The Lightcone",
    LIGHTCONE_EMERGENT_TRANSCRIPT,
    buildLightconeEmergentCanvasSection,
    LIGHTCONE_EMERGENT_VIDEO_URL,
  ),
  defineCanvas(
    "prashant-kishor-unfiltered",
    "Prashant Kishor — Unfiltered by Samdish",
    PRASHANT_KISHOR_INTERVIEW_TRANSCRIPT,
    buildPrashantKishorCanvasSection,
    PRASHANT_KISHOR_VIDEO_URL,
  ),
  defineCanvas(
    "huberman-raj-shamani",
    "Andrew Huberman — Figuring Out",
    HUBERMAN_RAJ_SHAMANI_TRANSCRIPT_EXCERPTS,
    buildHubermanRajShamaniCanvasSection,
    HUBERMAN_RAJ_SHAMANI_VIDEO_URL,
  ),
  defineCanvas(
    "cazual-talk-sahil-aggarwal",
    "Sahil Aggarwal — Cazual Talk",
    CAZUAL_TALK_SAHIL_AGGARWAL_TRANSCRIPT_EXCERPTS,
    buildCazualTalkSahilAggarwalCanvasSection,
    CAZUAL_TALK_SAHIL_AGGARWAL_VIDEO_URL,
  ),
];

export const DEFAULT_TRANSCRIPT_IMPORT_CANVAS_ID =
  TRANSCRIPT_IMPORT_CANVASES[0]!.id;

export function getTranscriptImportCanvas(
  id: string,
): TranscriptImportCanvasDef {
  return (
    TRANSCRIPT_IMPORT_CANVASES.find((canvas) => canvas.id === id) ??
    TRANSCRIPT_IMPORT_CANVASES[0]!
  );
}
