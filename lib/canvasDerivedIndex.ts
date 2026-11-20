import type { CanvasArtifactNode, Connection } from "@/lib/store";

/**
 * Derived lookups shared by every mounted card, keyed by the identity of the
 * store slice they come from. Zustand runs every component selector on every
 * `set()` — one per pan/zoom frame — so a per-card selector that scans
 * `connections` or `canvasArtifactNodes` costs O(cards × items) per frame.
 * These build the index once per slice version (O(items)) and make each
 * card's selector an O(1) lookup.
 */

const EMPTY_NODES: Record<string, CanvasArtifactNode> = Object.freeze(
  {},
) as Record<string, CanvasArtifactNode>;

const nodesByCardCache = new WeakMap<
  Record<string, CanvasArtifactNode>,
  Map<string, Record<string, CanvasArtifactNode>>
>();

function nodesByCard(
  nodes: Record<string, CanvasArtifactNode>,
): Map<string, Record<string, CanvasArtifactNode>> {
  let index = nodesByCardCache.get(nodes);
  if (index) return index;
  index = new Map();
  for (const [id, node] of Object.entries(nodes)) {
    const cardId = node.sourceCardId;
    if (!cardId) continue;
    let owned = index.get(cardId);
    if (!owned) {
      owned = {};
      index.set(cardId, owned);
    }
    owned[id] = node;
  }
  nodesByCardCache.set(nodes, index);
  return index;
}

/**
 * The artifact nodes a card produced (`sourceCardId === cardId`), as a record
 * so it can stand in for the full map in the Q&A status helpers, which only
 * ever look at a card's own nodes. Pair with `useShallow`: the record is
 * rebuilt per map version, but its entries keep their identity.
 */
export function selectCardArtifactNodes(
  nodes: Record<string, CanvasArtifactNode>,
  cardId: string,
): Record<string, CanvasArtifactNode> {
  return nodesByCard(nodes).get(cardId) ?? EMPTY_NODES;
}

interface ConnectionFlags {
  /** Cards with a follow-up child below them (bottom / unspecified side). */
  hasBottomChild: Set<string>;
  /** Cards that some connection points at. */
  isTarget: Set<string>;
  /** Left/right (lateral branch) connections, by source card. */
  lateralFrom: Map<string, Connection[]>;
}

const NO_CONNECTIONS: readonly Connection[] = Object.freeze([]);

const connectionFlagsCache = new WeakMap<readonly Connection[], ConnectionFlags>();

function connectionFlags(connections: readonly Connection[]): ConnectionFlags {
  let flags = connectionFlagsCache.get(connections);
  if (flags) return flags;
  flags = { hasBottomChild: new Set(), isTarget: new Set(), lateralFrom: new Map() };
  for (const c of connections) {
    if (c.fromSide === "bottom" || c.fromSide == null) {
      flags.hasBottomChild.add(c.from);
    } else if (c.fromSide === "left" || c.fromSide === "right") {
      const list = flags.lateralFrom.get(c.from);
      if (list) list.push(c);
      else flags.lateralFrom.set(c.from, [c]);
    }
    flags.isTarget.add(c.to);
  }
  connectionFlagsCache.set(connections, flags);
  return flags;
}

export function cardHasBottomChild(
  connections: readonly Connection[],
  cardId: string,
): boolean {
  return connectionFlags(connections).hasBottomChild.has(cardId);
}

export function cardIsConnectionTarget(
  connections: readonly Connection[],
  cardId: string,
): boolean {
  return connectionFlags(connections).isTarget.has(cardId);
}

/** A card's outgoing left/right connections, in connection order. */
export function lateralConnectionsFrom(
  connections: readonly Connection[],
  cardId: string,
): readonly Connection[] {
  return connectionFlags(connections).lateralFrom.get(cardId) ?? NO_CONNECTIONS;
}
