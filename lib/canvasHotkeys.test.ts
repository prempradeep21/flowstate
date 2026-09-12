import { describe, expect, it } from "vitest";
import { isCanvasHotkeyBlockedByTarget } from "@/lib/canvasHotkeys";

/**
 * Minimal DOM stubs — the repo's vitest runs in node with no jsdom, and the
 * helper only reads tagName, value, isContentEditable and closest().
 */
function fakeEl(opts: {
  tagName?: string;
  value?: string;
  isContentEditable?: boolean;
  /** Simulates an ancestor carrying data-canvas-hotkeys="off". */
  hotkeysOff?: boolean;
}): EventTarget {
  return {
    tagName: opts.tagName ?? "DIV",
    value: opts.value,
    isContentEditable: opts.isContentEditable ?? false,
    closest: (selector: string) =>
      opts.hotkeysOff && selector === '[data-canvas-hotkeys="off"]' ? {} : null,
  } as unknown as EventTarget;
}

const field = (value: string, hotkeysOff = false) =>
  fakeEl({ tagName: "INPUT", value, hotkeysOff });

describe("isCanvasHotkeyBlockedByTarget", () => {
  it("lets the shortcut through for an empty field (the chat composer case)", () => {
    expect(isCanvasHotkeyBlockedByTarget(field(""))).toBe(false);
    expect(isCanvasHotkeyBlockedByTarget(field("   "))).toBe(false);
  });

  it("blocks the shortcut once a field has content", () => {
    expect(isCanvasHotkeyBlockedByTarget(field("hello"))).toBe(true);
  });

  it("blocks an EMPTY field inside a data-canvas-hotkeys=off container", () => {
    // The search field: typing "q" first must type a letter, not place a card.
    expect(isCanvasHotkeyBlockedByTarget(field("", true))).toBe(true);
  });

  it("blocks contenteditable targets", () => {
    expect(
      isCanvasHotkeyBlockedByTarget(fakeEl({ isContentEditable: true })),
    ).toBe(true);
  });

  it("lets the shortcut through for the canvas itself", () => {
    expect(isCanvasHotkeyBlockedByTarget(fakeEl({}))).toBe(false);
  });

  it("tolerates a null target", () => {
    expect(isCanvasHotkeyBlockedByTarget(null)).toBe(false);
  });
});
