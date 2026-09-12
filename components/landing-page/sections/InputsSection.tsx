"use client";

import { useMemo, useState } from "react";
import { TagChip } from "@/components/repo-explorer/WidgetCard";
import {
  LandingArtifactPreview,
  previewHeightForEntry,
} from "@/components/landing-page/shared/LandingArtifactPreview";
import { LandingComposerInputDemo } from "@/components/landing-page/shared/LandingComposerInputDemo";
import { LandingSectionShell } from "@/components/landing-page/LandingSectionShell";
import { LANDING_COPY } from "@/components/landing-page/landingSections";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import { LANDING_COMPOSER_INPUTS } from "@/lib/landingComposerInputs";
import { playSound } from "@/lib/sounds/engine";

type InputsTab = "paste" | "composer";

export function InputsSection() {
  const [tab, setTab] = useState<InputsTab>("paste");
  const copy = LANDING_COPY.inputs;

  const pasteEntries = useMemo(
    () => ARTIFACT_CATALOG_ENTRIES.filter((e) => e.category === "input"),
    [],
  );

  return (
    <LandingSectionShell
      id="inputs"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.body}
      tone="soft"
    >
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "paste" as const, label: "Paste on canvas" },
            { id: "composer" as const, label: "Attach in composer" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              void playSound("plug-connect");
            }}
            className={`rounded-full px-4 py-2 text-canvas-compact transition-colors ${
              tab === t.id
                ? "bg-canvas-accent font-medium text-canvas-onAccent"
                : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {pasteEntries.map((entry) => (
            <article key={entry.id} className="flex min-w-0 flex-col gap-4">
              <div>
                <h3 className="font-display text-canvas-heading text-canvas-ink">
                  {entry.name}
                </h3>
                <p className="mt-2 text-canvas-body leading-[1.6] text-canvas-muted">
                  {entry.description}
                </p>
                {entry.example ? (
                  <p className="mt-2 text-canvas-caption leading-relaxed text-canvas-muted">
                    <span className="font-medium text-canvas-ink/80">Example: </span>
                    <span className="font-mono text-canvas-ink/70">{entry.example}</span>
                  </p>
                ) : null}
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
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_COMPOSER_INPUTS.map((input) => (
            <article
              key={input.id}
              className="flex flex-col gap-4 rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-artifact"
            >
              <div>
                <h3 className="font-display text-canvas-body-lg text-canvas-ink">
                  {input.label}
                </h3>
                <p className="mt-2 text-canvas-compact leading-[1.55] text-canvas-muted">
                  {input.description}
                </p>
              </div>
              <LandingComposerInputDemo input={input} />
            </article>
          ))}
        </div>
      )}
    </LandingSectionShell>
  );
}
