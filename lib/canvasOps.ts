import type { CanvasPersistSlice } from "@/lib/canvasPersistDirty";

/**
 * Entity-level op log over the persisted canvas slice.
 *
 * Ops are idempotent whole-entity LWW writes keyed by (field, id) — the
 * Figma-style model. Replaying a batch is a pure function of the previous
 * slice, and `applyOps(prev, diffSlices(prev, next))` reproduces `next`
 * exactly (round-trip tested). The viewport is deliberately excluded:
 * it is per-user ephemeral state, never synced.
 *
 * Diffing relies on the store's immutable updates: a changed entity is a
 * changed reference, so diff cost is proportional to entity counts with no
 * serialization — this permanently replaces snapshot-stringify comparisons
 * in the collab path.
 */

/** Record<string, entity> fields — diffed per entity id. */
export const CANVAS_OP_RECORD_FIELDS = [
  "cards",
  "threads",
  "groups",
  "sessionArtifacts",
  "canvasAssets",
  "canvasArtifactNodes",
  "canvasAssetNodes",
  "canvasTextLabels",
  "canvasGifNodes",
  "canvas3DNodes",
  "canvasStrokes",
] as const;

/** Whole-value fields (order arrays, connection list, style scalars). */
export const CANVAS_OP_VALUE_FIELDS = [
  "cardOrder",
  "connections",
  "threadOrder",
  "connectorStyle",
  "canvasBackgroundStyle",
  "canvasBackgroundImageId",
  "canvasTheme",
  "selectedModel",
  "viewMode",
  "canvasArtifactOrder",
  "canvasAssetOrder",
  "canvasTextLabelOrder",
  "canvasGifOrder",
  "canvas3DOrder",
  "canvasStrokeOrder",
  "uploadedAttachments",
] as const;

export type CanvasOpRecordField = (typeof CANVAS_OP_RECORD_FIELDS)[number];
export type CanvasOpValueField = (typeof CANVAS_OP_VALUE_FIELDS)[number];

export type CanvasOp =
  | { t: "upsert"; field: CanvasOpRecordField; id: string; value: unknown }
  | { t: "delete"; field: CanvasOpRecordField; id: string }
  | { t: "set"; field: CanvasOpValueField; value: unknown };

export interface CanvasOpBatch {
  batchId: string;
  actorId: string;
  baseRev: number;
  ops: CanvasOp[];
}

type RecordSlice = Record<string, unknown>;

function recordOf(
  slice: CanvasPersistSlice,
  field: CanvasOpRecordField,
): RecordSlice {
  return ((slice as unknown as Record<string, unknown>)[field] ??
    {}) as RecordSlice;
}

/**
 * Diff two persist slices into an op batch. Reference-equality walk — cheap
 * on store-sourced slices (immutable updates). Entities that were replaced
 * with identical content produce harmless idempotent upserts.
 */
export function diffSlices(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): CanvasOp[] {
  const ops: CanvasOp[] = [];

  for (const field of CANVAS_OP_RECORD_FIELDS) {
    const prevRec = recordOf(prev, field);
    const nextRec = recordOf(next, field);
    if (prevRec === nextRec) continue;

    for (const id of Object.keys(nextRec)) {
      if (prevRec[id] !== nextRec[id]) {
        ops.push({ t: "upsert", field, id, value: nextRec[id] });
      }
    }
    for (const id of Object.keys(prevRec)) {
      if (!(id in nextRec)) {
        ops.push({ t: "delete", field, id });
      }
    }
  }

  for (const field of CANVAS_OP_VALUE_FIELDS) {
    const prevVal = (prev as unknown as Record<string, unknown>)[field];
    const nextVal = (next as unknown as Record<string, unknown>)[field];
    if (prevVal !== nextVal) {
      ops.push({ t: "set", field, value: nextVal });
    }
  }

  return ops;
}

/** Apply an op list to a slice, returning a new slice (input untouched). */
export function applyOps(
  slice: CanvasPersistSlice,
  ops: CanvasOp[],
): CanvasPersistSlice {
  if (ops.length === 0) return slice;

  const out = { ...(slice as unknown as Record<string, unknown>) };
  const copiedRecords = new Set<string>();

  for (const op of ops) {
    if (op.t === "set") {
      out[op.field] = op.value;
      continue;
    }
    if (!copiedRecords.has(op.field)) {
      out[op.field] = { ...((out[op.field] ?? {}) as RecordSlice) };
      copiedRecords.add(op.field);
    }
    const rec = out[op.field] as RecordSlice;
    if (op.t === "upsert") {
      rec[op.id] = op.value;
    } else {
      delete rec[op.id];
    }
  }

  return out as unknown as CanvasPersistSlice;
}

/** Rough payload size guard — batches beyond this fall back to snapshot save. */
export function opsByteSize(ops: CanvasOp[]): number {
  return JSON.stringify(ops).length;
}
