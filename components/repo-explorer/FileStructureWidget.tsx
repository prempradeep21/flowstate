"use client";

import type { FileStructureData } from "@/lib/github/types";
import { StatPill, WidgetCard } from "@/components/repo-explorer/WidgetCard";

export function FileStructureWidget({ data }: { data?: FileStructureData }) {
  if (!data) return null;

  const maxCount = data.extensionCounts[0]?.count ?? 1;

  return (
    <WidgetCard
      title="File structure"
      subtitle={
        data.truncated
          ? "Summary from partial tree (large repo)"
          : "Counts by type from repository tree"
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Files" value={data.totalFiles.toLocaleString()} />
          <StatPill label="Folders" value={data.totalFolders.toLocaleString()} />
          <StatPill label="Entries" value={data.totalEntries.toLocaleString()} />
        </div>

        {data.extensionCounts.length > 0 ? (
          <div>
            <h3 className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              By extension
            </h3>
            <ul className="space-y-1.5">
              {data.extensionCounts.map((row) => (
                <li key={row.extension} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-canvas-compact font-medium text-canvas-ink">
                    {row.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="h-2 rounded-full bg-canvas-accent/80"
                      style={{
                        width: `${Math.max(8, (row.count / maxCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-canvas-compact tabular-nums text-canvas-muted">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-canvas-body-sm text-canvas-muted">
            Could not load file tree for this repository.
          </p>
        )}

        {data.topLevelFolders.length > 0 ? (
          <div>
            <h3 className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Top-level folders
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {data.topLevelFolders.map((folder) => (
                <span
                  key={folder}
                  className="inline-flex items-center rounded-canvas-sm bg-canvas-artifactStage px-2 py-1 font-mono text-canvas-compact text-canvas-ink"
                >
                  {folder}/
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </WidgetCard>
  );
}
