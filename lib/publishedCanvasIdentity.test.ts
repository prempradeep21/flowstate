import { describe, expect, it } from "vitest";
import {
  resolvePublishedCanvasIdentity,
  type PublishedOriginSummary,
} from "@/lib/publishedCanvasIdentity";

const viewing: PublishedOriginSummary = {
  title: "Alternate Telugu Filmmaking",
  ownerName: "Prem Pradeep",
  forked: false,
  forkSaveState: "idle",
};

const base = {
  signedIn: true,
  supabaseConfigured: true,
  localReadOnly: false,
};

describe("resolvePublishedCanvasIdentity", () => {
  it("leaves the chip alone off a published link", () => {
    expect(
      resolvePublishedCanvasIdentity({ ...base, origin: null }),
    ).toBeNull();
  });

  it("names the published canvas and its publisher while viewing", () => {
    expect(
      resolvePublishedCanvasIdentity({ ...base, origin: viewing }),
    ).toEqual({
      title: "Alternate Telugu Filmmaking",
      subtitle:
        "Published by Prem Pradeep · ask anything to start your own copy",
      action: null,
    });
  });

  it("still explains the ask when the publisher has no name", () => {
    const identity = resolvePublishedCanvasIdentity({
      ...base,
      origin: { ...viewing, ownerName: null },
    });
    expect(identity?.subtitle).toBe("Ask anything to start your own copy");
  });

  it("reads like an owned canvas once the copy is safely theirs", () => {
    for (const forkSaveState of ["idle", "saving", "saved"] as const) {
      expect(
        resolvePublishedCanvasIdentity({
          ...base,
          origin: { ...viewing, forked: true, forkSaveState },
        }),
      ).toEqual({
        title: "Alternate Telugu Filmmaking (copy)",
        subtitle: null,
        action: null,
      });
    }
  });

  it("warns a guest that the copy is theirs to lose", () => {
    expect(
      resolvePublishedCanvasIdentity({
        ...base,
        signedIn: false,
        origin: { ...viewing, forked: true, forkSaveState: "idle" },
      }),
    ).toEqual({
      title: "Alternate Telugu Filmmaking (copy)",
      subtitle: "Sign in to keep it — the original is untouched.",
      action: { kind: "sign-in", label: "Sign in to keep" },
    });
  });

  it("drops the sign-in button when there is nothing to sign in to", () => {
    const identity = resolvePublishedCanvasIdentity({
      ...base,
      signedIn: false,
      supabaseConfigured: false,
      origin: { ...viewing, forked: true, forkSaveState: "idle" },
    });
    expect(identity?.action).toBeNull();
    expect(identity?.subtitle).toBe(
      "Sign in to keep it — the original is untouched.",
    );
  });

  it("does not promise a save a local session never makes", () => {
    expect(
      resolvePublishedCanvasIdentity({
        ...base,
        localReadOnly: true,
        origin: { ...viewing, forked: true, forkSaveState: "idle" },
      }),
    ).toEqual({
      title: "Alternate Telugu Filmmaking (copy)",
      subtitle: "Local session — this copy isn't saved.",
      action: null,
    });
  });

  it("offers a retry when the copy failed to land", () => {
    expect(
      resolvePublishedCanvasIdentity({
        ...base,
        origin: { ...viewing, forked: true, forkSaveState: "failed" },
      }),
    ).toEqual({
      title: "Alternate Telugu Filmmaking (copy)",
      subtitle: "Couldn't save this copy to your canvases.",
      action: { kind: "retry", label: "Try again" },
    });
  });
});
