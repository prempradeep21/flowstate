"use client";

import { SkillBrainIcon } from "@/components/skills/SkillBrainIcon";
import { focusCanvasSkill } from "@/lib/canvasSkills";
import { setSidebarDragData } from "@/lib/sidebarDnD";
import { useCanvasStore } from "@/lib/store";

export function SkillSidebarTile({ skillId }: { skillId: string }) {
  const skill = useCanvasStore((s) => s.canvasSkills[skillId]);
  if (!skill) return null;

  return (
    <div className="group/skill relative flex aspect-square flex-col items-center justify-center rounded-canvas border border-canvas-border bg-canvas-card p-3 shadow-card transition-shadow hover:shadow-cardHover">
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-canvas-ink px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-canvas-card">
        Skill
      </span>
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          setSidebarDragData(e.dataTransfer, {
            kind: "skill",
            skillId,
          });
        }}
        onClick={() => focusCanvasSkill(skillId)}
        className="flex h-full w-full cursor-grab flex-col items-center justify-center gap-2 active:cursor-grabbing"
      >
        <SkillBrainIcon className="h-9 w-9 text-canvas-ink" />
        <span className="line-clamp-2 text-center text-canvas-body-sm font-medium leading-tight text-canvas-ink">
          {skill.title}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${skill.title}`}
        onClick={() => useCanvasStore.getState().removeCanvasSkill(skillId)}
        className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[11px] text-canvas-muted opacity-0 transition-opacity hover:text-canvas-ink group-hover/skill:opacity-100"
      >
        x
      </button>
    </div>
  );
}
