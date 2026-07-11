import type { CanvasSkill, CanvasSkillNode } from "@/lib/store";

/** Plain icon+title tile — used when a skill has no derived card metadata. */
export const CANVAS_SKILL_SIZE = 168;

/** Rich-card width (fits the 2-column widget grid); height auto-grows to fit content (see CanvasSkillNode's resize observer). */
export const CANVAS_SKILL_CARD_WIDTH = 440;
export const CANVAS_SKILL_CARD_MIN_HEIGHT = 200;

export function getCanvasSkillBounds(
  node: Pick<CanvasSkillNode, "size">,
  skill?: CanvasSkill,
): { w: number; h: number } {
  if (node.size) return { w: node.size.w, h: node.size.h };
  if (skill?.metadata) {
    return { w: CANVAS_SKILL_CARD_WIDTH, h: CANVAS_SKILL_CARD_MIN_HEIGHT };
  }
  return { w: CANVAS_SKILL_SIZE, h: CANVAS_SKILL_SIZE };
}
