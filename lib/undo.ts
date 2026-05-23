import type { Card, Connection, Thread } from "@/lib/store";

export const MAX_UNDO_STACK = 50;

export interface GraphSnapshot {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  activeThreadId: string | null;
  openArtifactCardId: string | null;
}

export function captureGraphSnapshot(state: {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  activeThreadId: string | null;
  openArtifactCardId: string | null;
}): GraphSnapshot {
  return JSON.parse(JSON.stringify(state)) as GraphSnapshot;
}
