import { describe, expect, it } from "vitest";
import { resolveGesturingMode } from "@/lib/gesture/gesturingAttr";

describe("resolveGesturingMode", () => {
  it("clears only when no gesture is held", () => {
    expect(resolveGesturingMode([])).toBeNull();
  });

  it("shows the strongest mode held, so a zoom during a drag keeps zoom styling", () => {
    expect(resolveGesturingMode(["drag"])).toBe("drag");
    expect(resolveGesturingMode(["drag", "zoom"])).toBe("zoom");
    expect(resolveGesturingMode(["pan", "drag"])).toBe("drag");
  });
});
