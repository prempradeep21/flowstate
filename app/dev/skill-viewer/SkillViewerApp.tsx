"use client";

import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { SkillCard } from "@/components/skill-viewer/SkillCard";
import { SEED_SKILLS } from "@/lib/skill-viewer/seedSkills";

export function SkillViewerApp() {
  return (
    <div className="relative h-full min-h-screen overflow-hidden bg-canvas-bg font-sans text-canvas-ink">
      <GridBackground viewport={{ x: 0, y: 0, scale: 1 }} />

      <div className="relative z-10 flex h-full min-h-screen flex-col">
        <header className="floating-chrome-padding border-b border-canvas-border/80 bg-canvas-card/90 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl">
            <p className="text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Flowstate · Skill Viewer
            </p>
            <h1 className="text-canvas-heading font-medium text-canvas-ink">
              Prose-guidance skills
            </h1>
          </div>
        </header>

        <main className="floating-chrome-padding mx-auto w-full max-w-6xl flex-1 overflow-y-auto pb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEED_SKILLS.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
