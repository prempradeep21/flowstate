import { afterEach, describe, expect, it } from "vitest";
import { isEphemeralFixtureSessionActive } from "@/lib/ephemeralCanvasSessions";
import {
  beginTranscriptImportPlaygroundSession,
  endTranscriptImportPlaygroundSession,
  isTranscriptImportPlaygroundSessionActive,
} from "@/lib/transcriptImportPlaygroundSession";
import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

/**
 * The contract executeSave's guard depends on.
 *
 * A fixture session puts foreign content in the store while canvasIdRef still
 * points at a real canvas. executeSave refuses to write while the flag is up,
 * so the flag must be up for the WHOLE window the store holds that content —
 * including during the restore on the way out, which is itself a store write.
 */

const source = (marker: string) =>
  ({ cards: { [marker]: {} } }) as unknown as CanvasSnapshotSource;

afterEach(() => {
  if (isTranscriptImportPlaygroundSessionActive()) {
    endTranscriptImportPlaygroundSession(() => {});
  }
});

describe("transcript playground session guard", () => {
  it("reports as an ephemeral fixture session while active", () => {
    expect(isEphemeralFixtureSessionActive()).toBe(false);
    beginTranscriptImportPlaygroundSession(source("real-canvas"));
    expect(isEphemeralFixtureSessionActive()).toBe(true);
  });

  it("is still active while the restore runs", () => {
    // The restore hydrates the user's real canvas back into the store. If the
    // flag dropped first, that write would schedule a save of half-restored
    // state against whichever canvas the ref points at.
    beginTranscriptImportPlaygroundSession(source("real-canvas"));

    let activeDuringRestore: boolean | null = null;
    endTranscriptImportPlaygroundSession(() => {
      activeDuringRestore = isEphemeralFixtureSessionActive();
    });

    expect(activeDuringRestore).toBe(true);
    expect(isEphemeralFixtureSessionActive()).toBe(false);
  });

  it("ignores a repeat begin so the stash keeps the real canvas", () => {
    // By the second begin the store already holds playground content; re-
    // stashing would make the restore write that over the user's canvas.
    beginTranscriptImportPlaygroundSession(source("real-canvas"));
    beginTranscriptImportPlaygroundSession(source("playground-content"));

    let restored: CanvasSnapshotSource | null = null;
    endTranscriptImportPlaygroundSession((snap) => {
      restored = snap;
    });

    expect(Object.keys((restored as unknown as CanvasSnapshotSource).cards))
      .toEqual(["real-canvas"]);
  });
});
