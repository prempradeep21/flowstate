import { afterEach, describe, expect, it } from "vitest";
import { isEphemeralFixtureSessionActive } from "@/lib/ephemeralCanvasSessions";
import {
  adoptPublishedCanvasSession,
  beginPublishedCanvasSession,
  endPublishedCanvasSession,
  isPublishedCanvasAdopted,
  isPublishedCanvasSessionActive,
  releasePublishedCanvasAdoption,
} from "@/lib/publishedCanvasSession";
import type { CanvasSnapshotSource } from "@/lib/canvasSnapshot";

const source = { cards: { mine: { question: "my own work" } } } as unknown as
  CanvasSnapshotSource;

afterEach(() => {
  endPublishedCanvasSession();
});

describe("published canvas session", () => {
  it("is inert until a session begins", () => {
    expect(isPublishedCanvasSessionActive()).toBe(false);
    expect(isEphemeralFixtureSessionActive()).toBe(false);
  });

  it("suppresses autosave while a published canvas is open", () => {
    // THE critical property. A signed-in visitor opening /c/<slug> is not a
    // guest, so without this the autosave treats the published snapshot as an
    // edit to THEIR canvas and overwrites it — silently.
    beginPublishedCanvasSession(source);
    expect(isEphemeralFixtureSessionActive()).toBe(true);
  });

  it("hands back the visitor's own canvas to restore on the way out", () => {
    beginPublishedCanvasSession(source);
    const restored = endPublishedCanvasSession();
    expect(restored).toEqual(source);
    expect(isEphemeralFixtureSessionActive()).toBe(false);
  });

  it("deep-copies the stash, so canvas edits cannot corrupt the restore", () => {
    const live = JSON.parse(JSON.stringify(source)) as Record<string, never>;
    beginPublishedCanvasSession(live as unknown as CanvasSnapshotSource);
    // Simulate the visitor editing the store after the session began.
    (live as unknown as { cards: Record<string, unknown> }).cards = {};
    const restored = endPublishedCanvasSession() as unknown as {
      cards: Record<string, unknown>;
    };
    expect(Object.keys(restored.cards)).toEqual(["mine"]);
  });

  it("clears the stash so a second session cannot restore a stale canvas", () => {
    beginPublishedCanvasSession(source);
    endPublishedCanvasSession();
    expect(endPublishedCanvasSession()).toBeNull();
  });
});

describe("adopting a published canvas", () => {
  it("un-mutes autosave so the adopted fork is actually written", () => {
    // The bug this exists to kill: a signed-in visitor forked, the app said
    // "Saved to your canvases", and nothing was ever written because the
    // session kept autosave muted for the life of the page.
    beginPublishedCanvasSession(source);
    adoptPublishedCanvasSession();
    expect(isPublishedCanvasSessionActive()).toBe(false);
    expect(isEphemeralFixtureSessionActive()).toBe(false);
  });

  it("stays flagged as adopted so the normal load keeps standing down", () => {
    beginPublishedCanvasSession(source);
    adoptPublishedCanvasSession();
    expect(isPublishedCanvasAdopted()).toBe(true);
  });

  it("is a mutex: a second adopt cannot mint a second canvas", () => {
    beginPublishedCanvasSession(source);
    adoptPublishedCanvasSession();
    // The adopt path bails on an inactive session, so re-entry is a no-op.
    expect(isPublishedCanvasSessionActive()).toBe(false);
  });

  it("re-mutes autosave when an adoption fails", () => {
    beginPublishedCanvasSession(source);
    adoptPublishedCanvasSession();
    releasePublishedCanvasAdoption();
    expect(isPublishedCanvasSessionActive()).toBe(true);
    expect(isPublishedCanvasAdopted()).toBe(false);
    expect(isEphemeralFixtureSessionActive()).toBe(true);
  });

  it("cannot be released once the session is over", () => {
    // No stash left means no page to protect — re-arming here would mute a
    // real canvas's autosave for the rest of the tab's life.
    beginPublishedCanvasSession(source);
    endPublishedCanvasSession();
    releasePublishedCanvasAdoption();
    expect(isPublishedCanvasSessionActive()).toBe(false);
  });

  it("clears the adopted flag on the way out", () => {
    beginPublishedCanvasSession(source);
    adoptPublishedCanvasSession();
    endPublishedCanvasSession();
    expect(isPublishedCanvasAdopted()).toBe(false);
  });
});
