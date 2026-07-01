"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";
import { ArtifactIntentCard } from "@/app/admin/tools/artifact-intent/components/ArtifactIntentCard";
import {
  ARTIFACT_INTENT_CATALOG,
  ARTIFACT_INTENT_RESOLUTION_ORDER,
  ARTIFACT_SPAWN_GLOBAL_RULES,
  CREATION_PATH_LABELS,
  SPAWN_PRIORITY_TABLE,
  filterCatalogEntries,
  getCatalogStats,
  type PathFilter,
} from "@/lib/artifactIntentCatalog";

const PATH_FILTERS: { id: PathFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai-intent", label: "AI intent" },
  { id: "llm-prompt", label: "LLM" },
  { id: "url-paste", label: "URL" },
  { id: "manual", label: "Manual" },
  { id: "file-drop", label: "File" },
];

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2">
      <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
        {label}
      </p>
      <p className="mt-0.5 font-display text-xl font-medium tabular-nums text-canvas-ink">
        {value}
      </p>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas-bg/60 sm:px-5"
        aria-expanded={open}
      >
        <span className="font-display text-canvas-body font-medium text-canvas-ink">
          {title}
        </span>
        <AdminActionIcon
          name={open ? "chevron-up" : "chevron-down"}
          className="h-4 w-4 shrink-0 text-canvas-muted"
        />
      </button>
      {open ? (
        <div className="border-t border-canvas-border px-4 py-4 sm:px-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function ArtifactIntentApp() {
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState<PathFilter>("all");
  const stats = useMemo(() => getCatalogStats(), []);

  const filtered = useMemo(
    () => filterCatalogEntries(ARTIFACT_INTENT_CATALOG, search, pathFilter),
    [search, pathFilter],
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-canvas-border bg-canvas-bg px-2.5 py-1 text-canvas-micro font-medium text-canvas-muted">
              Read-only
            </span>
            <span className="text-canvas-body-sm text-canvas-muted">
              Editing from portal — coming soon
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            <SummaryChip label="Artifact types" value={stats.total} />
            <SummaryChip label="AI intent" value={stats.withAiIntent} />
            <SummaryChip label="Manual only" value={stats.manualOnly} />
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <CollapsibleSection title="Intent resolution ladder" defaultOpen>
            <ol className="space-y-3">
              {ARTIFACT_INTENT_RESOLUTION_ORDER.map((step) => (
                <li key={step.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canvas-artifactIconBg text-canvas-micro font-semibold text-canvas-accent">
                    {step.step}
                  </span>
                  <div>
                    <p className="text-canvas-body-sm font-medium text-canvas-ink">
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-canvas-body-sm text-canvas-muted">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-canvas-micro text-canvas-muted">
              Only one primary intent system note is injected per turn to avoid
              conflicting MANDATORY instructions.
            </p>
          </CollapsibleSection>

          <CollapsibleSection title="Spawn behavior & priority" defaultOpen>
            <ul className="mb-4 list-disc space-y-1.5 pl-4 text-canvas-body-sm text-canvas-muted">
              {ARTIFACT_SPAWN_GLOBAL_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div className="overflow-x-auto rounded-canvas border border-canvas-border">
              <table className="w-full min-w-[240px] text-left text-canvas-body-sm">
                <thead>
                  <tr className="border-b border-canvas-border bg-canvas-bg/80">
                    <th className="px-3 py-2 font-medium text-canvas-ink">
                      Kind
                    </th>
                    <th className="px-3 py-2 font-medium text-canvas-ink">
                      Priority
                    </th>
                    <th className="hidden px-3 py-2 font-medium text-canvas-ink sm:table-cell">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SPAWN_PRIORITY_TABLE.map((row) => (
                    <tr
                      key={row.kind}
                      className="border-b border-canvas-border/60 last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-canvas-body-sm text-canvas-ink">
                        {row.kind}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-canvas-muted">
                        {row.priority}
                      </td>
                      <td className="hidden px-3 py-2 text-canvas-muted sm:table-cell">
                        {row.priority <= 20
                          ? "Auto-spawns first"
                          : row.priority <= 50
                            ? "Often auto"
                            : "May need permission"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-canvas-micro text-canvas-muted">
              Lower number = higher priority (spawns first without permission
              prompt).
            </p>
          </CollapsibleSection>
        </div>

        <div className="sticky top-0 z-10 -mx-4 space-y-3 border-b border-canvas-border bg-canvas-bg/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="relative">
            <AdminActionIcon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canvas-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search kinds, triggers, examples…"
              className="w-full rounded-canvas border border-canvas-border bg-canvas-card py-2 pl-9 pr-3 text-canvas-body-sm text-canvas-ink placeholder:text-canvas-muted focus:border-canvas-accent focus:outline-none focus:ring-1 focus:ring-canvas-accent"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PATH_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPathFilter(f.id)}
                className={`rounded-full px-3 py-1 text-canvas-body-sm font-medium transition-colors ${
                  pathFilter === f.id
                    ? "bg-canvas-accent text-white"
                    : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-canvas-micro text-canvas-muted">
            Showing {filtered.length} of {ARTIFACT_INTENT_CATALOG.length}{" "}
            {pathFilter !== "all"
              ? `· ${CREATION_PATH_LABELS[pathFilter as keyof typeof CREATION_PATH_LABELS] ?? pathFilter}`
              : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-canvas border border-dashed border-canvas-border bg-canvas-card px-6 py-12 text-center">
            <p className="font-display text-canvas-body font-medium text-canvas-ink">
              No artifacts match
            </p>
            <p className="mt-1 text-canvas-body-sm text-canvas-muted">
              Try a different search or filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((entry) => (
              <ArtifactIntentCard key={entry.kind} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
