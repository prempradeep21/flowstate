"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";
import { ArtifactIntentCard } from "@/app/admin/tools/artifact-intent/components/ArtifactIntentCard";
import { ArtifactIntentListItem } from "@/app/admin/tools/artifact-intent/components/ArtifactIntentListItem";
import {
  ARTIFACT_INTENT_CATALOG,
  CREATION_PATH_LABELS,
  filterCatalogEntries,
  type ArtifactCatalogKind,
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

export function ArtifactIntentApp() {
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState<PathFilter>("all");
  const [selectedKind, setSelectedKind] = useState<ArtifactCatalogKind | null>(
    ARTIFACT_INTENT_CATALOG[0]?.kind ?? null,
  );
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const filtered = useMemo(
    () => filterCatalogEntries(ARTIFACT_INTENT_CATALOG, search, pathFilter),
    [search, pathFilter],
  );

  const selected = useMemo(() => {
    if (filtered.length === 0) return null;
    return (
      filtered.find((entry) => entry.kind === selectedKind) ?? filtered[0]
    );
  }, [filtered, selectedKind]);

  useEffect(() => {
    if (selected && selected.kind !== selectedKind) {
      setSelectedKind(selected.kind);
    }
  }, [selected, selectedKind]);

  function handleSelect(kind: ArtifactCatalogKind) {
    setSelectedKind(kind);
    setMobileShowDetail(true);
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <aside
        className={`flex min-h-0 w-full shrink-0 flex-col border-canvas-border lg:w-72 lg:border-r xl:w-80 ${
          mobileShowDetail ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="shrink-0 space-y-3 border-b border-canvas-border px-3 py-3 sm:px-4">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {filtered.length === 0 ? (
            <div className="rounded-canvas border border-dashed border-canvas-border bg-canvas-card px-4 py-8 text-center">
              <p className="font-display text-canvas-body-sm font-medium text-canvas-ink">
                No artifacts match
              </p>
              <p className="mt-1 text-canvas-micro text-canvas-muted">
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((entry) => (
                <li key={entry.kind}>
                  <ArtifactIntentListItem
                    entry={entry}
                    selected={selected?.kind === entry.kind}
                    onSelect={() => handleSelect(entry.kind)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div
        className={`min-h-0 min-w-0 flex-1 flex-col ${
          mobileShowDetail ? "flex" : "hidden lg:flex"
        }`}
      >
        {selected ? (
          <>
            <div className="shrink-0 border-b border-canvas-border px-3 py-2 lg:hidden sm:px-4">
              <button
                type="button"
                onClick={() => setMobileShowDetail(false)}
                className="inline-flex items-center gap-1.5 rounded-canvas px-1 py-1 text-canvas-body-sm font-medium text-canvas-muted transition-colors hover:text-canvas-ink"
              >
                <AdminActionIcon name="back" className="h-4 w-4" />
                {selected.label}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <ArtifactIntentCard entry={selected} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
