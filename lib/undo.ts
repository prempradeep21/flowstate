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

export function captureGraphSnapshot(state: {
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
}): GraphSnapshot {
  return JSON.parse(JSON.stringify(state)) as GraphSnapshot;
}
