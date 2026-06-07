import type {
  CanvasArtifactNode,
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
  openSessionArtifactId: string | null;
  openSessionArtifactVersionId: string | null;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  selectedCanvasArtifactId: string | null;
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
    openSessionArtifactId: state.openSessionArtifactId,
    openSessionArtifactVersionId: state.openSessionArtifactVersionId,
    canvasArtifactNodes: state.canvasArtifactNodes,
    canvasArtifactOrder: state.canvasArtifactOrder,
    selectedCanvasArtifactId: state.selectedCanvasArtifactId,
    canvasTextLabels: state.canvasTextLabels,
    canvasTextLabelOrder: state.canvasTextLabelOrder,
    selectedCanvasTextLabelId: state.selectedCanvasTextLabelId,
  };
  return structuredClone(snap);
}

/** Pick graph fields from a wider store object before snapshotting. */
export function graphSnapshotFromState(
  state: GraphSnapshotSource & Record<string, unknown>,
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
    openSessionArtifactId: state.openSessionArtifactId,
    openSessionArtifactVersionId: state.openSessionArtifactVersionId,
    canvasArtifactNodes: state.canvasArtifactNodes,
    canvasArtifactOrder: state.canvasArtifactOrder,
    selectedCanvasArtifactId: state.selectedCanvasArtifactId,
    canvasTextLabels: state.canvasTextLabels,
    canvasTextLabelOrder: state.canvasTextLabelOrder,
    selectedCanvasTextLabelId: state.selectedCanvasTextLabelId,
  });
}
