/**
 * Which chapters a selection box picks. An empty result means the box
 * selects the items inside it instead.
 *
 * - Sweeping across two or more chapters, or fully covering one, picks
 *   every chapter the box touches.
 * - A box that only clips ONE chapter picks the items inside the box: you
 *   were boxing artifacts in or near that chapter, and a chapter's frame can
 *   reach far past what is on screen (its cards may sit elsewhere on the
 *   canvas), so picking it selected most of the board. If that box holds no
 *   items, the chapter it touched is picked, so a box on a frame's edge
 *   still selects it.
 * - A box drawn wholly inside one chapter picks the items in it.
 */

export interface ChapterBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function pickMarqueeChapters(
  chapters: readonly ChapterBox[],
  box: WorldBox,
  boxHoldsItems: boolean,
): string[] {
  const touched = chapters.filter(
    (b) => b.x < box.x2 && b.x + b.w > box.x1 && b.y < box.y2 && b.y + b.h > box.y1,
  );
  if (touched.length === 0) return [];

  const covered = touched.some(
    (b) => b.x >= box.x1 && b.x + b.w <= box.x2 && b.y >= box.y1 && b.y + b.h <= box.y2,
  );
  if (covered || touched.length >= 2) return touched.map((b) => b.id);

  // One chapter, only clipped (or the box sits wholly inside it).
  const only = touched[0]!;
  const insideIt =
    box.x1 >= only.x && box.x2 <= only.x + only.w &&
    box.y1 >= only.y && box.y2 <= only.y + only.h;
  if (insideIt || boxHoldsItems) return [];
  return [only.id];
}
