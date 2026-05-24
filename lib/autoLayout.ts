import type { Card, Connection } from "@/lib/store";
import {
  CARD_WIDTH,
  FALLBACK_CARD_HEIGHT,
  getCardBounds,
} from "@/lib/canvasNodeBounds";
import {
  COLUMN_STEP,
  FOLLOW_UP_GAP,
  BRANCH_HORIZONTAL_GAP,
  getFollowUpChild,
} from "@/lib/canvasLayout";

export { CARD_WIDTH, FALLBACK_CARD_HEIGHT };
export { FOLLOW_UP_GAP, BRANCH_HORIZONTAL_GAP, COLUMN_STEP };

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
  const card = cards[id];
  if (!card) return FALLBACK_CARD_HEIGHT;
  return getCardBounds(card).h;
}

function isIndependentRoot(
  id: string,
  connections: Connection[],
): boolean {
  return !connections.some((c) => c.to === id);
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
