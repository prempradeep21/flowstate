import { useCanvasStore } from "@/lib/store";

/** Card that produced or hosts this session artifact (for branch-from-selection). */
export function findSourceCardIdForArtifact(artifactId: string): string | null {
  const state = useCanvasStore.getState();

  for (const id of state.cardOrder) {
    const card = state.cards[id];
    if (card?.outputArtifactId === artifactId) return id;
  }

  for (const node of Object.values(state.canvasArtifactNodes)) {
    if (node.artifactId === artifactId && node.sourceCardId) {
      return node.sourceCardId;
    }
  }

  return null;
}
