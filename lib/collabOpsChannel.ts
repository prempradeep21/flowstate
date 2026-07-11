import type { RealtimeChannel } from "@supabase/supabase-js";
import type { CanvasOpBatch } from "@/lib/canvasOps";

/**
 * Bridge between the collab hook (which owns the realtime channel) and the
 * persistence hook (which produces op batches on its save debounce). Module
 * singleton, same pattern as the gesture layer.
 *
 * Ops ride the existing per-canvas presence channel as a broadcast event —
 * 1–5KB deltas at edit cadence instead of ~1MB snapshot rows through the
 * postgres_changes replication poller (which stays enabled as an eventual-
 * consistency safety net during the flag-gated rollout).
 */

export const CANVAS_OPS_EVENT = "canvas-ops";

/** Client rollout flag for op-log persistence + delta broadcast. */
export function canvasOpsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CANVAS_OPS === "1";
}

let channel: RealtimeChannel | null = null;
/** Batch ids we sent — self-echo suppression on the broadcast. */
const sentBatchIds = new Set<string>();
const SENT_BATCH_CAP = 256;

export function setCanvasOpsChannel(next: RealtimeChannel | null): void {
  channel = next;
}

export function rememberSentBatch(batchId: string): void {
  sentBatchIds.add(batchId);
  if (sentBatchIds.size > SENT_BATCH_CAP) {
    const first = sentBatchIds.values().next().value;
    if (first) sentBatchIds.delete(first);
  }
}

export function wasBatchSentLocally(batchId: string): boolean {
  return sentBatchIds.has(batchId);
}

/** Fire-and-forget delta broadcast to canvas collaborators. */
export function sendCanvasOpsBroadcast(batch: CanvasOpBatch): void {
  if (!channel) return;
  rememberSentBatch(batch.batchId);
  void channel.send({
    type: "broadcast",
    event: CANVAS_OPS_EVENT,
    payload: batch,
  });
}
