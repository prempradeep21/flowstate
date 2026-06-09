import type { CanvasSkill, CanvasSkillNode } from "@/lib/store";

export const CANVAS_SKILL_SIZE = 168;

export function getCanvasSkillBounds(
  node: Pick<CanvasSkillNode, "size">,
  _skill?: CanvasSkill,
): { w: number; h: number } {
  const size = node.size?.w ?? CANVAS_SKILL_SIZE;
  return { w: size, h: size };
}
