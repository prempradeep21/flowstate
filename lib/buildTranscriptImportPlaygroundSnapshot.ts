import {
  buildCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import { buildDesignToolsCanvasSection } from "@/lib/transcriptImport/buildDesignToolsCanvasSection";
import { buildYcInterviewCanvasSection } from "@/lib/transcriptImport/buildYcInterviewCanvasSection";
import {
  mergeTranscriptImportSections,
  ORIGIN_X,
  CARD_STEP_X,
} from "@/lib/transcriptImport/playgroundLayout";

export {
  TIP_GROUP_ID,
  TIP_THREAD_MAIN,
  TIP_THREAD_ADOBE,
  TIP_THREAD_PREFIGMA,
  TIP_THREAD_DYLAN,
} from "@/lib/transcriptImport/buildDesignToolsCanvasSection";

export {
  TIP_GROUP_ID_YC,
  TIP_THREAD_YC_MAIN,
} from "@/lib/transcriptImport/buildYcInterviewCanvasSection";

let cachedContentCenter: { x: number; y: number } | null = null;

/** Pre-built demo canvas for admin transcript-import playground only. */
export function buildTranscriptImportPlaygroundSnapshot(): CanvasSnapshot {
  const merged = mergeTranscriptImportSections([
    buildDesignToolsCanvasSection(),
    buildYcInterviewCanvasSection(),
  ]);
  cachedContentCenter = merged.contentCenter;

  return buildCanvasSnapshot({
    viewport: { x: 0, y: 0, scale: 0.55 },
    cards: merged.cards,
    cardOrder: merged.cardOrder,
    connections: merged.connections,
    threads: merged.threads,
    threadOrder: merged.threadOrder,
    groups: merged.groups,
    connectorStyle: "orthogonal",
    canvasBackgroundStyle: "grid",
    canvasTheme: "light",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts: merged.sessionArtifacts,
    canvasArtifactNodes: merged.canvasArtifactNodes,
    canvasArtifactOrder: merged.canvasArtifactOrder,
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}

export function transcriptImportPlaygroundContentCenter(): { x: number; y: number } {
  if (cachedContentCenter) return cachedContentCenter;
  const design = buildDesignToolsCanvasSection();
  const yc = buildYcInterviewCanvasSection();
  return {
    x: ORIGIN_X + CARD_STEP_X * 2.5,
    y: (design.contentCenter.y + yc.contentCenter.y) / 2,
  };
}
