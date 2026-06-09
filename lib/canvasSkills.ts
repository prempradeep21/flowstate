import { CANVAS_SKILL_SIZE } from "@/lib/canvasSkillBounds";
import { animateViewportTo } from "@/lib/motion/animateViewport";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { useCanvasStore, type CanvasSkillNode } from "@/lib/store";

export function findCanvasNodeBySkillId(
  nodes: Record<string, CanvasSkillNode>,
  skillId: string,
): CanvasSkillNode | undefined {
  return Object.values(nodes).find((n) => n.skillId === skillId);
}

export function focusCanvasSkill(skillId: string): boolean {
  const state = useCanvasStore.getState();
  let node = findCanvasNodeBySkillId(state.canvasSkillNodes, skillId);

  if (!node) {
    const skill = state.canvasSkills[skillId];
    if (!skill) return false;
    const nodeId = state.spawnCanvasSkill(skillId, { focus: true });
    if (!nodeId) return false;
    node = useCanvasStore.getState().canvasSkillNodes[nodeId];
    if (!node) return false;
  }

  state.selectCanvasSkill(node.id);

  const container = document.querySelector("[data-canvas-container]");
  const rect = container?.getBoundingClientRect();
  if (!rect) return true;

  const { w, h } = { w: CANVAS_SKILL_SIZE, h: CANVAS_SKILL_SIZE };
  const cx = node.position.x + w / 2;
  const cy = node.position.y + h / 2;
  const next = viewportCenteredOnWorldPoint(
    cx,
    cy,
    state.viewport.scale,
    rect.width,
    rect.height,
  );
  animateViewportTo(next);
  return true;
}
