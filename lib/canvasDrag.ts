import { useCanvasStore } from "@/lib/store";

/** Cancel spawn pop-up animation when the user starts dragging this node. */
export function clearSpawnMetaIfDragging(targetId: string) {
  const { spawnMeta, clearSpawnMeta } = useCanvasStore.getState();
  if (spawnMeta?.targetId === targetId) clearSpawnMeta();
}
