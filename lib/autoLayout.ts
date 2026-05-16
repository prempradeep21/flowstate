import type { Card, Connection } from "@/lib/store";

export const CARD_WIDTH = 420;
export const FOLLOW_UP_GAP = 80;
export const FALLBACK_CARD_HEIGHT = 240;
export const BRANCH_HORIZONTAL_GAP = CARD_WIDTH;
export const COLUMN_STEP = CARD_WIDTH + BRANCH_HORIZONTAL_GAP;

export interface AutoLayoutInput {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
}

export interface Position {
  x: number;
  y: number;
}

function cardHeight(cards: Record<string, Card>, id: string): number {
  return cards[id]?.size?.h ?? FALLBACK_CARD_HEIGHT;
}

function isIndependentRoot(
  id: string,
  connections: Connection[],
): boolean {
  return !connections.some((c) => c.to === id);
}

/** Single follow-up child; lowest Y, then earliest in cardOrder. */
function getFollowUpChild(
  cardId: string,
  input: AutoLayoutInput,
): string | null {
  const { connections, cards, cardOrder } = input;
  const children = connections
    .filter((c) => c.from === cardId && c.fromSide === "bottom")
    .map((c) => c.to)
    .filter((id) => cards[id]);

  if (children.length === 0) return null;
  if (children.length === 1) return children[0];

  children.sort((a, b) => {
    const ya = cards[a].position.y;
    const yb = cards[b].position.y;
    if (ya !== yb) return ya - yb;
    return cardOrder.indexOf(a) - cardOrder.indexOf(b);
  });
  return children[0];
}

function getColumnChain(rootId: string, input: AutoLayoutInput): string[] {
  const chain: string[] = [];
  let current: string | null = rootId;
  const seen = new Set<string>();

  while (current && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = getFollowUpChild(current, input);
  }
  return chain;
}

function getLateralBranchesInTree(
  treeCardIds: Set<string>,
  input: AutoLayoutInput,
): string[] {
  const { connections, cards } = input;
  const branchRoots: string[] = [];

  for (const conn of connections) {
    if (!treeCardIds.has(conn.from)) continue;
    if (conn.fromSide !== "left" && conn.fromSide !== "right") continue;
    if (!cards[conn.to]) continue;
    if (!branchRoots.includes(conn.to)) {
      branchRoots.push(conn.to);
    }
  }

  branchRoots.sort(
    (a, b) => cards[a].position.y - cards[b].position.y,
  );
  return branchRoots;
}

function placeColumnChain(
  chain: string[],
  colIndex: number,
  anchorY: number,
  cards: Record<string, Card>,
  positions: Map<string, Position>,
): void {
  const x = colIndex * COLUMN_STEP;
  let y = anchorY;

  for (const id of chain) {
    positions.set(id, { x, y });
    y += cardHeight(cards, id) + FOLLOW_UP_GAP;
  }
}

function layoutTree(
  rootId: string,
  colIndex: number,
  input: AutoLayoutInput,
  positions: Map<string, Position>,
): number {
  const { cards } = input;
  const card = cards[rootId];
  if (!card) return colIndex;

  const chain = getColumnChain(rootId, input);
  const treeCardIds = new Set(chain);
  const anchorY = card.position.y;

  placeColumnChain(chain, colIndex, anchorY, cards, positions);

  const branchRoots = getLateralBranchesInTree(treeCardIds, input);
  let nextCol = colIndex + 1;
  for (const branchId of branchRoots) {
    nextCol = layoutTree(branchId, nextCol, input, positions);
  }
  return nextCol;
}

export function computeAutoLayout(
  input: AutoLayoutInput,
): Map<string, Position> {
  const { cards, cardOrder, connections } = input;
  const positions = new Map<string, Position>();

  if (cardOrder.length === 0) return positions;

  const independentRoots = cardOrder.filter(
    (id) => cards[id] && isIndependentRoot(id, connections),
  );
  independentRoots.sort(
    (a, b) => cards[a].position.y - cards[b].position.y,
  );

  let nextCol = 0;
  for (const rootId of independentRoots) {
    nextCol = layoutTree(rootId, nextCol, input, positions);
  }

  return positions;
}
