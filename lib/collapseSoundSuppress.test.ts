import { describe, expect, it } from "vitest";
import {
  isChatCollapseSoundSuppressed,
  runSilentAutoCollapse,
} from "@/lib/collapseSoundSuppress";

describe("collapseSoundSuppress", () => {
  it("suppresses chat-collapse sound during auto-collapse batch", () => {
    expect(isChatCollapseSoundSuppressed()).toBe(false);
    runSilentAutoCollapse(() => {
      expect(isChatCollapseSoundSuppressed()).toBe(true);
    });
    expect(isChatCollapseSoundSuppressed()).toBe(false);
  });

  it("clears suppress flag after thrown action", () => {
    expect(() => {
      runSilentAutoCollapse(() => {
        throw new Error("fail");
      });
    }).toThrow("fail");
    expect(isChatCollapseSoundSuppressed()).toBe(false);
  });
});
