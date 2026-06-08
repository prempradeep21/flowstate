import type { Card, Connection, Thread } from "@/lib/store";

export interface ChatThreadState {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
}

export interface SidebarNode {
  threadId: string;
  title: string;
  branches: SidebarNode[];
}

function cardsInThread(state: ChatThreadState, threadId: string): Card[] {
  return state.cardOrder
    .map((id) => state.cards[id])
    .filter((c): c is Card => Boolean(c && c.threadId === threadId));
}

export function getThreadRootCard(
  state: ChatThreadState,
  threadId: string,
): Card | null {
  const inThread = cardsInThread(state, threadId);
  const roots = inThread.filter((c) => c.parentCardId === null);
  if (roots.length === 0) return inThread[0] ?? null;
  roots.sort(
    (a, b) => state.cardOrder.indexOf(a.id) - state.cardOrder.indexOf(b.id),
  );
  return roots[0];
}

function isBranchThread(state: ChatThreadState, threadId: string): boolean {
  const root = getThreadRootCard(state, threadId);
  if (!root) return false;
  return state.connections.some(
    (c) =>
      c.to === root.id &&
      (c.fromSide === "left" || c.fromSide === "right"),
  );
}

function getBranchParentThreadId(
  state: ChatThreadState,
  branchThreadId: string,
): string | null {
  const root = getThreadRootCard(state, branchThreadId);
  if (!root) return null;
  const conn = state.connections.find(
    (c) =>
      c.to === root.id &&
      (c.fromSide === "left" || c.fromSide === "right"),
  );
  if (!conn) return null;
  return state.cards[conn.from]?.threadId ?? null;
}

export function getThreadTitle(state: ChatThreadState, threadId: string): string {
  const chain = getThreadCardChain(state, threadId);
  for (const id of chain) {
    const q = state.cards[id]?.question.trim();
    if (q) return q.length > 48 ? `${q.slice(0, 48)}…` : q;
  }
  return "New chat";
}

/** Ordered card ids in a thread's main follow-up chain (top → bottom). */
export function getThreadCardChain(
  state: ChatThreadState,
  threadId: string,
): string[] {
  const root = getThreadRootCard(state, threadId);
  if (!root) return [];

  const chain: string[] = [root.id];
  let current = root.id;

  while (true) {
    const conn = state.connections.find(
      (c) =>
        c.from === current &&
        (c.fromSide === "bottom" || c.fromSide == null) &&
        state.cards[c.to]?.threadId === threadId,
    );
    if (!conn) break;
    chain.push(conn.to);
    current = conn.to;
  }

  return chain;
}

export function getThreadTailCardId(
  state: ChatThreadState,
  threadId: string,
): string | null {
  const chain = getThreadCardChain(state, threadId);
  return chain[chain.length - 1] ?? null;
}

function branchesOf(
  state: ChatThreadState,
  parentThreadId: string,
): SidebarNode[] {
  return state.threadOrder
    .filter(
      (tid) =>
        isBranchThread(state, tid) &&
        getBranchParentThreadId(state, tid) === parentThreadId,
    )
    .map((tid) => ({
      threadId: tid,
      title: getThreadTitle(state, tid),
      branches: branchesOf(state, tid),
    }));
}

export function buildSidebarTree(state: ChatThreadState): SidebarNode[] {
  return state.threadOrder
    .filter((tid) => !isBranchThread(state, tid))
    .map((tid) => ({
      threadId: tid,
      title: getThreadTitle(state, tid),
      branches: branchesOf(state, tid),
    }));
}

export function pickDefaultThreadId(state: ChatThreadState): string | null {
  const tree = buildSidebarTree(state);
  return tree[0]?.threadId ?? state.threadOrder[0] ?? null;
}

/** Walk branch-parent links until the main (non-branch) root thread id. */
export function getFamilyRootThreadId(
  state: ChatThreadState,
  threadId: string,
): string {
  let current = threadId;
  const seen = new Set<string>();
  while (true) {
    if (seen.has(current)) break;
    seen.add(current);
    if (!isBranchThread(state, current)) return current;
    const parent = getBranchParentThreadId(state, current);
    if (!parent) return current;
    current = parent;
  }
  return current;
}

function collectBranchThreadIds(
  state: ChatThreadState,
  node: SidebarNode,
  out: string[],
): void {
  out.push(node.threadId);
  for (const branch of node.branches) {
    collectBranchThreadIds(state, branch, out);
  }
}

/** Root thread id plus all nested tributary branch thread ids. */
export function getFamilyThreadIds(
  state: ChatThreadState,
  rootThreadId: string,
): string[] {
  const tree = buildSidebarTree(state);
  const node = tree.find((n) => n.threadId === rootThreadId);
  if (!node) return [rootThreadId];
  const ids: string[] = [];
  collectBranchThreadIds(state, node, ids);
  return ids;
}

/** All card ids belonging to a thread family. */
export function getFamilyCardIds(
  state: ChatThreadState,
  rootThreadId: string,
): string[] {
  const threadIds = new Set(getFamilyThreadIds(state, rootThreadId));
  return state.cardOrder.filter((id) => {
    const card = state.cards[id];
    return card && threadIds.has(card.threadId);
  });
}

export function isCardInSelectedFamilies(
  state: ChatThreadState,
  cardId: string,
  selectedFamilyRootIds: string[],
): boolean {
  const card = state.cards[cardId];
  if (!card || selectedFamilyRootIds.length === 0) return false;
  const root = getFamilyRootThreadId(state, card.threadId);
  return selectedFamilyRootIds.includes(root);
}

export interface LateralBranchFromCard {
  side: "left" | "right";
  threadId: string;
  branchRootCardId: string;
}

/** Lateral branches pulled directly from a card (left/right outgoing connections). */
export function getLateralBranchesFromCard(
  connections: readonly Connection[],
  cards: Record<string, Card>,
  cardId: string,
): LateralBranchFromCard[] {
  const branches: LateralBranchFromCard[] = [];
  for (const conn of connections) {
    if (conn.from !== cardId) continue;
    if (conn.fromSide !== "left" && conn.fromSide !== "right") continue;
    const branchRoot = cards[conn.to];
    if (!branchRoot) continue;
    branches.push({
      side: conn.fromSide,
      threadId: branchRoot.threadId,
      branchRootCardId: branchRoot.id,
    });
  }
  return branches;
}

function findSidebarNode(
  nodes: SidebarNode[],
  threadId: string,
): SidebarNode | null {
  for (const node of nodes) {
    if (node.threadId === threadId) return node;
    const nested = findSidebarNode(node.branches, threadId);
    if (nested) return nested;
  }
  return null;
}

function collectSubtreeThreadIds(node: SidebarNode, out: string[]): void {
  out.push(node.threadId);
  for (const branch of node.branches) {
    collectSubtreeThreadIds(branch, out);
  }
}

/** Branch thread id plus all nested tributary branch thread ids under it. */
export function getBranchSubtreeThreadIds(
  state: ChatThreadState,
  branchThreadId: string,
): string[] {
  const tree = buildSidebarTree(state);
  const node = findSidebarNode(tree, branchThreadId);
  if (!node) return [branchThreadId];
  const ids: string[] = [];
  collectSubtreeThreadIds(node, ids);
  return ids;
}

export interface CollapseVisibilityState extends ChatThreadState {
  collapsedBranchThreadIds: string[];
}

/** Card ids hidden because their branch thread subtree is collapsed on the canvas. */
export function getHiddenCardIds(state: CollapseVisibilityState): Set<string> {
  const hiddenThreadIds = new Set<string>();
  for (const branchThreadId of state.collapsedBranchThreadIds) {
    for (const tid of getBranchSubtreeThreadIds(state, branchThreadId)) {
      hiddenThreadIds.add(tid);
    }
  }
  const hidden = new Set<string>();
  for (const id of state.cardOrder) {
    const card = state.cards[id];
    if (card && hiddenThreadIds.has(card.threadId)) {
      hidden.add(id);
    }
  }
  return hidden;
}

export function isConnectionHidden(
  state: CollapseVisibilityState,
  conn: Connection,
): boolean {
  const hidden = getHiddenCardIds(state);
  return hidden.has(conn.from) || hidden.has(conn.to);
}
