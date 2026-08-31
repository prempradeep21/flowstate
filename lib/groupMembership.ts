import type { CanvasSelectionItem, CanvasSelectionKind } from "@/lib/canvasSelection";
import { getFamilyCardIds, getFamilyRootThreadId } from "@/lib/chatThreads";
import type { ChatThreadState } from "@/lib/chatThreads";
import type { GestureNodeRef } from "@/lib/gesture/gestureLayer";
import { useCanvasStore, type BranchGroup } from "@/lib/store";

/** Non-card members; absent on groups created before items existed. */
export function getGroupItems(group: BranchGroup): CanvasSelectionItem[] {
  return group.items ?? [];
}

/** The group containing a non-card canvas node, if any (nodes join one group at most). */
export function findGroupForItem(
  groups: Record<string, BranchGroup>,
  kind: CanvasSelectionKind,
  id: string,
): BranchGroup | null {
  for (const group of Object.values(groups)) {
    if (getGroupItems(group).some((i) => i.kind === kind && i.id === id)) {
      return group;
    }
  }
  return null;
}

/** The group containing a thread family, if any. */
export function findGroupForFamily(
  groups: Record<string, BranchGroup>,
  rootThreadId: string,
): BranchGroup | null {
  for (const group of Object.values(groups)) {
    if (group.familyRootThreadIds.includes(rootThreadId)) return group;
  }
  return null;
}

/** The group containing a card (via its thread family), if any. */
export function findGroupForCard(
  state: ChatThreadState & { groups: Record<string, BranchGroup> },
  cardId: string,
): BranchGroup | null {
  const card = state.cards[cardId];
  if (!card) return null;
  return findGroupForFamily(
    state.groups,
    getFamilyRootThreadId(state, card.threadId),
  );
}

/**
 * Every member as a gesture ref (cards expanded from families) — the drag
 * layer transforms these DOM nodes while a group moves as one unit.
 */
export function groupGestureRefs(
  state: ChatThreadState,
  group: BranchGroup,
): GestureNodeRef[] {
  // The container visual itself is part of the gesture — without it the
  // members transform per frame while the section box waits for the store
  // commit on drop and visibly trails the contents.
  const refs: GestureNodeRef[] = [{ kind: "group", id: group.id }];
  for (const rootId of group.familyRootThreadIds) {
    for (const cardId of getFamilyCardIds(state, rootId)) {
      refs.push({ kind: "card", id: cardId });
    }
  }
  for (const item of getGroupItems(group)) {
    refs.push({ kind: item.kind, id: item.id });
  }
  return refs;
}

/*
 * Group-aware drag routing ("locked positions"): dragging any member moves
 * the whole group. Node components plug these into useCanvasNodeDrag —
 * `null`/`false` means "not in a group, use your single-node behavior".
 * Alt-drag copies stay single-node: the copy's id is not a member.
 */

export function groupRefsForItemDrag(
  kind: CanvasSelectionKind,
  targetId: string,
): GestureNodeRef[] | null {
  const st = useCanvasStore.getState();
  const group = findGroupForItem(st.groups, kind, targetId);
  return group ? groupGestureRefs(st, group) : null;
}

export function commitGroupMoveForItem(
  kind: CanvasSelectionKind,
  targetId: string,
  dx: number,
  dy: number,
): boolean {
  const st = useCanvasStore.getState();
  const group = findGroupForItem(st.groups, kind, targetId);
  if (!group) return false;
  st.moveGroupBy(group.id, dx, dy);
  return true;
}

export function groupRefsForCardDrag(cardId: string): GestureNodeRef[] | null {
  const st = useCanvasStore.getState();
  const group = findGroupForCard(st, cardId);
  return group ? groupGestureRefs(st, group) : null;
}

export function commitGroupMoveForCard(
  cardId: string,
  dx: number,
  dy: number,
): boolean {
  const st = useCanvasStore.getState();
  const group = findGroupForCard(st, cardId);
  if (!group) return false;
  st.moveGroupBy(group.id, dx, dy);
  return true;
}
