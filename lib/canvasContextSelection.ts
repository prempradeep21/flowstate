import type { CanvasSelectionKind } from "@/lib/canvasSelection";
import { getLandingCardId } from "@/lib/canvasLandingState";
import { getFamilyCardIds, getFamilyRootThreadId } from "@/lib/chatThreads";
import type { useCanvasStore } from "@/lib/store";

type CanvasStore = ReturnType<typeof useCanvasStore.getState>;

export type CanvasContextHit =
  | { kind: "card"; id: string }
  | { kind: CanvasSelectionKind; id: string };

const NODE_SELECTOR: Record<CanvasSelectionKind, string> = {
  artifact: "[data-canvas-artifact]",
  asset: "[data-canvas-asset]",
  gif: "[data-canvas-gif]",
  "3d": "[data-canvas-3d]",
  skill: "[data-canvas-skill]",
  label: "[data-canvas-text-label]",
};

/** Resolve the canvas node under a context-menu pointer target. */
export function resolveCanvasContextHit(
  target: HTMLElement,
): CanvasContextHit | null {
  const cardEl = target.closest("[data-canvas-card]");
  if (cardEl) {
    const id = cardEl.getAttribute("data-canvas-card");
    return id ? { kind: "card", id } : null;
  }

  for (const kind of Object.keys(NODE_SELECTOR) as CanvasSelectionKind[]) {
    const el = target.closest(NODE_SELECTOR[kind]);
    if (!el) continue;
    const id = el.getAttribute("data-canvas-node-id");
    if (id) return { kind, id };
  }

  return null;
}

/** Replace the unified selection with the node under the context-menu target. */
export function applyContextMenuSelection(
  store: CanvasStore,
  hit: CanvasContextHit,
): void {
  if (hit.kind === "card") {
    const card = store.cards[hit.id];
    if (!card) return;
    const rootId = getFamilyRootThreadId(store, card.threadId);
    store.setCanvasSelection({
      familyRootIds: [rootId],
      items: [],
    });
    return;
  }

  store.setCanvasSelection({
    familyRootIds: [],
    items: [{ kind: hit.kind, id: hit.id }],
  });
}

export { canCopyCanvasSelection } from "@/lib/canvasClipboard";

export function hasCanvasSelection(store: CanvasStore): boolean {
  return (
    store.selectedFamilyRootIds.length > 0 || store.canvasSelection.length > 0
  );
}
/** Whether the current selection would actually remove something from the canvas. */
export function canRemoveCanvasSelection(store: CanvasStore): boolean {
  if (store.canvasReadOnly) return false;

  const landingId = getLandingCardId(store.cards, store.cardOrder);
  for (const rootId of store.selectedFamilyRootIds) {
    for (const id of getFamilyCardIds(store, rootId)) {
      if (id === landingId) {
        const landing = store.cards[id];
        if (landing?.status === "empty") continue;
      }
      return true;
    }
  }

  return store.canvasSelection.length > 0;
}

export function isContextHitInSelection(
  store: CanvasStore,
  hit: CanvasContextHit,
): boolean {
  if (hit.kind === "card") {
    const card = store.cards[hit.id];
    if (!card) return false;
    const rootId = getFamilyRootThreadId(store, card.threadId);
    return store.selectedFamilyRootIds.includes(rootId);
  }

  return store.canvasSelection.some(
    (item) => item.kind === hit.kind && item.id === hit.id,
  );
}
