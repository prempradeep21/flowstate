"use client";

import { useMemo, useState } from "react";
import { TagChip } from "@/components/repo-explorer/WidgetCard";
import { LandingArtifactPreview, previewHeightForEntry } from "@/components/landing-page/shared/LandingArtifactPreview";
import { LandingSectionShell } from "@/components/landing-page/LandingSectionShell";
import { LANDING_COPY } from "@/components/landing-page/landingSections";
import {
  ARTIFACT_CATALOG_ENTRIES,
  CATALOG_SECTIONS,
  type ArtifactCatalogCategory,
} from "@/lib/artifactCatalogSamples";
import { playSound } from "@/lib/sounds/engine";

const ARTIFACT_TABS: ArtifactCatalogCategory[] = ["flowstate", "custom-example"];

export function ArtifactsSection() {
  const [tab, setTab] = useState<ArtifactCatalogCategory>("flowstate");
  const copy = LANDING_COPY.artifacts;

  const entries = useMemo(
    () => ARTIFACT_CATALOG_ENTRIES.filter((e) => e.category === tab),
    [tab],
  );

  const tabMeta = CATALOG_SECTIONS.filter((s) => ARTIFACT_TABS.includes(s.id));

  return (
    <LandingSectionShell
      id="artifacts"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.body}
    >
      <div className="flex flex-wrap gap-2">
        {tabMeta.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              setTab(section.id);
              void playSound("plug-connect");
            }}
            className={`rounded-full px-4 py-2 text-canvas-compact transition-colors ${
              tab === section.id
                ? "bg-canvas-accent font-medium text-canvas-onAccent"
                : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {entries.map((entry) => (
          <article key={entry.id} className="flex min-w-0 flex-col gap-4">
            <div>
              <h3 className="font-display text-canvas-heading text-canvas-ink">
                {entry.name}
              </h3>
              <p className="mt-2 text-canvas-body leading-[1.6] text-canvas-muted">
                {entry.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.chips.slice(0, 4).map((chip) => (
                  <TagChip key={chip} label={chip} />
                ))}
              </div>
            </div>
            <LandingArtifactPreview
              entry={entry}
              previewHeight={previewHeightForEntry(entry.id)}
            />
          </article>
        ))}
      </div>
    </LandingSectionShell>
  );
}
