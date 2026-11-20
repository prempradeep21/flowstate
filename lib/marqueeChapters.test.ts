import { describe, expect, it } from "vitest";
import { pickMarqueeChapters, type ChapterBox } from "@/lib/marqueeChapters";

const box = (x1: number, y1: number, x2: number, y2: number) => ({ x1, y1, x2, y2 });

// Two chapters side by side, and one whose cards sit far up-left so its frame
// covers most of the board (the reported case).
const A: ChapterBox = { id: "a", x: 0, y: 0, w: 400, h: 300 };
const B: ChapterBox = { id: "b", x: 600, y: 0, w: 400, h: 300 };
const HUGE: ChapterBox = { id: "huge", x: -20000, y: -9000, w: 22000, h: 11000 };

describe("pickMarqueeChapters", () => {
  it("boxing items that clips one big chapter's edge picks the items", () => {
    // Artifacts near the chapter's bottom-right corner; the box spills past it.
    expect(pickMarqueeChapters([HUGE], box(1500, 1500, 2300, 2400), true)).toEqual([]);
  });

  it("a box only on one chapter's edge, holding no items, picks that chapter", () => {
    expect(pickMarqueeChapters([A], box(350, 250, 500, 400), false)).toEqual(["a"]);
  });

  it("sweeping across two chapters picks both, even holding items", () => {
    expect(pickMarqueeChapters([A, B], box(300, 100, 700, 200), true)).toEqual(["a", "b"]);
  });

  it("fully covering a chapter picks every chapter the box touches", () => {
    expect(pickMarqueeChapters([A, B], box(-10, -10, 650, 310), true)).toEqual(["a", "b"]);
    expect(pickMarqueeChapters([A], box(-10, -10, 410, 310), true)).toEqual(["a"]);
  });

  it("a box wholly inside one chapter picks the items, even an empty one", () => {
    expect(pickMarqueeChapters([A], box(50, 50, 100, 100), true)).toEqual([]);
    expect(pickMarqueeChapters([A], box(50, 50, 100, 100), false)).toEqual([]);
  });

  it("a box touching no chapter picks items", () => {
    expect(pickMarqueeChapters([A, B], box(420, 0, 580, 300), true)).toEqual([]);
  });
});
