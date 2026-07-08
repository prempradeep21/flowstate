"use client";

import { TagChip } from "@/components/repo-explorer/WidgetCard";
import { RestrictionChip, SkillAuthorWidget } from "@/components/skill-viewer/SkillAuthorWidget";
import { SkillMetaRow } from "@/components/skill-viewer/SkillMetaRow";
import type { Skill } from "@/lib/skill-viewer/types";

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <section className="flex flex-col gap-4 overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-shadow hover:shadow-cardHover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-canvas-body-lg font-medium text-canvas-ink">{skill.name}</h2>
        </div>
        <SkillAuthorWidget
          name={skill.authorName}
          handle={skill.authorHandle}
          avatarUrl={skill.authorAvatarUrl}
          sourceUrl={skill.sourceUrl}
        />
      </div>

      <p className="text-canvas-body-sm leading-relaxed text-canvas-ink">{skill.whatItDoes}</p>

      {skill.topics.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skill.topics.map((topic) => (
            <TagChip key={topic} label={topic} />
          ))}
        </div>
      ) : null}

      {skill.restrictions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skill.restrictions.map((restriction) => (
            <RestrictionChip key={restriction} label={restriction} />
          ))}
        </div>
      ) : null}

      <div className="border-t border-canvas-border pt-3">
        <SkillMetaRow
          tokenCost={skill.tokenCost}
          security={skill.security}
          maturity={skill.maturity}
          compatibility={skill.compatibility}
        />
      </div>
    </section>
  );
}
