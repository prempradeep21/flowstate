"use client";

import {
  TagChip,
  WidgetCard,
  WidgetSkeleton,
} from "@/components/repo-explorer/WidgetCard";
import { RestrictionChip } from "@/components/skill-viewer/SkillAuthorWidget";
import { SkillMetaRow } from "@/components/skill-viewer/SkillMetaRow";
import { SkillBrainIcon } from "@/components/skills/SkillBrainIcon";
import type { CanvasSkill } from "@/lib/store";

function CollapsedTile({ skill }: { skill: CanvasSkill }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-3 pb-3 pt-5">
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-canvas-ink px-3 py-0.5 text-canvas-caption font-bold uppercase tracking-wider text-canvas-card">
        Skill
      </span>
      <SkillBrainIcon className="h-11 w-11 shrink-0 text-canvas-ink" />
      <span className="mt-2 line-clamp-2 text-center text-canvas-body-sm font-medium leading-tight text-canvas-ink">
        {skill.title}
      </span>
    </div>
  );
}

/** Rich, widget-per-category card for a real uploaded skill. Falls back to a plain icon+title look when collapsed or when no metadata has been derived yet. */
export function SkillNodeCard({
  skill,
  collapsed = false,
}: {
  skill: CanvasSkill;
  collapsed?: boolean;
}) {
  const meta = skill.metadata;

  if (collapsed || !meta) {
    return <CollapsedTile skill={skill} />;
  }

  const analyzing = skill.metadataStatus === "analyzing" || skill.metadataStatus === "pending";

  return (
    <div className="grid w-full grid-cols-2 gap-3 p-4">
      <WidgetCard
        title={skill.title}
        subtitle={meta.author ? `by ${meta.author}` : undefined}
        className="col-span-2"
      >
        {analyzing ? (
          <WidgetSkeleton lines={2} />
        ) : (
          <p className="text-canvas-body-sm leading-relaxed text-canvas-ink">
            {meta.whatItDoes}
          </p>
        )}
      </WidgetCard>

      {analyzing || meta.topics.length > 0 ? (
        <WidgetCard title="Topics">
          {analyzing ? (
            <WidgetSkeleton lines={1} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {meta.topics.map((topic) => (
                <TagChip key={topic} label={topic} />
              ))}
            </div>
          )}
        </WidgetCard>
      ) : null}

      {analyzing || meta.restrictions.length > 0 ? (
        <WidgetCard title="Restrictions">
          {analyzing ? (
            <WidgetSkeleton lines={1} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {meta.restrictions.map((restriction) => (
                <RestrictionChip key={restriction} label={restriction} />
              ))}
            </div>
          )}
        </WidgetCard>
      ) : null}

      <WidgetCard title="Signals" className="col-span-2">
        <SkillMetaRow
          tokenCost={meta.tokenCost}
          security={meta.security}
          maturity={meta.maturity}
          compatibility={meta.compatibility}
        />
      </WidgetCard>
    </div>
  );
}
