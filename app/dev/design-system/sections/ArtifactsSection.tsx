"use client";

import { useMemo, useState } from "react";
import { TagChip } from "@/components/repo-explorer/WidgetCard";
import { LandingArtifactPreview } from "@/components/landing-page/shared/LandingArtifactPreview";
import {
  CATALOG_SECTIONS,
  type ArtifactCatalogCategory,
} from "@/lib/artifactCatalogSamples";
import {
  getArtifactCatalogEntry,
  getArtifactEntriesByCategory,
} from "@/lib/designSystemRegistry";

const ARTIFACT_TABS: ArtifactCatalogCategory[] = ["flowstate", "input", "custom-example"];

function previewHeightForEntry(id: string): number {
  if (id.startsWith("chart") || id === "repo") return 360;
  if (id === "map" || id === "streetview" || id === "3d") return 340;
  if (id === "custom" || id.startsWith("timezone") || id === "currency") return 280;
  return 300;
}

export function ArtifactsSection() {
  const [tab, setTab] = useState<ArtifactCatalogCategory>("flowstate");

  const entries = useMemo(() => getArtifactEntriesByCategory(tab), [tab]);
  const tabMeta = CATALOG_SECTIONS.filter((s) => ARTIFACT_TABS.includes(s.id));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        {tabMeta.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setTab(section.id)}
            className={`rounded-full px-4 py-2 text-canvas-compact transition-colors ${
              tab === section.id
                ? "bg-canvas-ink font-medium text-canvas-card"
                : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {entries.map((entry) => {
          const sample = getArtifactCatalogEntry(entry.id);
          if (!sample) return null;

          return (
            <article key={entry.id} className="flex min-w-0 flex-col gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-canvas-heading text-canvas-ink">
                    {entry.name}
                  </h3>
                  {entry.livePreviewOnly ? (
                    <span className="rounded-full bg-canvas-warningSoft px-2 py-0.5 text-canvas-micro text-canvas-warningText">
                      Live preview
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-canvas-body leading-[1.6] text-canvas-muted">
                  {entry.description}
                </p>
                <p className="mt-2 font-mono text-canvas-micro text-canvas-muted">
                  {entry.componentPath}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.tags.slice(0, 4).map((chip) => (
                    <TagChip key={chip} label={chip} />
                  ))}
                </div>
              </div>
              <LandingArtifactPreview
                entry={sample}
                previewHeight={previewHeightForEntry(entry.id)}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
