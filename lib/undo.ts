import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasGifNode,
  CanvasSkill,
  CanvasSkillNode,
  CanvasTextLabel,
  Card,
  Connection,
  Thread,
} from "@/lib/store";

import type { SessionArtifact } from "@/lib/sessionArtifacts";



export const MAX_UNDO_STACK = 50;



export interface GraphSnapshot {

  cards: Record<string, Card>;

  cardOrder: string[];

  connections: Connection[];

  threads: Record<string, Thread>;

  threadOrder: string[];

  activeThreadId: string | null;

  openArtifactCardId: string | null;

  sessionArtifacts: Record<string, SessionArtifact>;

  canvasAssets?: Record<string, CanvasAsset>;

  openSessionArtifactId: string | null;

  openSessionArtifactVersionId: string | null;

  canvasArtifactNodes: Record<string, CanvasArtifactNode>;

  canvasArtifactOrder: string[];

  selectedCanvasArtifactId: string | null;

  canvasAssetNodes?: Record<string, CanvasAssetNode>;

  canvasAssetOrder?: string[];

  selectedCanvasAssetId?: string | null;

  canvasSkills?: Record<string, CanvasSkill>;

  canvasSkillNodes?: Record<string, CanvasSkillNode>;

  canvasSkillOrder?: string[];

  selectedCanvasSkillId?: string | null;

  canvasGifNodes?: Record<string, CanvasGifNode>;

  canvasGifOrder?: string[];

  selectedCanvasGifId?: string | null;

  canvasTextLabels: Record<string, CanvasTextLabel>;

  canvasTextLabelOrder: string[];

  selectedCanvasTextLabelId: string | null;

}



export type GraphSnapshotSource = GraphSnapshot;



/** Deep-clone only graph fields — never pass the full store (avoids undoPast recursion). */

export function captureGraphSnapshot(state: GraphSnapshotSource): GraphSnapshot {

  const snap: GraphSnapshot = {

    cards: state.cards,

    cardOrder: state.cardOrder,

    connections: state.connections,

    threads: state.threads,

    threadOrder: state.threadOrder,

    activeThreadId: state.activeThreadId,

    openArtifactCardId: state.openArtifactCardId,

    sessionArtifacts: state.sessionArtifacts,

    canvasAssets: state.canvasAssets ?? {},

    openSessionArtifactId: state.openSessionArtifactId,

    openSessionArtifactVersionId: state.openSessionArtifactVersionId,

    canvasArtifactNodes: state.canvasArtifactNodes,

    canvasArtifactOrder: state.canvasArtifactOrder,

    selectedCanvasArtifactId: state.selectedCanvasArtifactId,

    canvasAssetNodes: state.canvasAssetNodes ?? {},

    canvasAssetOrder: state.canvasAssetOrder ?? [],

    selectedCanvasAssetId: state.selectedCanvasAssetId ?? null,

    canvasSkills: state.canvasSkills ?? {},

    canvasSkillNodes: state.canvasSkillNodes ?? {},

    canvasSkillOrder: state.canvasSkillOrder ?? [],

    selectedCanvasSkillId: state.selectedCanvasSkillId ?? null,

    canvasGifNodes: state.canvasGifNodes ?? {},

    canvasGifOrder: state.canvasGifOrder ?? [],

    selectedCanvasGifId: state.selectedCanvasGifId ?? null,

    canvasTextLabels: state.canvasTextLabels,

    canvasTextLabelOrder: state.canvasTextLabelOrder,

    selectedCanvasTextLabelId: state.selectedCanvasTextLabelId,

  };

  return structuredClone(snap);

}



/** Pick graph fields from a wider store object before snapshotting. */

export function graphSnapshotFromState<T extends GraphSnapshotSource>(
  state: T,
): GraphSnapshot {

  return captureGraphSnapshot({

    cards: state.cards,

    cardOrder: state.cardOrder,

    connections: state.connections,

    threads: state.threads,

    threadOrder: state.threadOrder,

    activeThreadId: state.activeThreadId,

    openArtifactCardId: state.openArtifactCardId,

    sessionArtifacts: state.sessionArtifacts,

    canvasAssets: state.canvasAssets ?? {},

    openSessionArtifactId: state.openSessionArtifactId,

    openSessionArtifactVersionId: state.openSessionArtifactVersionId,

    canvasArtifactNodes: state.canvasArtifactNodes,

    canvasArtifactOrder: state.canvasArtifactOrder,

    selectedCanvasArtifactId: state.selectedCanvasArtifactId,

    canvasAssetNodes: state.canvasAssetNodes ?? {},

    canvasAssetOrder: state.canvasAssetOrder ?? [],

    selectedCanvasAssetId: state.selectedCanvasAssetId ?? null,

    canvasSkills: state.canvasSkills ?? {},

    canvasSkillNodes: state.canvasSkillNodes ?? {},

    canvasSkillOrder: state.canvasSkillOrder ?? [],

    selectedCanvasSkillId: state.selectedCanvasSkillId ?? null,

    canvasGifNodes: state.canvasGifNodes ?? {},

    canvasGifOrder: state.canvasGifOrder ?? [],

    selectedCanvasGifId: state.selectedCanvasGifId ?? null,

    canvasTextLabels: state.canvasTextLabels,

    canvasTextLabelOrder: state.canvasTextLabelOrder,

    selectedCanvasTextLabelId: state.selectedCanvasTextLabelId,

  });

}

