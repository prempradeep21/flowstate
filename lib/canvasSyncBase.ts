import type { CanvasSnapshot } from "@/lib/canvasSnapshot";

/**
 * The last canvas state this client and the server agreed on, per canvas:
 * set after a successful save (what we wrote) and after loading a snapshot
 * from the server (what they had). A save that loses the optimistic lock
 * merges three-way against it (mergeCanvasSnapshots), so only items this
 * client actually changed override the server's.
 *
 * Holding the store's own records (or a parsed snapshot) is cheap: entities
 * are immutable, so this keeps references, not copies.
 */
const bases = new Map<string, Partial<CanvasSnapshot>>();

export function setCanvasSyncBase(
  canvasId: string,
  snapshot: Partial<CanvasSnapshot>,
): void {
  bases.set(canvasId, snapshot);
}

export function getCanvasSyncBase(
  canvasId: string,
): Partial<CanvasSnapshot> | null {
  return bases.get(canvasId) ?? null;
}

/**
 * True when `incoming` (an ISO timestamp from the server) is older than
 * `known`: a stale echo or an out-of-order delivery, never to be applied.
 */
export function isOlderTimestamp(
  incoming: string | null | undefined,
  known: string | null | undefined,
): boolean {
  if (!incoming || !known) return false;
  const a = Date.parse(incoming);
  const b = Date.parse(known);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return a < b;
}
