"use client";

import { useState } from "react";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";
import {
  CREATION_PATH_LABELS,
  type ArtifactCreationPath,
  type ArtifactIntentEntry,
} from "@/lib/artifactIntentCatalog";

const PATH_BADGE_CLASS: Record<ArtifactCreationPath, string> = {
  "ai-intent": "bg-violet-500/10 text-violet-800 border-violet-200",
  "llm-prompt": "bg-sky-500/10 text-sky-900 border-sky-200",
  "url-paste": "bg-amber-500/10 text-amber-900 border-amber-200",
  manual: "bg-canvas-bg text-canvas-muted border-canvas-border",
  "file-drop": "bg-emerald-500/10 text-emerald-900 border-emerald-200",
  "search-images": "bg-rose-500/10 text-rose-900 border-rose-200",
};

const MAX_PRIORITY = 90;

function PriorityMeter({ priority }: { priority: number }) {
  const pct = Math.max(8, ((MAX_PRIORITY - priority) / MAX_PRIORITY) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-canvas-accent to-amber-500/80 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-canvas-micro tabular-nums text-canvas-muted">
        {priority}
      </span>
    </div>
  );
}

function PathBadge({ path }: { path: ArtifactCreationPath }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-canvas-micro font-medium ${PATH_BADGE_CLASS[path]}`}
    >
      {CREATION_PATH_LABELS[path]}
    </span>
  );
}

function RuleBlock({
  rule,
}: {
  rule: ArtifactIntentEntry["rules"][number];
}) {
  const [showPatterns, setShowPatterns] = useState(false);
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="rounded-canvas border border-canvas-border/80 bg-canvas-bg/40 p-3">
      <p className="text-canvas-body-sm font-medium text-canvas-ink">
        {rule.label}
      </p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-canvas-body-sm text-canvas-muted">
        {rule.triggers.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {rule.patterns && rule.patterns.length > 0 ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPatterns((v) => !v)}
            className="text-canvas-micro font-medium text-canvas-accent hover:underline"
          >
            {showPatterns ? "Hide patterns" : "Show patterns"}
          </button>
          {showPatterns ? (
            <pre className="mt-1.5 overflow-x-auto rounded bg-canvas-card p-2 font-mono text-canvas-micro text-canvas-muted">
              {rule.patterns.join("\n")}
            </pre>
          ) : null}
        </div>
      ) : null}
      {rule.mandatoryNote ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowNote((v) => !v)}
            className="text-canvas-micro font-medium text-canvas-accent hover:underline"
          >
            {showNote ? "Hide mandatory note" : "Show mandatory note"}
          </button>
          {showNote ? (
            <p className="mt-1.5 rounded border border-amber-200/60 bg-amber-50/80 px-2.5 py-2 text-canvas-micro leading-relaxed text-amber-950">
              {rule.mandatoryNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ArtifactIntentCard({ entry }: { entry: ArtifactIntentEntry }) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <article className="flex flex-col rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <div className="border-b border-canvas-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-canvas-artifactIconBg px-2 py-0.5 font-mono text-canvas-micro font-semibold uppercase tracking-wide text-canvas-accent">
                {entry.kind}
              </span>
              <h3 className="font-display text-canvas-body font-medium text-canvas-ink">
                {entry.label}
              </h3>
            </div>
            <p className="mt-1.5 text-canvas-body-sm text-canvas-muted">
              {entry.summary}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.creationPaths.map((path) => (
            <PathBadge key={path} path={path} />
          ))}
        </div>
        {entry.spawnPriority !== undefined ? (
          <div className="mt-3">
            <p className="mb-1 text-canvas-micro font-medium text-canvas-muted">
              Spawn priority
            </p>
            <PriorityMeter priority={entry.spawnPriority} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-5">
        <section>
          <h4 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            When to spin up
          </h4>
          <div className="mt-2 space-y-2">
            {entry.rules.map((rule) => (
              <RuleBlock key={rule.id} rule={rule} />
            ))}
          </div>
        </section>

        {(entry.promptGuidance || entry.rules.some((r) => r.mandatoryNote)) && (
          <section>
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <h4 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                AI behavior
              </h4>
              <AdminActionIcon
                name={aiOpen ? "chevron-up" : "chevron-down"}
                className="h-3.5 w-3.5 text-canvas-muted"
              />
            </button>
            {aiOpen ? (
              <div className="mt-2 space-y-2">
                {entry.promptGuidance ? (
                  <p className="rounded-canvas border border-canvas-border bg-canvas-bg/50 px-3 py-2 text-canvas-body-sm leading-relaxed text-canvas-muted">
                    {entry.promptGuidance}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        )}

        <section>
          <h4 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            Spawn
          </h4>
          <p className="mt-1.5 text-canvas-body-sm text-canvas-muted">
            {entry.autoSpawnBehavior}
          </p>
          {entry.permissionCopy ? (
            <p className="mt-1.5 text-canvas-micro italic text-canvas-muted">
              Permission copy: &ldquo;{entry.permissionCopy}&rdquo;
            </p>
          ) : null}
        </section>

        {entry.validation && entry.validation.length > 0 ? (
          <section>
            <h4 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
              Validation
            </h4>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-canvas-body-sm text-canvas-muted">
              {entry.validation.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {entry.examples && entry.examples.length > 0 ? (
          <section>
            <h4 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
              Examples
            </h4>
            <ul className="mt-2 space-y-1.5">
              {entry.examples.map((ex) => (
                <li
                  key={ex}
                  className="border-l-2 border-canvas-accent/40 pl-3 text-canvas-body-sm italic text-canvas-muted"
                >
                  &ldquo;{ex}&rdquo;
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-auto border-t border-canvas-border pt-3">
          <h4 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            Source
          </h4>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {entry.sourceFiles.map((file) => (
              <li
                key={file}
                className="font-mono text-canvas-micro text-canvas-muted"
              >
                {file}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
