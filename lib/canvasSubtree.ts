/** Minimal edge shape for subtree walks (compatible with store + layout connections). */
export interface SubtreeConnection {
  from: string;
  to: string;
}

/** All card ids reachable from root via outgoing connections (includes root). */
export function collectSubtreeIds(
  connections: SubtreeConnection[],
  rootId: string,
): Set<string> {
  const subtree = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const cid = queue.shift()!;
    if (subtree.has(cid)) continue;
    subtree.add(cid);
    for (const conn of connections) {
      if (conn.from === cid) queue.push(conn.to);
    }
  }
  return subtree;
}
